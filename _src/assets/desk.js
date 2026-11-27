/* Seven Times — версия для компьютера и ноутбука.
   Работает только при широком экране и мыши: (min-width:1024px) and (hover:hover) and (pointer:fine).
   На телефоне сразу выходит — ничего не меняет. Логика заказа та же (core.js / menu.js):
   здесь шапка, боковое меню разделов, фото в корзине, оформление в две колонки, анимации. */
(function(){
var Q=window.matchMedia&&matchMedia("(min-width:1024px) and (hover:hover) and (pointer:fine)");
if(!Q)return;
var KK=document.documentElement.lang==="kk";
var T=KK?{add:"Себетке",menu:"Мәзір",order:"Сіздің тапсырысыңыз",close:"Жабу",
 nav:[["./","Мәзір"],["booking/","Брондау"],["loyalty/","Лоялдық картасы"],["restaurants/","Мейрамханалар"],["about/","Компания туралы"]]}
:{add:"В корзину",menu:"Меню",order:"Ваш заказ",close:"Закрыть",
 nav:[["./","Меню"],["booking/","Бронирование"],["loyalty/","Карта лояльности"],["restaurants/","Рестораны"],["about/","О компании"]]};
var bound=false,lock=0,lastN=-1,raf=0;

function $(s,r){return(r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function navOff(){var n=$("nav");return n?Math.max(0,n.getBoundingClientRect().bottom):60}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g," ")+" ₸"}
function big(s){return String(s||"").replace(/-400\.(webp|jpg)/,"-800.$1")}

window.dkToMenu=function(){var m=$("#menuContent");if(!m)return;try{menuFlush()}catch(e){}scrollTo({top:m.getBoundingClientRect().top+scrollY-navOff()+8,behavior:"smooth"})};

/* шапка */
function navInit(){
 document.documentElement.style.setProperty("--dk-add",'"'+T.add+'"');
 var d=$("#desktopNav");
 if(d&&!d.dataset.dk){d.dataset.dk=1;d.textContent="";
  T.nav.forEach(function(x,i){var a=document.createElement("a");a.href=x[0];a.textContent=x[1];
   if(i===0){a.className="on";a.setAttribute("aria-current","page");a.addEventListener("click",function(e){e.preventDefault();dkToMenu()})}
   d.appendChild(a)})}
}
function cartPill(){
 var b=$("#cartNavBtn");if(!b)return;var c=[];try{c=cart||[]}catch(e){}
 var n=0,s=0;c.forEach(function(i){var q=+i.qty||0;n+=q;s+=(+i.price||0)*q});
 var ct=b.querySelector(".dk-ct");if(ct)ct.textContent=n?n+" · "+fmt(s):"";
 b.classList.toggle("dk-has",n>0);
 if(lastN>=0&&n>lastN){b.classList.add("dk-bump");setTimeout(function(){b.classList.remove("dk-bump")},420)}
 lastN=n}

/* первый экран: три рамки с блюдами из меню. Фото стоят на месте и по очереди, по часовой стрелке
   (верх-справа → низ-слева → центр), очень плавно сменяются на другие блюда. Без качания и параллакса. */
var HF=[],hp=0,hStep=0,hT=0,hVis=true,hHold=false,RM=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
function okCard(c){return!c.classList.contains("teaser")&&!c.classList.contains("stopped")&&c.querySelector(".item-img img")}
function cName(c){return((c.querySelector(".item-name")||{}).textContent||"").trim()}
function heroPool(){
 var cs=$$("#menuContent .item-card").filter(okCard);
 var skip=/соус|напит|кофе|чай|шай|лимонад|коктейл|смузи|мохито|гарнир|добавк|сусын|сироп|вода|қосымша/i;
 var G=[];
 cs.forEach(function(c){var s=c.closest(".cat-section"),t=s&&s.querySelector(".sec-title");if((t&&skip.test(t.textContent))||skip.test(cName(c)))return;
  var g=null;G.some(function(x){if(x.s===s){g=x;return true}return false});if(!g){g={s:s,a:[]};G.push(g)}g.a.push(c)});
 var out=[],i=0,more=true;
 while(more&&out.length<30){more=false;G.forEach(function(g){if(g.a[i]){out.push(g.a[i]);more=true}});i++}
 return out.length>=4?out:cs}
function heroImg(c){var s=c.querySelector(".item-img img").getAttribute("src");return{big:big(s),sm:s}}
function heroSet(F,c,first){
 var L=F.ly[F.cur^1],im=L.firstChild,u=heroImg(c),done=false;
 var go=function(){if(done)return;done=true;L.classList.add("on");F.ly[F.cur].classList.remove("on");F.cur^=1;F.id=c.dataset.id;if(F.main)tagSet(c,first)};
 im.onerror=function(){im.onerror=null;im.src=u.sm};
 im.src=u.big;
 if(first)return go();
 (im.decode?im.decode():Promise.resolve()).then(go,function(){setTimeout(go,200)})}
function tagSet(c,first){
 var bt=$("#dkArt .dkh-tag");if(!bt)return;
 var put=function(){var bd=c.querySelector(".item-badge"),s=c.closest(".cat-section"),st=s&&s.querySelector(".sec-title");
  bt.querySelector("small").textContent=bd?bd.textContent.trim():(st?st.textContent.trim():T.menu);
  bt.querySelector("span").textContent=cName(c);
  bt.querySelector("em").textContent=((c.querySelector(".item-price")||{}).textContent||"").trim();
  bt.querySelector("img").src=heroImg(c).sm;bt.dataset.id=c.dataset.id;bt.classList.remove("dk-sw")};
 if(first)return put();
 bt.classList.add("dk-sw");setTimeout(put,520)}
function heroNext(){
 clearTimeout(hT);
 if(RM||!HF.length)return;
 if(document.hidden||!hVis||hHold){hT=setTimeout(heroNext,1200);return}
 var P=heroPool(),F=HF[[1,2,0][hStep%3]],shown=HF.map(function(x){return x.id});
 for(var k=0;k<P.length;k++){var c=P[hp%P.length];hp++;if(shown.indexOf(c.dataset.id)<0){heroSet(F,c);break}}
 hStep++;hT=setTimeout(heroNext,3400)}
function heroArt(){
 var a=$("#dkArt");if(!a||a.dataset.ok)return;
 var P=heroPool();if(P.length<3)return;
 a.dataset.ok=1;a.textContent="";HF=[];
 for(var i=0;i<3;i++){
  var f=document.createElement("figure");f.className="dkh-ph p"+(i+1);
  var pp=document.createElement("div");pp.className="dkh-pop";var fl=document.createElement("div");fl.className="dkh-fl";
  var F={f:f,ly:[],cur:0,id:"",main:i===0};
  for(var k=0;k<2;k++){var ly=document.createElement("div");ly.className="dkh-ly";var im=document.createElement("img");im.alt="";im.decoding="async";if(i===0&&k===0)im.setAttribute("fetchpriority","high");ly.appendChild(im);fl.appendChild(ly);F.ly.push(ly)}
  F.cur=1;pp.appendChild(fl);f.appendChild(pp);a.appendChild(f);HF.push(F)}
 var bt=document.createElement("button");bt.type="button";bt.className="dkh-tag";
 bt.innerHTML='<img alt=""><div class="dkh-tx"><small></small><span></span><em></em></div><i>+</i>';
 bt.addEventListener("click",function(){var it=null;try{it=findItem(bt.dataset.id)}catch(e){}if(it&&!it.stopped&&!it.lunchLocked){openDetail(it)}else dkToMenu()});
 a.appendChild(bt);
 HF.forEach(function(F,i){heroSet(F,P[i],true)});hp=3;
 bt.addEventListener("mouseenter",function(){hHold=true});bt.addEventListener("mouseleave",function(){hHold=false});
 if("IntersectionObserver" in window)new IntersectionObserver(function(es){hVis=es[0].isIntersecting}).observe(a);
 hT=setTimeout(heroNext,4200)}
function heroStep(){
 var h=$("#dkHero");if(!h)return false;var y=scrollY,H=h.offsetHeight||1;
 if(y<H+200){var t=$(".dkh-txt",h);if(t){t.style.transform=y>0?"translate3d(0,"+(y*.16).toFixed(1)+"px,0)":"";t.style.opacity=y>0?String(Math.max(0,1-y/H*1.15).toFixed(3)):""}}
 return false}

/* боковое меню разделов */
function brName(){var s=$("#dksBr"),l=$("#navBranchLabel");if(s&&l)s.textContent=l.textContent.trim()}
function sideBuild(){
 var mc=$("#menuContent");if(!mc)return;var secs=$$(".cat-section",mc);
 var sig=secs.map(function(s){var t=s.querySelector(".sec-title");return s.id+":"+(t?t.textContent.trim():"")+":"+s.querySelectorAll(".item-card").length}).join("|");
 var sd=$("#dkSide");
 if(sd&&sd.dataset.sig===sig&&sd.parentNode===mc&&mc.firstElementChild===sd)return;
 if(!sd){sd=document.createElement("div");sd.id="dkSide";sd.hidden=true;sd.setAttribute("aria-label",T.menu);
  var h=document.createElement("div");h.className="dks-h";h.textContent=T.menu;
  var b=document.createElement("div");b.className="dks-s";b.id="dksBr";
  var l=document.createElement("div");l.className="dks-l";var ind=document.createElement("div");ind.className="dks-ind";l.appendChild(ind);
  sd.appendChild(h);sd.appendChild(b);sd.appendChild(l)}
 sd.dataset.sig=sig;var L=$(".dks-l",sd);$$("a",L).forEach(function(a){a.remove()});
 secs.forEach(function(s){var t=s.querySelector(".sec-title");if(!t||!s.id)return;
  var a=document.createElement("a");a.href="#"+s.id;a.dataset.sec=s.id;a.textContent=t.textContent.trim();
  var n=document.createElement("span");n.textContent=s.querySelectorAll(".item-card").length;a.appendChild(n);
  a.addEventListener("click",function(e){e.preventDefault();go(s.id)});L.appendChild(a)});
 if(mc.firstElementChild!==sd)mc.insertBefore(sd,mc.firstChild);
 brName();spy(true)}
function go(id){
 try{menuFlush()}catch(e){}try{lazyLayoutOff()}catch(e){}
 var s=document.getElementById(id);if(!s)return;lock=Date.now()+1000;setAct(id);
 try{_pillLocked=true;clearTimeout(_pillLockT);_pillLockT=setTimeout(function(){_pillLocked=false},1000)}catch(e){}
 scrollTo({top:s.getBoundingClientRect().top+scrollY-navOff()-28,behavior:"smooth"})}
function spy(force){
 if(!$("#dkSide"))return;if(!force&&Date.now()<lock)return;
 var y=navOff()+140,cur=null,first=null;
 $$("#dkSide .dks-l a").forEach(function(a){var s=document.getElementById(a.dataset.sec);var vis=!!(s&&s.offsetParent);a.style.display=vis?"":"none";if(!vis)return;first=first||a.dataset.sec;if(s.getBoundingClientRect().top<=y)cur=a.dataset.sec});
 setAct(cur||first)}
function setAct(id){
 var L=$("#dkSide .dks-l");if(!L)return;var act=null;
 $$("a",L).forEach(function(a){var o=a.dataset.sec===id;a.classList.toggle("on",o);if(o)act=a});
 var ind=$(".dks-ind",L);if(!ind)return;
 if(!act){ind.style.opacity=0;return}
 ind.style.transform="translateY("+act.offsetTop+"px)";ind.style.height=act.offsetHeight+"px";ind.style.opacity=1;
 var sd=$("#dkSide"),top=act.offsetTop+L.offsetTop;
 if(top<sd.scrollTop+30||top+act.offsetHeight>sd.scrollTop+sd.clientHeight-30)sd.scrollTo({top:top-sd.clientHeight/2,behavior:"smooth"})}

/* карточки: чёткие фото на больших экранах, волна появления по колонкам */
function cards(){
 var g=$("#menuContent .items-grid"),cols=3;
 if(g){var gt=getComputedStyle(g).gridTemplateColumns;cols=gt&&gt!=="none"?gt.split(" ").length:3}
 $$("#menuContent .items-grid").forEach(function(gr){var i=0;
  Array.prototype.forEach.call(gr.children,function(c){if(!c.classList||!c.classList.contains("item-card"))return;
   if(!c.dataset.dk){c.dataset.dk=1;if(!c.classList.contains("visible"))c.style.setProperty("--dkd",(i%cols)*90+"ms");
    var im=c.querySelector(".item-img img"),s=im&&im.getAttribute("src");
    if(s&&/-400\.(webp|jpg)/.test(s)&&!im.getAttribute("srcset")){im.setAttribute("srcset",s+" 400w, "+big(s)+" 800w");im.setAttribute("sizes","(min-width:1700px) 360px, 30vw")}}
   i++})})}
function menuPass(){sideBuild();cards();heroArt();spy()}

/* корзина: фото у позиций */
function thumbs(){
 $$("#cartBody .crow").forEach(function(r){if(r.querySelector(".dk-th"))return;
  var b=r.querySelector("[onclick*='cartD']"),m=b&&(b.getAttribute("onclick")||"").match(/cartD\('([^']+)'/);if(!m)return;
  var base=m[1].split(/[|:#~]/)[0],card=null;
  $$("#menuContent .item-card").some(function(c){if(c.dataset.id===base){card=c;return true}return false});
  var im=card&&card.querySelector(".item-img img"),src=im&&im.getAttribute("src");if(!src)return;
  var d=document.createElement("div");d.className="dk-th";d.hidden=true;var i=document.createElement("img");i.src=src;i.alt="";i.decoding="async";d.appendChild(i);r.insertBefore(d,r.firstChild)})}

/* оформление: форма слева, заказ и кнопка справа */
var OW=["drawJoinRow","agreeRow","agreeErr","osum","oerr"];
function wrapOrder(){
 var mb=$("#orderMov .mbody");if(!mb||$("#dkOSide"))return;
 var side=document.createElement("div");side.id="dkOSide";
 var h=document.createElement("div");h.className="dko-h";h.hidden=true;h.textContent=T.order;side.appendChild(h);
 var E={};OW.forEach(function(id){var e=document.getElementById(id);if(e&&e.parentNode===mb)E[id]=e});
 var ob=null;Array.prototype.forEach.call(mb.children,function(c){if(c.classList.contains("obar"))ob=c});
 ["osum","drawJoinRow","oerr"].forEach(function(id){E[id]&&side.appendChild(E[id])});
 ob&&side.appendChild(ob);
 ["agreeRow","agreeErr"].forEach(function(id){E[id]&&side.appendChild(E[id])});
 mb.appendChild(side)}
function unwrapOrder(){
 var s=$("#dkOSide");if(!s)return;var mb=s.parentNode;
 OW.forEach(function(id){var e=document.getElementById(id);if(e&&e.parentNode===s)mb.insertBefore(e,s)});
 var ob=$(".obar",s);ob&&mb.insertBefore(ob,s);s.remove()}

/* окно блюда: крестик; Esc закрывает верхнее окно */
function detailX(){
 var m=$("#detailMov .mbox");if(!m||$(".dk-x",m))return;
 var x=document.createElement("button");x.type="button";x.className="dk-x";x.hidden=true;x.setAttribute("aria-label",T.close);x.textContent="×";
 x.addEventListener("click",function(){try{closeDetail()}catch(e){}});m.appendChild(x)}
function esc(e){
 if(e.key!=="Escape")return;
 var p=$("#profileModalOv");if(p&&(p.classList.contains("open")||(p.style.display&&p.style.display!=="none"))){try{closeMov("profileModalOv")}catch(x){}return}
 var so=$("#searchOv");if(so&&so.classList.contains("open")){try{closeSearchOv()}catch(x){}return}
 var L=[["confirmMov",0],["orderMov",function(){closeOrder()}],["obrMov",function(){closeMov("obrMov")}],["drawMov",function(){closeMov("drawMov")}],["funMov",function(){closeMov("funMov")}],["detailMov",function(){closeDetail()}],["cartMov",function(){closeCart()}],["sheetOv",function(){closeSheet()}]];
 for(var i=0;i<L.length;i++){var m=document.getElementById(L[i][0]);if(m&&m.classList.contains("open")){if(L[i][1])try{L[i][1]()}catch(x){}return}}}

/* появление блоков при прокрутке */
function reveal(){
 if(!("IntersectionObserver" in window))return;
 var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("dk-in");io.unobserve(en.target)}})},{rootMargin:"0px 0px -8% 0px"});
 /* плитки «Сейчас у нас»: поднимаются по очереди при прокрутке. ctxCard и промо пересоздаются скриптами —
    проверяем заново; анимируем только то, что ещё ниже экрана (видимое не мигает) */
 var t0=Date.now();
 var scan=function(){nowRow();[$("#ctxCard")].concat($$("#promoCarousel .promo-card-ring")).forEach(function(e){if(!e||e.dataset.dkt)return;e.dataset.dkt=1;
   if(Date.now()-t0<6000||e.getBoundingClientRect().top>innerHeight*.92){e.classList.add("dk-tile");io.observe(e)}})};
 scan();var sh=$("#appShell"),pc=$("#promoCarousel");
 sh&&new MutationObserver(scan).observe(sh,{childList:true});pc&&new MutationObserver(scan).observe(pc,{childList:true})}
