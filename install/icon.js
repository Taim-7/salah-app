'use strict';

if (navigator.standalone === true || matchMedia('(display-mode: standalone)').matches) {
  const app = new URL('../', location.href);
  app.searchParams.set('icon', document.body.dataset.icon || document.body.dataset.accent);
  if (document.body.dataset.icon) app.searchParams.set('palette', document.body.dataset.accent);
  location.replace(app);
} else if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('../sw.js').catch(() => {});
}
