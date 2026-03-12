const CACHE_NAME = "bakeboard-v2";
const PRECACHE_URLS = ["/offline"];
const STATIC_ASSET_PATTERN = /\.(js|css|png|jpg|jpeg|svg|woff2?)$/;
const SAME_ORIGIN = self.location.origin;

function isCacheableAsset(request) {
  const requestUrl = new URL(request.url);
  return requestUrl.origin === SAME_ORIGIN && STATIC_ASSET_PATTERN.test(requestUrl.pathname);
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }

  return response;
}

async function navigationResponse(request) {
  try {
    return await fetch(request);
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match("/offline")) ||
      Response.error()
    );
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Network-first for navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(navigationResponse(event.request));
    return;
  }

  // Cache-first for static assets
  if (isCacheableAsset(event.request)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Network-first for API calls
  event.respondWith(fetch(event.request));
});
