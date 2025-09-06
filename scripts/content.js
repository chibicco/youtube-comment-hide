// 現在の状態を追跡するグローバル変数
let currentHideEnabled = null; // 初期値をnullにして、ストレージから読み込むまで動作しない
let currentObserver = null;
let isInitialized = false; // 初期化完了フラグ

// 拡張機能のコンテキストが有効かチェック
const isExtensionContextValid = () => {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch {
    return false;
  }
};

const hideComments = () => {
  const commentsSection = document.querySelector(COMMENTS_SELECTOR);
  if (commentsSection) {
    commentsSection.style.visibility = 'hidden';
  }
};

const showComments = () => {
  const commentsSection = document.querySelector(COMMENTS_SELECTOR);
  if (commentsSection) {
    commentsSection.style.visibility = 'visible';
  }
};

const toggleComments = (hide) => {
  // 初期化完了前は何もしない
  if (!isInitialized) return;

  if (hide) {
    hideComments();
  } else {
    showComments();
  }
};

const initializeCommentToggle = () => {
  // 既存のオブザーバーを切断
  if (currentObserver) {
    currentObserver.disconnect();
    currentObserver = null;
  }

  try {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        // 拡張機能のコンテキストが無効な場合は初期化を中止
        console.log('Extension context is invalid. Please refresh the page.');
        return;
      }
      
      // グローバル状態を更新
      currentHideEnabled = result[STORAGE_KEY] !== false; // 未設定の場合はtrueをデフォルトとする
      isInitialized = true; // 初期化完了
      toggleComments(currentHideEnabled);

      const sectionsElement = document.querySelector(SECTIONS_SELECTOR);
      if (sectionsElement) {
        // グローバル変数を使用する新しいオブザーバーを作成
        currentObserver = new MutationObserver(() => {
          // 初期化完了後のみ実行
          if (isInitialized) {
            toggleComments(currentHideEnabled);
          }
        });
        currentObserver.observe(sectionsElement, {
          childList: true,
          subtree: true,
        });
      }
    });
  } catch (error) {
    // 拡張機能のコンテキストが無効になった場合
    console.log('Extension was updated. Please refresh the page.');
  }
};

// 初期化処理（コンテキストが有効な場合のみ実行）
if (isExtensionContextValid()) {
  initializeCommentToggle();
  
  document.addEventListener('yt-navigate-finish', () => {
    if (isExtensionContextValid()) {
      initializeCommentToggle();
    }
  });
}

// storage変更を監視して全てのタブで同期
if (isExtensionContextValid()) {
  try {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (!isExtensionContextValid()) return;
      
      try {
        if (namespace === 'sync' && changes[STORAGE_KEY]) {
          // 他のタブやウィンドウでの変更を検知
          currentHideEnabled = changes[STORAGE_KEY].newValue;
          if (isInitialized) {
            toggleComments(currentHideEnabled);
          }
        }
      } catch (error) {
        // エラーは静かに無視
        console.log('Extension context invalidated. Please refresh the page.');
      }
    });
  } catch (error) {
    console.log('Could not add storage listener:', error.message);
  }
}

// メッセージリスナーの登録
if (isExtensionContextValid()) {
  try {
    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
      if (!isExtensionContextValid()) {
        return false;
      }
      
      if (request[STORAGE_KEY] !== undefined) {
        // バックグラウンドスクリプトからメッセージを受信した際にグローバル状態を更新
        currentHideEnabled = request[STORAGE_KEY];
        isInitialized = true; // メッセージ受信時は強制的に初期化済みにする
        toggleComments(currentHideEnabled);
        sendResponse({ status: 'success' });
      }
    });
  } catch (error) {
    console.log('Could not add message listener:', error.message);
  }
}
