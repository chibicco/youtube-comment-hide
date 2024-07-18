const hideComments = () => {
  const commentsSection = document.querySelector('#comments');
  if (commentsSection) {
    commentsSection.style.visibility = 'hidden';
  }
};

const showComments = () => {
  const commentsSection = document.querySelector('#comments');
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

chrome.storage.sync.get(['YouTubeCommentHideEnabled'], (result) => {
  toggleComments(result.YouTubeCommentHideEnabled);

  const sectionsElement = document.querySelector('#sections');
  if (sectionsElement) {
    const observer = new MutationObserver(() => toggleComments(result.YouTubeCommentHideEnabled));
    observer.observe(sectionsElement, {
      childList: true,
      subtree: true,
    });
  }
});

document.addEventListener('yt-navigate-finish', () => {
  chrome.storage.sync.get(['YouTubeCommentHideEnabled'], (result) => {
    toggleComments(result.YouTubeCommentHideEnabled);

    const sectionsElement = document.querySelector('#sections');
    if (sectionsElement) {
      const observer = new MutationObserver(() => toggleComments(result.YouTubeCommentHideEnabled));
      observer.observe(sectionsElement, {
        childList: true,
        subtree: true,
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.YouTubeCommentHideEnabled !== undefined) {
    toggleComments(request.YouTubeCommentHideEnabled);
    sendResponse({ status: 'success' });
  }
});
