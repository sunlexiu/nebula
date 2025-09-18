self.addEventListener("install", event => {
  console.log("Service Worker installing.");
  self.skipWaiting();
});
self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});