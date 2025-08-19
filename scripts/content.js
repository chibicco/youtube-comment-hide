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
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    toggleComments(result[STORAGE_KEY]);

    const sectionsElement = document.querySelector(SECTIONS_SELECTOR);
    if (sectionsElement) {
      const observer = new MutationObserver(() => toggleComments(result[STORAGE_KEY]));
      observer.observe(sectionsElement, {
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
    toggleComments(request[STORAGE_KEY]);
    sendResponse({ status: 'success' });
  }
});
