// Chrome API のモックセットアップ
const chrome = require('sinon-chrome');
const sinon = require('sinon');

// Chrome APIをグローバルに設定
global.chrome = chrome;

// 定数をグローバルに設定
global.STORAGE_KEY = 'YouTubeCommentHideEnabled';
global.COMMENTS_SELECTOR = '#comments';
global.SECTIONS_SELECTOR = '#sections';
global.ICON_PATHS = {
  enabled: {
    "16": "/images/icon-16.png",
    "48": "/images/icon-48.png",
    "128": "/images/icon-128.png"
  },
  disabled: {
    "16": "/images/icon-disabled-16.png",
    "48": "/images/icon-disabled-48.png",
    "128": "/images/icon-disabled-128.png"
  }
};

// 各テストの前にChromeモックをリセット
beforeEach(() => {
  chrome.flush();
  // chrome.actionを追加（Manifest V3対応）
  chrome.action = {
    setIcon: sinon.stub()
  };
  // runtime.idを設定
  chrome.runtime = chrome.runtime || {};
  chrome.runtime.id = 'test-extension-id';
});

// 各テストの後にモックをクリア
afterEach(() => {
  chrome.flush();
});