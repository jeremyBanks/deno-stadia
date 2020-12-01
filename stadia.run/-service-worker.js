const cacheId = "stadia.run/cache/v2";

self.addEventListener("fetch", (/** @type {any} */ event) => {
  const fetchEvent = /** @type {FetchEvent} */ (event);

  const request = event.request;

  const cacheFirst = false;

  const cached = caches.match(request).then((response) => {
    response?.headers.set("Cache-Control", "no-store");
    return response;
  });

  const fresh = (async () => {
    const response = await fetch(request);
    if (
      response.ok && (
        request.method === "GET" || request.method === "HEAD"
      )
    ) {
      const cache = await caches.open(cacheId);
      cache.put(event.request, response.clone());
    }
    return response;
  })();

  return fetchEvent.respondWith(
    cacheFirst ? Promise.any([cached, fresh]) : fresh.catch(() => cached),
  );
});
