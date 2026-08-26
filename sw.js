/* HOKAGE service worker — cache-first for the shell, versioned, old caches swept on activate. */
var VERSION = 'hokage-v5.0.0';
var ASSETS = ['.', 'index.html', 'manifest.webmanifest', 'css/style.css', 'css/v5.css',
  'js/data.js', 'js/lore.js', 'js/guides.js', 'js/core.js', 'js/game.js', 'js/climb.js', 'js/reel.js', 'js/ui-climb.js', 'js/fx.js', 'js/ui.js', 'js/ui-run.js', 'js/ui-more.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png',
  'fonts/yuji-syuku-japanese-400-normal.woff2', 'fonts/yuji-syuku-latin-400-normal.woff2'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    return r || fetch(e.request).then(function (res) {
      if (res && res.ok && new URL(e.request.url).origin === self.location.origin) { var cp = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, cp); }); }
      return res;
    });
  }).catch(function () { return caches.match('index.html'); }));
});
