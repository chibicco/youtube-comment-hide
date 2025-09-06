// 現在の状態を追跡するグローバル変数
let currentHideEnabled = true;
let currentObserver = null;

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

  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    // グローバル状態を更新
    currentHideEnabled = result[STORAGE_KEY] !== false; // 未設定の場合はtrueをデフォルトとする
    toggleComments(currentHideEnabled);

    const sectionsElement = document.querySelector(SECTIONS_SELECTOR);
    if (sectionsElement) {
      // グローバル変数を使用する新しいオブザーバーを作成
      currentObserver = new MutationObserver(() => toggleComments(currentHideEnabled));
      currentObserver.observe(sectionsElement, {
        childList: true,
        subtree: true,
      });
    }
  });
};

initializeCommentToggle();

document.addEventListener('yt-navigate-finish', () => {
  initializeCommentToggle();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request[STORAGE_KEY] !== undefined) {
    // バックグラウンドスクリプトからメッセージを受信した際にグローバル状態を更新
    currentHideEnabled = request[STORAGE_KEY];
    toggleComments(currentHideEnabled);
    sendResponse({ status: 'success' });
  }
});
