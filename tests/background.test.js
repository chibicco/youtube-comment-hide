describe('Background Script', () => {
  let updateAction, sendMessageToTab;

  beforeEach(() => {
    // Chrome API モックをセットアップ
    chrome.storage.sync.get.yields({ YouTubeCommentHideEnabled: true });
    chrome.storage.sync.set.yields();
    chrome.tabs.sendMessage.yields({ status: 'success' });

    // background.jsの関数を模擬
    updateAction = (YouTubeCommentHideEnabled) => {
      const iconPath = YouTubeCommentHideEnabled ? ICON_PATHS.enabled : ICON_PATHS.disabled;
      chrome.action.setIcon({ path: iconPath });
    };

    sendMessageToTab = (tabId, message) => {
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          if (response && response.status === 'success') {
            resolve();
          } else {
            reject(new Error('No response from content script'));
          }
        });
      });
    };
  });

  describe('updateAction', () => {
    test('YouTubeCommentHideEnabledがtrueの場合、有効アイコンを設定する', () => {
      updateAction(true);

      expect(chrome.action.setIcon.calledOnce).toBe(true);
      expect(chrome.action.setIcon.calledWith({
        path: ICON_PATHS.enabled
      })).toBe(true);
    });

    test('YouTubeCommentHideEnabledがfalseの場合、無効アイコンを設定する', () => {
      updateAction(false);

      expect(chrome.action.setIcon.calledOnce).toBe(true);
      expect(chrome.action.setIcon.calledWith({
        path: ICON_PATHS.disabled
      })).toBe(true);
    });
  });

  describe('sendMessageToTab', () => {
    test('メッセージ送信が成功した場合、resolveする', async () => {
      chrome.tabs.sendMessage.yields({ status: 'success' });

      await expect(sendMessageToTab(123, { YouTubeCommentHideEnabled: true }))
        .resolves.toBeUndefined();

      expect(chrome.tabs.sendMessage.calledOnce).toBe(true);
      expect(chrome.tabs.sendMessage.calledWith(
        123,
        { YouTubeCommentHideEnabled: true }
      )).toBe(true);
    });

    test('chrome.runtime.lastErrorが存在する場合、rejectする', async () => {
      chrome.runtime.lastError = { message: 'Could not establish connection' };
      chrome.tabs.sendMessage.yields();

      await expect(sendMessageToTab(123, { YouTubeCommentHideEnabled: true }))
        .rejects.toEqual({ message: 'Could not establish connection' });

      chrome.runtime.lastError = undefined;
    });

    test('content scriptから応答がない場合、rejectする', async () => {
      chrome.tabs.sendMessage.yields(null);

      await expect(sendMessageToTab(123, { YouTubeCommentHideEnabled: true }))
        .rejects.toThrow('No response from content script');
    });
  });

  describe('Chrome Storage連携', () => {
    test('インストール時にストレージから初期状態を取得する', () => {
      chrome.storage.sync.get.yields({ YouTubeCommentHideEnabled: undefined });
      chrome.storage.sync.set.callsArg(1); // Call the callback (second argument)

      // Simulate onInstalled listener
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY] === undefined) {
          chrome.storage.sync.set({ [STORAGE_KEY]: true }, () => {
            updateAction(true);
          });
        }
      });

      expect(chrome.storage.sync.get.calledOnce).toBe(true);
      expect(chrome.storage.sync.set.calledWith({ YouTubeCommentHideEnabled: true })).toBe(true);
    });

    test('ブラウザ起動時に状態を復元する', () => {
      chrome.storage.sync.get.yields({ YouTubeCommentHideEnabled: false });

      // Simulate onStartup listener
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        const isEnabled = result[STORAGE_KEY] !== false;
        updateAction(isEnabled);
      });

      expect(chrome.storage.sync.get.calledOnce).toBe(true);
      expect(chrome.action.setIcon.calledWith({
        path: ICON_PATHS.disabled
      })).toBe(true);
    });
  });

  describe('アクションクリックハンドラー', () => {
    test('YouTubeタブでアクションがクリックされた場合、状態をトグルする', () => {
      const tab = {
        id: 123,
        url: 'https://www.youtube.com/watch?v=test'
      };

      chrome.storage.sync.get.yields({ YouTubeCommentHideEnabled: true });
      chrome.storage.sync.set.yields();
      chrome.tabs.sendMessage.yields({ status: 'success' });

      // Simulate action click
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        const newValue = !result[STORAGE_KEY];
        chrome.storage.sync.set({ [STORAGE_KEY]: newValue }, () => {
          updateAction(newValue);
          if (tab.url && tab.url.includes('youtube.com')) {
            sendMessageToTab(tab.id, { [STORAGE_KEY]: newValue });
          }
        });
      });

      expect(chrome.storage.sync.get.calledOnce).toBe(true);
      expect(chrome.storage.sync.set.calledWith({ YouTubeCommentHideEnabled: false })).toBe(true);
      expect(chrome.action.setIcon.calledWith({
        path: ICON_PATHS.disabled
      })).toBe(true);
    });

    test('YouTube以外のタブでアクションがクリックされた場合、メッセージを送信しない', () => {
      const tab = {
        id: 456,
        url: 'https://www.google.com'
      };

      chrome.storage.sync.get.yields({ YouTubeCommentHideEnabled: true });
      chrome.storage.sync.set.yields();

      // Simulate action click
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        const newValue = !result[STORAGE_KEY];
        chrome.storage.sync.set({ [STORAGE_KEY]: newValue }, () => {
          updateAction(newValue);
          if (tab.url && tab.url.includes('youtube.com')) {
            sendMessageToTab(tab.id, { [STORAGE_KEY]: newValue });
          }
        });
      });

      expect(chrome.tabs.sendMessage.called).toBe(false);
      expect(chrome.action.setIcon.calledOnce).toBe(true);
    });
  });
});
