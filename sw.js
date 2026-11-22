const BASE = new URL(self.registration.scope);
const PREFIX = 'salah-static:' + BASE.pathname + ':';
const CACHE_NAME = PREFIX + 'v25';
const iconVariants = ['ocean', 'midnight', 'sand', 'slate', 'mihrab', 'minaret', 'compass', 'mat'];
const iconFiles = iconVariants.flatMap(name => [
  './manifest-' + name + '.webmanifest',
  ...[180, 192, 512].map(size => './icons/' + name + '/icon-' + size + '.png')
]);
const FILES = [
  './', './index.html', './styles.css', './region.js', './solar.js', './providers.js', './audio.js', './app.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png',
  './vendor/magvar/magvar.mjs', './vendor/magvar/utils.mjs', './vendor/magvar/WMMCOF2025.mjs', ...iconFiles,
  './install/icon.js', ...['forest', ...iconVariants].map(name => './install/' + name + '.html')
].map(path => new URL(path, BASE).href);
const index = new URL('./index.html', BASE).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(FILES.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  url.search = '';
  const asset = url.href;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const hit = await cache.match(asset);
    if (hit) return hit;
    try {
      return await fetch(request);
    } catch {
      if (request.mode === 'navigate') {
        const page = await cache.match(index);
        if (page) return page;
      }
      return new Response('Unavailable offline', { status: 503, statusText: 'Offline' });
    }
  }));
});
