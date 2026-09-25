// Seven Times — Service Worker
// Два раздельных кэша:
// 1) APP_CACHE — сама страница сайта, версионируется, чистится при каждом
//    обновлении кода (чтобы гость видел свежую версию сайта).
// 2) IMAGE_CACHE — фото блюд, ОТДЕЛЬНЫЙ и НЕ версионируется вместе с сайтом —
//    при обновлении кода сайта этот кэш НЕ трогается и НЕ чистится. Новые фото
//    просто добавляются в него по мере просмотра, старые остаются лежать вечно
//    (пока сам браузер гостя не решит почистить место на диске).

const APP_CACHE = "seventimes-app-v4";
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

  // Сама страница сайта — "сеть, а если сеть тупит дольше 3 сек или её нет — кэш".
  // Свежая версия всё равно докачается в фоне и сохранится на следующий заход.
  if (req.mode === "navigate") {
    var network = fetch(req).then(function (res) {
      if (res && res.ok && !res.redirected) {
        var resClone = res.clone();
        caches.open(APP_CACHE).then(function (cache) { cache.put(req, resClone); });
      }
      return res;
    });
    event.waitUntil(network.catch(function () {}));
    var fromCache = function () {
      return caches.match(req, { cacheName: APP_CACHE }).then(function (cached) {
        return cached || caches.match("./index.html", { cacheName: APP_CACHE });
      });
    };
    event.respondWith(new Promise(function (resolve) {
      var done = false;
      var finish = function (res) { if (!done && res) { done = true; resolve(res); } };
      var timer = setTimeout(function () {
        fromCache().then(finish);
      }, 3000);
      network.then(function (res) {
        clearTimeout(timer);
        finish(res);
      }).catch(function () {
        clearTimeout(timer);
        fromCache().then(function (cached) {
          if (cached) finish(cached);
          else network.then(finish, function () { finish(Response.error()); });
        });
      });
    }));
    return;
  }

  // Фото (Cloudinary и другие) — "кэш навсегда, а если нет — сеть и сохраняем
  // в постоянный IMAGE_CACHE". Именно этот кэш переживает обновления сайта.
  if (req.destination === "image") {
    event.respondWith(
      caches.match(req, { cacheName: IMAGE_CACHE }).then(function (cached) {
        if (cached) return cached;
        // Фото Cloudinary берём CORS-запросом: такой ответ можно проверить на
        // ошибку и он не раздувает лимит хранилища (непрозрачный ответ Chrome
        // считает за несколько мегабайт — при сотнях фото браузер мог стереть
        // всё хранилище сайта, включая корзину). Не вышло — обычный запрос.
        var isCloudinary = req.url.indexOf("https://res.cloudinary.com/") === 0;
        var net = isCloudinary
          ? fetch(req.url, { mode: "cors", credentials: "omit" }).catch(function () { return fetch(req); })
          : fetch(req);
        return net.then(function (res) {
          // кэшируем только точно успешные ответы; непрозрачный — только не для Cloudinary
          if (res && (res.ok || (res.type === "opaque" && !isCloudinary))) {
            var resClone = res.clone();
            caches.open(IMAGE_CACHE).then(function (cache) { cache.put(req, resClone); });
          }
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
          if (res && (res.ok || res.type === "opaque")) {
            var resClone = res.clone();
            caches.open(APP_CACHE).then(function (cache) { cache.put(req, resClone); });
          }
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
  // Качаем максимум по 3 фото одновременно, чтобы фоновая докачка не забивала
  // канал и не тормозила фото, которые гость видит на экране прямо сейчас.
  event.waitUntil(
    caches.open(IMAGE_CACHE).then(function (cache) {
      var i = 0;
      function next() {
        if (i >= urls.length) return Promise.resolve();
        var url = urls[i++];
        return cache.match(url).then(function (already) {
          if (already) return; // уже есть — не качаем повторно
          return fetch(url).then(function (res) {
            if (res && res.ok) return cache.put(url, res);
          });
        }).catch(function () {}).then(next);
      }
      return Promise.all([next(), next(), next()]);
    })
  );
});
