// Uncomment the lines below
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/index.js',
  '/manifest.webmanifest',
  'styles.css',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'db.js'
];

const CACHE_NAME = "static-cache-v0";
const DATA_CACHE_NAME = "data-cache-v0";

self.addEventListener("install", evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("caching all the files");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", evt => {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key=> {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  )
  self.clients.claim();
});

self.addEventListener("fetch", evt => {
  if (evt.request.url.includes('/api/')) {
    console.log('[Service Worker] Fetch (data)', evt.request.url);
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }
            return response;
          })
          .catch(err => {
            return cache.match(evt.request);
          })
      })
    )
    return;
  }

  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      })
    })
  )
});