/* «Холодильник пустой?», iPhone и «Армандар» — одним рядом из трёх карточек: плашку и промо кладём в общий ряд.
   Скрипты главной пересоздают их на месте (replaceWith/innerHTML) — ряд сохраняется; если плашка вставлена заново рядом — возвращаем */
function nowRow(){
 var pc=$("#promoCarousel");if(!pc)return;var w=$("#dkNow");
 if(!w){w=document.createElement("section");w.id="dkNow";pc.parentNode.insertBefore(w,pc)}
 var cc=$("#ctxCard");if(cc&&cc.parentNode!==w)w.insertBefore(cc,w.firstChild);
 if(pc.parentNode!==w)w.appendChild(pc)}
function unNow(){var w=$("#dkNow");if(!w)return;var p=w.parentNode;Array.prototype.slice.call(w.children).forEach(function(e){p.insertBefore(e,w)});w.remove()}

/* «Сервисы» — костыль нижнего меню телефона; на компьютере всё есть в шапке и подвале → на главную.
   Профиль: ссылка ./#profile открывает окно профиля на главной */
function svcAway(){if(document.documentElement.getAttribute("data-page")==="services"){location.replace("./");return true}return false}
function profHash(){
 var go=function(){if(location.hash!=="#profile")return;try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}location.replace("profile/")};
 go();addEventListener("hashchange",go)}

