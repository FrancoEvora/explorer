const CACHE_NAME = 'explorer-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './cloud.js',
  './manifest.json',
  './logo.svg',
  './assets/unlock.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isAppAsset = url.origin === self.location.origin;
  const isSupabaseLibrary = url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/@supabase/supabase-js@2/');
  if (!isAppAsset && !isSupabaseLibrary) return;

  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response && (response.ok || response.type === 'opaque')) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone()).catch(() => null);
        }
        return response;
      } catch (error) {
        if (isAppAsset) return caches.match('./index.html');
        throw error;
      }
    })
  );
});
