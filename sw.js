// Seven Times — Service Worker
// Кэширует главную страницу сайта, чтобы меню открывалось даже без интернета
// (последняя загруженная версия). Картинки (Cloudinary) кэшируются "по факту"
// при первом просмотре — второй раз грузятся мгновенно из кэша.

const CACHE_NAME = "seventimes-v1";
const APP_SHELL = [
  "./",
  "./index.html"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () {
        // если index.html называется иначе или лежит по другому пути — не падаем
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;

  // Запросы к Google Apps Script (меню, заказы, статус) — всегда идём в сеть,
  // офлайн-кэш тут не нужен и вреден (данные должны быть свежими).
  if (req.url.indexOf("script.google.com") !== -1) {
    return;
  }

  // Сама страница сайта — "сеть, а если сети нет — кэш" (всегда свежая версия,
  // но если офлайн — последняя сохранённая).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, resClone); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match("./index.html");
          });
        })
    );
    return;
  }

  // Картинки и прочие статические файлы — "кэш, а если нет — сеть, и сохраняем"
  if (req.destination === "image" || req.destination === "script" || req.destination === "style") {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, resClone); });
          return res;
        }).catch(function () {
          return cached;
        });
      })
    );
  }
});
