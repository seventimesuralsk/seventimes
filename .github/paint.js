// Кадр меню для мгновенного показа.
// Chrome открывает сайт в режиме ?paint=1 (без запросов наружу, меню из снимка menu/samal.json),
// страница кладёт свой первый экран (баннер, категории, два первых раздела) в <script id="__paintOut">.
// Этот скрипт переносит его в <template id="p0"> страницы: новый гость видит меню с первой отрисовкой.
// node .github/paint.js dump.html index.html
const fs = require("fs");
const [dumpFile, htmlFile] = process.argv.slice(2);
const fail = (m) => { console.error("::warning::кадр меню: " + m); process.exit(1); };
const m = fs.readFileSync(dumpFile, "utf8").match(/<script type="text\/plain" id="__paintOut">([\s\S]*?)<\/script>/);
if (!m) fail("страница не отдала кадр");
const P = JSON.parse(m[1]);
if ((P.m.match(/class="item-card/g) || []).length < 4 || !/cat-pill/.test(P.b)) fail("кадр неполный");
const tpl = '<template id="p0">' + ["c", "d", "b", "m"].map((k) => '<div data-p="' + k + '">' + (P[k] || "") + "</div>").join("") + "</template>";
const html = fs.readFileSync(htmlFile, "utf8");
if ((html.match(/<template id="p0">/g) || []).length !== 1) fail("в странице нет места под кадр");
const out = html.replace(/<template id="p0">[\s\S]*?<\/template>/, () => tpl);
if (out === html) { console.log("кадр не изменился"); process.exit(0); }
fs.writeFileSync(htmlFile, out);
console.log("кадр обновлён: " + tpl.length + " байт");
