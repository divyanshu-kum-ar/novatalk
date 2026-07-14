const CACHE_NAME = "novatalk-cache-v1";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  OFFLINE_URL,
  "/vite.svg",
  "/bg.png",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png"
];

// Install Phase: Pre-cache static shell and offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Phase: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Phase: Intercept and serve from cache or network
self.addEventListener("fetch", (event) => {
  // Only intercept GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Bypass checks: Socket.IO, API requests, third-party requests, and Vite-dev files
  const isSocket = url.pathname.includes("socket.io");
  const isApi = url.pathname.includes("/api/");
  const isExternal = url.origin !== self.location.origin;
  const isViteDev = 
    url.pathname.startsWith("/@") || 
    url.pathname.includes("/node_modules/") || 
    url.pathname.includes(".jsx") || 
    url.pathname.includes(".tsx") || 
    url.pathname.includes(".ts") || 
    url.pathname.includes("?import") || 
    url.pathname.includes("hot-update");

  if (isSocket || isApi || isExternal || isViteDev) {
    return; // Let network handle it directly
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset, and fetch updated asset in background (Stale-While-Revalidate)
        if (url.pathname !== OFFLINE_URL) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {
              // Ignore background fetch failures
            });
        }
        return cachedResponse;
      }

      // Fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache dynamic static files like compiled js, css, images, or svgs on the fly
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.pathname.endsWith(".js") ||
              url.pathname.endsWith(".css") ||
              url.pathname.endsWith(".png") ||
              url.pathname.endsWith(".svg") ||
              url.pathname.includes("/assets/"))
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fetch fails and it's a page navigation request, return offline fallback page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});
