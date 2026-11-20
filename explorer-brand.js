(() => {
  'use strict';
  const src = '/explorer-mark.svg?v=2.0.0';
  const setBrand = () => {
    document.querySelectorAll('img.brand-symbol').forEach(image => {
      if (image.getAttribute('src') !== src) {
        image.setAttribute('src', src);
        image.setAttribute('alt', 'Explorer — bússola e diafragma');
      }
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#071D28');
    if (!document.querySelector('link[data-explorer-brand="icon"]')) {
      const icon = document.createElement('link');
      icon.rel = 'icon'; icon.type = 'image/svg+xml'; icon.href = src;
      icon.setAttribute('data-explorer-brand', 'icon');
      document.head.appendChild(icon);
    }
    if (!document.querySelector('link[data-explorer-brand="apple"]')) {
      const touch = document.createElement('link');
      touch.rel = 'apple-touch-icon'; touch.href = src;
      touch.setAttribute('data-explorer-brand', 'apple');
      document.head.appendChild(touch);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setBrand, {once:true}); else setBrand();
  const observer = new MutationObserver((changes) => {
    if (changes.some(change => change.addedNodes?.length)) setBrand();
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
})();