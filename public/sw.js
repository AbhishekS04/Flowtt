// Service Worker Kill Switch
// This replaces the old cached SW that was serving stale Clerk v5 chunks.
// It unregisters itself immediately so the browser fetches all resources fresh.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] All caches cleared. Unregistering service worker.');
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    })
  );
});
