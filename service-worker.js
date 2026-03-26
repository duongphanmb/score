const CACHE_NAME = "scoretracker";
const urlsToCache = [
    ".",
    "./index.html",
    "./assets/css/fonts.css",
    "./assets/css/main.css",
    "./assets/js/main.js",
    "./favicon.ico",
    "./assets/fonts/Roboto-Regular.woff2",
    "./assets/fonts/Roboto-Bold.woff2",
    "./assets/icons/hexagon-dice.svg",
    "./assets/icons/leaderboard.svg",
    "./assets/icons/math-book.svg",
    "./assets/icons/minus.svg",
    "./assets/icons/plus.svg",
    "./assets/icons/question-mark.svg",
    "./assets/icons/restart.svg",
    "./assets/icons/trash.svg",
    "./assets/icons/user-plus.svg",
    "./assets/icons/user-xmark.svg",
    "./assets/icons/warning-triangle.svg",
    "./assets/icons/xmark.svg",
    "./assets/icons/favicon/apple-touch-icon.png",
    "./assets/icons/favicon/favicon.ico",
    "./assets/icons/favicon/favicon.svg",
    "./assets/icons/favicon/favicon-96x96.png",
    "./assets/icons/favicon/web-app-manifest-192x192.png",
    "./assets/icons/favicon/web-app-manifest-512x512.png",
    "./site.webmanifest",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const url of urlsToCache) {
                try {
                    await cache.add(url);
                } catch (err) {
                    console.error("Failed to cache:", url);
                }
            }
        }),
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== CACHE_NAME)
                        .map((k) => caches.delete(k)),
                ),
            ),
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;
            return fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    if (event.request.mode === "navigate") {
                        return caches.match("index.html");
                    }
                });
        }),
    );
});
