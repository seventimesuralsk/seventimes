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
 ["#ctxCard","#promoCarousel"].forEach(function(s){var e=$(s);if(e&&e.getBoundingClientRect().top>innerHeight){e.classList.add("dk-rv");io.observe(e)}})}

function tick(){if(!raf)raf=requestAnimationFrame(frame)}
function frame(){raf=0;var more=heroStep();spy();var n=$("nav");n&&n.classList.toggle("dk-sc",scrollY>8);if(more)tick()}

function init(){
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
 detailX();reveal();
 var yr=$("#dkYr");yr&&(yr.textContent=new Date().getFullYear());
 document.addEventListener("keydown",esc);
 addEventListener("scroll",tick,{passive:true});
 addEventListener("resize",function(){spy(true);tick()});
 tick()}

function start(){if(!Q.matches)return;if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init()}
start();
var onCh=function(e){if(e.matches)start();else unwrapOrder()};
Q.addEventListener?Q.addEventListener("change",onCh):Q.addListener&&Q.addListener(onCh);
})();