/* ===== Профиль на компьютере: личный кабинет «тут я главный» =====
   Тот же localStorage, что и у модуля профиля (core.js); настройки — модуль профиля (без выбора темы). */
var PFT=KK?{greet:["Қайырлы түн","Қайырлы таң","Қайырлы күн","Қайырлы кеш"],welcome:"Қош келдіңіз",since:"Seven Times қонағы",
  mon:["қаңтар","ақпан","наурыз","сәуір","мамыр","маусым","шілде","тамыз","қыркүйек","қазан","қараша","желтоқсан"],
  edit:"Деректерді өзгерту",fill:"Деректерді толтыру",menu:"Мәзірді ашу",guest:"Қонақ",fillSub:"Аты, телефон мен мекенжайды бір рет толтырыңыз — тапсырыс екі басуда.",
  st:["тапсырыс","брондау","сүйікті тағам","бірінші тапсырыс"],fav:"Сүйікті",order:"Тапсырыс беру",mine:"Менің деректерім",addr:"Жеткізу мекенжайы",noAddr:"Мекенжай көрсетілмеген",
  card:"Қонақ картасы",cardSub:"залда алғашқы келгеннен шотқа",cardHow:"Картаны қалай алуға болады",tg:"Telegram-да ашу",noBk:"Кешке үстел керек пе?",bkBtn:"Үстел брондау",
  favEmpty:"Мұнда сүйікті тағамыңыз пайда болады",ent:"кіреберіс",flat:"пәтер",floor:"қабат",deliv:"Жеткізу",pick:"Алып кету",guests:"қонақ"}
