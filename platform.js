(() => {
  'use strict';
  const bridge = window.SalahAndroid;
  if (typeof bridge?.postMessage !== 'function') return;

  const listeners = new Map();
  bridge.onmessage = event => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    listeners.get(message?.type)?.(message);
  };
  window.SalahNative = Object.freeze({
    on(type, listener) { listeners.set(type, listener); },
    send(type, fields) { bridge.postMessage(JSON.stringify({ ...fields, type })); }
  });

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (link?.protocol !== 'https:' || link.origin === location.origin) return;
    event.preventDefault();
    window.SalahNative.send('openLink', { url:link.href });
  });
})();
