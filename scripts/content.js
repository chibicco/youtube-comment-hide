const hideComments = () => {
    const commentsSection = document.querySelector('#comments');
    if (commentsSection) {
      commentsSection.style.visibility = 'hidden';
    }
  };

  window.addEventListener('load', () => {
    hideComments();

    const sectionsElement = document.querySelector('#sections');
    if (sectionsElement) {
      const observer = new MutationObserver(hideComments);
      observer.observe(sectionsElement, {
        childList: true,
        subtree: true,
      });
    }
  });

  document.addEventListener('yt-navigate-finish', () => {
    hideComments();

    const sectionsElement = document.querySelector('#sections');
    if (sectionsElement) {
      const observer = new MutationObserver(hideComments);
      observer.observe(sectionsElement, {
        childList: true,
        subtree: true,
      });
    }
  });