:{greet:["Доброй ночи","Доброе утро","Добрый день","Добрый вечер"],welcome:"Добро пожаловать",since:"Гость Seven Times",
  mon:["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
  edit:"Изменить данные",fill:"Заполнить данные",menu:"Открыть меню",guest:"Гость",fillSub:"Заполните имя, телефон и адрес один раз — и заказ будет в два касания.",
  st:["заказ","брони","любимое блюдо","первый заказ"],fav:"Любимое",order:"Заказать",mine:"Мои данные",addr:"Адрес доставки",noAddr:"Адрес не указан",
  card:"Карта гостя",cardSub:"к счёту в зале с первого визита",cardHow:"Как получить карту",tg:"Открыть в Telegram",noBk:"Столик на вечер?",bkBtn:"Забронировать стол",
  favEmpty:"Здесь появится ваше любимое блюдо",ent:"подъезд",flat:"кв.",floor:"этаж",deliv:"Доставка",pick:"Самовывоз",guests:"гостей"};
var pfOn=3,pfBn=3;
function pfE(s){try{return _pfE(s)}catch(e){return String(s==null?"":s).replace(/[&<>"']/g,"")}}
function pfPl(n,a){try{return _pfPl(n,a)}catch(e){return a[a.length-1]}}
function pfDash(){
 var host=$("#dkPf");if(!host)return;
 var p={};try{p=loadClientProfile()||{}}catch(e){}
 var H=[],B=[],S=[];try{H=_pfHist();B=_pfBks();S=_pfJ("st_seen",[])}catch(e){}
 var nm=String(p.name||"").trim(),first=nm.split(/\s+/)[0]||"",ini="";
 /* гость (нет имени или номера) — только «Заполнить», без статистики */
 var RG=nm.length>=2&&typeof validPhone=="function"&&validPhone(String(p.phone||""));try{ini=_pfIni(nm)}catch(e){}
 var h=new Date().getHours(),gi=h<5?0:h<12?1:h<17?2:h<23?3:0;
 var f0=H.length?_pfDate(H[H.length-1]):null,fav=H.length?_pfFav(H):"",favId="",favPh="";
 if(fav){H.some(function(o){return(o.itemsList||[]).some(function(x){if(String(x.name||"").replace(/\s*\(.*\)$/,"")===fav){favId=x.id;return true}})});
  S.some(function(x){if(x&&(x.id===favId||x.n===fav)){favPh=x.ph||"";favId=favId||x.id;return true}})}
 var up=B.filter(function(b){return b.up})[0];
 var r='';
 /* первый экран */
 r+='<section class="dpf-hero"><div class="dpf-glow"><i></i><i></i><i></i></div><div class="dpf-hin"><div class="dpf-me">'
  +'<div class="dpf-av"><span>'+(ini?pfE(ini):'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="9" r="3.6"/><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6"/></svg>')+'</span></div>'
  +'<div class="dpf-greet">'+(first?PFT.greet[gi]+',':PFT.welcome)+'</div>'
 /* ГАЛОЧКА у имени: форма — строго по образцу владельца (#0d6efd, 12 мягких волн), НИКОГДА НЕ МЕНЯТЬ (та же, что в core.js). Синяя — есть, пунктирная — можно получить; тап → verified/ */
  +'<h1 class="dpf-name">'+pfE(first||PFT.guest)+(function(){var v=null;try{v=JSON.parse(localStorage.getItem("st_vrf")||"null")}catch(e){}return'<a class="dpf-vfa" href="verified/" aria-label="'+(KK?"Көк құсбелгі":"Синяя галочка")+'">'+(v&&v.ok?'<svg class="dpf-vf" viewBox="0 0 24 24" role="img" aria-label="✓"><path fill="#0d6efd" d="M23.32 12.00 23.13 12.73 22.65 13.40 22.13 14.01 21.81 14.63 21.78 15.32 21.92 16.11 22.00 16.93 21.81 17.66 21.27 18.20 20.52 18.54 19.76 18.81 19.18 19.18 18.81 19.76 18.54 20.52 18.20 21.27 17.66 21.81 16.93 22.00 16.11 21.92 15.32 21.78 14.63 21.81 14.01 22.13 13.40 22.65 12.73 23.13 12.00 23.32 11.27 23.13 10.60 22.65 9.99 22.13 9.37 21.81 8.68 21.78 7.89 21.92 7.07 22.00 6.34 21.81 5.80 21.27 5.46 20.52 5.19 19.76 4.82 19.18 4.24 18.81 3.48 18.54 2.73 18.20 2.19 17.66 2.00 16.93 2.08 16.11 2.22 15.32 2.19 14.63 1.87 14.01 1.35 13.40 0.87 12.73 0.68 12.00 0.87 11.27 1.35 10.60 1.87 9.99 2.19 9.37 2.22 8.68 2.08 7.89 2.00 7.07 2.19 6.34 2.73 5.80 3.48 5.46 4.24 5.19 4.82 4.82 5.19 4.24 5.46 3.48 5.80 2.73 6.34 2.19 7.07 2.00 7.89 2.08 8.68 2.22 9.37 2.19 9.99 1.87 10.60 1.35 11.27 0.87 12.00 0.68 12.73 0.87 13.40 1.35 14.01 1.87 14.63 2.19 15.32 2.22 16.11 2.08 16.93 2.00 17.66 2.19 18.20 2.73 18.54 3.48 18.81 4.24 19.18 4.82 19.76 5.19 20.52 5.46 21.27 5.80 21.81 6.34 22.00 7.07 21.92 7.89 21.78 8.68 21.81 9.37 22.13 9.99 22.65 10.60 23.13 11.27Z"/><path d="M7.77 12.14L11.05 15.53L16.28 9.16" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>':'<svg class="dpf-vf o" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.32 12.00 23.13 12.73 22.65 13.40 22.13 14.01 21.81 14.63 21.78 15.32 21.92 16.11 22.00 16.93 21.81 17.66 21.27 18.20 20.52 18.54 19.76 18.81 19.18 19.18 18.81 19.76 18.54 20.52 18.20 21.27 17.66 21.81 16.93 22.00 16.11 21.92 15.32 21.78 14.63 21.81 14.01 22.13 13.40 22.65 12.73 23.13 12.00 23.32 11.27 23.13 10.60 22.65 9.99 22.13 9.37 21.81 8.68 21.78 7.89 21.92 7.07 22.00 6.34 21.81 5.80 21.27 5.46 20.52 5.19 19.76 4.82 19.18 4.24 18.81 3.48 18.54 2.73 18.20 2.19 17.66 2.00 16.93 2.08 16.11 2.22 15.32 2.19 14.63 1.87 14.01 1.35 13.40 0.87 12.73 0.68 12.00 0.87 11.27 1.35 10.60 1.87 9.99 2.19 9.37 2.22 8.68 2.08 7.89 2.00 7.07 2.19 6.34 2.73 5.80 3.48 5.46 4.24 5.19 4.82 4.82 5.19 4.24 5.46 3.48 5.80 2.73 6.34 2.19 7.07 2.00 7.89 2.08 8.68 2.22 9.37 2.19 9.99 1.87 10.60 1.35 11.27 0.87 12.00 0.68 12.73 0.87 13.40 1.35 14.01 1.87 14.63 2.19 15.32 2.22 16.11 2.08 16.93 2.00 17.66 2.19 18.20 2.73 18.54 3.48 18.81 4.24 19.18 4.82 19.76 5.19 20.52 5.46 21.27 5.80 21.81 6.34 22.00 7.07 21.92 7.89 21.78 8.68 21.81 9.37 22.13 9.99 22.65 10.60 23.13 11.27Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="1.2 1.5" stroke-linecap="round"/><path d="M7.77 12.14L11.05 15.53L16.28 9.16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>')+'</a>'})()+'</h1>'
  +(f0?'<div class="dpf-since">'+PFT.since+' · '+(KK?PFT.mon[f0.getMonth()]+' '+f0.getFullYear():'с '+PFT.mon[f0.getMonth()]+' '+f0.getFullYear())+'</div>':(first?'':'<div class="dpf-since">'+PFT.fillSub+'</div>'))
  +'<div class="dpf-acts"><button type="button" class="dpf-btn" onclick="_pfGo(\'set\')">'+(RG?PFT.edit:PFT.fill)+'</button>'+(RG?'<button type="button" class="dpf-btn dpf-btn2" onclick="_pfGo(\'stat\')">Статистика</button>':'')+'<a class="dpf-lnk" href="./">'+PFT.menu+'<span>›</span></a></div></div>'
  +'<a class="dpf-card" href="loyalty/"><div class="dpf-cd"><div class="dpf-sh"></div><div class="dpf-ct"><span class="dk-logo"><i></i>Seven Times</span><em>'+PFT.card+'</em></div>'
  +'<div class="dpf-chip"></div><div class="dpf-cm"><b>−3%</b><span>'+PFT.cardSub+'</span></div>'
  +'<div class="dpf-cb"><span>'+pfE((nm||PFT.guest).toUpperCase())+'</span><span>'+(f0?f0.getFullYear():new Date().getFullYear())+'</span></div></div></a></div>';
 if(H.length||B.length){
  r+='<div class="dpf-stats">'
   +'<div><b data-n="'+H.length+'">0</b><span>'+pfPl(H.length,PFL.ow)+'</span></div>'
   +'<div><b data-n="'+B.length+'">0</b><span>'+(KK?PFT.st[1]:pfPl(B.length,["бронь","брони","броней"]))+'</span></div>'
   +'<div><b class="t">'+pfE(fav?_pfTr(fav):"—")+'</b><span>'+PFT.st[2]+'</span></div>'
   +'<div><b class="t">'+(f0?PFL.mn[f0.getMonth()]+' '+f0.getFullYear():"—")+'</b><span>'+PFT.st[3]+'</span></div></div>'}
 r+='</section>';
 /* плитки */
 var addr=[p.street,p.house].filter(Boolean).join(", ");var ad2=[p.entrance?PFT.ent+" "+p.entrance:"",p.flat?PFT.flat+" "+p.flat:"",p.floor?PFT.floor+" "+p.floor:""].filter(Boolean).join(" · ");
 r+='<section class="dpf-bento">';
 r+='<a class="dpf-t dpf-fav'+(favPh?' ph':'')+'" href="'+(favId?'./?dish='+encodeURIComponent(favId):'./')+'">'+(favPh?'<img src="'+pfE(favPh)+'" alt="">':'')
  +'<div class="dpf-tx"><small>'+PFT.fav+'</small><b>'+pfE(fav?_pfTr(fav):PFT.favEmpty)+'</b><span class="dpf-go">'+(fav?PFT.order:PFT.menu)+' ›</span></div></a>';
 if(up){var gid="";try{gid=_2gis[up.br]||""}catch(e){}
  r+='<div class="dpf-t dpf-bk"><small>'+PFL.bk+'</small><div class="dpf-time">'+pfE(up.tm)+'</div><div class="dpf-day">'+pfE(_pfDay(up.at))+'</div><div class="dpf-where">'+pfE(_pfBrName(up.br))+' · '+pfE(_pfGuests(up.g))+'</div>'
   +(gid?'<a class="dpf-pill" href="https://2gis.kz/uralsk/firm/'+gid+'" target="_blank" rel="noopener">'+PFL.route+'</a>':'')+'</div>'}
 else r+='<a class="dpf-t dpf-bk dpf-nobk" href="booking/"><small>'+PFL.bks+'</small><div class="dpf-day">'+PFT.noBk+'</div><span class="dpf-pill">'+PFT.bkBtn+'</span></a>';
 r+='<div class="dpf-t dpf-data"><small>'+PFT.mine+'</small><div class="dpf-dn">'+pfE(nm||"—")+'</div><div class="dpf-dp">'+pfE(p.phone||"")+'</div>'
  +'<div class="dpf-da"><span>'+PFT.addr+'</span>'+pfE(addr||PFT.noAddr)+(ad2?'<em>'+pfE(ad2)+'</em>':'')+'</div><button type="button" class="dpf-pill" onclick="_pfGo(\'set\')">'+PFL.edit+'</button></div>';
 r+='<a class="dpf-t dpf-loy" href="loyalty/"><small>'+PFL.loy+'</small><div class="dpf-pct">−3%</div><div class="dpf-ls">'+PFT.cardSub+'</div><span class="dpf-go">'+PFT.cardHow+' ›</span></a>';
 r+='</section>';
 /* заказы */
 r+='<section class="dpf-sec"><div class="dpf-sh2"><h2>'+PFL.orders+'</h2>'+(H.length?'<span>'+H.length+'</span>':'')+'</div>';
 if(H.length){r+='<div class="dpf-list">';H.slice(0,pfOn).forEach(function(o,i){var d=_pfDate(o);
   r+='<div class="dpf-row"><div class="dpf-date"><b>'+(d?d.getDate():"")+'</b><span>'+(d?PFL.mn[d.getMonth()]:"")+'</span></div>'
    +'<div class="dpf-ri"><div class="dpf-rt">'+pfE(_pfBrName(o.branch))+' <em>'+("delivery"===o.type?PFT.deliv:PFT.pick)+(o.orderNum?' · '+pfE(o.orderNum):'')+'</em></div>'
    +'<div class="dpf-rs">'+pfE(o.itemsList&&o.itemsList.length?o.itemsList.map(function(x){return _pfTr(x.name)+(x.qty>1?" ×"+x.qty:"")}).join(", "):o.items||"")+'</div></div>'
    +'<div class="dpf-sum">'+Number(o.total).toLocaleString("ru").replace(/\s/g," ")+' ₸</div>'
    +(o.itemsList&&o.itemsList.length?'<button type="button" class="dpf-pill" onclick="_pfRep('+i+')">'+PFL.repBtn+'</button>':'<span></span>')+'</div>'});
  r+='</div>'+(H.length>pfOn?'<button type="button" class="dpf-more" data-k="o">'+PFL.more+'</button>':'')}
 else r+='<div class="dpf-empty">'+PFL.noOrd+'<a class="dpf-pill" href="./">'+PFT.menu+'</a></div>';
 r+='</section>';
 /* брони */
 r+='<section class="dpf-sec"><div class="dpf-sh2"><h2>'+PFL.bks+'</h2>'+(B.length?'<span>'+B.length+'</span>':'')+'</div>';
 if(B.length){r+='<div class="dpf-list">';B.slice(0,pfBn).forEach(function(b){var gid="";try{gid=_2gis[b.br]||""}catch(e){}
   r+='<div class="dpf-row'+(b.up?'':' past')+'"><div class="dpf-date t"><b>'+pfE(b.tm)+'</b><span>'+pfE(_pfDay(b.at))+'</span></div>'
    +'<div class="dpf-ri"><div class="dpf-rt">'+pfE(_pfBrName(b.br))+' <em>'+pfE(_pfGuests(b.g))+'</em></div></div>'
    +'<div class="dpf-tag'+(b.up?' up':'')+'">'+(b.up?PFL.soon:PFL.past)+'</div>'
    +(b.up&&gid?'<a class="dpf-pill" href="https://2gis.kz/uralsk/firm/'+gid+'" target="_blank" rel="noopener">'+PFL.route+'</a>':'<span></span>')+'</div>'});
  r+='</div>'+(B.length>pfBn?'<button type="button" class="dpf-more" data-k="b">'+PFL.more+'</button>':'')}
 else r+='<div class="dpf-empty">'+PFL.noBk+'<a class="dpf-pill" href="booking/">'+PFT.bkBtn+'</a></div>';
 r+='</section>';
 /* недавно смотрели */
 if(S.length){r+='<section class="dpf-sec"><div class="dpf-sh2"><h2>'+PFL.seen+'</h2></div><div class="dpf-seen">';
  S.slice(0,6).forEach(function(x){r+='<a class="dpf-sc" href="./?dish='+encodeURIComponent(x.id)+'">'+(x.ph?'<img src="'+pfE(x.ph)+'" alt="" loading="lazy">':'<i></i>')+'<b>'+pfE(_pfTr(x.n||""))+'</b><span>'+(x.p?Number(x.p).toLocaleString("ru").replace(/\s/g," ")+' ₸':'')+'</span></a>'});
  r+='</div></section>'}
 host.innerHTML=r;
 /* счётчики */
 $$(".dpf-stats b[data-n]",host).forEach(function(b){var n=+b.dataset.n,t0=0;if(RM||!n){b.textContent=n;return}
  var st=function(ts){t0=t0||ts;var k=Math.min(1,(ts-t0)/1300),e=1-Math.pow(1-k,3);b.textContent=Math.round(n*e);k<1&&requestAnimationFrame(st)};setTimeout(function(){requestAnimationFrame(st)},500)});
 /* «Показать ещё» (недавно смотрели не очищаются) */
 $$(".dpf-more",host).forEach(function(m){m.addEventListener("click",function(){var y=scrollY;m.dataset.k==="o"?pfOn+=3:pfBn+=3;pfDash();scrollTo(0,y)})});
 
 /* появление при прокрутке */
 if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("dk-in");io.unobserve(en.target)}})},{rootMargin:"0px 0px -6% 0px"});
  host.addEventListener("transitionend",function(e){e.propertyName==="opacity"&&e.target.style&&e.target.style.removeProperty("--d")});
  $$(".dpf-t,.dpf-sec",host).forEach(function(e,i){e.classList.add("dpf-rv");e.style.setProperty("--d",(e.classList.contains("dpf-t")?i*.08:0)+"s");io.observe(e)})}
}
function pfPage(){
 if(document.documentElement.getAttribute("data-page")!=="profile")return;
 var pb=$("#profileBody");if(!pb)return;
 var host=$("#dkPf");if(!host){host=document.createElement("div");host.id="dkPf";host.hidden=true;pb.parentNode.insertBefore(host,pb)}
 var sync=function(){var set=typeof _pfV!=="undefined"&&_pfV!=="main";document.documentElement.classList.toggle("dkpf-set",set);if(!set)pfDash()};
 new MutationObserver(sync).observe(pb,{childList:true});sync()}

