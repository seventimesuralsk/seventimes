// SEVEN AI сам не отвечает — все вопросы у администратора (Telegram / панель оператора).
// Поэтому «мозг» ИИ (~200 КБ) больше не грузим: чат открывается в разы быстрее.
// Интерфейсу нужны только эти заглушки.
(function (root) {
  if (root.SevenLocalAI) return;
  root.SevenLocalAI = {
    parseCustom: function () { return {}; },
    afterSend: function (kind) { return { text: kind === "book" ? "Заявка на бронь отправлена — администратор скоро свяжется с вами." : "Заказ отправлен — администратор скоро свяжется с вами." }; },
    reply: function () { return { text: "" }; },
    fromDish: function () { return null; },
    FACTS: {}
  };
})(window);

/*
 * ── Окно чата SEVEN AI (только в браузере) ──
 * Живёт в этом же файле, чтобы главная страница не таскала лишний код:
 * index.html держит только оболочку (окно, историю, кнопки), всё остальное
 * подгружается вместе с движком, когда гость открывает «Сообщения».
 * Карточка блюда в переписке открывает шторку блюда поверх чата.
 * Сами по себе ничего не открываем — только по тапу или по «открой …».
 */
(function () {
  if (typeof window === "undefined" || !window.document || !window.SevenLocalAI || window._saiSend) return;
  var W = window, D = document, AI = W.SevenLocalAI;
  function el(id) { return D.getElementById(id); }
  function safe(f, dflt) { try { return f(); } catch (e) { return dflt; } }
  function scrollEnd() { var m = el("seventAiMessages"); if (m) m.scrollTop = m.scrollHeight; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function ne(s) { return typeof noEmoji === "function" ? noEmoji(String(s || "")) : String(s || ""); }
  function ev(name, det) { safe(function () { logGuestEvent(name, det || ""); }); }
  function toast(t) { safe(function () { showToast(t); }); }
  function curBranch() { return typeof branch !== "undefined" && branch ? branch : null; }
  function menuNow() { return typeof menuData !== "undefined" && menuData ? menuData : {}; }
  function chatVisible() { var o = el("seventAiOv"), t = el("seventAiOvTitle"); return !!(o && o.style.display !== "none" && t && t.textContent === "SEVEN AI"); }

  // ── стили чата
  var css =
    ".sai-chips{display:flex;flex-shrink:0;flex-wrap:wrap;gap:8px;align-self:flex-start;max-width:100%;margin-top:-4px}" +
    ".sai-chip{font:inherit;font-size:0.78rem;line-height:1.25;padding:8px 13px;border-radius:999px;border:1px solid #e3cdd3;background:#fff;color:#7a1128;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s,background .12s;text-align:left}" +
    ".sai-chip:active{transform:scale(.96);background:#f7eef0}" +
    ".sai-cards{display:flex;flex-shrink:0;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;align-self:stretch;margin:-4px calc(-1*var(--px)) 0;padding:2px var(--px) 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}" +
    ".sai-cards::-webkit-scrollbar{display:none}" +
    ".sai-card{flex:0 0 58%;max-width:230px;scroll-snap-align:start;background:#fff;border:1px solid #ececef;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s}" +
    ".sai-card:active{transform:scale(.97)}" +
    ".sai-cards.one .sai-card{flex-basis:84%;max-width:320px}" +
    ".sai-card img,.sai-card-ph{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#f2f2f4}" +
    ".sai-card-b{padding:9px 12px 11px}" +
    ".sai-card-n{font-size:0.8rem;font-weight:600;color:#1d1d1f;line-height:1.3}" +
    ".sai-card-p{font-size:0.76rem;font-weight:600;color:#7a1128;margin-top:3px}" +
    ".sai-card-s{font-size:0.66rem;color:#6e6e73;margin-top:2px}" +
    ".sai-card-d{font-size:0.68rem;color:#6e6e73;line-height:1.4;margin-top:5px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}" +
    ".sai-cards.one .sai-card-d{-webkit-line-clamp:6}" +
    ".sai-mic{flex-shrink:0;width:44px;height:44px;border-radius:50%;border:none;background:#7a1128;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;align-self:center;-webkit-tap-highlight-color:transparent;transition:transform .12s}.sai-mic:active{transform:scale(.92)}" +
    ".sai-mic.on{animation:saiPulse 1.2s infinite}" +
    "#seventAiSendBtn.sai-send{flex-shrink:0;width:44px;height:44px;padding:0!important;border-radius:50%!important;display:flex;align-items:center;justify-content:center;align-self:center;transition:transform .12s}#seventAiSendBtn.sai-send:active{transform:scale(.92)}" +
    ".sai-camb{flex-shrink:0;width:40px;height:44px;border:none;background:none;color:#7a1128;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;align-self:center;-webkit-tap-highlight-color:transparent}" +
    // кружочек: запись на весь экран, фон размыт
    ".sai-cam-ov{position:fixed;inset:0;z-index:100000;background:rgba(20,20,22,.55);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);opacity:0;transition:opacity .18s;display:flex;flex-direction:column;align-items:center;color:#fff;touch-action:none;user-select:none;-webkit-user-select:none}" +
    ".sai-cam-ov.show{opacity:1}" +
    ".sai-cam-ov button{border:none;background:none;color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;-webkit-tap-highlight-color:transparent}" +
    ".sai-cam-x{position:absolute;left:14px;top:calc(12px + env(safe-area-inset-top));width:44px;height:44px}" +
    ".sai-cam-t{position:absolute;left:50%;transform:translateX(-50%);top:calc(20px + env(safe-area-inset-top));font-size:1.05rem;font-variant-numeric:tabular-nums;padding:3px 8px;border-radius:6px}" +
    ".sai-cam-t.rec{background:#ff3b5c}" +
    ".sai-cam-c{position:relative;margin:auto;width:min(86vw,54vh,420px);aspect-ratio:1;border-radius:50%}" +
    ".sai-cam-c canvas,.sai-cam-c video{position:absolute;inset:6px;width:calc(100% - 12px);height:calc(100% - 12px);border-radius:50%;object-fit:cover;background:#000}" +
    ".sai-cam-ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}.sai-cam-ring circle{fill:none;stroke-width:1.6}.sai-cam-ring .bg{stroke:rgba(255,255,255,.18)}.sai-cam-ring .fg{stroke:#fff;stroke-linecap:round;transition:stroke-dashoffset .25s linear}" +
    ".sai-cam-pl{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:50%;background:rgba(255,255,255,.85)!important;color:#333!important}" +
    ".sai-cam-flip{position:absolute;left:16px;bottom:calc(96px + env(safe-area-inset-bottom));width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,.35)!important}" +
    ".sai-cam-bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:12px 20px calc(14px + env(safe-area-inset-bottom));background:rgba(0,0,0,.35)}" +
    ".sai-cam-bar button{width:52px;height:52px}" +
    ".sai-cam-stop{border:2.5px solid #ff3b5c!important;border-radius:50%}.sai-cam-stop i{width:18px;height:18px;border-radius:4px;background:#ff3b5c}" +
    ".sai-cam-go{border-radius:50%;background:#7a1128!important}" +
    ".sai-cam-ov.review .sai-cam-stop,.sai-cam-ov.review .sai-cam-flip{visibility:hidden}" +
    // кружочек в переписке
    ".sai-vnbox{background:transparent!important;padding:0!important;color:#86868b!important;flex-direction:column;align-items:flex-end!important;gap:2px!important}" +
    ".sai-msg[style*='flex-start'] .sai-vnbox{align-items:flex-start!important}" +
    ".sai-vn{position:relative;width:200px;height:200px;border-radius:50%;overflow:hidden;background:#2c2c2e;cursor:pointer}" +
    ".sai-vn img,.sai-vn video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
    ".sai-vn-pl{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(0,0,0,.45);color:#fff;display:flex;align-items:center;justify-content:center}" +
    ".sai-vn.playing .sai-vn-pl{display:none}" +
    ".sai-vn-d{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);font-size:.66rem;color:#fff;background:rgba(0,0,0,.45);padding:1px 7px;border-radius:9px}" +
    "@keyframes saiPulse{0%,100%{box-shadow:0 0 0 0 rgba(122,17,40,.35)}50%{box-shadow:0 0 0 7px rgba(122,17,40,0)}}" +
    ".sai-rec{flex-shrink:0;align-items:center;gap:10px;padding:12px var(--px);border-top:1px solid #e5e5e7;background:#fbfbfd;min-height:68px;box-sizing:border-box}" +
    ".sai-rec button{flex-shrink:0;width:44px;height:44px;border-radius:12px;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    ".sai-rec-x{background:#f0f0f2;color:#6e6e73}.sai-rec-go{background:#7a1128;color:#fff}" +
    ".sai-rec-dot{width:9px;height:9px;border-radius:50%;background:#e0243f;flex-shrink:0;animation:saiBlink 1s infinite}" +
    "@keyframes saiBlink{50%{opacity:.25}}" +
    ".sai-rec-t{font-size:0.8rem;font-variant-numeric:tabular-nums;color:#1d1d1f;flex-shrink:0;min-width:30px}" +
    ".sai-rec-w{flex:1;min-width:0;height:30px;display:flex;align-items:center;gap:3px;overflow:hidden}" +
    ".sai-rec-w i{flex:1;max-width:4px;min-width:2px;height:100%;border-radius:2px;background:#7a1128;transform:scaleY(.08);transition:transform .09s linear;will-change:transform}" +
    ".sai-vpill{flex-basis:100%;display:flex;align-items:center;gap:9px;padding:2px 0 4px}" +
    ".sai-vmic{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}.sai-vmic svg{width:16px;height:16px}" +
    ".sai-vw{flex:1;min-width:90px;height:24px;display:flex;align-items:center;gap:2px}" +
    ".sai-vw i{flex:1;max-width:3px;border-radius:2px;background:currentColor;opacity:.9}.sai-vpill.playing .sai-vw i{opacity:.4}.sai-vpill.playing .sai-vw i.on{opacity:1}" +
    ".sai-vmic.play{background:#fff;color:#7a1128;cursor:pointer}" +
    ".sai-vd{font-size:0.7rem;opacity:.85;font-variant-numeric:tabular-nums;flex-shrink:0}" +
    ".sai-vtxt{font-size:0.76rem;opacity:.82;font-style:italic}" +
    ".sai-msg{position:relative;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;transition:transform .25s}" +
    ".sai-msg.sai-pressing{transform:scale(.97)}.sai-msg.has-rx{margin-bottom:14px}.sai-msg.sai-flash>div{box-shadow:0 0 0 3px rgba(111,211,255,.7)}" +
    ".sai-rx{position:absolute;bottom:-15px;right:10px;background:#fff;border:1px solid #e5e5e7;border-radius:999px;padding:1px 7px;font-size:0.85rem;line-height:1.5;box-shadow:0 1px 3px rgba(0,0,0,.12)}" +
    ".sai-msg[style*='flex-start'] .sai-rx{right:auto;left:10px}" +
    ".sai-q{flex-basis:100%;border-left:3px solid #6fd3ff;background:rgba(255,255,255,.14);border-radius:8px;padding:4px 8px;margin:2px 0 4px;font-size:0.74rem;line-height:1.35;display:flex;flex-direction:column;cursor:pointer;max-width:100%;overflow:hidden}" +
    ".sai-q b{font-weight:600;color:#6fd3ff}.sai-q span{opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".sai-msg[style*='flex-start'] .sai-q{background:rgba(0,0,0,.05);border-left-color:#7a1128}.sai-msg[style*='flex-start'] .sai-q b{color:#7a1128}" +
    ".sai-ed{font-size:0.6rem;opacity:.7;margin-right:4px}" +
    ".sai-menu-ov{position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.28);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);opacity:0;transition:opacity .18s}.sai-menu-ov.show{opacity:1}" +
    ".sai-menu-msg{box-shadow:0 8px 30px rgba(0,0,0,.25);transform:scale(.98);transition:transform .18s}.sai-menu-ov.show .sai-menu-msg{transform:scale(1)}" +
    ".sai-rbar{position:fixed;display:flex;gap:2px;padding:6px 8px;border-radius:999px;background:#fff;box-shadow:0 6px 24px rgba(0,0,0,.2)}" +
    ".sai-rbar button{border:none;background:none;font-size:1.6rem;line-height:1;width:42px;height:42px;border-radius:50%;cursor:pointer;transition:transform .12s;-webkit-tap-highlight-color:transparent}.sai-rbar button:active{transform:scale(1.25)}.sai-rbar button.on{background:#ececef}" +
    ".sai-mmenu{position:fixed;min-width:220px;border-radius:14px;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.2);overflow:hidden}" +
    ".sai-mmenu button{display:flex;align-items:center;justify-content:space-between;width:100%;padding:13px 16px;border:none;background:none;font:inherit;font-size:0.95rem;color:#1d1d1f;cursor:pointer;border-bottom:1px solid #ececef}.sai-mmenu button:last-child{border-bottom:none}.sai-mmenu button:active{background:#f2f2f4}" +
    ".sai-replybar{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:8px var(--px);background:#fbfbfd;border-top:1px solid #e5e5e7}" +
    ".sai-rq{flex:1;min-width:0;border-left:3px solid #7a1128;padding:2px 10px;display:flex;flex-direction:column;font-size:0.8rem}.sai-rq b{color:#7a1128;font-weight:600}.sai-rq span{color:#6e6e73;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".sai-replybar button{border:none;background:none;color:#86868b;cursor:pointer;padding:4px;display:flex}" +
    "#seventAiMessages.sai-blur{filter:blur(8px);pointer-events:none;transition:filter .2s}" +
    ".sai-edit{flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:10px;padding:10px var(--px) 12px;background:#fbfbfd;border-top:1px solid #e5e5e7}" +
    ".sai-edit-prev{max-width:82%;padding:8px 10px 6px 14px;border-radius:16px;background:#7a1128;color:#fff;font-size:0.84rem;display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap}" +
    ".sai-edit-row{display:flex;align-items:center;gap:8px;width:100%}.sai-edit-row input{flex:1;min-width:0;font-size:16px;padding:10px 14px;border-radius:20px;border:1.5px solid #e5e5e7;outline:none;font-family:inherit;background:#fff;color:#1d1d1f}" +
    ".sai-edit-x{border:none;background:none;color:#86868b;cursor:pointer;display:flex;padding:2px}.sai-edit-ok{width:40px;height:40px;border-radius:50%;border:none;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}" +
    ".sai-tk{display:inline-flex;margin-left:4px;vertical-align:-1px;opacity:.85}.sai-tk svg{width:17px;height:12px}.sai-tk.rd{color:#6fd3ff;opacity:1}" +
    "@media (prefers-reduced-motion:reduce){.sai-rec-dot{animation:none}}" +
    "@media (prefers-color-scheme:dark){" +
    ".sai-chip{background:#1c1c1e;border-color:#48343a;color:#ef6b83}.sai-chip:active{background:#2c2c2e}" +
    ".sai-card{background:#1c1c1e;border-color:#38383a}.sai-card-n{color:#f5f5f7}.sai-card-p{color:#ef6b83}" +
    ".sai-card-s,.sai-card-d{color:#a1a1a6}.sai-card img,.sai-card-ph{background:#2c2c2e}" +
    ".sai-rec{background:#111113;border-top-color:#38383a}.sai-rec-x{background:#2c2c2e;color:#a1a1a6}.sai-rec-t{color:#f5f5f7}.sai-rec-w i{background:#ef6b83}" +
    ".sai-rx{background:#2c2c2e;border-color:#38383a}.sai-rbar,.sai-mmenu{background:#2c2c2e}.sai-mmenu button{color:#f5f5f7;border-bottom-color:#38383a}.sai-mmenu button:active{background:#3a3a3c}.sai-rbar button.on{background:#48484a}" +
    ".sai-replybar,.sai-edit{background:#111113;border-top-color:#38383a}.sai-rq span{color:#a1a1a6}.sai-rq{border-left-color:#ef6b83}.sai-rq b{color:#ef6b83}.sai-edit-row input{background:#1c1c1e;border-color:#38383a;color:#f5f5f7}" +
    ".sai-msg[style*='flex-start'] .sai-q{background:rgba(255,255,255,.06);border-left-color:#ef6b83}.sai-msg[style*='flex-start'] .sai-q b{color:#ef6b83}" +
    ".sai-camb{color:#ef6b83}}";
  if (!el("saiStyle")) { var stl = D.createElement("style"); stl.id = "saiStyle"; stl.textContent = css; D.head.appendChild(stl); }

  // ── состояние разговора (переживает перезагрузку вкладки)
  W._saiState = {};
  safe(function () { var s = JSON.parse(sessionStorage.getItem("sai_state") || "null"); if (s && typeof s === "object") W._saiState = s; });
  function save() { safe(function () { sessionStorage.setItem("sai_state", JSON.stringify(W._saiState)); }); }
  W._saiSaveState = save;
  W._saiReset = function () { W._saiState = {}; save(); };
  W._aiBusy = false;
  var termsOpened = false, lastBookMsg = "";

  // ── факты от админа («ИИ факты» в таблице)
  var facts = "", factsTs = 0;
  safe(function () { var f = localStorage.getItem("st_ai_facts"); if (f !== null) facts = f; });
  function loadFacts() {
    // «факты» нужны были только старому ИИ — лишний запрос к скрипту при открытии чата не делаем
    if (!W._saiNeedFacts) return;
    if (Date.now() - factsTs < 6e5) return;
    factsTs = Date.now();
    safe(function () {
      apiGet({ action: "getAiFacts" }, function (e) { facts = String(e && e.facts || ""); safe(function () { localStorage.setItem("st_ai_facts", facts); }); }, function () { factsTs = 0; });
    });
  }

  // ── меню всех филиалов (текущий — живой, остальные — из кэша)
  var menuCache = null;
  function menus() {
    var m;
    if (menuCache && Date.now() - menuCache.t < 6e4) m = menuCache.m;
    else {
      m = {};
      safe(function () {
        (BRANCHES || []).forEach(function (b) {
          safe(function () {
            var k = "st_menu_" + b.id, raw = localStorage.getItem(k);
            if (raw && localStorage.getItem(k + "_ver") === "2") m[b.id] = cleanMenu(JSON.parse(raw));
          });
        });
      });
      menuCache = { t: Date.now(), m: m };
    }
    var out = {};
    for (var k in m) out[k] = m[k];
    var md = menuNow();
    if (curBranch() && Object.keys(md).length) out[curBranch()] = md;
    return out;
  }

  // ── что знаем о госте: имя и прошлый заказ (для «как обычно»)
  function guest() {
    var g = {};
    safe(function () { var p = loadClientProfile() || {}; if (p.name) g.name = String(p.name).trim().split(/\s+/)[0]; });
    safe(function () {
      var h = JSON.parse(localStorage.getItem("st_order_history") || "[]"), o = h && h[0];
      if (o && o.itemsList && o.itemsList.length) g.last = { branch: o.branch, items: o.itemsList.map(function (x) { return { name: x.name, qty: x.qty || 1 }; }) };
    });
    return g;
  }
  // ── свежие акции из «Сообщений»
  function news() {
    var out = [];
    safe(function () {
      (typeof _newsFeedData !== "undefined" && _newsFeedData || []).forEach(function (n) {
        if (n && n.title !== "SEVEN AI") out.push({ title: String(n.title || ""), text: String(n.text || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() });
      });
    });
    return out.slice(0, 20);
  }

  // ── мост к сайту: корзина, профиль, брони
  var site = {
    branch: function () { return curBranch(); },
    switchBranch: function (b) { if (branch !== b) switchBranch(b); },
    cart: function () { return cart.map(function (e) { return { id: e.id, name: e.name, price: e.price, qty: e.qty }; }); },
    total: function () { return cartTotal(); },
    add: function (it, q, mod) { addCart({ id: String(it.id), name: it.name, price: it.price }, q || 1); updBadge(); safe(function () { if (mod) updCC(mod.id, mod.price); }); },
    remove: function (id) { cart = cart.filter(function (e) { return e.id !== id; }); saveCartToStorage(); updBadge(); },
    canOrder: function (b) { return canOrderNow(b); },
    profile: function () { return loadClientProfile() || {}; },
    bkProfile: function () { return safe(function () { return bk_loadProfile() || {}; }, {}); },
    bkAllowedNow: function (b) { return bk_isBookingAllowedNow(b); },
    bkBlocked: function (m, d, b) { return bk_isDateBlocked(m, d, b); },
    bkClosed: function () { return typeof bk__restaurantClosed !== "undefined" && !!bk__restaurantClosed; },
    openAt: function (b) { return b === "abulhair" && typeof ABULHAIR_OPEN_AT !== "undefined" ? ABULHAIR_OPEN_AT : 0; }
  };
  W._saiSite = site;
  function ctx() {
    return { menus: menus(), branch: curBranch(), now: Date.now(), custom: AI.parseCustom(facts), state: W._saiState, deliveryHours: typeof DELIVERY_HOURS !== "undefined" ? DELIVERY_HOURS : null, site: site, guest: guest(), news: news() };
  }
  W._saiCtx = ctx;

  // ── кнопки-подсказки под ответом
  W._saiChips = function (acts) {
    var box = el("seventAiMessages");
    if (!box) return;
    box.querySelectorAll(".sai-chips").forEach(function (x) { x.remove(); });
    if (!acts || !acts.length) return;
    var row = D.createElement("div");
    row.className = "sai-chips";
    acts.forEach(function (c) {
      if (!c || !c.a || c.a === "wa") return;
      var b = D.createElement("button");
      b.type = "button"; b.className = "sai-chip"; b.textContent = ne(c.label);
      b.onclick = function () { seventAiAct(c.a, c.label); };
      row.appendChild(b);
    });
    box.appendChild(row);
  };

  // ── карточки блюд: тап открывает шторку блюда
  function findById(id) {
    var f = null, md = menuNow();
    Object.keys(md).forEach(function (k) { (md[k] || []).forEach(function (x) { if (!f && String(x.id) === String(id)) f = x; }); });
    return f;
  }
  function openCard(c) {
    var b = curBranch();
    if (c.b && b && c.b !== b) { toast("Это блюдо из филиала " + safe(function () { return branchDisplayName(c.b); }, c.b) + " — переключите филиал в меню"); return; }
    var it = findById(c.id);
    if (!it) { toast(b ? "«" + ne(c.name || "Это блюдо") + "» сейчас нет в меню" : "Сначала выберите филиал в меню"); return; }
    ev("SEVEN AI: открыл блюдо", it.name);
    openDetail(it);
  }
  W._saiOpenCard = openCard;
  W._saiCards = function (list) {
    var box = el("seventAiMessages");
    if (!box || !list || !list.length) return;
    var row = D.createElement("div");
    row.className = "sai-cards" + (list.length === 1 ? " one" : "");
    list.forEach(function (c) {
      var d = D.createElement("div");
      d.className = "sai-card"; d.setAttribute("role", "button"); d.tabIndex = 0;
      var src = c.photo ? safe(function () { return convertPhotoUrl(c.photo, list.length === 1 ? 640 : 400); }, "") : "";
      d.innerHTML = (src ? '<img loading="lazy" decoding="async" alt="" src="' + esc(src) + '" onerror="this.style.visibility=\'hidden\'">' : '<div class="sai-card-ph"></div>') +
        '<div class="sai-card-b"><div class="sai-card-n">' + esc(ne(c.name)) + '</div><div class="sai-card-p">' + esc(c.off || c.price) + "</div>" +
        (c.sizes && !c.off ? '<div class="sai-card-s">' + esc(c.sizes) + "</div>" : "") +
        (c.desc ? '<div class="sai-card-d">' + esc(ne(c.desc)) + "</div>" : "") + "</div>";
      d.onclick = function () { openCard(c); };
      d.onkeydown = function (e) { if (e.key === "Enter") openCard(c); };
      row.appendChild(d);
    });
    box.appendChild(row);
  };

  function typing(on) {
    var old = el("seventAiTyping");
    if (old) old.remove();
    if (!on) return;
    var box = el("seventAiMessages"), t = D.createElement("div");
    t.id = "seventAiTyping";
    t.style.cssText = "align-self:flex-start;font-size:0.78rem;color:#86868b;display:flex;align-items:center;gap:6px";
    t.innerHTML = '<span id="seventAiTypingText">SEVEN AI печатает</span><span class="seventai-dots"><span></span><span></span><span></span></span>';
    box.appendChild(t); scrollEnd();
  }
  W._saiTyping = typing;
  // «печатает…» в шапке: администратор прочитал вопрос (синие галочки) — значит отвечает.
  // Гаснет, когда пришёл ответ, или через 90 секунд.
  var headT = 0;
  function headTyping(on) {
    clearTimeout(headT);
    safe(function () { W._saiHeadTyping && W._saiHeadTyping(on); });
    if (on) headT = setTimeout(function () { headTyping(false); }, 90e3);
  }
  function awaitingReply() { for (var i = seventAiHistory.length - 1; i >= 0; i--) { var m = seventAiHistory[i]; if (m.role === "user") return true; if (m.opId) return false; } return false; }
  function say(r) { seventAiAppendMessage("ai", r.text, r.acts, r.cards); save(); }
  W._saiSay = say;

  // ── вопросы и ответы — в таблицу SEVEN_AI
  // голосовое (если есть) уходит вместе с вопросом — файлом в Google Диск
  function log(q, r, audio, by) {
    safe(function () {
      var a = String(r.text || "") + (r.cards && r.cards.length ? "\n[карточки: " + r.cards.map(function (c) { return c.name + " — " + (c.off || c.price); }).join("; ") + "]" : "");
      var body = {
        action: "logAiChat", q: String(q).slice(0, 500), a: a.slice(0, 1500), known: r.known ? 1 : 0, intent: r.intent || "", branch: curBranch() || "", clientId: getClientId(),
        device: typeof _guestDevice !== "undefined" ? _guestDevice : "", source: typeof _guestSource !== "undefined" ? _guestSource : "",
        city: typeof _guestCity !== "undefined" ? _guestCity : "", ip: typeof _guestIp !== "undefined" ? _guestIp : ""
      };
      if (by) body.by = by;
      // сам звук/видео в таблицу и Google Диск не шлём — он уже у тебя в Telegram
      if (audio) { body.media = audio.video ? "кружочек" : "голосовое"; body.mdur = audio.dur; }
      fetch(API, { method: "POST", keepalive: true, body: JSON.stringify(body) }).catch(function () {});
    });
  }
  W._saiLogVoiceOnly = function (audio) { log("[голосовое без расшифровки]", { text: "", known: 0, intent: "voice" }, audio); };

  // ── вопросы гостей отвечает администратор: вопрос уходит ему в Telegram,
  // его ответ приходит сюда как обычное сообщение SEVEN AI. Внешних ИИ нет.
  var PHRASES = ["SEVEN AI печатает"];
  function guestName() { return safe(function () { var p = loadClientProfile() || {}; return String(p.name || "").trim(); }, ""); }
  function xhrJson(method, url, body, timeoutMs, cb) {
    var x = new XMLHttpRequest();
    x.open(method, url, true); x.timeout = timeoutMs;
    x.onload = function () { cb(safe(function () { return JSON.parse(x.responseText); }, null)); };
    x.ontimeout = x.onerror = function () { cb(null); };
    x.send(body ? JSON.stringify(body) : null);
  }
  // ── галочки у сообщений гостя, как в мессенджерах:
  // 1 — отправлено, 2 — дошло администратору в Telegram, 3 — прочитано (синие)
  var TICK1 = '<svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 6l3 3 6.5-7.5"/></svg>';
  var TICK2 = '<svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6l3 3 6.5-7.5"/><path d="M6.5 8.6l.9.9L14 2"/></svg>';
  function tickEl(bubble) {
    var box = bubble && bubble.firstChild, tm = box && box.lastChild;
    if (!tm) return null;
    var k = tm.querySelector && tm.querySelector(".sai-tk");
    if (!k) { k = D.createElement("span"); k.className = "sai-tk"; tm.appendChild(k); }
    return k;
  }
  function paintTick(bubble, st) {
    var k = st && tickEl(bubble);
    if (!k) return;
    k.innerHTML = st >= 2 ? TICK2 : TICK1;
    k.classList.toggle("rd", st >= 3);
    k.setAttribute("aria-label", st >= 3 ? "Прочитано" : st >= 2 ? "Доставлено" : "Отправлено");
  }
  // шапка сайта вызывает это для каждого сообщения гостя из истории
  W._saiTickDecor = function (bubble, time) { W._saiMsgDecor(bubble, time, "user"); };
  // поднять статус: у одного сообщения (time) или у всех уже доставленных (time = 0, onlyFrom = 2)
  function setTicks(st, time, onlyFrom) {
    var changed = false;
    seventAiHistory.forEach(function (m) {
      if (m.role !== "user" || (time && m.time !== time) || (onlyFrom && (m.st || 0) < onlyFrom) || (m.st || 0) >= st) return;
      if (!time && !m.st) return;
      m.st = st; changed = true;
      var el = D.querySelector('#seventAiMessages [data-mt="' + m.time + '"]');
      if (el) paintTick(el, st);
    });
    if (changed) seventAiSaveHistory();
  }

  // вопрос гостя (и голосовое) — администратору. Сам чат на вопросы не отвечает.
  var AWAY = "Ой, походу оператор отошёл. Ожидайте — ваше сообщение у него, он обязательно ответит.";
  function forward(t, audio, tm) {
    var o = opGet(), fresh = !(o.until > Date.now());
    var body = fresh
      ? { action: "aiAsk", branch: curBranch() || "", message: t, clientId: getClientId(), name: guestName(), history: seventAiHistory.slice(-13, -1).map(function (e) { return { role: e.role, text: String(e.text || "").slice(0, 1500) }; }) }
      : { action: "jivoSend", clientId: getClientId(), name: guestName(), text: t };
    body.mt = tm;
    var lg = langGet(); if (lg) body.lang = lg;
    var mine = msgBy(tm, "user");
    if (mine && mine.reply) {
      var rt = msgBy(mine.reply.mt);
      var rtg = rt ? (rt.role === "user" ? rt.tgId : String(rt.opId || "").replace(/^tg/, "")) : "";
      if (rtg) body.replyTg = rtg;
      else if (fresh) body.message = "(в ответ на «" + String(mine.reply.text).slice(0, 80) + "») " + t;
      else body.text = "(в ответ на «" + String(mine.reply.text).slice(0, 80) + "») " + t;
    }
    function go() {
      xhrJson("POST", API, body, audio && audio.video ? 180e3 : 25e3, function (e) {
        if (e && (e.operator || (!fresh && e.ok))) {
          typing(false);
          var mm = msgBy(tm, "user");
          if (mm && e.tgId) { mm.tgId = e.tgId; seventAiSaveHistory(); }
          setTicks(2, tm);
          log(t, { text: "(передано администратору)", known: 1, intent: "operator" }, audio, "Передано");
          opStart(t, function () {
            // «оператор отошёл» — один раз и всё (не чаще раза в 6 часов)
            var last = 0;
            try { last = Number(localStorage.getItem("sai_away") || 0); } catch (le) {}
            if (Date.now() - last < 6 * 3600e3) return;
            try { localStorage.setItem("sai_away", String(Date.now())); } catch (le2) {}
            seventAiAppendMessage("ai", AWAY);
          }, e.now);
        }
        // не дошло (Telegram не подключён или недоступен) — остаётся одна галочка, бот молчит
      });
    }
    if (audio && audio.blob && typeof FileReader !== "undefined") {
      var fr = new FileReader();
      fr.onload = function () {
        // тип файла бывает с кодеками через запятую (video/mp4;codecs=avc1…,mp4a…) — берём всё после «base64,»
        var du = String(fr.result || ""), bi = du.indexOf(";base64,"), b64 = bi >= 0 ? du.slice(bi + 8) : "";
        if (audio.video) { body.video = b64; body.vmime = audio.mime; body.vdur = audio.dur; }
        else { body.audio = b64; body.mime = audio.mime; body.dur = audio.dur; }
        go();
      };
      fr.onerror = go;
      fr.readAsDataURL(audio.blob);
    } else go();
  }

  // ── «открой …»: выполняем только то, что гость попросил сам
  function doAuto(a) {
    a = String(a && a.a || "");
    if (!a) return;
    setTimeout(function () {
      if (!chatVisible()) return;
      if (a.indexOf("dish:") === 0) openCard({ id: a.slice(5) });
      else if (a.indexOf("cat:") === 0) W._saiAct(a, "открой раздел");
      else if (a === "menu") { seventAiClose(); switchBottomTab("home"); }
      else if (a === "cart") { seventAiClose(); switchBottomTab("home"); openCart(); }
    }, 450);
  }


  // ════ сообщения как в мессенджере: реакции, «Ответить», «Изменить» ════
  var HOLD_MS = 1500, REACTS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "👏"], replyTo = null;
  function mediaLabel(m) { return m.voice ? (m.voice.kind === "vn" ? "Видеосообщение" : "Голосовое сообщение") : String(m.text).slice(0, 200); }
  function msgBy(time, role) { time = Number(time); return seventAiHistory.filter(function (x) { return x.time === time && (!role || x.role === role); })[0] || null; }
  function bubbleOf(time) { return D.querySelector('#seventAiMessages [data-mt="' + time + '"]'); }
  function textSpan(bubble) { var box = bubble && bubble.firstChild; if (!box) return null; var sp = box.querySelectorAll(":scope > span"); return sp.length ? sp[0] : null; }
  W._saiMsgDecor = function (bubble, time, role) {
    bubble.setAttribute("data-mt", String(time));
    bubble.classList.add("sai-msg");
    var m = msgBy(time, role === "user" ? "user" : "ai");
    if (m) decorate(bubble, m);
  };
  function decorate(bubble, m) {
    var box = bubble.firstChild;
    if (!box) return;
    // голосовое: без текста расшифровки
    if (m.voice) { var vt = box.querySelector(".sai-vtxt"); if (vt) vt.style.display = "none"; }
    // цитата («ответ на»)
    var oq = box.querySelector(".sai-q"); if (oq) oq.remove();
    if (m.reply) {
      var q = D.createElement("div");
      q.className = "sai-q";
      q.innerHTML = '<b>' + esc(m.reply.who || "") + '</b><span>' + esc(String(m.reply.text || "").slice(0, 160)) + "</span>";
      q.onclick = function (ev) { ev.stopPropagation(); var t = bubbleOf(m.reply.mt); if (t) { t.scrollIntoView({ block: "center", behavior: "smooth" }); t.classList.add("sai-flash"); setTimeout(function () { t.classList.remove("sai-flash"); }, 1200); } };
      box.insertBefore(q, box.firstChild);
    }
    // «изменено»
    var tm = box.lastChild, oe = tm && tm.querySelector && tm.querySelector(".sai-ed");
    if (oe) oe.remove();
    if (m.edited && tm) { var ed = D.createElement("span"); ed.className = "sai-ed"; ed.textContent = "изменено"; tm.insertBefore(ed, tm.firstChild); }
    if (m.role === "user" && m.st) paintTick(bubble, m.st);
    // реакции под сообщением
    var orx = bubble.querySelector(".sai-rx"); if (orx) orx.remove();
    var list = [m.oreact, m.react].filter(function (x) { return x; });
    bubble.classList.toggle("has-rx", list.length > 0);
    if (list.length) {
      var rx = D.createElement("div");
      rx.className = "sai-rx";
      rx.textContent = list.filter(function (x, i) { return list.indexOf(x) === i; }).join("");
      if (list.length > 1 && list[0] === list[1]) rx.textContent += " 2";
      bubble.appendChild(rx);
    }
  }
  function refreshMsg(m) {
    var b = bubbleOf(m.time);
    if (!b) return;
    var sp = textSpan(b);
    if (sp && !m.voice && sp.textContent !== m.text) sp.textContent = ne(m.text);
    decorate(b, m);
  }

  // долгое нажатие на сообщение → размытие, реакции и меню
  var hold = null;
  function holdCancel() { if (hold) { clearTimeout(hold.t); hold = null; } }
  function setupHold() {
    var box = el("seventAiMessages");
    if (!box || box._saiHold) return;
    box._saiHold = true;
    box.addEventListener("pointerdown", function (e) {
      var b = e.target.closest && e.target.closest(".sai-msg");
      if (!b || e.target.closest(".sai-vmic,.sai-q,a,button")) return;
      holdCancel();
      hold = { b: b, x: e.clientX, y: e.clientY, t: setTimeout(function () { var bb = hold && hold.b; hold = null; if (bb) openMenu(bb); }, HOLD_MS) };
      b.classList.add("sai-pressing");
    });
    box.addEventListener("pointermove", function (e) { if (hold && (Math.abs(e.clientX - hold.x) > 10 || Math.abs(e.clientY - hold.y) > 10)) { hold.b.classList.remove("sai-pressing"); holdCancel(); } });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (n) { box.addEventListener(n, function () { if (hold) hold.b.classList.remove("sai-pressing"); holdCancel(); }); });
    box.addEventListener("scroll", function () { if (hold) hold.b.classList.remove("sai-pressing"); holdCancel(); }, { passive: true });
    box.addEventListener("contextmenu", function (e) { var b = e.target.closest && e.target.closest(".sai-msg"); if (b) { e.preventDefault(); holdCancel(); openMenu(b); } });
  }
  function closeMenu() { var o = el("saiMenu"); if (o) o.remove(); D.querySelectorAll(".sai-pressing").forEach(function (x) { x.classList.remove("sai-pressing"); }); }
  function openMenu(b) {
    closeMenu();
    b.classList.remove("sai-pressing");
    var m = msgBy(Number(b.getAttribute("data-mt")));
    if (!m) return;
    safe(function () { navigator.vibrate && navigator.vibrate(12); });
    var r = b.firstChild.getBoundingClientRect(), mine = m.role === "user";
    var ov = D.createElement("div");
    ov.id = "saiMenu"; ov.className = "sai-menu-ov";
    var clone = b.firstChild.cloneNode(true);
    clone.className = "sai-menu-msg";
    clone.style.cssText += ";position:fixed;left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;margin:0";
    var bar = D.createElement("div");
    bar.className = "sai-rbar";
    REACTS.forEach(function (em) {
      var bt = D.createElement("button");
      bt.type = "button"; bt.textContent = em; bt.setAttribute("aria-label", "Реакция " + em);
      if (m.react === em) bt.className = "on";
      bt.onclick = function (ev) { ev.stopPropagation(); react(m, m.react === em ? "" : em); closeMenu(); };
      bar.appendChild(bt);
    });
    var menu = D.createElement("div");
    menu.className = "sai-mmenu";
    function item(label, icon, fn) {
      var it = D.createElement("button");
      it.type = "button"; it.innerHTML = "<span>" + label + "</span>" + icon;
      it.onclick = function (ev) { ev.stopPropagation(); closeMenu(); fn(); };
      menu.appendChild(it);
    }
    item("Ответить", '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/></svg>', function () { startReply(m); });
    if (mine && !m.voice) item("Изменить", '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>', function () { startEdit(m); });
    ov.appendChild(clone); ov.appendChild(bar); ov.appendChild(menu);
    ov.onclick = closeMenu;
    D.body.appendChild(ov);
    // реакции над сообщением, меню под ним (или наоборот, если не влезает)
    var vh = W.innerHeight, vw = W.innerWidth, bw = bar.offsetWidth, mh = menu.offsetHeight;
    var bl = mine ? Math.max(8, Math.min(r.right - bw, vw - bw - 8)) : Math.max(8, Math.min(r.left, vw - bw - 8));
    var ml = mine ? Math.max(8, r.right - menu.offsetWidth) : Math.max(8, Math.min(r.left, vw - menu.offsetWidth - 8));
    var top = r.top, shift = 0;
    if (top - 64 < 8) shift = 72 - top;
    if (r.bottom + shift + 12 + mh > vh - 8) shift = Math.min(shift, (vh - 8 - mh - 12) - r.bottom);
    clone.style.top = (r.top + shift) + "px";
    bar.style.left = bl + "px"; bar.style.top = (r.top + shift - 60) + "px";
    menu.style.left = ml + "px"; menu.style.top = (r.bottom + shift + 10) + "px";
    requestAnimationFrame(function () { ov.classList.add("show"); });
  }
  function react(m, em) {
    m.react = em; seventAiSaveHistory(); refreshMsg(m);
    var target = m.role === "user" ? m.tgId : m.opId;
    if (target) xhrJson("POST", API, { action: "opReact", clientId: getClientId(), target: String(target), emoji: em }, 15e3, function () {});
    ev("SEVEN AI: реакция", em || "убрал");
  }

  // «Ответить»: цитата над полем ввода
  function closeReply() { replyTo = null; var rb = el("saiReplyBar"); if (rb) rb.remove(); }
  function startReply(m) {
    closeReply();
    replyTo = { mt: m.time, who: m.role === "user" ? "Вы" : "SEVEN AI", text: mediaLabel(m) };
    var row = el("seventAiInputRow");
    if (!row) return;
    var rb = D.createElement("div");
    rb.id = "saiReplyBar"; rb.className = "sai-replybar";
    rb.innerHTML = '<div class="sai-rq"><b>' + esc(replyTo.who) + "</b><span>" + esc(replyTo.text) + '</span></div><button type="button" aria-label="Отменить ответ"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg></button>';
    rb.querySelector("button").onclick = closeReply;
    row.parentNode.insertBefore(rb, row);
    var inp = el("seventAiInput"); if (inp) inp.focus();
  }

  // «Изменить»: переписка размыта, сообщение над полем, ✕ и ✓
  function startEdit(m) {
    var row = el("seventAiInputRow"), msgs = el("seventAiMessages"), src = bubbleOf(m.time);
    if (!row || !msgs) return;
    closeReply();
    var pan = D.createElement("div");
    pan.id = "saiEdit"; pan.className = "sai-edit";
    var prev = src ? src.firstChild.cloneNode(true) : D.createElement("div");
    prev.className = "sai-edit-prev";
    pan.innerHTML = '<div class="sai-edit-row"><button type="button" class="sai-edit-x" aria-label="Отменить"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg></button><input type="text" maxlength="500" enterkeyhint="done"><button type="button" class="sai-edit-ok" aria-label="Сохранить"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button></div>';
    pan.insertBefore(prev, pan.firstChild);
    var inp = pan.querySelector("input");
    inp.value = m.text;
    function done(save) {
      var t = inp.value.trim().slice(0, 500);
      pan.remove(); row.style.display = "flex"; msgs.classList.remove("sai-blur");
      if (!save || !t || t === m.text) return;
      m.text = t; m.edited = true; seventAiSaveHistory(); refreshMsg(m);
      if (m.tgId) xhrJson("POST", API, { action: "opEdit", clientId: getClientId(), tgId: String(m.tgId), text: t }, 15e3, function () {});
      ev("SEVEN AI: гость изменил сообщение", t.slice(0, 60));
    }
    pan.querySelector(".sai-edit-x").onclick = function () { done(false); };
    pan.querySelector(".sai-edit-ok").onclick = function () { done(true); };
    inp.onkeydown = function (e) { if (e.key === "Enter" && !e.isComposing) done(true); if (e.key === "Escape") done(false); };
    row.style.display = "none";
    row.parentNode.insertBefore(pan, row);
    msgs.classList.add("sai-blur");
    setTimeout(function () { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }, 30);
  }

  // ── живой администратор (Jivo) внутри этого же чата ──
  // Гостю ничего не объявляем: ответ администратора приходит как обычное
  // сообщение SEVEN AI. Сессия живёт 15 минут после последней активности.
  var OP_KEY = "sai_op", OP_WAIT = 7e3, OP_TTL = 15 * 60e3, opTimer = 0, opWaitTimer = 0, opWaiting = null;
  function opGet() { return safe(function () { return JSON.parse(localStorage.getItem(OP_KEY) || "null"); }, null) || { since: 0, until: 0, human: 0, seen: [] }; }
  function opSet(o) { safe(function () { localStorage.setItem(OP_KEY, JSON.stringify(o)); }); }
  function opActive() { var o = opGet(); return o.until > Date.now(); }
  function opHuman() { var o = opGet(); return o.until > Date.now() && o.human > Date.now() - OP_TTL; }
  // вопрос ушёл администратору: ждём ответ (onTimeout — если за минуту тишина)
  function opStart(q, onTimeout, srvNow) {
    var o = opGet(); o.until = Date.now() + OP_TTL; o.q = q; o.asked = Date.now();
    // новый разговор: берём только ответы, пришедшие после этого вопроса (время сервера)
    if (srvNow && !(o.since > srvNow - OP_TTL)) o.since = srvNow - 3000;
    opSet(o);
    W._aiBusy = false; // гость может писать дальше, пока ждём администратора
    if (onTimeout) {
      clearTimeout(opWaitTimer);
      opWaiting = onTimeout;
      opWaitTimer = setTimeout(function () {
        var f = opWaiting; opWaiting = null;
        W._aiBusy = false; typing(false);
        if (f) f();
      }, W._saiOpWaitMs || OP_WAIT);
    }
    opSchedule(200);
  }
  function opSchedule(ms) { clearTimeout(opTimer); if (opActive()) opTimer = setTimeout(opPoll, ms); }
  // «живой» разговор: чат открыт и гость тут — сервер держит запрос, пока ты не ответишь
  // (ответ из Telegram прилетает сразу, без интервалов опроса)
  // гость на странице (даже если листает меню) и недавно писал — ждём ответ «вживую»
  function opLive(o) { return D.visibilityState !== "hidden" && Date.now() - Math.max(o.human || 0, o.asked || 0) < 10 * 60e3; }
  var opBusy = false;
  function opPoll() {
    var o = opGet();
    if (!(o.until > Date.now()) || opBusy) return;
    var live = opLive(o);
    opBusy = true;
    xhrJson("GET", API + "?action=jivoPoll&clientId=" + encodeURIComponent(getClientId()) + "&since=" + (o.since || 0) + "&rs=" + (o.readSeen || 0) + (live ? "&wait=20" : ""), null, live ? 40e3 : 15e3, function (e) {
      opBusy = false;
      var o2 = opGet(), got = 0;
      ((e && e.msgs) || []).forEach(function (m) {
        if (m && m.kind === "react") {
          if (o2.seen.indexOf(m.id) >= 0) return;
          o2.seen.push(m.id); o2.seen = o2.seen.slice(-50);
          o2.since = Math.max(o2.since || 0, m.ts || 0);
          var tgt = msgBy(m.mt, "user");
          if (tgt) { tgt.oreact = m.emoji || ""; seventAiSaveHistory(); refreshMsg(tgt); }
          return;
        }
        if (!m || !m.text || o2.seen.indexOf(m.id) >= 0) return;
        o2.seen.push(m.id); o2.seen = o2.seen.slice(-50);
        o2.since = Math.max(o2.since || 0, m.ts || 0);
        o2.human = Date.now(); o2.until = Date.now() + OP_TTL; got++;
        if (opWaiting) { opWaiting = null; clearTimeout(opWaitTimer); W._aiBusy = false; }
        typing(false); headTyping(false);
        setTicks(3, 0, 1);
        seventAiAppendMessage("ai", String(m.text));
        var nm = seventAiHistory[seventAiHistory.length - 1];
        if (nm && nm.role === "ai") {
          nm.opId = m.id;
          var qm = m.q ? msgBy(m.q, "user") : null;
          if (qm) nm.reply = { mt: qm.time, who: "Вы", text: mediaLabel(qm) };
          seventAiSaveHistory(); refreshMsg(nm);
        }
        o2.unseen = (o2.unseen || []).concat([m.id]).slice(-20);
        log(o2.q || "(продолжение разговора)", { text: String(m.text), known: 1, intent: "operator" }, null, "Оператор");
        if (!chatVisible()) toast("SEVEN AI ответила в «Сообщениях»");
      });
      if (e && e.read && e.read > (o2.readSeen || 0)) { o2.readSeen = e.read; setTicks(3, 0, 2); if (awaitingReply()) headTyping(true); }
      opSet(o2);
      ackSeen();
      // чат открыт — сразу следующий «длинный» запрос; закрыт — реже
      var fresh = Math.max(o2.human || 0, o2.asked || 0);
      if (!e) opSchedule(4000);
      else if (opLive(o2)) opSchedule(120);
      else opSchedule(Date.now() - fresh < 180e3 ? 5000 : 20000);
    });
  }
  // гость реально увидел ответ (чат открыт, страница перед глазами) → администратору 👀 в Telegram
  function ackSeen() {
    var o = opGet();
    if (!o.unseen || !o.unseen.length || !chatVisible() || D.visibilityState === "hidden") return;
    var ids = o.unseen.slice(); o.unseen = []; opSet(o);
    xhrJson("GET", API + "?action=opSeen&clientId=" + encodeURIComponent(getClientId()) + "&ids=" + encodeURIComponent(ids.join(",")), null, 15e3, function () {});
  }
  D.addEventListener("visibilitychange", function () { if (D.visibilityState === "visible") { setTimeout(ackSeen, 400); if (opActive() && chatVisible()) opSchedule(100); } });
  // гость пишет, пока с ним администратор: сообщение — сразу ему
  function opForward(t, note) {
    xhrJson("POST", API, { action: "jivoSend", clientId: getClientId(), name: guestName(), text: t + (note ? "\n— " + note : "") }, 15e3, function () {});
    var o = opGet(); o.until = Date.now() + OP_TTL; o.q = t; o.asked = Date.now(); opSet(o);
    opSchedule(200);
  }

  W._saiSend = function (voice, audio) {
    var inp = el("seventAiInput");
    if (!inp || W._aiBusy) return;
    var t = inp.value.trim().slice(0, 500);
    if (!t) return;
    if (!W.seventAiLoaded && W._saiOpenRender) W._saiOpenRender();
    W._aiBusy = true; inp.value = ""; syncRow();
    seventAiAppendMessage("user", t, null, null, voice && voice.dur ? voice : null);
    // бот сам ничего не отвечает: всё — администратору в Telegram
    W._aiBusy = false;
    var mine = seventAiHistory[seventAiHistory.length - 1], tm = mine && mine.role === "user" ? mine.time : 0;
    if (mine && tm && replyTo) { mine.reply = replyTo; seventAiSaveHistory(); refreshMsg(mine); }
    closeReply();
    if (tm) setTicks(1, tm);
    forward(t, audio, tm);
    askLang();
  };

  // ── язык общения: после первого сообщения один раз спрашиваем (сначала по-казахски, потом по-русски).
  // Выбор запоминается на телефоне и уходит администратору (Telegram и панель), чтобы он отвечал на нужном языке.
  var LANG_KEY = "sai_lang", LANG_ASKED = "sai_lang_asked";
  var LANG_Q = "Сізбен қай тілде сөйлескен ыңғайлы?\nНа каком языке вам удобнее общаться?";
  function langGet() { var v = lsGet(LANG_KEY); return v === "kz" || v === "ru" ? v : ""; }
  function askLang() {
    if (langGet() || lsGet(LANG_ASKED)) return;
    lsSet(LANG_ASKED, "1");
    setTimeout(function () {
      if (langGet()) return;
      seventAiAppendMessage("ai", LANG_Q, [{ a: "lang:kz", label: "Қазақша" }, { a: "lang:ru", label: "Русский" }]);
    }, 700);
  }
  function setLang(code) {
    lsSet(LANG_KEY, code);
    W._saiLang = code;
    // кнопки выбора больше не показываем (и после перезагрузки тоже)
    var changed = false;
    seventAiHistory.forEach(function (m) { if (m.acts && m.acts.some(function (c) { return c && /^lang:/.test(c.a); })) { delete m.acts; changed = true; } });
    if (changed) seventAiSaveHistory();
    safe(function () { D.querySelectorAll("#seventAiMessages .sai-chips").forEach(function (x) { x.remove(); }); });
    seventAiAppendMessage("ai", code === "kz" ? "Жақсы! Сізге қазақ тілінде жауап береміз." : "Хорошо! Будем общаться на русском.");
    xhrJson("POST", API, { action: "opLang", clientId: getClientId(), name: guestName(), lang: code }, 15e3, function () {});
    ev("SEVEN AI: язык", code === "kz" ? "Қазақша" : "Русский");
  }
  safe(function () { var lg = langGet(); if (lg) W._saiLang = lg; });

  // ── отправка заказа, собранного в чате
  function sendOrder() {
    var f = W._saiState.flow;
    if (!f || f.t !== "order" || !f.d || !f.d.final) return seventAiAppendMessage("ai", "Этот заказ уже неактуален — давайте соберём заново.", [{ a: "ask:Хочу оформить доставку", label: "Оформить заказ" }]);
    var o = f.d.final;
    if (!cart.length) return seventAiAppendMessage("ai", "Корзина пустая — сначала добавим блюда. Что везём?");
    if (branch !== o.branch) return seventAiAppendMessage("ai", "Филиал поменялся — давайте проверим заказ ещё раз.", [{ a: "ask:Хочу оформить доставку", label: "Оформить заказ" }]);
    if (!canOrderNow(branch) && !isTestPhoneActive()) return seventAiAppendMessage("ai", "Заказы сейчас не принимаем — принимаем " + getOrderWindowText(branch) + ". Могу забронировать столик.", [{ a: "ask:Хочу забронировать столик", label: "Забронировать столик" }]);
    var dlv = o.mode === "delivery", prof = loadClientProfile() || {}, isNew = !(prof.name && prof.phone);
    oType = dlv ? "delivery" : "self";
    cutlery = o.cutlery || 1;
    if (dlv) payType = o.pay === "cash" ? "cash" : "kaspi";
    var num = genOrderNumber();
    _pendingOrderNum = num;
    saveClientProfile({ name: o.name, phone: o.phone });
    if (dlv) { saveClientProfile({ street: o.street, house: o.house, entrance: o.entrance, flat: o.flat, floor: o.floor }); _addrRemember(o.street, o.house); }
    if (isNew) {
      ev("Зарегистрировался (имя+телефон)", "через SEVEN AI");
      var cid = getClientId();
      getPublicIp(function (ip) { apiGet({ action: "registerClient", name: o.name, phone: o.phone, ip: ip || "", clientId: cid, device: getDeviceLabel() }, function () {}, function () {}); });
      flushStatBuffer();
    }
    var allergy = /аллерг|allerg/i.test(o.note) ? o.note : "", bn = branchDisplayName(branch), total = cartTotal(), m = "";
    if (allergy) m += "АЛЛЕРГИИ КЛИЕНТА: " + allergy + "\n\n";
    m += dlv ? "Здравствуйте, хочу заказать доставку из филиала: " + bn + "\n\n" : "Здравствуйте, хочу заказать самовывоз из филиала: " + bn + "\n\n";
    m += "Состав заказа:\n";
    cart.forEach(function (e) { m += e.name + " x" + e.qty + " - " + (e.price * e.qty).toLocaleString("ru") + " тенге\n"; });
    m += "\nИтого: " + total.toLocaleString("ru") + " тенге\n\n";
    if (dlv) {
      var ad = "ул. " + o.street + ", дом " + o.house;
      if (o.entrance) ad += ", подъезд " + o.entrance;
      if (o.flat) ad += ", кв. " + o.flat;
      if (o.floor) ad += ", этаж " + o.floor;
      m += "Адрес доставки: " + ad + "\n";
      m += "Оплата: " + (o.pay === "cash" ? "Наличные" : "Kaspi перевод") + "\n";
    } else m += "Заберу через: " + (o.pickup || "не указано") + "\n";
    m += "Имя: " + o.name + "\n";
    m += "Телефон: " + o.phone + "\n";
    if (dlv) m += "Приборов: " + cutlery + "\n";
    if (o.note && !allergy) m += "Пожелания: " + o.note + "\n";
    m += "(оформлено через SEVEN AI)\n";
    _pendingOrderMsg = m;
    var where = dlv ? "ул. " + o.street + ", д. " + o.house + (o.entrance ? ", под. " + o.entrance : "") + (o.flat ? ", кв. " + o.flat : "") : "Самовывоз, " + (o.pickup || "время не указано");
    _pendingStatsDetails = "Заказ:" + num + " | Тип:" + (dlv ? "Доставка" : "Самовывоз") + " | Адрес:" + where + " | Сумма:" + total + " | Аллергии:" + (allergy || "нет") + " | Товары:" + cart.map(function (e) { return e.name + " x" + e.qty; }).join(", ") + " | Через SEVEN AI";
    confirmAndSendOrder();
    say(AI.afterSend("order", { num: num }, { state: W._saiState }));
  }

  // ── отправка брони, собранной в чате
  function openWa(text) {
    var a = D.createElement("a");
    a.href = "https://wa.me/77760709898?text=" + encodeURIComponent(text); a.target = "_blank"; a.rel = "noopener noreferrer";
    D.body.appendChild(a); a.click(); a.remove();
  }
  function sendBooking() {
    var f = W._saiState.flow;
    if (!f || f.t !== "book" || !f.d || !f.d.final) return seventAiAppendMessage("ai", "Эта бронь уже неактуальна — давайте оформим заново.", [{ a: "ask:Хочу забронировать столик", label: "Забронировать столик" }]);
    var b = f.d.final, p2 = function (n) { return String(n).padStart(2, "0"); };
    if (site.bkClosed()) return seventAiAppendMessage("ai", "Ресторан сейчас временно закрыт, бронь недоступна.");
    if (!bk_isBookingAllowedNow(b.bookId)) return seventAiAppendMessage("ai", "Заявки на бронь сейчас не принимаем — с 12:00. Загляните попозже.");
    if (bk_isDateBlocked(b.m, b.d, b.bookId)) return seventAiAppendMessage("ai", "В этот день ресторан не работает — выберите другую дату.", [{ a: "ask:изменить дату", label: "Изменить дату" }]);
    if (Date.UTC(b.y, b.m, b.d, b.h - 5, b.mi) - Date.now() < 36e5) return seventAiAppendMessage("ai", "Бронь — минимум за час до визита. Давайте выберем время попозже.", [{ a: "ask:изменить время", label: "Изменить время" }]);
    var guests = b.guests >= 6 ? "6 и более" : b.guests,
      comment = b.comment + (b.guestsExact > 6 ? (b.comment ? "; " : "") + "гостей: " + b.guestsExact : ""),
      MON = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    var m = "Здравствуйте! Хочу забронировать столик.\n\nИмя: " + b.name + "\nТелефон: " + b.phone + "\nФилиал: " + b.branchName +
      "\nДата: " + p2(b.d) + " " + MON[b.m] + " " + b.y + "\nВремя: " + p2(b.h) + ":" + p2(b.mi) + "\nГостей: " + guests + (comment ? "\nКомментарий: " + comment : "") +
      "\n\nГость ознакомлен и согласен с Условиями бронирования (удержание столика 20 мин, предоплата 2000 тг невозвратна при неявке/недозвоне).\n(оформлено через SEVEN AI)";
    lastBookMsg = m;
    bk_logBooking({ branch: b.branchName, name: b.name, phone: b.phone, comment: comment, guests: guests, bookDate: p2(b.d) + "." + p2(b.m + 1) + "." + b.y, bookTime: p2(b.h) + ":" + p2(b.mi), consent: "да", termsClick: termsOpened ? "да" : "нет" });
    bk_saveProfile({ name: b.name, phone: b.phone, comment: b.comment, branch: b.bookId, guests: Math.min(b.guests, 6), lastBookingAt: Date.now() });
    if (typeof _bookOpenedNoSubmit !== "undefined") _bookOpenedNoSubmit = false;
    ev("Бронь через SEVEN AI", b.branchName + ", " + p2(b.d) + "." + p2(b.m + 1) + " " + p2(b.h) + ":" + p2(b.mi) + ", гостей: " + guests);
    openWa(m);
    say(AI.afterSend("book", {}, { state: W._saiState }));
  }

  // ── кнопки под сообщениями
  W._saiAct = function (a, label) {
    a = String(a || "");
    if (a.indexOf("ask:") === 0) { var inp = el("seventAiInput"); inp.value = a.slice(4); return seventAiSend(); }
    if (a === "wa") return;
    if (a === "lang:kz" || a === "lang:ru") return setLang(a.slice(5));
    ev("SEVEN AI: кнопка", String(label || a));
    if (a === "order:send") return sendOrder();
    if (a === "book:send") return sendBooking();
    if (a === "link:order") return void W.open("https://taplink.cc/seventimes/p/1153436/", "_blank", "noopener");
    if (a === "link:book") { termsOpened = true; return void W.open("https://taplink.cc/seventimes/p/1154a9f/", "_blank", "noopener"); }
    if (a === "retrywa") return retryOpenWhatsapp();
    if (a === "retrybook") { if (lastBookMsg) openWa(lastBookMsg); return; }
    if (a.indexOf("dish:") === 0) return openCard({ id: a.slice(5) });
    if (a.indexOf("cat:") === 0) {
      var i = Object.keys(menuNow()).indexOf(a.slice(4));
      seventAiClose(); switchBottomTab("home");
      if (i >= 0) setTimeout(function () { scrollToSec(i); }, 80);
      return;
    }
    seventAiClose();
    if (a === "menu") switchBottomTab("home");
    else if (a === "book") bookBtnClick();
    else if (a === "news") switchBottomTab("news");
    else if (a === "vacancy") switchBottomTab("vacancy");
    else if (a === "cart") { switchBottomTab("home"); openCart(); }
  };

  // ── кнопка «Спросить SEVEN AI» в шторке блюда
  // «Спросить SEVEN AI» в карточке блюда: бот не отвечает, просто подставляем блюдо в поле ввода
  W._saiFromDish = function (it) {
    var inp = el("seventAiInput");
    if (inp) { inp.value = "«" + it.name + "» — "; syncRow(); safe(function () { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }); }
  };

  // короткое приветствие на казахском и русском — единственное, что бот пишет сам (кроме «оператор отошёл»)
  W._saiWelcome = function () {
    if (W._saiNoWelcome) { W._saiNoWelcome = false; return; }
    seventAiAppendMessage("ai", "Сәлеметсіз бе! Мен — сіздің SEVEN AI көмекшіңізбін. Кез келген сұрағыңызға жауап беремін.\n\nЗдравствуйте! Я ваш ИИ-помощник SEVEN AI. Отвечу на любые вопросы.");
  };


  // ── голосовые сообщения, как в мессенджерах ──
  // Тап по микрофону: браузер слушает (бесплатное распознавание речи) и
  // параллельно пишет звук. Волна живая — от громкости голоса, плавная.
  // В чат уходит «голосовое» с расшифровкой, SEVEN AI отвечает на текст,
  // а сам звук уходит файлом в Google Диск (ссылка «Слушать» в листе SEVEN_AI).
  // Если телефон не даёт писать звук и слушать одновременно — дальше только
  // распознаём (запоминаем это на телефоне), чтобы бот всегда понимал гостя.
  var SR = W.SpeechRecognition || W.webkitSpeechRecognition, recOn = false, vs = null, NB = 28, LIVE = 34;
  var MIC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
  var PLAY = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>';
  var PAUSE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4.5" height="16" rx="1.2"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.2"/></svg>';
  function dur(s) { s = Math.max(1, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function lsGet(k) { return safe(function () { return localStorage.getItem(k); }, null); }
  function lsSet(k, v) { safe(function () { localStorage.setItem(k, v); }); }

  // звук своих голосовых храним на телефоне гостя (IndexedDB), чтобы можно было переслушать
  var idbP = null;
  function idb() {
    if (!idbP) idbP = new Promise(function (ok, no) {
      var rq = W.indexedDB.open("sai_voice", 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore("v"); };
      rq.onsuccess = function () { ok(rq.result); }; rq.onerror = function () { no(rq.error); };
    });
    return idbP;
  }
  function idbPut(id, blob) { return safe(function () { return idb().then(function (db) { db.transaction("v", "readwrite").objectStore("v").put(blob, id); }); }) || Promise.resolve(); }
  function idbGet(id) { return safe(function () { return idb().then(function (db) { return new Promise(function (ok) { var q = db.transaction("v").objectStore("v").get(id); q.onsuccess = function () { ok(q.result || null); }; q.onerror = function () { ok(null); }; }); }); }) || Promise.resolve(null); }
  function idbClear() { safe(function () { idb().then(function (db) { db.transaction("v", "readwrite").objectStore("v").clear(); }); }); }
  var resetChat = W._saiReset;
  W._saiReset = function () { idbClear(); return resetChat.apply(this, arguments); };

  // волна для пузыря: сжимаем записанную громкость до 28 столбиков
  function squeeze(levels) {
    var out = [];
    if (!levels.length) levels = [0.3];
    var mx = Math.max.apply(null, levels) || 1;
    for (var i = 0; i < NB; i++) {
      var a = Math.floor(i * levels.length / NB), b = Math.max(a + 1, Math.floor((i + 1) * levels.length / NB)), m = 0;
      for (var j = a; j < b && j < levels.length; j++) m = Math.max(m, levels[j]);
      out.push(Math.round(Math.min(1, Math.max(0.04, m / mx)) * 100) / 100);
    }
    return out;
  }
  function barsHtml(list) { return list.map(function (h) { return '<i style="height:' + Math.round(14 + h * 86) + '%"></i>'; }).join(""); }
  var player = null;
  W._saiVoiceDecor = function (bubble, v) {
    var box = bubble.firstChild, txt = box && box.firstChild;
    if (!box) return;
    var pill = D.createElement("div");
    pill.className = "sai-vpill";
    pill.innerHTML = '<span class="sai-vmic">' + MIC + '</span><span class="sai-vw">' + barsHtml(v.bars || squeeze([])) + '</span><span class="sai-vd">' + dur(v.dur || 1) + "</span>";
    box.insertBefore(pill, box.firstChild);
    if (txt) txt.classList.add("sai-vtxt");
    if (!v.id || !v.a) return;
    idbGet(v.id).then(function (blob) {
      if (!blob) return;
      var btn = pill.querySelector(".sai-vmic");
      btn.innerHTML = PLAY; btn.classList.add("play"); btn.setAttribute("role", "button"); btn.setAttribute("aria-label", "Прослушать");
      btn.onclick = function () { playVoice(pill, blob, v.dur); };
    });
  };
  function playVoice(pill, blob, secs) {
    if (player && player.pill === pill) { if (player.au.paused) player.au.play(); else player.au.pause(); return; }
    if (player) { player.au.pause(); player.stop(); }
    var url = URL.createObjectURL(blob), au = new Audio(url), btn = pill.querySelector(".sai-vmic"), bars = pill.querySelectorAll(".sai-vw i"), dEl = pill.querySelector(".sai-vd"), raf = 0;
    function paint() {
      var p = au.duration && isFinite(au.duration) ? au.currentTime / au.duration : 0;
      for (var i = 0; i < bars.length; i++) bars[i].classList.toggle("on", i / bars.length < p);
      dEl.textContent = dur(Math.max(1, (au.duration && isFinite(au.duration) ? au.duration : secs) - au.currentTime));
      if (!au.paused) raf = requestAnimationFrame(paint);
    }
    function stop() { cancelAnimationFrame(raf); btn.innerHTML = PLAY; pill.classList.remove("playing"); for (var i = 0; i < bars.length; i++) bars[i].classList.remove("on"); dEl.textContent = dur(secs); }
    au.onplay = function () { btn.innerHTML = PAUSE; pill.classList.add("playing"); paint(); };
    au.onpause = function () { btn.innerHTML = PLAY; cancelAnimationFrame(raf); };
    au.onended = function () { stop(); URL.revokeObjectURL(url); player = null; };
    player = { pill: pill, au: au, stop: stop };
    au.play().catch(function () { toast("Не получилось воспроизвести"); });
  }

  // панель записи: крестик, красная точка, таймер, живая волна, «отправить»
  function recBar(on) {
    var row = el("seventAiInputRow"), bar = el("saiRecBar");
    if (!row) return null;
    if (on && !bar) {
      bar = D.createElement("div");
      bar.id = "saiRecBar"; bar.className = "sai-rec";
      var live = ""; for (var i = 0; i < LIVE; i++) live += "<i></i>";
      bar.innerHTML = '<button type="button" class="sai-rec-x" aria-label="Отменить запись"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        '<span class="sai-rec-dot"></span><span class="sai-rec-t">0:00</span><span class="sai-rec-w">' + live + "</span>" +
        '<button type="button" class="sai-rec-go" aria-label="Отправить голосовое"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
      bar.querySelector(".sai-rec-x").onclick = function () { stopRec(true); };
      bar.querySelector(".sai-rec-go").onclick = function () { stopRec(false); };
      row.parentNode.insertBefore(bar, row);
    }
    if (bar) bar.style.display = on ? "flex" : "none";
    row.style.display = on ? "none" : "flex";
    return bar;
  }
  // плавная волна: громкость сглаживаем, столбики едут справа налево
  function animate(s) {
    var bar = el("saiRecBar"), bars = bar ? bar.querySelectorAll(".sai-rec-w i") : [], tEl = bar && bar.querySelector(".sai-rec-t"), hist = [], lastPush = 0, buf = null;
    for (var i = 0; i < LIVE; i++) hist.push(0.06);
    function frame(ts) {
      if (!s.alive) return;
      var lvl;
      if (s.an) {
        if (!buf) buf = new Uint8Array(s.an.fftSize);
        s.an.getByteTimeDomainData(buf);
        var sum = 0; for (var k = 0; k < buf.length; k++) { var x = (buf[k] - 128) / 128; sum += x * x; }
        lvl = Math.min(1, Math.sqrt(sum / buf.length) * 4.2);
        s.peak = Math.max(s.peak, lvl);
      } else {
        // без доступа к звуку — по событиям распознавания: говорит / молчит
        var tgt = s.speaking ? 0.42 + 0.3 * Math.sin(ts / 170) * Math.sin(ts / 97) + (ts - s.lastRes < 300 ? 0.25 : 0) : 0.05;
        lvl = Math.max(0.04, tgt);
      }
      s.lv = s.lv + (lvl - s.lv) * (lvl > s.lv ? 0.35 : 0.12);
      if (ts - lastPush > 70) {
        lastPush = ts; hist.push(s.lv); hist.shift(); s.levels.push(s.lv);
        for (var j = 0; j < bars.length; j++) bars[j].style.transform = "scaleY(" + Math.max(0.08, Math.min(1, hist[j] * 1.15)).toFixed(3) + ")";
      }
      var f = Math.floor((Date.now() - s.t0) / 1000);
      if (tEl) tEl.textContent = Math.floor(f / 60) + ":" + String(f % 60).padStart(2, "0");
      if (f >= 60) stopRec(false);
      s.raf = requestAnimationFrame(frame);
    }
    s.raf = requestAnimationFrame(frame);
  }
  function stopRec(cancel) {
    var s = vs;
    if (!recOn || !s || s.stopping) return;
    s.stopping = true; s.cancel = !!cancel;
    safe(function () { cancel ? s.rec.abort() : s.rec.stop(); });
    safe(function () { if (s.mr && s.mr.state !== "inactive") s.mr.stop(); });
  }
  function release(s) {
    s.alive = false; cancelAnimationFrame(s.raf);
    safe(function () { s.stream && s.stream.getTracks().forEach(function (t) { t.stop(); }); });
    safe(function () { s.ac && s.ac.close(); });
  }
  function finish(s) {
    if (s.done) return;
    s.done = true; clearTimeout(s.guard); release(s);
    micState(false); recBar(false); vs = null;
    var text = (s.fin || s.tmp).replace(/\s+/g, " ").trim().slice(0, 500), secs = Math.max(1, Math.round((Date.now() - s.t0) / 1000));
    var blob = s.chunks.length ? new Blob(s.chunks, { type: s.mime || "audio/webm" }) : null;
    if (s.cancel) return;
    if (s.err === "not-allowed" || s.err === "service-not-allowed") return toast("Разрешите доступ к микрофону в настройках браузера");
    if (!text) {
      // расшифровки нет (телефон не умеет слушать и писать разом) — отправляем само голосовое
      if (blob && (s.peak > 0.12 || !s.rec)) text = "Голосовое сообщение (без расшифровки)";
      else return toast(s.err && s.err !== "no-speech" && s.err !== "aborted" ? "Голосовые сейчас недоступны — напишите текстом" : "Не расслышала — скажите ещё раз");
    }
    if (!chatVisible()) return;
    var id = "v" + Date.now(), meta = { id: id, dur: secs, bars: squeeze(s.levels) };
    if (blob) { meta.a = 1; idbPut(id, blob); }
    el("seventAiInput").value = text;
    W._saiSend(meta, blob ? { blob: blob, mime: s.mime, dur: secs } : null);
  }
  function toggleMic() {
    var inp = el("seventAiInput");
    if (recOn) return stopRec(false);
    if (!inp || inp.disabled || W._aiBusy) return;
    if (player) { player.au.pause(); }
    var canRec = !!(W.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    var rec = SR ? safe(function () { return new SR(); }, null) : null;
    if (!rec && !canRec) return toast("Голосовые на этом телефоне недоступны — напишите текстом");
    var l = W._saiLang, s = { rec: rec, t0: Date.now(), fin: "", tmp: "", err: "", chunks: [], levels: [], lv: 0.05, peak: 0, lastRes: 0, alive: true, speaking: false };
    vs = s;
    if (rec) {
    rec.lang = l === "kz" ? "kk-KZ" : l === "en" ? "en-US" : "ru-RU";
    rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
    rec.onresult = function (e) {
      var tmp = "";
      for (var i = e.resultIndex; i < e.results.length; i++) { var x = e.results[i][0].transcript; if (e.results[i].isFinal) s.fin += x; else tmp += x; }
      s.tmp = tmp; s.lastRes = performance.now(); s.speaking = true;
    };
    rec.onspeechstart = rec.onsoundstart = function () { s.speaking = true; };
    rec.onspeechend = rec.onsoundend = function () { s.speaking = false; };
    rec.onerror = function (e) { s.err = e && e.error || "error"; };
    rec.onend = function () {
      s.recEnded = true;
      if (!s.mr || s.mr.state === "inactive") return finish(s);
      safe(function () { s.mr.stop(); });
      s.guard = setTimeout(function () { finish(s); }, 1500);
    };
    }
    // звук пишем всегда, когда телефон это умеет — голосовое уйдёт тебе в бот
    if (canRec) {
      safe(function () { var AC = W.AudioContext || W.webkitAudioContext; s.ac = new AC(); });
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (stream) {
        s.stream = stream;
        if (!s.alive) return release(s);
        safe(function () { var an = s.ac.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.6; s.ac.createMediaStreamSource(stream).connect(an); s.an = an; if (s.ac.state === "suspended") s.ac.resume(); });
        var types = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"], mt = "";
        for (var i = 0; i < types.length; i++) if (safe(function () { return MediaRecorder.isTypeSupported(types[i]); }, false)) { mt = types[i]; break; }
        var mr = safe(function () { return new MediaRecorder(stream, mt ? { mimeType: mt, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 }); }, null);
        if (!mr) return;
        s.mr = mr; s.mime = (mr.mimeType || mt || "audio/webm").split(";")[0];
        mr.ondataavailable = function (e) { if (e.data && e.data.size) s.chunks.push(e.data); };
        mr.onstop = function () { if (s.recEnded || s.stopping) finish(s); };
        mr.start(250);
      }, function () {
        safe(function () { s.ac && s.ac.close(); }); s.ac = null;
        // без распознавания и без микрофона записывать нечего
        if (!rec) { s.err = "not-allowed"; finish(s); }
      });
    }
    if (rec) { try { rec.start(); } catch (e) { rec = s.rec = null; if (!canRec) { release(s); vs = null; return toast("Голосовые сейчас недоступны — напишите текстом"); } } }
    micState(true); recBar(true); animate(s); ev("SEVEN AI: голосовое");
  }
  function micState(on) {
    recOn = on;
    var b = el("saiMic");
    if (b) b.classList.toggle("on", on);
  }
  // ── строка ввода как в WhatsApp: пустое поле — камера и микрофон, есть текст — «отправить»
  var CAM = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5A2 2 0 0 1 5.5 6.5h2l1.4-2h6.2l1.4 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.6"/></svg>';
  var SEND = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6l-.02 6.53L15 12 3.38 13.87z"/></svg>';
  function micOk() { return !!(SR || (W.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)); }
  function camOk() { return !!(W.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && W.HTMLCanvasElement && HTMLCanvasElement.prototype.captureStream); }
  function syncRow() {
    var inp = el("seventAiInput"), send = el("seventAiSendBtn"), mic = el("saiMic"), cam = el("saiCamBtn");
    if (!inp || !send) return;
    var live = chatVisible() && !inp.disabled, has = !!inp.value.trim();
    var m = live && !has && !!mic && micOk(), c = live && !has && !!cam && camOk();
    send.style.display = !live || has || !(m || c) ? "" : "none";
    if (mic) mic.style.display = m ? "" : "none";
    if (cam) cam.style.display = c ? "" : "none";
  }
  W._saiSyncRow = syncRow;
  function setupMic() {
    var row = el("seventAiInputRow"), send = el("seventAiSendBtn"), inp = el("seventAiInput"), b = el("saiMic"), c = el("saiCamBtn");
    if (!row || !send) return;
    if (!send.classList.contains("sai-send")) { send.classList.add("sai-send"); send.innerHTML = SEND; send.setAttribute("aria-label", "Отправить"); }
    if (!c) {
      c = D.createElement("button");
      c.type = "button"; c.id = "saiCamBtn"; c.className = "sai-camb"; c.setAttribute("aria-label", "Записать кружочек");
      c.innerHTML = CAM;
      c.onclick = openCam;
      row.insertBefore(c, send);
    }
    if (!b) {
      b = D.createElement("button");
      b.type = "button"; b.id = "saiMic"; b.className = "sai-mic"; b.setAttribute("aria-label", "Записать голосовое");
      b.innerHTML = MIC;
      b.onclick = toggleMic;
      row.insertBefore(b, send);
    }
    if (inp && !inp._saiRow) { inp._saiRow = true; inp.addEventListener("input", syncRow); }
    syncRow();
  }
  // чат новостей открывается в том же окне — там кнопок записи нет
  var openChat = W.seventAiOpen;
  if (openChat) W.seventAiOpen = function () { var r = openChat.apply(this, arguments); syncRow(); return r; };

  // ── кружочки (видеосообщения), как в Telegram/WhatsApp ──
  // Камера на весь экран, фон размыт: сверху ✕ и таймер, по центру круг,
  // слева «сменить камеру», снизу корзина / стоп / отправить. После стопа
  // можно посмотреть свою запись. Уходит тебе в бот круглым видео, в Google Диск — нет.
  var VN_MAX = 60, VN_SIZE = 480, cam = null;
  var XI = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var FLIP = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5A2 2 0 0 1 5.5 6.5h2l1.4-2h6.2l1.4 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M9 12.5a3 3 0 0 1 5.2-2l.8.8M15 14a3 3 0 0 1-5.2 1.5l-.8-.8"/><path d="M15 9.5v1.8h-1.8M9 16.5v-1.8h1.8"/></svg>';
  var TRASH = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>';
  var BIGPLAY = '<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  function vnMime() {
    var t = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"];
    for (var i = 0; i < t.length; i++) if (safe(function () { return MediaRecorder.isTypeSupported(t[i]); }, false)) return t[i];
    return "";
  }
  function mmss(sec) { sec = Math.max(0, Math.floor(sec)); return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0"); }
  function camVideo(s) {
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: s.facing, width: { ideal: 720 }, height: { ideal: 720 } }, audio: false }).then(function (vs2) {
      if (!s.alive) { vs2.getTracks().forEach(function (t) { t.stop(); }); return; }
      if (s.vstream) s.vstream.getTracks().forEach(function (t) { t.stop(); });
      s.vstream = vs2; s.src.srcObject = vs2;
      return s.src.play().catch(function () {});
    });
  }
  function camDraw(s) {
    if (!s.alive || s.review) return;
    var v = s.src, g = s.g;
    if (v.videoWidth) {
      var w = v.videoWidth, h = v.videoHeight, m = Math.min(w, h);
      g.save();
      if (s.facing === "user") { g.translate(VN_SIZE, 0); g.scale(-1, 1); } // как в зеркале — как видит себя гость
      g.drawImage(v, (w - m) / 2, (h - m) / 2, m, m, 0, 0, VN_SIZE, VN_SIZE);
      g.restore();
    }
    s.raf = requestAnimationFrame(function () { camDraw(s); });
  }
  function camTick(s) {
    if (!s.alive || s.review) return;
    var sec = (Date.now() - s.t0) / 1000;
    s.tEl.textContent = mmss(sec);
    s.ring.style.strokeDashoffset = String(s.len * (1 - Math.min(1, sec / VN_MAX)));
    if (sec >= VN_MAX) return camStop(s);
    s.timer = setTimeout(function () { camTick(s); }, 250);
  }
  function camTracksOff(s) {
    safe(function () { s.vstream && s.vstream.getTracks().forEach(function (t) { t.stop(); }); });
    safe(function () { s.astream && s.astream.getTracks().forEach(function (t) { t.stop(); }); });
    safe(function () { s.cs && s.cs.getTracks().forEach(function (t) { t.stop(); }); });
  }
  function closeCam() {
    var s = cam;
    if (!s) return;
    cam = null; s.alive = false; s.sendAfter = false;
    cancelAnimationFrame(s.raf); clearTimeout(s.timer);
    safe(function () { if (s.mr && s.mr.state !== "inactive") { s.mr.onstop = null; s.mr.stop(); } });
    camTracksOff(s);
    safe(function () { s.play.pause(); });
    if (s.url) safe(function () { URL.revokeObjectURL(s.url); });
    s.ov.classList.remove("show");
    setTimeout(function () { s.ov.remove(); }, 180);
  }
  function camStop(s) {
    if (!s.mr || s.mr.state === "inactive" || s.stopping) return;
    s.stopping = true; clearTimeout(s.timer);
    s.dur = Math.max(1, Math.round((Date.now() - s.t0) / 1000));
    // обложка для переписки (маленькая, хранится в истории)
    safe(function () { var pc = D.createElement("canvas"); pc.width = pc.height = 160; pc.getContext("2d").drawImage(s.canvas, 0, 0, 160, 160); s.poster = pc.toDataURL("image/jpeg", 0.6); });
    s.mr.stop();
  }
  function camReview(s) {
    s.review = true; cancelAnimationFrame(s.raf);
    camTracksOff(s); // камера гаснет сразу
    s.blob = new Blob(s.chunks, { type: s.mime.split(";")[0] });
    if (s.sendAfter) return camSend(s);
    s.ov.classList.add("review");
    s.tEl.classList.remove("rec"); s.tEl.textContent = mmss(s.dur);
    s.url = URL.createObjectURL(s.blob);
    s.play.src = s.url; s.play.style.display = "block"; s.canvas.style.display = "none";
    if (s.poster) s.play.poster = s.poster;
    s.pl.style.display = "flex";
    s.ring.style.strokeDashoffset = String(s.len);
  }
  function camSend(s) {
    if (!s.blob || !s.blob.size) { closeCam(); return toast("Кружочек не записался — попробуйте ещё раз"); }
    var inp = el("seventAiInput");
    if (!inp || !chatVisible()) return closeCam();
    var id = "n" + Date.now(), meta = { kind: "vn", id: id, dur: s.dur, poster: s.poster || "", a: 1 };
    idbPut(id, s.blob);
    var blob = s.blob, mime = s.mime.split(";")[0], d = s.dur;
    closeCam();
    inp.value = "Кружочек (видеосообщение)";
    W._saiSend(meta, { blob: blob, mime: mime, dur: d, video: true });
    ev("SEVEN AI: кружочек", d + " сек");
  }
  function openCam() {
    if (cam || recOn || W._aiBusy || !camOk()) return;
    if (player) player.au.pause();
    var ov = D.createElement("div");
    ov.id = "saiCam"; ov.className = "sai-cam-ov";
    ov.innerHTML = '<button type="button" class="sai-cam-x" aria-label="Закрыть">' + XI + '</button>' +
      '<div class="sai-cam-t rec">00:00</div>' +
      '<div class="sai-cam-c"><svg class="sai-cam-ring" viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="49"/><circle class="fg" cx="50" cy="50" r="49"/></svg>' +
      '<canvas width="' + VN_SIZE + '" height="' + VN_SIZE + '"></canvas><video playsinline webkit-playsinline style="display:none"></video>' +
      '<button type="button" class="sai-cam-pl" style="display:none" aria-label="Посмотреть запись">' + BIGPLAY + '</button></div>' +
      '<button type="button" class="sai-cam-flip" aria-label="Сменить камеру">' + FLIP + '</button>' +
      '<div class="sai-cam-bar"><button type="button" class="sai-cam-del" aria-label="Удалить запись">' + TRASH + '</button>' +
      '<button type="button" class="sai-cam-stop" aria-label="Остановить запись"><i></i></button>' +
      '<button type="button" class="sai-cam-go" aria-label="Отправить кружочек">' + SEND + '</button></div>';
    D.body.appendChild(ov);
    var s = cam = { ov: ov, facing: "user", alive: true, chunks: [], mime: vnMime(), len: 2 * Math.PI * 49 };
    s.canvas = ov.querySelector("canvas"); s.g = s.canvas.getContext("2d");
    s.play = ov.querySelector("video"); s.pl = ov.querySelector(".sai-cam-pl");
    s.tEl = ov.querySelector(".sai-cam-t"); s.ring = ov.querySelector(".sai-cam-ring .fg");
    s.ring.style.strokeDasharray = String(s.len); s.ring.style.strokeDashoffset = String(s.len);
    s.src = D.createElement("video"); s.src.muted = true; s.src.playsInline = true; s.src.setAttribute("playsinline", "");
    requestAnimationFrame(function () { ov.classList.add("show"); });
    ov.querySelector(".sai-cam-x").onclick = closeCam;
    ov.querySelector(".sai-cam-del").onclick = closeCam;
    ov.querySelector(".sai-cam-stop").onclick = function () { camStop(s); };
    ov.querySelector(".sai-cam-go").onclick = function () {
      if (s.review) return camSend(s);
      if (s.mr && s.mr.state === "recording") { s.sendAfter = true; camStop(s); }
    };
    ov.querySelector(".sai-cam-flip").onclick = function () {
      if (s.review) return;
      s.facing = s.facing === "user" ? "environment" : "user";
      camVideo(s).catch(function () { s.facing = s.facing === "user" ? "environment" : "user"; toast("Вторая камера недоступна"); });
    };
    function togglePlay() { if (!s.review) return; if (s.play.paused) s.play.play().catch(function () {}); else s.play.pause(); }
    s.pl.onclick = togglePlay; s.play.onclick = togglePlay;
    s.play.onplay = function () { s.pl.style.display = "none"; };
    s.play.onpause = s.play.onended = function () { s.pl.style.display = "flex"; };
    s.play.ontimeupdate = function () { if (s.play.duration && isFinite(s.play.duration)) s.ring.style.strokeDashoffset = String(s.len * (1 - s.play.currentTime / s.play.duration)); };
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (as) {
      s.astream = as;
      if (!s.alive) return camTracksOff(s);
      return camVideo(s);
    }).then(function () {
      if (!s.alive) return;
      camDraw(s);
      s.cs = s.canvas.captureStream(30);
      var tracks = s.cs.getVideoTracks().concat(s.astream.getAudioTracks());
      var opt = { videoBitsPerSecond: 700000, audioBitsPerSecond: 48000 };
      if (s.mime) opt.mimeType = s.mime;
      s.mr = new MediaRecorder(new MediaStream(tracks), opt);
      s.mime = s.mr.mimeType || s.mime || "video/webm";
      s.mr.ondataavailable = function (e) { if (e.data && e.data.size) s.chunks.push(e.data); };
      s.mr.onstop = function () { if (s.alive) camReview(s); };
      s.mr.start(500);
      s.t0 = Date.now();
      camTick(s);
      safe(function () { navigator.vibrate && navigator.vibrate(10); });
    }).catch(function () {
      closeCam();
      toast("Разрешите доступ к камере и микрофону в настройках браузера");
    });
    ev("SEVEN AI: камера");
  }

  // кружочек в переписке: круг с обложкой, тап — смотреть
  var voiceDecor = W._saiVoiceDecor;
  W._saiVoiceDecor = function (bubble, v) {
    if (!v || v.kind !== "vn") return voiceDecor(bubble, v);
    var box = bubble.firstChild, txt = box && box.firstChild;
    if (!box) return;
    box.classList.add("sai-vnbox");
    if (txt) txt.classList.add("sai-vtxt");
    var c = D.createElement("div");
    c.className = "sai-vn";
    c.innerHTML = (v.poster && /^data:image\/jpeg;base64,/.test(v.poster) ? '<img alt="" src="' + v.poster + '">' : "") +
      '<span class="sai-vn-pl">' + PLAY + '</span><span class="sai-vn-d">' + dur(v.dur || 1) + "</span>";
    box.insertBefore(c, box.firstChild);
    if (!v.id) return;
    idbGet(v.id).then(function (blob) {
      if (!blob) return;
      var vid = null, url = "";
      c.setAttribute("role", "button"); c.setAttribute("aria-label", "Смотреть кружочек");
      c.onclick = function () {
        if (player) player.au.pause();
        if (!vid) {
          url = URL.createObjectURL(blob);
          vid = D.createElement("video"); vid.playsInline = true; vid.setAttribute("playsinline", ""); vid.src = url;
          if (v.poster) vid.poster = v.poster;
          vid.onplay = function () { c.classList.add("playing"); };
          vid.onpause = function () { c.classList.remove("playing"); };
          vid.onended = function () { c.classList.remove("playing"); vid.currentTime = 0; };
          c.insertBefore(vid, c.querySelector(".sai-vn-pl"));
        }
        if (vid.paused) vid.play().catch(function () { toast("Не получилось воспроизвести"); }); else vid.pause();
      };
    });
  };
  var closeChat = W.seventAiClose;
  W.seventAiClose = function () { headTyping(false); closeCam(); if (recOn) stopRec(true); if (player) player.au.pause(); closeMenu(); var ed = el("saiEdit"); if (ed) { ed.remove(); var rw = el("seventAiInputRow"); if (rw) rw.style.display = "flex"; var ms = el("seventAiMessages"); if (ms) ms.classList.remove("sai-blur"); } return closeChat.apply(this, arguments); };

  W._saiOnOpen = function () {
    loadFacts(); setupMic(); setupHold(); syncRow();
    // ответ администратора мог прийти, пока чат был закрыт (хранится 6 часов) — проверяем
    var o = opGet();
    if (o.asked && Date.now() - o.asked < 6 * 3600e3) { if (!(o.until > Date.now())) { o.until = Date.now() + OP_TTL; opSet(o); } opSchedule(300); }
    setTimeout(ackSeen, 600);
  };
})();
