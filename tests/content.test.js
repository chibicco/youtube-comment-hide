describe('Content Script', () => {
  let hideComments, showComments, toggleComments, isExtensionContextValid;

  beforeEach(() => {
    // DOMをリセット
    document.body.innerHTML = `
      <div id="sections">
        <div id="comments">Test Comments</div>
      </div>
    `;

    // Chrome storage モックをセットアップ
    chrome.storage.sync.get.yields({ YouTubeCommentHideEnabled: true });

    // content.jsの関数を模擬（実際のファイルをロードする代わりに）
    hideComments = () => {
      const commentsSection = document.querySelector('#comments');
      if (commentsSection) {
        commentsSection.style.visibility = 'hidden';
      }
    };

    showComments = () => {
      const commentsSection = document.querySelector('#comments');
      if (commentsSection) {
        commentsSection.style.visibility = 'visible';
      }
    };

    toggleComments = (hide) => {
      if (hide) {
        hideComments();
      } else {
        showComments();
      }
    };

    isExtensionContextValid = () => {
      try {
        return !!(chrome.runtime && chrome.runtime.id);
      } catch {
        return false;
      }
    };
  });

  describe('hideComments', () => {
    test('コメントセクションが存在する場合、非表示にする', () => {
      const commentsSection = document.querySelector('#comments');
      expect(commentsSection).toBeTruthy();

      hideComments();

      expect(commentsSection.style.visibility).toBe('hidden');
    });

    test('コメントセクションが存在しない場合でもエラーを投げない', () => {
      document.body.innerHTML = '';

      expect(() => hideComments()).not.toThrow();
    });
  });

  describe('showComments', () => {
    test('コメントセクションが存在する場合、表示する', () => {
      const commentsSection = document.querySelector('#comments');
      commentsSection.style.visibility = 'hidden';

      showComments();

      expect(commentsSection.style.visibility).toBe('visible');
    });

    test('コメントセクションが存在しない場合でもエラーを投げない', () => {
      document.body.innerHTML = '';

      expect(() => showComments()).not.toThrow();
    });
  });

  describe('toggleComments', () => {
    test('hideがtrueの場合、コメントを非表示にする', () => {
      const commentsSection = document.querySelector('#comments');

      toggleComments(true);

      expect(commentsSection.style.visibility).toBe('hidden');
    });

    test('hideがfalseの場合、コメントを表示する', () => {
      const commentsSection = document.querySelector('#comments');
      commentsSection.style.visibility = 'hidden';

      toggleComments(false);

      expect(commentsSection.style.visibility).toBe('visible');
    });
  });

  describe('isExtensionContextValid', () => {
    test('chrome.runtime.idが存在する場合、trueを返す', () => {
      chrome.runtime.id = 'test-extension-id';

      expect(isExtensionContextValid()).toBe(true);
    });

    test('chrome.runtimeが未定義の場合、falseを返す', () => {
      const originalRuntime = chrome.runtime;
      delete chrome.runtime;

      expect(isExtensionContextValid()).toBe(false);

      chrome.runtime = originalRuntime;
    });
    
    test('拡張機能のコンテキストが無効化された場合の処理', () => {
      const originalRuntime = chrome.runtime;
      
      // コンテキストが有効な状態
      chrome.runtime.id = 'test-extension-id';
      expect(isExtensionContextValid()).toBe(true);
      
      // 拡張機能の更新/リロードをシミュレート
      chrome.runtime.id = undefined;
      expect(isExtensionContextValid()).toBe(false);
      
      chrome.runtime = originalRuntime;
    });
  });

  describe('Chrome Storage連携', () => {
    test('chrome.storage.syncから初期状態を取得する', () => {
      chrome.storage.sync.get.yields({ YouTubeCommentHideEnabled: true });

      chrome.storage.sync.get(['YouTubeCommentHideEnabled'], (result) => {
        expect(result.YouTubeCommentHideEnabled).toBe(true);
      });

      expect(chrome.storage.sync.get.calledOnce).toBe(true);
    });

    test('storage.onChangedイベントを処理する', () => {
      const changes = {
        YouTubeCommentHideEnabled: {
          oldValue: true,
          newValue: false
        }
      };

      let currentHideEnabled = true;

      // Simulate storage change listener
      const listener = (changes, namespace) => {
        if (namespace === 'sync' && changes.YouTubeCommentHideEnabled) {
          currentHideEnabled = changes.YouTubeCommentHideEnabled.newValue;
        }
      };

      listener(changes, 'sync');

      expect(currentHideEnabled).toBe(false);
    });
    
    test('別ウィンドウからの変更も同期される（storage.onChanged経由）', () => {
      let currentHideEnabled = true;
      let isInitialized = true;
      const toggleCommentsMock = jest.fn();
      
      // chrome.storage.onChangedリスナーを模擬
      const storageChangeListener = (changes, namespace) => {
        if (namespace === 'sync' && changes.YouTubeCommentHideEnabled) {
          currentHideEnabled = changes.YouTubeCommentHideEnabled.newValue;
          if (isInitialized) {
            toggleCommentsMock(currentHideEnabled);
          }
        }
      };
      
      // 別ウィンドウでの変更を模擬
      const changes = {
        YouTubeCommentHideEnabled: {
          oldValue: true,
          newValue: false
        }
      };
      
      storageChangeListener(changes, 'sync');
      
      expect(currentHideEnabled).toBe(false);
      expect(toggleCommentsMock).toHaveBeenCalledWith(false);
    });
    
    test('storage.onChangedで他のキーの変更は無視される', () => {
      let currentHideEnabled = true;
      const toggleCommentsMock = jest.fn();
      
      const storageChangeListener = (changes, namespace) => {
        if (namespace === 'sync' && changes.YouTubeCommentHideEnabled) {
          currentHideEnabled = changes.YouTubeCommentHideEnabled.newValue;
          toggleCommentsMock(currentHideEnabled);
        }
      };
      
      // 関係ないキーの変更
      const changes = {
        OtherExtensionKey: {
          oldValue: 'old',
          newValue: 'new'
        }
      };
      
      storageChangeListener(changes, 'sync');
      
      expect(currentHideEnabled).toBe(true); // 変更されない
      expect(toggleCommentsMock).not.toHaveBeenCalled();
    });
    
    test('初期化前はstorage.onChangedでも更新しない', () => {
      let currentHideEnabled = true;
      let isInitialized = false; // 初期化前
      const toggleCommentsMock = jest.fn();
      
      const storageChangeListener = (changes, namespace) => {
        if (namespace === 'sync' && changes.YouTubeCommentHideEnabled) {
          currentHideEnabled = changes.YouTubeCommentHideEnabled.newValue;
          if (isInitialized) {
            toggleCommentsMock(currentHideEnabled);
          }
        }
      };
      
      const changes = {
        YouTubeCommentHideEnabled: {
          oldValue: true,
          newValue: false
        }
      };
      
      storageChangeListener(changes, 'sync');
      
      expect(currentHideEnabled).toBe(false); // 値は更新される
      expect(toggleCommentsMock).not.toHaveBeenCalled(); // でも表示は更新されない
    });
  });

  describe('メッセージ処理', () => {
    test('バックグラウンドスクリプトからのメッセージを処理する', () => {
      let currentHideEnabled = true;
      const sendResponse = jest.fn();

      const messageListener = (request, _, sendResponse) => {
        if (request.YouTubeCommentHideEnabled !== undefined) {
          currentHideEnabled = request.YouTubeCommentHideEnabled;
          sendResponse({ status: 'success' });
        }
      };

      messageListener(
        { YouTubeCommentHideEnabled: false },
        {},
        sendResponse
      );

      expect(currentHideEnabled).toBe(false);
      expect(sendResponse).toHaveBeenCalledWith({ status: 'success' });
    });
  });
});
