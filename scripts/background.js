chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ YouTubeCommentHideEnabled: true });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.sync.get(['YouTubeCommentHideEnabled'], (result) => {
    const newValue = !result.YouTubeCommentHideEnabled;
    chrome.storage.sync.set({ YouTubeCommentHideEnabled: newValue }, () => {
      updateAction(newValue);
      sendMessageToTab(tab.id, { YouTubeCommentHideEnabled: newValue })
        .then(() => {
        })
        .catch(error => {
          console.error('Error sending message:', error);
        });
    });
  });
});

function updateAction(YouTubeCommentHideEnabled) {
  const iconPath = YouTubeCommentHideEnabled
  ? {
      "16": "/images/icon-16.png",
      "48": "/images/icon-48.png",
      "128": "/images/icon-128.png"
    }
  : {
      "16": "/images/icon-disabled-16.png",
      "48": "/images/icon-disabled-48.png",
      "128": "/images/icon-disabled-128.png"
    };
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
