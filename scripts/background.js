try {
  importScripts('./constants.js');
} catch (e) {
  console.error('Failed to import constants:', e);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    // 初回インストール時のみデフォルト値を設定
    if (result[STORAGE_KEY] === undefined) {
      chrome.storage.sync.set({ [STORAGE_KEY]: true });
      updateAction(true);
    } else {
      // 既存の設定がある場合はそれに従ってアイコンを更新
      updateAction(result[STORAGE_KEY]);
    }
  });
});

// ブラウザ起動時にもアイコンを更新
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    const isEnabled = result[STORAGE_KEY] !== false;
    updateAction(isEnabled);
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    const newValue = !result[STORAGE_KEY];
    chrome.storage.sync.set({ [STORAGE_KEY]: newValue }, () => {
      updateAction(newValue);
      sendMessageToTab(tab.id, { [STORAGE_KEY]: newValue })
        .catch(error => {
          console.error('Error sending message:', error);
        });
    });
  });
});

function updateAction(YouTubeCommentHideEnabled) {
  const iconPath = YouTubeCommentHideEnabled ? ICON_PATHS.enabled : ICON_PATHS.disabled;
  chrome.action.setIcon({ path: iconPath });
}

function sendMessageToTab(tabId, message) {
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
}
