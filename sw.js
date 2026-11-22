const BASE = new URL(self.registration.scope);
const PREFIX = 'salah-static:' + BASE.pathname + ':';
const CACHE_NAME = PREFIX + 'v32';
const legacyIcons = ['ocean', 'midnight', 'sand', 'slate', 'mihrab', 'minaret', 'compass', 'mat'];
const palettes = ['forest', 'ocean', 'midnight', 'sand', 'slate'];
const iconDesigns = ['crescent', 'mihrab', 'minaret', 'compass', 'mat'];
const iconFiles = palettes.flatMap(palette => iconDesigns.flatMap(icon => [
  './install/' + palette + '-' + icon + '.html',
  './manifest-' + palette + '-' + icon + '.webmanifest',
  ...[180, 192, 512].map(size => './icons/art/' + palette + '/' + icon + '-' + size + '.png')
]));
const FILES = [
  './', './index.html', './styles.css', './region.js', './solar.js', './providers.js', './timetable.js',
  './audio.js', './hijri.js', './app.js',
  './manifest.webmanifest', './vendor/magvar/magvar.mjs', './vendor/magvar/utils.mjs', './vendor/magvar/WMMCOF2025.mjs',
  './install/icon.js', ...['forest', ...legacyIcons].map(name => './install/' + name + '.html'),
  ...legacyIcons.map(name => './manifest-' + name + '.webmanifest'), ...iconFiles
].map(path => new URL(path, BASE).href);
const index = new URL('./index.html', BASE).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(FILES.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
    .then(async () => {
      await self.clients.claim();
      try {
        const subscription = await self.registration.pushManager?.getSubscription();
        await subscription?.unsubscribe();
      } catch {}
    }));
});
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname) ||
      url.pathname.startsWith(BASE.pathname + 'api/')) return;
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