/* бронь: карточки ресторанов слева выбирают филиал в форме справа и подсвечиваются вместе с ним */
function bookSync(){
 var rs=$$(".dkb-r");if(!rs.length)return;
 var paint=function(){rs.forEach(function(r){var b=document.getElementById("bk-branchBtn"+r.dataset.b);r.classList.toggle("on",!!(b&&b.classList.contains("bk-on")))})};
 rs.forEach(function(r){r.addEventListener("click",function(){var b=document.getElementById("bk-branchBtn"+r.dataset.b);if(b){b.click();setTimeout(paint,30)}})});
 var pk=$("#bk-branchPicker");pk&&new MutationObserver(paint).observe(pk,{attributes:true,subtree:true,attributeFilter:["class"]});
 paint()}

function tick(){if(!raf)raf=requestAnimationFrame(frame)}
function frame(){raf=0;var more=heroStep();spy();var n=$("nav");n&&n.classList.toggle("dk-sc",scrollY>8);if(more)tick()}

function init(){
 if(svcAway())return;
 navInit();wrapOrder();
 if(bound)return;bound=true;
 cartPill();var cn=$("#cartN");cn&&new MutationObserver(cartPill).observe(cn,{childList:true,characterData:true,subtree:true,attributes:true});
 var bl=$("#navBranchLabel");bl&&new MutationObserver(brName).observe(bl,{childList:true,characterData:true,subtree:true});
 var mc=$("#menuContent"),mt=0;
 mc&&new MutationObserver(function(){clearTimeout(mt);mt=setTimeout(menuPass,60)}).observe(mc,{childList:true,subtree:true});
 mc&&mc.addEventListener("transitionend",function(e){var c=e.target;if(e.propertyName==="opacity"&&c.classList&&c.classList.contains("item-card"))c.style.removeProperty("--dkd")});
 menuPass();
 var cb=$("#cartBody");cb&&new MutationObserver(thumbs).observe(cb,{childList:true});thumbs();
 var si=$("#searchInput");si&&si.addEventListener("input",function(){var m=$("#menuContent");if(!si.value.trim()||!m)return;var top=m.getBoundingClientRect().top;if(top>navOff()+120||top<-40)scrollTo({top:top+scrollY-navOff()-64,behavior:"instant"})});
 detailX();reveal();bookSync();profHash();pfPage();
 var yr=$("#dkYr");yr&&(yr.textContent=new Date().getFullYear());
 document.addEventListener("keydown",esc);
 addEventListener("scroll",tick,{passive:true});
 addEventListener("resize",function(){spy(true);tick()});
 tick()}

function start(){if(!Q.matches)return;if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init()}
start();
var onCh=function(e){if(e.matches){start();nowRow()}else{unwrapOrder();unNow()}};
Q.addEventListener?Q.addEventListener("change",onCh):Q.addListener&&Q.addListener(onCh);
})();
