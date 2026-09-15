// Seven Times — Service Worker
// Два раздельных кэша:
// 1) APP_CACHE — сама страница сайта, версионируется, чистится при каждом
//    обновлении кода (чтобы гость видел свежую версию сайта).
// 2) IMAGE_CACHE — фото блюд, ОТДЕЛЬНЫЙ и НЕ версионируется вместе с сайтом —
//    при обновлении кода сайта этот кэш НЕ трогается и НЕ чистится. Новые фото
//    просто добавляются в него по мере просмотра, старые остаются лежать вечно
//    (пока сам браузер гостя не решит почистить место на диске).

const APP_CACHE = "seventimes-app-v2";
const IMAGE_CACHE = "seventimes-images"; // без номера версии — стабильное имя навсегда

const APP_SHELL = [
  "./",
  "./index.html"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(APP_CACHE).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          // чистим только СТАРЫЕ версии APP_CACHE (seventimes-app-v1 и т.д.),
          // IMAGE_CACHE никогда не попадает под удаление
          .filter(function (name) { return name.indexOf("seventimes-app-") === 0 && name !== APP_CACHE; })
          .map(function (name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;

  // Google Apps Script — всегда в сеть, без кэша (данные должны быть свежими)
  if (req.url.indexOf("script.google.com") !== -1) {
    return;
  }

  // Сама страница сайта — "сеть, а если сети нет — кэш"
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          var resClone = res.clone();
          caches.open(APP_CACHE).then(function (cache) { cache.put(req, resClone); });
          return res;
        })
        .catch(function () {
          return caches.match(req, { cacheName: APP_CACHE }).then(function (cached) {
            return cached || caches.match("./index.html", { cacheName: APP_CACHE });
          });
        })
    );
    return;
  }

  // Фото (Cloudinary и другие) — "кэш навсегда, а если нет — сеть и сохраняем
  // в постоянный IMAGE_CACHE". Именно этот кэш переживает обновления сайта.
  if (req.destination === "image") {
    event.respondWith(
      caches.match(req, { cacheName: IMAGE_CACHE }).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          var resClone = res.clone();
          caches.open(IMAGE_CACHE).then(function (cache) { cache.put(req, resClone); });
          return res;
        }).catch(function () {
          return cached;
        });
      })
    );
    return;
  }

  // Скрипты и стили — вместе с версией самого сайта (эти обновляются вместе с кодом)
  if (req.destination === "script" || req.destination === "style") {
    event.respondWith(
      caches.match(req, { cacheName: APP_CACHE }).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          var resClone = res.clone();
          caches.open(APP_CACHE).then(function (cache) { cache.put(req, resClone); });
          return res;
        }).catch(function () {
          return cached;
        });
      })
    );
  }
});

// ── Сообщение от страницы: "заранее загрузи вот эти фото в фоне" ──
// Страница сама присылает список ссылок (после того как построила меню),
// SW тихо докачивает недостающие в IMAGE_CACHE, не мешая ничему видимому.
self.addEventListener("message", function (event) {
  if (!event.data || event.data.type !== "PREFETCH_IMAGES") return;
  var urls = event.data.urls || [];
  event.waitUntil(
    caches.open(IMAGE_CACHE).then(function (cache) {
      return Promise.all(
        urls.map(function (url) {
          return cache.match(url).then(function (already) {
            if (already) return; // уже есть — не качаем повторно
            return fetch(url).then(function (res) {
              if (res && res.ok) return cache.put(url, res);
            }).catch(function () {});
          });
        })
      );
    })
  );
});
