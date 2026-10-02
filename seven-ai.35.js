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
    ".sai-cam-c canvas,.sai-cam-c video{position:absolute;top:6px;left:6px;width:calc(100% - 12px);height:calc(100% - 12px);border-radius:50%;object-fit:cover;background:#000;-webkit-clip-path:circle(50% at 50% 50%);clip-path:circle(50% at 50% 50%)}" +
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
    ".sai-vn{position:relative;width:200px;height:200px;border-radius:50%;overflow:hidden;background:#2c2c2e;cursor:pointer;-webkit-clip-path:circle(50% at 50% 50%);clip-path:circle(50% at 50% 50%);-webkit-mask-image:-webkit-radial-gradient(white,black);isolation:isolate;transform:translateZ(0)}" +
    ".sai-vn img,.sai-vn video{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;object-fit:cover;border-radius:50%}" +
    ".sai-vn-pl{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(0,0,0,.45);color:#fff;display:flex;align-items:center;justify-content:center}" +
    ".sai-vn.playing .sai-vn-pl{display:none}" +
    ".sai-vn-d{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);font-size:.66rem;color:#fff;background:rgba(0,0,0,.45);padding:1px 7px;border-radius:9px}" +
    "#seventAiInputRow.sai-locked{display:none!important}" +
    ".sai-lockbar{display:none;margin:0 var(--px,16px) calc(12px + env(safe-area-inset-bottom,0px));padding:14px 16px;border-radius:16px;background:#f2f2f7;color:#3a3a3c;font-size:.84rem;line-height:1.35;text-align:center;align-items:center;justify-content:center;gap:8px}" +
    ".sai-lockbar.on{display:flex}" +
    /* тема чата: свой цвет сообщений и обои */
    "#seventAiOv.sai-th #seventAiMessages .sai-msg[style*='flex-end']>div:first-child:not(.sai-vnbox){background:var(--sai-me)!important;color:var(--sai-me-fg)!important}" +
    "#seventAiOv.sai-th-wall #seventAiMessages .sai-msg[style*='flex-start']>div:first-child:not(.sai-vnbox){background:#fff!important;box-shadow:0 1px 1.5px rgba(0,0,0,.13)}" +
    "#seventAiOv.sai-th-dark #seventAiMessages .sai-msg[style*='flex-start']>div:first-child:not(.sai-vnbox){background:#2a2c31!important;color:#f2f2f7!important;box-shadow:none}" +
    "#seventAiOv.sai-th-dark #seventAiMessages>div[style*='align-self:center'] span{background:rgba(255,255,255,.14)!important;color:#e5e5ea!important}" +
    "#seventAiOv.sai-th-wall #seventAiMessages>div[style*='align-self:center'] span{box-shadow:0 1px 1px rgba(0,0,0,.08)}" +
    "#seventAiOv.sai-th-dark .sai-vnbox{color:#e5e5ea!important}" +
    "#seventAiMessages{transition:background .25s}" +
    "#seventAiOv.sai-th .sai-mic,#seventAiOv.sai-th .sai-send{background:var(--sai-me)!important;color:var(--sai-me-fg)!important}#seventAiOv.sai-th .sai-plus,#seventAiOv.sai-th .sai-camb{color:var(--sai-me)!important}" +
    ".sai-set-ov{position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.32);display:flex;align-items:flex-end;justify-content:center;animation:saiSetF .18s ease}" +
    "@keyframes saiSetF{from{opacity:0}to{opacity:1}}@keyframes saiSetU{from{transform:translateY(40px)}to{transform:none}}" +
    ".sai-set{width:100%;max-width:520px;max-height:90vh;overflow-y:auto;background:#f2f2f7;border-radius:18px 18px 0 0;padding:0 16px calc(24px + env(safe-area-inset-bottom,0px));animation:saiSetU .24s cubic-bezier(.2,.8,.2,1);-webkit-overflow-scrolling:touch}" +
    ".sai-set-h{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:center;padding:14px 0 10px;background:#f2f2f7}.sai-set-h b{font-size:1rem}" +
    ".sai-set-x{position:absolute;right:0;top:10px;border:none;background:none;color:#7a1128;font:inherit;font-weight:600;font-size:.95rem;padding:6px;cursor:pointer}" +
    ".sai-set-pv{display:flex;justify-content:center;margin:4px 0 6px}" +
    ".sai-set-g{font-size:.72rem;color:#6e6e73;text-transform:uppercase;letter-spacing:.04em;margin:16px 4px 8px}" +
    ".sai-set-l{background:#fff;border-radius:14px;overflow:hidden}" +
    ".sai-set-r{display:flex;align-items:center;gap:12px;width:100%;padding:13px 14px;border:none;background:#fff;font:inherit;font-size:.92rem;color:#1d1d1f;text-align:left;cursor:pointer;border-bottom:1px solid #ececf0}" +
    ".sai-set-r span{width:26px;text-align:center}" +
    ".sai-sol{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:12px 14px}.sai-sol[hidden]{display:none}" +
    ".sai-tws{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}" +
    ".sai-tw{border:none;background:none;padding:0;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:5px;align-items:center}.sai-tw em{font-style:normal;font-size:.72rem;color:#3a3a3c}" +
    ".sai-tt{position:relative;display:block;width:100%;aspect-ratio:3/4;border-radius:14px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}" +
    ".sai-tt.big{width:132px}" +
    ".sai-tt i{position:absolute;height:11%;border-radius:8px}.sai-tt .a{left:9%;top:16%;width:52%;background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.12)}.sai-tt .a.d{background:#2a2c31}" +
    ".sai-tt .b{right:9%;top:38%;width:46%}.sai-tt .a.s{top:60%;width:38%}" +
    ".sai-tw.on .sai-tt{box-shadow:0 0 0 3px #fff,0 0 0 5px #7a1128}" +
    ".sai-tcs{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;background:#fff;border-radius:14px;padding:14px}" +
    ".sai-tc{width:100%;aspect-ratio:1;border-radius:50%;border:none;cursor:pointer;position:relative;padding:0}.sai-tc.sq{border-radius:12px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}" +
    ".sai-tc.on::after{content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1rem;border-radius:inherit;box-shadow:0 0 0 3px #fff,0 0 0 5px #1d1d1f;text-shadow:0 0 3px rgba(0,0,0,.5)}" +
    ".sai-seg{display:flex;background:#e3e3e8;border-radius:10px;padding:2px}.sai-seg button{flex:1;border:none;background:none;font:inherit;font-size:.88rem;padding:8px;border-radius:8px;cursor:pointer;color:#1d1d1f}.sai-seg button.on{background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);font-weight:600}" +
    ".sai-set-reset{display:block;width:100%;margin-top:18px;padding:13px;border:none;border-radius:14px;background:#fff;color:#d70015;font:inherit;font-size:.92rem;cursor:pointer}" +
    ".sai-plus{flex-shrink:0;width:38px;height:44px;border:none;background:none;color:#7a1128;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;align-self:center;-webkit-tap-highlight-color:transparent}" +
    ".sai-pmenu{position:fixed;z-index:100001;background:rgba(255,255,255,.96);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-radius:16px;box-shadow:0 10px 36px rgba(0,0,0,.18),0 0 0 .5px rgba(0,0,0,.06);padding:6px;min-width:190px;animation:saiPop .16s ease-out}" +
    "@keyframes saiPop{from{transform:translateY(6px) scale(.97);opacity:0}}" +
    ".sai-pmenu button{display:flex;align-items:center;gap:12px;width:100%;padding:9px 10px;border:none;background:none;border-radius:10px;font:inherit;font-size:.86rem;color:#1d1d1f;cursor:pointer;text-align:left}" +
    ".sai-pmenu button:active{background:#f2f2f7}.sai-pmenu span{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}" +
    ".sai-opc{flex-basis:100%;margin:8px 0 2px;background:#fff;border:1px solid #ececf0;border-radius:14px;padding:12px;font-size:.8rem;color:#1d1d1f;line-height:1.45}" +
    ".sai-opc h4{margin:0 0 8px;font-size:.84rem}.sai-opc .r{display:flex;justify-content:space-between;gap:10px;padding:2px 0}.sai-opc .r b{white-space:nowrap}" +
    ".sai-opc .tot{border-top:1px solid #ececf0;margin-top:6px;padding-top:6px;font-weight:700}.sai-opc .mt{color:#6e6e73;margin-top:6px}.sai-opc .warn{color:#c0392b;margin-top:6px}" +
    ".sai-opc input,.sai-opc select{width:100%;box-sizing:border-box;margin-top:6px;padding:9px 11px;border:1px solid #d9d9df;border-radius:10px;font:inherit;font-size:16px;background:#fff;color:#1d1d1f}" +
    ".sai-opc .two{display:flex;gap:6px}.sai-opc .two>*{flex:1}.sai-opc label.ck{display:flex;gap:8px;align-items:flex-start;margin-top:8px;font-size:.74rem;color:#3a3a3c}.sai-opc label.ck input{width:auto;margin:2px 0 0}" +
    ".sai-opc .go{display:block;width:100%;margin-top:10px;padding:12px;border:none;border-radius:12px;background:#25d366;color:#fff;font:inherit;font-weight:700;font-size:.84rem;cursor:pointer}" +
    ".sai-opc .go:disabled{opacity:.5}.sai-opc .ed{display:block;width:100%;margin-top:6px;padding:8px;border:none;background:none;color:#7a1128;font:inherit;font-size:.76rem;cursor:pointer}" +
    ".sai-opc .ok{margin-top:10px;color:#1faa53;font-weight:700}.sai-opc a{color:#7a1128}" +
    ".sai-imgbox .sai-vtxt,.sai-vpill~.sai-vtxt{font-style:normal!important;opacity:1!important;padding-left:8px}.sai-imgbox{padding:4px 4px 6px!important}.sai-imgbox>span:last-child{padding-right:6px}" +
    ".sai-img{flex-basis:100%;width:230px;max-width:100%;min-height:150px;border-radius:12px;overflow:hidden;background:#e4e4e8;display:flex;align-items:center;justify-content:center;color:#86868b;font-size:.72rem;cursor:zoom-in}" +
    ".sai-img img{display:block;width:100%;height:auto}.sai-img.st{width:140px;min-height:140px;background:transparent;cursor:default}" +
    ".sai-stbox{background:transparent!important;padding:0!important;color:#86868b!important;flex-direction:column;align-items:flex-start!important;gap:2px!important}" +
    ".sai-imgview{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;cursor:zoom-out}.sai-imgview img{max-width:100%;max-height:100%;object-fit:contain}" +
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
    "";
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
      if (audio) { body.media = audio.photo ? "фото" : audio.video ? "кружочек" : "голосовое"; body.mdur = audio.dur; }
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
  var AWAY = "Уточняю информацию по вашему вопросу — ответ придёт сюда, в этот чат. Можно пока смотреть меню, я напишу.";
  // что гость делает на сайте — администратору рядом с сообщением
  function guestCtx() {
    return safe(function () {
      var prof = (typeof loadClientProfile === "function" && loadClientProfile()) || {}, bp = (typeof bk_loadProfile === "function" && bk_loadProfile()) || {};
      var c = typeof cart !== "undefined" && cart ? cart : [];
      return { cart: c.slice(0, 15).map(function (x) { return [String(x.name), x.qty]; }), sum: typeof cartTotal === "function" ? cartTotal() : 0, seen: W._saiLastSeen || "",
        orders: Number(lsGet("st_order_count") || 0), nm: prof.name || bp.name || "", ph: prof.phone || bp.phone || "", br: curBranch() || "",
        lo: W._saiLastOrder ? W._saiLastOrder() : undefined,
        ad: prof.street ? { st: prof.street, ho: prof.house || "", en: prof.entrance || "", fl: prof.flat || "", fr: prof.floor || "" } : undefined };
    }, null);
  }
  safe(function () {
    var od = W.openDetail;
    if (typeof od === "function" && !od._sai) { W.openDetail = function (it) { try { if (it && it.name) W._saiLastSeen = String(it.name).slice(0, 60); } catch (e) {} return od.apply(this, arguments); }; W.openDetail._sai = 1; }
  });
  function forward(t, audio, tm) {
    var o = opGet(), fresh = !(o.until > Date.now());
    var body = fresh
      ? { action: "aiAsk", branch: curBranch() || "", message: t, clientId: getClientId(), name: guestName(), history: seventAiHistory.slice(-13, -1).map(function (e) { return { role: e.role, text: String(e.text || "").slice(0, 1500) }; }) }
      : { action: "jivoSend", clientId: getClientId(), name: guestName(), text: t };
    body.mt = tm;
    var gc = guestCtx(); if (gc) body.ctx = gc;
    var lg = langGet(); if (lg) body.lang = lg;
    var mine = msgBy(tm, "user");
    if (tm && !isLocked()) fbSend({ t: audio ? "" : t, mt: tm, k: audio ? (audio.video ? "vn" : audio.photo ? "img" : "voice") : "", dur: audio && audio.dur });
    if (mine && mine.reply) {
      var rt = msgBy(mine.reply.mt);
      var rtg = rt ? (rt.role === "user" ? rt.tgId : String(rt.opId || "").replace(/^tg/, "")) : "";
      if (rtg) body.replyTg = rtg;
      else if (fresh) body.message = "(в ответ на «" + String(mine.reply.text).slice(0, 80) + "») " + t;
      else body.text = "(в ответ на «" + String(mine.reply.text).slice(0, 80) + "») " + t;
    }
    function go() {
      xhrJson("POST", API, body, audio && audio.video ? 180e3 : audio && audio.photo ? 60e3 : audio && audio.blob ? 900e3 : 25e3, function (e) {
        if (e && (e.operator || (!fresh && e.ok))) {
          typing(false);
          var mm = msgBy(tm, "user");
          if (mm && e.tgId) { mm.tgId = e.tgId; seventAiSaveHistory(); }
          lsSet("sai_chatted", "1");
          setTicks(2, tm);
          log(t, { text: "(передано администратору)", known: 1, intent: "operator" }, audio, "Передано");
          // SEVEN AI сам ничего не пишет: отвечает только администратор (панель или Telegram)
          opStart(t, null, e.now);
        }
        if (e && e.blocked) { typing(false); lockChat(true, true); }
        // не дошло (Telegram не подключён или недоступен) — остаётся одна галочка, бот молчит
      });
    }
    if (audio && audio.blob && typeof FileReader !== "undefined") {
      var fr = new FileReader();
      fr.onload = function () {
        // тип файла бывает с кодеками через запятую (video/mp4;codecs=avc1…,mp4a…) — берём всё после «base64,»
        var du = String(fr.result || ""), bi = du.indexOf(";base64,"), b64 = bi >= 0 ? du.slice(bi + 8) : "";
        if (audio.photo) { body.photo = b64; body.pmime = audio.mime || "image/jpeg"; }
        else if (audio.video) { body.video = b64; body.vmime = audio.mime; body.vdur = audio.dur; }
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
  function mediaLabel(m) { var v = m.voice; return v && !v.cap ? (v.kind === "vn" ? "Видеосообщение" : v.kind === "img" ? (v.st ? "Стикер" : "Фото") : "Голосовое сообщение") : String(m.text).slice(0, 200); }
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
    if (m.voice && !m.voice.cap) { var vt = box.querySelector(".sai-vtxt"); if (vt) vt.style.display = "none"; }
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
    if (m.opOrder || m.opBook) renderOpCard(bubble, m);
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
        if (!m || (!m.text && !m.media) || o2.seen.indexOf(m.id) >= 0) return;
        o2.seen.push(m.id); o2.seen = o2.seen.slice(-50);
        o2.since = Math.max(o2.since || 0, m.ts || 0);
        var fm = fbMatch(m);
        if (fm) {
          // уже показан мгновенно (Firebase) — только привязываем id скрипта
          fm.opId = m.id;
          var fq = m.q ? msgBy(m.q, "user") : null;
          if (fq && !fm.reply) fm.reply = { mt: fq.time, who: "Вы", text: mediaLabel(fq) };
          seventAiSaveHistory(); refreshMsg(fm);
          o2.unseen = (o2.unseen || []).concat([m.id]).slice(-20);
          return;
        }
        o2.human = Date.now(); o2.until = Date.now() + OP_TTL; got++;
        if (opWaiting) { opWaiting = null; clearTimeout(opWaitTimer); W._aiBusy = false; }
        typing(false); headTyping(false);
        setTicks(3, 0, 1);
        var md = m.media, mv = md && md.fid ? { kind: md.k === "vn" ? "vn" : md.k === "img" ? "img" : "voice", id: "op_" + m.id, fid: String(md.fid), dur: Number(md.dur) || 0, a: 0 } : null;
        if (mv && md.st) mv.st = 1;
        if (mv && m.text) mv.cap = 1;
        // кнопка от администратора (/бронь, /меню…) — только из безопасного списка
        var oacts = (m.acts || []).filter(function (c) { return c && (/^(book|menu|cart|news|vacancy)$/.test(c.a) || /^cat:[^<>]{1,60}$/.test(c.a)) && c.label; }).slice(0, 3).map(function (c) { return { a: c.a, label: String(c.label).slice(0, 50) }; });
        // /маргарита, /пицца — карточки блюд из меню на сайте (цена и фото — свежие, для филиала гостя)
        var ocards = (m.dishes || []).slice(0, 10).map(function (d) {
          var it = d && findById(d.id);
          if (!it) return d && d.id ? { id: String(d.id), name: String(d.name || ""), price: "" } : null;
          return { id: String(it.id), name: it.name, price: it.stopped ? "Закончилось" : (Number(it.price) || 0).toLocaleString("ru") + " ₸", photo: it.photo || "", desc: String(it.desc || "").slice(0, 90), b: curBranch() || "" };
        }).filter(function (c) { return c; });
        seventAiAppendMessage("ai", String(m.text || (mv ? (mv.kind === "img" ? (mv.st ? "Стикер" : "📷 Фото") : mv.kind === "vn" ? "Видеосообщение" : "🎤 Голосовое сообщение") : "")), oacts.length ? oacts : null, ocards.length ? ocards : null, mv);
        var nm = seventAiHistory[seventAiHistory.length - 1];
        if (nm && nm.role === "ai") {
          nm.opId = m.id;
          if (m.lid) nm.lid = String(m.lid);
          if (m.opOrder && m.opOrder.items) nm.opOrder = cleanOrder(m.opOrder);
          if (m.opBook && m.opBook.y) nm.opBook = cleanBook(m.opBook);
          var qm = m.q ? msgBy(m.q, "user") : null;
          if (qm) nm.reply = { mt: qm.time, who: "Вы", text: mediaLabel(qm) };
          seventAiSaveHistory(); refreshMsg(nm);
        }
        o2.unseen = (o2.unseen || []).concat([m.id]).slice(-20);
        log(o2.q || "(продолжение разговора)", { text: String(m.text || (mv ? "[" + mediaLabel(nm || { voice: mv }) + "]" : "")), known: 1, intent: "operator" }, null, "Оператор");
        if (!chatVisible()) toast("SEVEN AI ответила в «Сообщениях»");
        if (!chatVisible() || D.visibilityState === "hidden") { lsSet("sai_unread", String(Number(lsGet("sai_unread") || 0) + 1)); safe(function () { navigator.vibrate && navigator.vibrate([60, 40, 60]); }); safe(function () { W._saiUnreadPaint && W._saiUnreadPaint(); }); }
      });
      if (e && e.read && e.read > (o2.readSeen || 0)) { o2.readSeen = e.read; setTicks(3, 0, 2); if (awaitingReply()) headTyping(true); }
      opSet(o2);
      ackSeen();
      if (got) fbSeenNow();
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

  // ── мгновенный канал (Firebase Realtime Database): текст, «печатает», галочки и блок — за доли секунды.
  // Скрипт Google остаётся как был (Telegram, история, голосовые, фото) и страхует: нет Firebase — всё идёт через него.
  var FB = W._saiFB || { key: "AIzaSyD3101vOHEOxSVJM1cVADAr781geVbt8OY", db: "https://seven-ai-50995-default-rtdb.europe-west1.firebasedatabase.app", auth: "https://identitytoolkit.googleapis.com", sec: "https://securetoken.googleapis.com", ns: "" };
  var fb = { tok: "", exp: 0, uid: "", ready: null, es: null, st: null, known: {}, t0: 0, idle: 0, blk: false, off: false };
  function fbUrl(path, q) { return FB.db + "/" + path + ".json?" + (FB.ns ? "ns=" + FB.ns + "&" : "") + "auth=" + encodeURIComponent(fb.tok) + (q ? "&" + q : ""); }
  function fbJson(r) { if (!r.ok) throw new Error("fb " + r.status); return r.json(); }
  // вход — строго один раз, даже если его попросили несколько раз подряд (иначе два аккаунта на один телефон)
  function fbAuth() {
    if (fb.tok && Date.now() < fb.exp - 120e3) return Promise.resolve(fb.tok);
    if (fb.authP) return fb.authP;
    fb.authP = fbAuth1();
    fb.authP.then(function () { fb.authP = null; }, function () { fb.authP = null; });
    return fb.authP;
  }
  function fbAuth1() {
    var rt = lsGet("sai_fb_rt");
    var p = rt ? fetch(FB.sec + "/v1/token?key=" + FB.key, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(rt) })
      .then(fbJson).then(function (j) { return { t: j.id_token, r: j.refresh_token, u: j.user_id, e: j.expires_in }; }) : Promise.reject();
    return p.catch(function () {
      return fetch(FB.auth + "/v1/accounts:signUp?key=" + FB.key, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }) })
        .then(fbJson).then(function (j) { return { t: j.idToken, r: j.refreshToken, u: j.localId, e: j.expiresIn }; });
    }).then(function (a) {
      if (!a.t) throw new Error("fb auth");
      fb.tok = a.t; fb.uid = a.u; fb.exp = Date.now() + (Number(a.e) || 3600) * 1000; lsSet("sai_fb_rt", a.r);
      return fb.tok;
    });
  }
  // вход + «этот чат мой» (ID телефона закрепляется за этим браузером)
  function fbReady() {
    if (fb.off || typeof fetch === "undefined") return Promise.reject(new Error("off"));
    // «чат мой» проверяем один раз; дальше только свежий пропуск
    if (fb.ready) return fb.ready.then(function () { return fbAuth(); });
    var cid = getClientId();
    fb.ready = fbAuth().then(function () {
      if (lsGet("sai_fb_own") === fb.uid + "|" + cid) return true;
      return fetch(fbUrl("own/" + cid), { method: "PUT", body: JSON.stringify(fb.uid) }).then(function (r) {
        if (r.status === 401 || r.status === 403) { fb.off = true; throw new Error("not mine"); } // чат закреплён за другим браузером — только через скрипт
        if (!r.ok) throw new Error("fb own");
        lsSet("sai_fb_own", fb.uid + "|" + cid); return true;
      });
    });
    fb.ready.catch(function () { fb.ready = null; });
    return fb.ready;
  }
  // сообщение гостя — оператору в панель сразу (скрипт получает его параллельно, как раньше)
  function fbSend(it) {
    return fbReady().then(function () {
      var d = { c: getClientId(), t: String(it.t || "").slice(0, 2000), mt: Number(it.mt) || 0, ts: { ".sv": "timestamp" } };
      if (it.k) d.k = it.k;
      if (it.dur) d.dur = Math.round(Number(it.dur) || 0);
      var nm = guestName(); if (nm) d.nm = String(nm).slice(0, 40);
      return fetch(fbUrl("in"), { method: "POST", body: JSON.stringify(d) }).then(fbJson);
    }).then(function () { if (it.mt) setTicks(2, it.mt); if (fb.es && fb.es.close) fbIdle(); else fbListen(); return true; }, function () { return false; });
  }
  // «гость прочитал» и «гость печатает» — администратору в панель мгновенно (не чаще раза в 2–3 с)
  var fbPingAt = {};
  function fbPing(kind) {
    if (fb.off || isLocked() || Date.now() - (fbPingAt[kind] || 0) < (kind === "ty" ? 3000 : 2000)) return;
    if (lsGet("sai_chatted") !== "1") return;
    fbPingAt[kind] = Date.now();
    fbReady().then(function () {
      return fetch(fbUrl("in"), { method: "POST", body: JSON.stringify({ c: getClientId(), t: "", mt: 0, k: kind, ts: { ".sv": "timestamp" } }) });
    }).catch(function () {});
  }
  function fbSeenNow() {
    if (!chatVisible() || D.visibilityState === "hidden") return;
    var last = seventAiHistory[seventAiHistory.length - 1];
    if (last && last.role === "ai" && (last.lid || last.opId)) fbPing("seen");
  }
  W._saiFbSeen = fbSeenNow;
  // ответы, «печатает», прочитано и блок — одним потоком, пока чат открыт
  function fbListen() {
    if (fb.es || fb.off || !W.EventSource || !chatVisible() || D.visibilityState === "hidden") return;
    if (lsGet("sai_chatted") !== "1" && !seventAiHistory.some(function (m) { return m.role === "user"; })) return;
    fb.es = { pending: 1 };
    fbReady().then(function () {
      if (!fb.es || !fb.es.pending) return;
      var es = new EventSource(fbUrl("g/" + getClientId()));
      fb.es = es; fb.st = null; fb.t0 = Date.now(); fbIdle();
      es.addEventListener("put", function (e) { fbEv(e, false); });
      es.addEventListener("patch", function (e) { fbEv(e, true); });
      es.addEventListener("auth_revoked", function () { fbClose(); fb.tok = ""; setTimeout(fbListen, 300); });
      es.addEventListener("cancel", function () { fbClose(); });
      es.onerror = function () { if (es.readyState === 2) { fbClose(); setTimeout(fbListen, 3000); } };
    }, function () { fb.es = null; });
  }
  // гость тапнул в поле — заранее входим в Firebase, чтобы и первое сообщение ушло мгновенно
  function fbWarm() { if (!fb.off && !fb.tok && !fb.ready && chatVisible() && !isLocked()) fbReady().catch(function () {}); }
  function fbClose() { var es = fb.es; fb.es = null; clearTimeout(fb.idle); if (es && es.close) es.close(); }
  // 5 минут тишины в открытом чате — отключаемся (ответ всё равно придёт через скрипт)
  function fbIdle() { clearTimeout(fb.idle); fb.idle = setTimeout(fbClose, 5 * 60e3); }
  W._saiFbClose = fbClose;
  function fbEv(e, patch) {
    var d = safe(function () { return JSON.parse(e.data); }, null);
    if (!d) return;
    var first = fb.st === null, parts = String(d.path || "/").split("/").filter(Boolean);
    if (first) fb.st = {};
    if (!parts.length) {
      if (patch) { for (var k in d.data || {}) fb.st[k] = d.data[k]; } else fb.st = d.data || {};
    } else {
      var node = fb.st;
      for (var i = 0; i < parts.length - 1; i++) { if (!node[parts[i]] || typeof node[parts[i]] !== "object") node[parts[i]] = {}; node = node[parts[i]]; }
      var last = parts[parts.length - 1];
      if (patch) { if (!node[last] || typeof node[last] !== "object") node[last] = {}; for (var k2 in d.data || {}) node[last][k2] = d.data[k2]; }
      else if (d.data === null) delete node[last]; else node[last] = d.data;
    }
    fbApply(first && !parts.length, parts[0] || "");
  }
  function fbApply(initial, what) {
    var s = fb.st || {};
    // блок: нажал в панели — у гостя замок сразу
    if (s.blk && !fb.blk) { fb.blk = true; lockChat(true, true); }
    else if (!s.blk && fb.blk) { fb.blk = false; lockChat(false); }
    // ответы: при подключении — только свежие (5 мин), которых ещё нет в переписке (метка lid)
    Object.keys(s.r || {}).sort(function (a, b) { return ((s.r[a] || {}).ts || 0) - ((s.r[b] || {}).ts || 0); }).forEach(function (k) {
      if (fb.known[k]) return;
      fb.known[k] = 1;
      var it = s.r[k];
      if (!it || !it.t || fbHas(it.lid)) return;
      if (initial && !(Number(it.ts) > Date.now() - 5 * 60e3)) return;
      fbShow(it);
    });
    if (initial) return;
    if (what === "ty") { if (s.ty) { headTyping(true); clearTimeout(fb.tyT); fb.tyT = setTimeout(function () { headTyping(false); }, 6000); } else headTyping(false); }
    if (what === "rd" && s.rd) setTicks(3, 0, 2);
  }
  function fbHas(lid) { return !!lid && seventAiHistory.some(function (m) { return m.role === "ai" && m.lid === lid; }); }
  function fbShow(it) {
    var o2 = opGet(); o2.human = Date.now(); o2.until = Math.max(o2.until || 0, Date.now() + OP_TTL); opSet(o2);
    if (opWaiting) { opWaiting = null; clearTimeout(opWaitTimer); W._aiBusy = false; }
    typing(false); headTyping(false); clearTimeout(fb.tyT);
    setTicks(3, 0, 1);
    seventAiAppendMessage("ai", String(it.t).slice(0, 3000));
    var nm = seventAiHistory[seventAiHistory.length - 1];
    if (nm && nm.role === "ai") {
      nm.lid = String(it.lid || "");
      var qm = it.q ? msgBy(it.q, "user") : null;
      if (qm) nm.reply = { mt: qm.time, who: "Вы", text: mediaLabel(qm) };
      seventAiSaveHistory(); refreshMsg(nm);
    }
    fbIdle();
    fbSeenNow();
    if (!chatVisible() || D.visibilityState === "hidden") { lsSet("sai_unread", String(Number(lsGet("sai_unread") || 0) + 1)); safe(function () { navigator.vibrate && navigator.vibrate([60, 40, 60]); }); safe(function () { W._saiUnreadPaint && W._saiUnreadPaint(); }); }
    opSchedule(150); // скрипт подтянет тот же ответ с его id (реакции, «увидел») — без дубля
  }
  // ответ пришёл и через скрипт — это тот же, что уже показан мгновенно
  function fbMatch(m) {
    if (!m || m.media || (m.acts && m.acts.length) || (m.dishes && m.dishes.length)) return null;
    var hit = null;
    seventAiHistory.forEach(function (x) {
      if (hit || x.role !== "ai" || !x.lid || x.opId) return;
      if ((m.lid && x.lid === m.lid) || (!m.lid && String(x.text) === String(m.text || ""))) hit = x;
    });
    return hit;
  }
  D.addEventListener("visibilitychange", function () { if (D.visibilityState === "hidden") fbClose(); else if (chatVisible()) { fbListen(); fbSeenNow(); } });

  W._saiSend = function (voice, audio) {
    var inp = el("seventAiInput");
    if (!inp || W._aiBusy || isLocked()) return;
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
    toast(code === "kz" ? "Қазақ тілі таңдалды" : "Выбран русский язык");
    xhrJson("POST", API, { action: "opLang", clientId: getClientId(), name: guestName(), lang: code }, 15e3, function () {});
    ev("SEVEN AI: язык", code === "kz" ? "Қазақша" : "Русский");
  }
  safe(function () { var lg = langGet(); if (lg) W._saiLang = lg; });

  // ── Настройки SEVEN AI: тема чата (обои + цвет сообщений) и язык. Всё хранится на телефоне гостя.
  // Обои нарисованы кодом (градиенты и узоры SVG) — ничего не скачивается, открываются мгновенно.
  var DOODLE = function (fg) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="' + fg + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M14 22h16v10a8 8 0 0 1-16 0zM30 25h3a3 3 0 0 1 0 6h-3"/><path d="M18 17c0-2 2-2 2-4M24 17c0-2 2-2 2-4"/>' +
      '<path d="M70 14l22 8-18 20z"/><circle cx="78" cy="22" r="1.5"/><circle cx="84" cy="27" r="1.5"/>' +
      '<path d="M18 80c8-10 20-10 28 0M16 84h32M18 88h28"/><path d="M78 76a10 10 0 1 0 20 0 10 10 0 1 0-20 0M88 66v-4M96 70l3-3"/>' +
      '<path d="M52 52l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z"/><path d="M100 100q6-6 12 0M4 104q6-6 12 0"/></svg>';
    return "url(\"data:image/svg+xml," + encodeURIComponent(s) + "\")";
  };
  var WALLS = [
    { id: "none", n: "Без обоев", bg: "#ffffff" },
    { id: "cream", n: "Крем", bg: DOODLE("rgba(122,17,40,.10)") + " 0 0/120px 120px, #f6f0e6" },
    { id: "mint", n: "Мята", bg: DOODLE("rgba(0,90,60,.10)") + " 0 0/120px 120px, #e4f2ea" },
    { id: "sky", n: "Небо", bg: DOODLE("rgba(20,70,140,.10)") + " 0 0/120px 120px, #e3eef9" },
    { id: "lilac", n: "Лаванда", bg: DOODLE("rgba(80,40,140,.10)") + " 0 0/120px 120px, #ece6f6" },
    { id: "night", n: "Ночь", bg: DOODLE("rgba(255,255,255,.07)") + " 0 0/120px 120px, #15171b", dark: 1 },
    { id: "wine", n: "Бордо", bg: DOODLE("rgba(255,255,255,.08)") + " 0 0/120px 120px, #3a0a15", dark: 1 },
    { id: "dawn", n: "Рассвет", bg: "linear-gradient(165deg,#ffe2d1 0%,#ffd0dd 50%,#e8d6ff 100%)" },
    { id: "peach", n: "Персик", bg: "linear-gradient(165deg,#fff1dc 0%,#ffd8bf 100%)" },
    { id: "lagoon", n: "Лагуна", bg: "linear-gradient(165deg,#d5f5ee 0%,#cfe4ff 100%)" },
    { id: "rose", n: "Роза", bg: "radial-gradient(circle at 20% 15%,#ffd9e6 0,transparent 45%),radial-gradient(circle at 85% 80%,#ffe8cc 0,transparent 45%),#fff5f7" },
    { id: "aurora", n: "Сияние", bg: "radial-gradient(circle at 15% 20%,#c9f2e3 0,transparent 42%),radial-gradient(circle at 85% 30%,#d9d2ff 0,transparent 45%),radial-gradient(circle at 50% 90%,#ffe0ee 0,transparent 45%),#f7f7fb" },
    { id: "sand", n: "Песок", bg: "linear-gradient(180deg,#f4ecdf 0%,#e9dcc6 100%)" },
    { id: "ocean", n: "Океан", bg: "linear-gradient(165deg,#0f2b4a 0%,#1d4f7a 100%)", dark: 1 },
    { id: "forest", n: "Лес", bg: "linear-gradient(165deg,#12302a 0%,#285446 100%)", dark: 1 },
    { id: "violet", n: "Фиалка", bg: "linear-gradient(165deg,#2a1640 0%,#5a2f73 100%)", dark: 1 }
  ];
  var SOLIDS = ["#f2f2f7", "#e8f5e9", "#e3f2fd", "#fff8e1", "#fce4ec", "#ede7f6", "#e0f2f1", "#efebe9", "#1c1c1e", "#0b3d2e", "#102a43", "#3b1020"];
  // цвет своих сообщений (как «Значок чата» в WhatsApp): [фон, текст]
  var BUBBLES = [["#7a1128", "#fff"], ["#1f7a4d", "#fff"], ["#0a6e5c", "#fff"], ["#0b5cad", "#fff"], ["#1e3a8a", "#fff"], ["#5b3cc4", "#fff"],
    ["#8e44ad", "#fff"], ["#c2185b", "#fff"], ["#d9463b", "#fff"], ["#b8561c", "#fff"], ["#8d6e63", "#fff"], ["#5d4037", "#fff"],
    ["#2e7d32", "#fff"], ["#558b2f", "#fff"], ["#00838f", "#fff"], ["#0277bd", "#fff"], ["#455a64", "#fff"], ["#37474f", "#fff"],
    ["#b8860b", "#fff"], ["#f2c94c", "#1d1d1f"], ["#a5d6a7", "#1d1d1f"], ["#90caf9", "#1d1d1f"], ["#f8bbd0", "#1d1d1f"], ["#1d1d1f", "#fff"]];
  var TH_KEY = "sai_theme", TH_IMG = "sai_theme_img";
  function thGet() { return safe(function () { return JSON.parse(localStorage.getItem(TH_KEY) || "{}") || {}; }, {}); }
  function thSet(t) { safe(function () { localStorage.setItem(TH_KEY, JSON.stringify(t)); }); thApply(); }
  function thWall(t) {
    if (t.w === "img") { var im = lsGet(TH_IMG); return im ? { bg: "url(" + JSON.stringify(im) + ") center/cover no-repeat, #222", dark: 1, img: 1 } : WALLS[0]; }
    if (t.w && /^#[0-9a-f]{6}$/i.test(t.w)) return { bg: t.w, dark: SOLIDS.indexOf(t.w) >= 8 ? 1 : 0 };
    for (var i = 0; i < WALLS.length; i++) if (WALLS[i].id === t.w) return WALLS[i];
    return WALLS[0];
  }
  function thApply() {
    var box = el("seventAiMessages"), ov = el("seventAiOv"); if (!box || !ov) return;
    var ai = chatVisible() || (el("seventAiOvTitle") && el("seventAiOvTitle").textContent === "SEVEN AI");
    var sb = el("saiSetBtn"); if (sb) sb.style.display = ai ? "block" : "none";
    var t = thGet(), w = thWall(t), b = BUBBLES[Number(t.b) || 0] || BUBBLES[0], on = ai && (w.id !== "none" || t.b);
    box.style.background = ai && w.id !== "none" ? w.bg : "";
    box.style.backgroundAttachment = w.img ? "local" : "";
    ov.classList.toggle("sai-th", !!on);
    ov.classList.toggle("sai-th-wall", ai && w.id !== "none");
    ov.classList.toggle("sai-th-dark", ai && !!w.dark);
    ov.style.setProperty("--sai-me", b[0]); ov.style.setProperty("--sai-me-fg", b[1]);
  }
  W._saiThemeSync = thApply;
  // файл чата грузится в момент первого открытия — тему применяем сразу и ещё раз, когда окно дорисуется
  safe(thApply); setTimeout(function () { safe(thApply); }, 0); setTimeout(function () { safe(thApply); }, 300);
  function thThumb(bg, dark, me) {
    return '<span class="sai-tt" style="background:' + String(bg).replace(/"/g, "&quot;") + '"><i class="a' + (dark ? " d" : "") + '"></i><i class="b" style="background:' + me + '"></i><i class="a s' + (dark ? " d" : "") + '"></i></span>';
  }
  function thSheet() {
    var old = el("saiSet"); if (old) old.remove();
    var t = thGet(), me = (BUBBLES[Number(t.b) || 0] || BUBBLES[0])[0], lg = langGet();
    var ov = D.createElement("div"); ov.id = "saiSet"; ov.className = "sai-set-ov";
    var walls = WALLS.map(function (w) { return '<button type="button" class="sai-tw' + ((t.w || "none") === w.id ? " on" : "") + '" data-w="' + w.id + '">' + thThumb(w.bg, w.dark, me) + "<em>" + esc(w.n) + "</em></button>"; }).join("");
    var cols = BUBBLES.map(function (b, i) { return '<button type="button" class="sai-tc' + ((Number(t.b) || 0) === i ? " on" : "") + '" data-b="' + i + '" style="background:' + b[0] + '" aria-label="Цвет ' + (i + 1) + '"></button>'; }).join("");
    var sol = SOLIDS.map(function (c) { return '<button type="button" class="sai-tc sq' + (t.w === c ? " on" : "") + '" data-w="' + c + '" style="background:' + c + '"></button>'; }).join("");
    ov.innerHTML = '<div class="sai-set" role="dialog" aria-label="Настройки SEVEN AI"><div class="sai-set-h"><b>Настройки</b><button type="button" class="sai-set-x" aria-label="Закрыть">Готово</button></div>' +
      '<div class="sai-set-pv">' + thThumb(thWall(t).bg, thWall(t).dark, me).replace("sai-tt", "sai-tt big") + "</div>" +
      '<div class="sai-set-g">Обои</div><div class="sai-set-l">' +
      '<label class="sai-set-r"><span>🖼</span>Выбрать из фото<input type="file" accept="image/*" hidden></label>' +
      '<button type="button" class="sai-set-r" data-open="sol"><span>🎨</span>Установить цвет</button>' +
      '<div class="sai-sol" hidden>' + sol + "</div></div>" +
      '<div class="sai-tws">' + walls + "</div>" +
      '<div class="sai-set-g">Цвет ваших сообщений</div><div class="sai-tcs">' + cols + "</div>" +
      '<div class="sai-set-g">Язык общения</div><div class="sai-seg"><button type="button" data-l="ru"' + (lg !== "kz" ? ' class="on"' : "") + '>Русский</button><button type="button" data-l="kz"' + (lg === "kz" ? ' class="on"' : "") + ">Қазақша</button></div>" +
      '<button type="button" class="sai-set-reset">Сбросить тему</button></div>';
    D.body.appendChild(ov);
    function redraw() { var keep = ov.querySelector(".sai-set").scrollTop; thSheet(); var n = el("saiSet"); if (n) n.querySelector(".sai-set").scrollTop = keep; }
    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest(".sai-set-x")) return ov.remove();
      var w = e.target.closest("[data-w]"), b = e.target.closest("[data-b]"), l = e.target.closest("[data-l]");
      if (e.target.closest("[data-open]")) { var s = ov.querySelector(".sai-sol"); s.hidden = !s.hidden; return; }
      if (w) { var t1 = thGet(); t1.w = w.getAttribute("data-w"); thSet(t1); return redraw(); }
      if (b) { var t2 = thGet(); t2.b = Number(b.getAttribute("data-b")); thSet(t2); return redraw(); }
      if (l) { if (l.getAttribute("data-l") !== langGet()) setLang(l.getAttribute("data-l")); return redraw(); }
      if (e.target.closest(".sai-set-reset")) { safe(function () { localStorage.removeItem(TH_KEY); localStorage.removeItem(TH_IMG); }); thApply(); return redraw(); }
    });
    ov.querySelector('input[type="file"]').onchange = function () {
      var f = this.files && this.files[0]; if (!f) return;
      var url = URL.createObjectURL(f), im = new Image();
      im.onload = function () {
        // сжимаем до 900px — фото хранится на телефоне гостя, никуда не отправляется
        var k = Math.min(1, 900 / Math.max(im.width, im.height)), c = D.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        var q = 0.8, data = c.toDataURL("image/jpeg", q);
        while (data.length > 900000 && q > 0.4) { q -= 0.15; data = c.toDataURL("image/jpeg", q); }
        var ok = safe(function () { localStorage.setItem(TH_IMG, data); return true; }, false);
        if (!ok) return toast("Фото слишком большое — выберите другое");
        var t3 = thGet(); t3.w = "img"; thSet(t3); redraw();
      };
      im.onerror = function () { toast("Не получилось открыть фото"); };
      im.src = url;
    };
  }
  W._saiSettings = thSheet;

  // ── отправка заказа, собранного в чате
  function fail(msg) { toast(msg); return false; }
  // fromOp — заказ собрал администратор: часы работы он уже учёл, не блокируем
  function sendOrder(fromOp) {
    var f = W._saiState.flow;
    if (!f || f.t !== "order" || !f.d || !f.d.final) return fail("Этот заказ уже неактуален — давайте соберём заново.");
    var o = f.d.final;
    if (!cart.length) return fail("Корзина пустая — сначала добавим блюда. Что везём?");
    if (branch !== o.branch) return fail("Филиал поменялся — давайте проверим заказ ещё раз.");
    if (!fromOp && !canOrderNow(branch) && !isTestPhoneActive()) return fail(getOrderWindowText(branch) ? "Заказы сейчас не принимаем. Часы приёма: " + getOrderWindowText(branch) : "Заказы из этого филиала сейчас не принимаем");
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
    return true;
  }

  // ── отправка брони, собранной в чате
  function openWa(text) {
    var a = D.createElement("a");
    a.href = "https://wa.me/77760709898?text=" + encodeURIComponent(text); a.target = "_blank"; a.rel = "noopener noreferrer";
    D.body.appendChild(a); a.click(); a.remove();
  }
  function sendBooking(fromOp) {
    var f = W._saiState.flow;
    if (!f || f.t !== "book" || !f.d || !f.d.final) return fail("Эта бронь уже неактуальна — давайте оформим заново.");
    var b = f.d.final, p2 = function (n) { return String(n).padStart(2, "0"); };
    if (site.bkClosed()) return fail("Ресторан сейчас временно закрыт, бронь недоступна.");
    if (!fromOp && !bk_isBookingAllowedNow(b.bookId)) return fail("Заявки на бронь сейчас не принимаем — с 12:00. Загляните попозже.");
    if (bk_isDateBlocked(b.m, b.d, b.bookId)) return fail("В этот день ресторан не работает — выберите другую дату.");
    if (Date.UTC(b.y, b.m, b.d, b.h - 5, b.mi) - Date.now() < 36e5) return fail("Бронь — минимум за час до визита. Давайте выберем время попозже.");
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
    return true;
  }

  // ── стартовые кнопки и быстрые ответы без администратора
  function L(ru, kz) { return langGet() === "kz" ? kz : ru; }
  function starterChips() {
    return [{ a: "menu", label: L("Меню и цены", "Мәзір мен бағалар") }, { a: "info:dlv", label: L("Доставка", "Жеткізу") },
      { a: "book", label: L("Забронировать столик", "Үстел брондау") }, { a: "info:addr", label: L("Адреса и часы работы", "Мекенжай және жұмыс уақыты") }];
  }
  function infoAddr() {
    return safe(function () {
      var cfg = typeof BRANCH_STATUS_CONFIG !== "undefined" ? BRANCH_STATUS_CONFIG : {};
      return L("Наши рестораны в Уральске:", "Орал қаласындағы мейрамханаларымыз:") + "\n" + BRANCHES.map(function (b) { var h = cfg[b.id] && cfg[b.id].hours; return "• " + b.name + (h ? " — " + h.replace("-", "–") : ""); }).join("\n");
    }, L("Адреса ресторанов — во вкладке «Меню», вверху.", "Мекенжайлар — «Мәзір» бетінің жоғарғы жағында."));
  }
  function infoDlv() {
    var br = curBranch(), win = br ? safe(function () { return getOrderWindowText(br); }, "") : "";
    return L("Доставка и самовывоз: выберите блюда в меню, добавьте в корзину и оформите заказ — он придёт нам в WhatsApp, и мы подтвердим.", "Жеткізу және алып кету: мәзірден тағам таңдап, себетке салып, тапсырыс беріңіз — ол бізге WhatsApp-қа келеді, біз растаймыз.") +
      (win ? "\n" + L("Заказы принимаем ", "Тапсырыс қабылдау уақыты: ") + win + "." : "");
  }

  // ── заказ и бронь, собранные администратором: гость проверяет и жмёт одну кнопку → WhatsApp
  function str(v, n) { return String(v == null ? "" : v).slice(0, n || 80); }
  function cleanOrder(o) {
    return { items: (o.items || []).slice(0, 20).map(function (x) { return { id: str(x.id, 40), name: str(x.name), qty: Math.max(1, Math.min(99, Number(x.qty) || 1)) }; }),
      mode: o.mode === "self" ? "self" : "delivery", pay: o.pay === "cash" ? "cash" : "kaspi", cutlery: Math.max(0, Math.min(20, Number(o.cutlery) || 0)),
      note: str(o.note, 300), name: str(o.name, 40), phone: str(o.phone, 20), pickup: str(o.pickup, 40),
      street: str(o.street, 80), house: str(o.house, 12), entrance: str(o.entrance, 4), flat: str(o.flat, 8), floor: str(o.floor, 4),
      br: o.br === "samal" || o.br === "skoro" ? o.br : "" };
  }
  function cleanBook(b) {
    var n = function (v, lo, hi) { v = Number(v); return isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : lo; };
    return { y: n(b.y, 2024, 2100), m: n(b.m, 0, 11), d: n(b.d, 1, 31), h: n(b.h, 0, 23), mi: n(b.mi, 0, 59), guests: n(b.guests, 0, 30), br: [0, 1, 3].indexOf(Number(b.br)) >= 0 ? Number(b.br) : -1,
      name: str(b.name, 40), phone: str(b.phone, 20), comment: str(b.comment, 200) };
  }
  var MONG = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  var BK_IDS = { samal: 0, skoro: 1, abulhair: 3 };
  function money(v) { return (Number(v) || 0).toLocaleString("ru") + " ₸"; }
  function profile() { var a = safe(function () { return loadClientProfile(); }, null) || {}, b = safe(function () { return bk_loadProfile(); }, null) || {}; return { name: a.name || b.name || "", phone: a.phone || b.phone || "", street: a.street || "", house: a.house || "", entrance: a.entrance || "", flat: a.flat || "", floor: a.floor || "" }; }
  function inputEl(ph, val, type) { var i = D.createElement("input"); i.placeholder = ph; i.value = val || ""; if (type) i.type = type; return i; }
  function phoneOk(v) { var d = String(v || "").replace(/\D/g, ""); return d.length >= 10 && d.length <= 12; }
  function renderOpCard(bubble, m) {
    var box = bubble.firstChild;
    if (!box) return;
    var old = box.querySelector(".sai-opc");
    if (old) old.remove();
    var card = D.createElement("div");
    card.className = "sai-opc";
    card.onpointerdown = function (e) { e.stopPropagation(); };
    box.insertBefore(card, box.lastChild);
    if (m.opOrder) orderCard(card, m); else bookCard(card, m);
  }
  function sentBlock(card, txt, retry) {
    var ok = D.createElement("div"); ok.className = "ok"; ok.textContent = "✓ " + txt; card.appendChild(ok);
    if (retry) { var r = D.createElement("button"); r.type = "button"; r.className = "ed"; r.textContent = L("Открыть WhatsApp ещё раз", "WhatsApp-ты қайта ашу"); r.onclick = retry; card.appendChild(r); }
  }
  function orderCard(card, m) {
    var o = m.opOrder, pr = profile(), rows = [], miss = [], total = 0;
    o.items.forEach(function (x) {
      var it = findById(x.id);
      if (!it || it.stopped) { miss.push(x.name); return; }
      rows.push({ it: it, qty: x.qty }); total += (Number(it.price) || 0) * x.qty;
    });
    // филиал выбрал администратор — показываем его; иначе — филиал гостя на сайте
    var obr = o.br || curBranch();
    var h = '<h4>🧾 ' + esc(L(o.mode === "self" ? "Самовывоз" : "Доставка", o.mode === "self" ? "Алып кету" : "Жеткізу")) + (obr ? " · " + esc(safe(function () { return branchDisplayName(obr); }, "")) : "") + "</h4>";
    rows.forEach(function (r) { h += '<div class="r"><span>' + esc(ne(r.it.name)) + " ×" + r.qty + "</span><b>" + money(r.it.price * r.qty) + "</b></div>"; });
    h += '<div class="r tot"><span>' + L("Итого", "Барлығы") + "</span><b>" + money(total) + "</b></div>";
    if (o.mode === "self") h += '<div class="mt">' + L("Заберу: ", "Алып кетемін: ") + esc(o.pickup || L("время уточним", "уақытын нақтылаймыз")) + "</div>";
    h += '<div class="mt">' + L("Оплата: ", "Төлем: ") + (o.pay === "cash" ? L("наличные", "қолма-қол") : "Kaspi") + (o.note ? "<br>" + L("Пожелания: ", "Тілектер: ") + esc(o.note) : "") + "</div>";
    if (miss.length) h += '<div class="warn">' + L("Нет в вашем филиале сейчас: ", "Қазір филиалыңызда жоқ: ") + esc(miss.join(", ")) + "</div>";
    card.innerHTML = h;
    if (m.opOrder.sent) return sentBlock(card, L("Заказ отправлен в WhatsApp", "Тапсырыс WhatsApp-қа жіберілді"), function () { retryOpenWhatsapp(); });
    // что заполнил администратор — только для чтения; поля — лишь для того, что он оставил пустым
    var f = {}, fixed = D.createElement("div");
    fixed.className = "mt";
    var lines = [];
    if (o.mode !== "self") {
      if (o.street && o.house) lines.push(L("Адрес: ", "Мекенжай: ") + "ул. " + o.street + ", д. " + o.house + (o.entrance ? ", под. " + o.entrance : "") + (o.flat ? ", кв. " + o.flat : "") + (o.floor ? ", эт. " + o.floor : ""));
      else {
        f.street = inputEl(L("Улица", "Көше"), pr.street); f.house = inputEl(L("Дом", "Үй"), pr.house); f.flat = inputEl(L("Кв.", "Пәтер"), pr.flat);
        var two = D.createElement("div"); two.className = "two"; two.appendChild(f.house); two.appendChild(f.flat);
        var lab = D.createElement("div"); lab.className = "mt"; lab.textContent = L("Адрес доставки:", "Жеткізу мекенжайы:");
        card.appendChild(lab); card.appendChild(f.street); card.appendChild(two);
      }
    }
    if (o.name) lines.push(L("Имя: ", "Аты: ") + o.name);
    if (o.phone) lines.push(L("Телефон: ", "Телефон: ") + o.phone);
    if (lines.length) { fixed.textContent = lines.join("\n"); fixed.style.whiteSpace = "pre-line"; card.appendChild(fixed); }
    if (!o.name) f.name = inputEl(L("Ваше имя", "Атыңыз"), pr.name);
    if (!o.phone) f.phone = inputEl(L("Телефон", "Телефон"), pr.phone, "tel");
    if (f.name || f.phone) { var two2 = D.createElement("div"); two2.className = "two"; if (f.name) two2.appendChild(f.name); if (f.phone) two2.appendChild(f.phone); card.appendChild(two2); }
    var go = D.createElement("button"); go.type = "button"; go.className = "go"; go.textContent = L("Подтвердить и отправить в WhatsApp", "Растау және WhatsApp-қа жіберу");
    go.disabled = !rows.length;
    go.onclick = function () {
      // заказ в филиал, который выбрал администратор: переключаем сайт гостя на него
      if (o.br && curBranch() !== o.br) safe(function () { branch = o.br; });
      if (!curBranch()) { toast(L("Сначала выберите филиал", "Алдымен филиалды таңдаңыз")); safe(function () { seventAiClose(); switchBottomTab("home"); showBranchModal(); }); return; }
      var v = function (k) { return f[k] ? f[k].value.trim() : String(o[k] || ""); };
      if (v("name").length < 2) return toast(L("Впишите имя", "Атыңызды жазыңыз"));
      if (!phoneOk(v("phone"))) return toast(L("Впишите телефон", "Телефонды жазыңыз"));
      if (o.mode !== "self" && (!v("street") || !v("house"))) return toast(L("Впишите улицу и дом", "Көше мен үйді жазыңыз"));
      cart.splice(0, cart.length);
      rows.forEach(function (r) { cart.push({ id: r.it.id, name: r.it.name, price: r.it.price, qty: r.qty }); });
      safe(function () { saveCartToStorage(); updBadge(); });
      var pk = o.pickup && /^\d{1,2}[:.]\d{2}$/.test(o.pickup) ? "к " + o.pickup.replace(".", ":") : o.pickup;
      W._saiState.flow = { t: "order", d: { final: { branch: curBranch(), mode: o.mode === "self" ? "self" : "delivery", name: v("name"), phone: v("phone"),
        street: v("street"), house: v("house"), flat: v("flat"), entrance: o.entrance || pr.entrance, floor: o.floor || pr.floor, pay: o.pay, pickup: pk, cutlery: o.cutlery || 1, note: o.note } } };
      sendOrder(true);
      if (!cart.length) {
        m.opOrder.sent = Date.now(); seventAiSaveHistory(); refreshMsg(m);
        opNote("✅ Гость подтвердил заказ и отправил его в WhatsApp");
      }
    };
    card.appendChild(go);
  }
  function bookCard(card, m) {
    var b = m.opBook, pr = profile(), wd = new Date(Date.UTC(b.y, b.m, b.d)).getUTCDay(), WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
    var h = "<h4>📅 " + L("Бронь столика", "Үстел брондау") + "</h4>" +
      '<div class="r"><span>' + L("Дата", "Күні") + "</span><b>" + b.d + " " + MONG[b.m] + " (" + WD[wd] + ")</b></div>" +
      '<div class="r"><span>' + L("Время", "Уақыты") + "</span><b>" + String(b.h).padStart(2, "0") + ":" + String(b.mi).padStart(2, "0") + "</b></div>" +
      (b.comment ? '<div class="mt">' + L("Комментарий: ", "Пікір: ") + esc(b.comment) + "</div>" : "");
    card.innerHTML = h;
    if (b.sent) return sentBlock(card, L("Заявка на бронь отправлена в WhatsApp", "Брондау өтінімі WhatsApp-қа жіберілді"), function () { if (lastBookMsg) openWa(lastBookMsg); });
    // заполненное администратором — только для чтения
    var br = b.br >= 0 ? b.br : (BK_IDS[curBranch()] !== undefined ? BK_IDS[curBranch()] : 0), sel = null, gs = null, fn = null, fp = null, rows2 = "";
    if (b.br >= 0) rows2 += '<div class="r"><span>' + L("Филиал", "Филиал") + "</span><b>" + esc(safe(function () { return bk_bookingWindow(b.br).name; }, "")) + "</b></div>";
    if (b.guests) rows2 += '<div class="r"><span>' + L("Гостей", "Қонақ саны") + "</span><b>" + b.guests + "</b></div>";
    if (b.name) rows2 += '<div class="r"><span>' + L("Имя", "Аты") + "</span><b>" + esc(b.name) + "</b></div>";
    if (b.phone) rows2 += '<div class="r"><span>' + L("Телефон", "Телефон") + "</span><b>" + esc(b.phone) + "</b></div>";
    if (rows2) { var fx = D.createElement("div"); fx.innerHTML = rows2; card.appendChild(fx); }
    var two0 = D.createElement("div"); two0.className = "two";
    if (b.br < 0) { sel = D.createElement("select"); [0, 1, 3].forEach(function (id) { var op = D.createElement("option"); op.value = id; op.textContent = safe(function () { return bk_bookingWindow(id).name; }, String(id)); if (id === br) op.selected = true; sel.appendChild(op); }); two0.appendChild(sel); }
    if (!b.guests) { gs = D.createElement("select"); for (var i = 1; i <= 10; i++) { var og = D.createElement("option"); og.value = i; og.textContent = L("Гостей: ", "Қонақ саны: ") + i + (i === 10 ? "+" : ""); if (i === 2) og.selected = true; gs.appendChild(og); } two0.appendChild(gs); }
    if (two0.children.length) card.appendChild(two0);
    if (!b.name) fn = inputEl(L("Ваше имя", "Атыңыз"), pr.name);
    if (!b.phone) fp = inputEl(L("Телефон", "Телефон"), pr.phone, "tel");
    if (fn || fp) { var two = D.createElement("div"); two.className = "two"; if (fn) two.appendChild(fn); if (fp) two.appendChild(fp); card.appendChild(two); }
    var ck = D.createElement("label"); ck.className = "ck";
    ck.innerHTML = '<input type="checkbox"><span>' + L("Согласен с ", "Келісемін: ") + '<a href="#">' + L("условиями бронирования", "брондау шарттары") + "</a>" + L(" (столик держим 20 мин, предоплата 2000 ₸ не возвращается при неявке)", " (үстел 20 мин ұсталады, келмесеңіз 2000 ₸ алдын ала төлем қайтарылмайды)") + "</span>";
    ck.querySelector("a").onclick = function (e) { e.preventDefault(); W._saiAct("link:book"); };
    card.appendChild(ck);
    var go = D.createElement("button"); go.type = "button"; go.className = "go"; go.textContent = L("Подтвердить и отправить в WhatsApp", "Растау және WhatsApp-қа жіберу");
    go.onclick = function () {
      var nmv = fn ? fn.value.trim() : b.name, phv = fp ? fp.value.trim() : b.phone;
      if (nmv.length < 2) return toast(L("Впишите имя", "Атыңызды жазыңыз"));
      if (!phoneOk(phv)) return toast(L("Впишите телефон", "Телефонды жазыңыз"));
      if (!ck.querySelector("input").checked) return toast(L("Отметьте согласие с условиями", "Шарттармен келісуді белгілеңіз"));
      var id = sel ? Number(sel.value) : b.br, g = gs ? Number(gs.value) : b.guests, before = lastBookMsg;
      W._saiState.flow = { t: "book", d: { final: { bookId: id, branchName: safe(function () { return bk_bookingWindow(id).name; }, ""), y: b.y, m: b.m, d: b.d, h: b.h, mi: b.mi,
        guests: g, guestsExact: g, comment: b.comment || "", name: nmv, phone: phv } } };
      sendBooking(true);
      if (lastBookMsg && lastBookMsg !== before) {
        b.sent = Date.now(); seventAiSaveHistory(); refreshMsg(m);
        opNote("✅ Гость подтвердил бронь и отправил её в WhatsApp");
      }
    };
    card.appendChild(go);
  }
  // тихая пометка администратору (в Telegram и в панель), гостю в чат не пишем
  function opNote(t) { xhrJson("POST", API, { action: "jivoSend", clientId: getClientId(), name: guestName(), text: t }, 20e3, function () {}); }

  // ── кнопки под сообщениями
  W._saiAct = function (a, label) {
    a = String(a || "");
    if (a.indexOf("ask:") === 0) { var inp = el("seventAiInput"); inp.value = a.slice(4); return seventAiSend(); }
    if (a === "wa") return;
    if (a === "lang:kz" || a === "lang:ru") return setLang(a.slice(5));
    ev("SEVEN AI: кнопка", String(label || a));
    if (a === "order:send") return sendOrder();
    if (a === "info:addr") return seventAiAppendMessage("ai", infoAddr(), [{ a: "book", label: L("Забронировать столик", "Үстел брондау") }, { a: "menu", label: L("Меню", "Мәзір") }]);
    if (a === "info:dlv") return seventAiAppendMessage("ai", infoDlv(), [{ a: "menu", label: L("Открыть меню", "Мәзірді ашу") }]);
    if (a === "book:send") return sendBooking();
    if (a === "link:order") return void W.open("https://taplink.cc/seventimes/p/1153436/", "_blank", "noopener");
    if (a === "link:book") { termsOpened = true; return void W.open("https://taplink.cc/seventimes/p/1154a9f/", "_blank", "noopener"); }
    if (a === "retrywa") return retryOpenWhatsapp();
    if (a === "retrybook") { if (lastBookMsg) openWa(lastBookMsg); return; }
    if (a.indexOf("dish:") === 0) return openCard({ id: a.slice(5) });
    if (a.indexOf("cat:") === 0) {
      var i = Object.keys(menuNow()).indexOf(a.slice(4));
      seventAiClose();
      // сайт разделён на страницы: из «Сообщений» — сразу в меню на эту категорию
      if (W.PAGE && W.PAGE !== "menu" && W.goPage) return W.goPage("./?cat=" + (i >= 0 ? i : 0));
      switchBottomTab("home");
      if (i >= 0) setTimeout(function () { scrollToSec(i); }, 80);
      return;
    }
    seventAiClose();
    if (a === "menu") switchBottomTab("home");
    else if (a === "book") bookBtnClick();
    else if (a === "news") switchBottomTab("news");
    else if (a === "vacancy") switchBottomTab("vacancy");
    else if (a === "cart") { if (!(W.PAGE && W.PAGE !== "menu")) switchBottomTab("home"); openCart(); }
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
    rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = true;
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
      // пауза в речи — телефон перестаёт «слушать», но запись звука идёт дальше:
      // голосовое заканчивает только сам гость (отправить / отменить), хоть через час
      if (!s.stopping && s.alive && s.useMr && s.err !== "not-allowed" && s.err !== "service-not-allowed") {
        s.restarts = (s.restarts || 0) + 1;
        if (s.restarts < 400) setTimeout(function () { if (!s.stopping && s.alive && vs === s) { try { rec.start(); s.recEnded = false; } catch (re) {} } }, 150);
        return;
      }
      if (!s.mr || s.mr.state === "inactive") return finish(s);
      safe(function () { s.mr.stop(); });
      s.guard = setTimeout(function () { finish(s); }, 1500);
    };
    }
    // звук пишем всегда, когда телефон это умеет — голосовое уйдёт тебе в бот
    s.useMr = canRec;
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
        s.useMr = false;
        if (!rec) { s.err = "not-allowed"; finish(s); }
        else if (s.recEnded) finish(s);
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
  // ── блокировка: чат закрыт целиком (ни текста, ни фото, ни голоса). Гостю — от имени SEVEN AI, не от человека
  var LOCK_TXT = "SEVEN AI автоматически ограничил доступ к чату: система обнаружила нарушение правил общения.";
  function isLocked() { return lsGet("sai_blocked") === "1"; }
  function lockBar() {
    var b = el("saiLockBar"), row = el("seventAiInputRow");
    if (!b && row && row.parentNode) {
      b = D.createElement("div"); b.id = "saiLockBar"; b.className = "sai-lockbar";
      b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><span></span>';
      b.lastChild.textContent = LOCK_TXT;
      row.parentNode.insertBefore(b, row.nextSibling);
    }
    return b;
  }
  function lockChat(on, say) {
    var was = isLocked();
    lsSet("sai_blocked", on ? "1" : "");
    if (on && say && !was) seventAiAppendMessage("ai", LOCK_TXT);
    if (on) { safe(function () { if (recOn) stopRec(true); closeCam(); }); var i = el("seventAiInput"); if (i) { i.value = ""; i.blur(); } }
    syncRow();
  }
  W._saiLock = lockChat;
  // при открытии чата — сверяемся с сервером: заблокирован / разблокирован
  var lockAt = 0;
  function lockCheck() {
    if (Date.now() - lockAt < 15e3) return;
    lockAt = Date.now();
    var body = { action: "opCtx", clientId: typeof getClientId === "function" ? getClientId() : "", ev: [] }, gc = guestCtx();
    if (!body.clientId) return;
    if (gc) body.ctx = gc;
    xhrJson("POST", API, body, 15e3, function (e) { if (e && typeof e === "object") lockChat(!!e.blocked, true); });
  }
  W._saiLockCheck = lockCheck;
  function syncRow() {
    var row0 = el("seventAiInputRow"), lk = chatVisible() && isLocked(), lb = lockBar();
    if (row0) row0.classList.toggle("sai-locked", lk);
    if (lb) lb.classList.toggle("on", lk);
    var inp = el("seventAiInput"), send = el("seventAiSendBtn"), mic = el("saiMic"), cam = el("saiCamBtn"), ph = el("saiPlus");
    if (ph) ph.style.display = chatVisible() && inp && !inp.disabled ? "" : "none";
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
    // «+» слева: фото и кружочек в одном месте (справа — только микрофон / отправить)
    if (!el("saiPlus")) {
      var pl = D.createElement("button"), pf = D.createElement("input");
      pl.type = "button"; pl.id = "saiPlus"; pl.className = "sai-plus"; pl.setAttribute("aria-label", "Отправить фото");
      pl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
      pf.type = "file"; pf.accept = "image/*"; pf.id = "saiPhotoIn"; pf.style.display = "none";
      pf.onchange = function () { var f = pf.files && pf.files[0]; pf.value = ""; if (f) pickPhoto(f); };
      // «+» — сразу системный выбор айфона/андроида: галерея или камера
      pl.onclick = function (e) { e.stopPropagation(); pf.click(); };
      row.insertBefore(pl, row.firstChild); row.appendChild(pf);
    }
    // кружочек — рядом с микрофоном, как раньше
    if (!el("saiCamBtn")) {
      var c = D.createElement("button");
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
    if (inp && !inp._saiRow) { inp._saiRow = true; inp.addEventListener("input", syncRow); inp.addEventListener("focus", fbWarm); inp.addEventListener("input", fbWarm); inp.addEventListener("input", function () { if (inp.value.trim() && chatVisible()) fbPing("ty"); }); }
    syncRow();
  }
  function plusMenu(btn, pf) {
    var old = el("saiPlusMenu");
    if (old) { old.remove(); return; }
    var mn = D.createElement("div"), r = btn.getBoundingClientRect();
    mn.id = "saiPlusMenu"; mn.className = "sai-pmenu";
    mn.innerHTML = '<button type="button" data-a="photo"><span style="background:#34c759"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m21 16-5-5-9 9"/></svg></span>Фото</button>' +
      (camOk() ? '<button type="button" data-a="vn"><span style="background:#7a1128">' + CAM.replace(/currentColor/g, "#fff").replace(/width="\d+" height="\d+"/, 'width="18" height="18"') + "</span>Кружочек</button>" : "");
    D.body.appendChild(mn);
    mn.style.left = Math.max(8, r.left) + "px"; mn.style.bottom = (innerHeight - r.top + 8) + "px";
    mn.onclick = function (e) { var a = e.target.closest("[data-a]"); mn.remove(); if (!a) return; if (a.getAttribute("data-a") === "photo") pf.click(); else openCam(); };
    setTimeout(function () { D.addEventListener("click", function cl(e) { if (!mn.contains(e.target)) { mn.remove(); D.removeEventListener("click", cl); } }); }, 0);
  }
  // ── фото от гостя: сжимаем до 1600px и отправляем, как голосовое (администратору в Telegram)
  function pickPhoto(file) {
    if (!/^image\//.test(file.type || "image/")) return toast("Это не фото");
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var k = Math.min(1, 1600 / Math.max(im.naturalWidth || 1, im.naturalHeight || 1)), cv = D.createElement("canvas");
      cv.width = Math.max(1, Math.round(im.naturalWidth * k)); cv.height = Math.max(1, Math.round(im.naturalHeight * k));
      cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(function (blob) {
        if (!blob) return toast("Не получилось обработать фото");
        if (blob.size > 5e6) return toast("Фото слишком большое");
        var id = "ph" + Date.now(), inp = el("seventAiInput"), cap = inp ? inp.value.trim().slice(0, 500) : "";
        idbPut(id, blob).then(function () {
          if (!inp) return;
          inp.value = cap || "📷 Фото";
          W._saiSend({ kind: "img", id: id, a: 1, dur: 1, cap: cap ? 1 : 0 }, { blob: blob, mime: "image/jpeg", photo: 1, dur: 0 });
        });
      }, "image/jpeg", 0.82);
    };
    im.onerror = function () { URL.revokeObjectURL(url); toast("Не получилось открыть фото"); };
    im.src = url;
  }

  // чат новостей открывается в том же окне — там кнопок записи нет
  var openChat = W.seventAiOpen;
  if (openChat) W.seventAiOpen = function () { var r = openChat.apply(this, arguments); syncRow(); thApply(); if (chatVisible()) { lockCheck(); fbListen(); setTimeout(fbSeenNow, 300); } return r; };

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
  // фото/стикер в переписке; файлы администратора из Telegram скачиваем один раз и храним у гостя
  var vnDecor = W._saiVoiceDecor;
  W._saiVoiceDecor = function (bubble, v) {
    if (v && v.fid && !v.a) setTimeout(function () { opMediaLoad(v); }, 0);
    if (!v || v.kind !== "img") return vnDecor(bubble, v);
    var box = bubble.firstChild, txt = box && box.firstChild;
    if (!box) return;
    box.classList.add(v.st ? "sai-stbox" : "sai-imgbox");
    if (txt) txt.classList.add("sai-vtxt");
    var w = D.createElement("div");
    w.className = "sai-img" + (v.st ? " st" : "");
    w.textContent = v.a ? "" : "Загружаем…";
    box.insertBefore(w, box.firstChild);
    if (!v.id || !v.a) return;
    idbGet(v.id).then(function (blob) {
      if (!blob) { w.textContent = "Фото недоступно"; return; }
      var url = URL.createObjectURL(blob), im = D.createElement("img");
      im.alt = ""; im.src = url; w.textContent = ""; w.appendChild(im);
      if (!v.st) w.onclick = function (ev) {
        ev.stopPropagation();
        var ov = D.createElement("div"); ov.className = "sai-imgview";
        ov.innerHTML = '<img alt="" src="' + url + '">';
        ov.onclick = function () { ov.remove(); };
        D.body.appendChild(ov);
      };
    });
  };
  var mediaBusy = {};
  function opMediaLoad(v, tries) {
    if (!v || !v.fid || v.a || mediaBusy[v.id]) return;
    mediaBusy[v.id] = 1;
    xhrJson("GET", API + "?action=opMedia&clientId=" + encodeURIComponent(getClientId()) + "&fid=" + encodeURIComponent(v.fid), null, 60e3, function (r) {
      delete mediaBusy[v.id];
      var m = seventAiHistory.filter(function (x) { return x.voice && x.voice.id === v.id; })[0];
      if (!m) return;
      if (!r || !r.ok || !r.b64) { if ((tries || 0) < 2) setTimeout(function () { opMediaLoad(m.voice, (tries || 0) + 1); }, 4000); return; }
      var bin = atob(r.b64), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      idbPut(m.voice.id, new Blob([arr], { type: r.mime || "application/octet-stream" })).then(function () {
        m.voice.a = 1; seventAiSaveHistory();
        var b = bubbleOf(m.time), box = b && b.firstChild;
        if (!box) return;
        // перерисовываем только «медиа»-часть пузыря
        [].slice.call(box.querySelectorAll(".sai-vpill,.sai-vn,.sai-img,.sai-q")).forEach(function (x) { x.remove(); });
        box.classList.remove("sai-vnbox", "sai-imgbox", "sai-stbox");
        W._saiVoiceDecor(b, m.voice); decorate(b, m);
      });
    });
  }
  var closeChat = W.seventAiClose;
  W.seventAiClose = function () { fbClose(); headTyping(false); closeCam(); if (recOn) stopRec(true); if (player) player.au.pause(); closeMenu(); var ed = el("saiEdit"); if (ed) { ed.remove(); var rw = el("seventAiInputRow"); if (rw) rw.style.display = "flex"; var ms = el("seventAiMessages"); if (ms) ms.classList.remove("sai-blur"); } return closeChat.apply(this, arguments); };

  W._saiOnOpen = function () {
    loadFacts(); setupMic(); setupHold(); syncRow();
    lsSet("sai_unread", "0"); safe(function () { W._saiUnreadPaint && W._saiUnreadPaint(); });
    // ответ администратора мог прийти, пока чат был закрыт (хранится 6 часов) — проверяем
    var o = opGet();
    if (o.asked && Date.now() - o.asked < 6 * 3600e3) { if (!(o.until > Date.now())) { o.until = Date.now() + OP_TTL; opSet(o); } opSchedule(300); }
    setTimeout(ackSeen, 600);
  };
})();
