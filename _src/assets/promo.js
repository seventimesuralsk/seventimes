/* Страницы акций: обратный отсчёт (плитки), статус акции, прогресс дня, появление блоков при прокрутке.
   Время — Уральск (UTC+5), сверяется с сервером (заголовок Date), чтобы перевод часов на телефоне ничего не менял. */
!function(){
var root=document.querySelector(".pz");if(!root)return;
document.documentElement.classList.add("pz-js");
var kk=(document.documentElement.lang||"").indexOf("kk")===0,kind=root.getAttribute("data-kind");
var rm=false;try{rm=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
var off=0;try{fetch(location.pathname,{method:"HEAD",cache:"no-store"}).then(function(r){var d=Date.parse(r.headers.get("Date")||"");if(d&&Math.abs(d-Date.now())>6e4){off=d-Date.now();tick()}}).catch(function(){})}catch(e){}
function now(){return Date.now()+off}
function at(ds,min){var p=ds.split("-");return Date.UTC(+p[0],+p[1]-1,+p[2],0,min)-18e6}
var L=kk?{d:"күн",h:"сағ",m:"мин",s:"сек",
  up:"Алдағы акция",live:"Дәл қазір жүріп жатыр",next:"Жалғасы — 14:00-ден",done:"Акция аяқталды",
  until18:"18:00-ге дейін",dDone:"өтті",dLive:"қазір",dNext:"алда",
  setLive:"Бүгін 18:00-ге дейін",setLater:"Бүгін 11:00-ден",setTom:"Ертең 11:00-ден",setDone:"Акция аяқталды",
  drOpen:"Чек қабылдау ашық",drClosed:"Чек қабылдау аяқталды",drDone:"Ұтыс өтті"}
 :{d:"дн",h:"ч",m:"мин",s:"сек",
  up:"Предстоящая акция",live:"Идёт сейчас",next:"Продолжение — с 14:00",done:"Акция завершена",
  until18:"До 18:00",dDone:"прошёл",dLive:"сейчас",dNext:"впереди",
  setLive:"Сегодня до 18:00",setLater:"Сегодня с 11:00",setTom:"Завтра с 11:00",setDone:"Акция завершена",
  drOpen:"Приём чеков открыт",drClosed:"Приём чеков завершён",drDone:"Розыгрыш состоялся"};
/* плитки */
var tw=root.querySelector(".tiles"),T=[];
if(tw){[L.d,L.h,L.m,L.s].forEach(function(lab){var t=document.createElement("div");t.className="tile";t.innerHTML="<b>00</b><i>"+lab+"</i>";tw.appendChild(t);T.push(t.firstChild)})}
function z(v){return(v<10?"0":"")+v}
function setTiles(ms){if(!T.length)return;var s=Math.max(0,Math.floor(ms/1e3)),v=[Math.floor(s/86400),Math.floor(s%86400/3600),Math.floor(s%3600/60),s%60];
 T.forEach(function(b,i){var x=i?z(v[i]):String(v[i]);if(b.textContent!==x){b.textContent=x;if(!rm){b.classList.remove("tk");void b.offsetWidth;b.classList.add("tk")}}})}
var chip=root.querySelector(".chip"),chipT=chip&&chip.querySelector("span:last-child"),cap=root.querySelector("[data-cap]");
function setChip(txt,live){if(!chip)return;if(chipT.textContent!==txt)chipT.textContent=txt;chip.classList.toggle("live",!!live);chip.classList.toggle("off",!live)}
function hideTiles(h){if(tw)tw.style.display=h?"none":""}
/* Golden Hours: 23, 24, 25 ноября 2026, 14:00–18:00 */
var GH=["2026-11-23","2026-11-24","2026-11-25"],dayEls=[].slice.call(root.querySelectorAll(".day"));
function ghTick(n){var cur=-1,nx=-1;GH.forEach(function(d,i){var s=at(d,840),e=at(d,1080);if(n>=s&&n<e)cur=i;else if(n<s&&nx<0)nx=i});
 dayEls.forEach(function(el,i){var s=at(GH[i],840),e=at(GH[i],1080),st=n>=e?"done":(n>=s?"live":"next");el.className="day rv in "+st;
  var em=el.querySelector("em"),bar=el.querySelector(".bar");em.textContent=st==="done"?L.dDone:st==="live"?L.dLive:L.dNext;bar.style.width=st==="live"?((n-s)/(e-s)*100).toFixed(2)+"%":"0"});
 if(cur>=0){setChip(L.live,1);hideTiles(0);setTiles(at(GH[cur],1080)-n);cap&&(cap.textContent=L.until18)}
 else if(nx>=0){setChip(nx===0?L.up:L.next,0);hideTiles(0);setTiles(at(GH[nx],840)-n);cap&&(cap.textContent=cap.getAttribute("data-cap").split("|")[nx])}
 else{setChip(L.done,0);hideTiles(1);cap&&(cap.textContent=cap.getAttribute("data-end"))}}
/* Акционный сет: 14–22 ноября, 11:00–18:00 */
var SET0=at("2026-11-14",660),SET1=at("2026-11-22",1080),line=root.querySelector(".line i");
function setTick(n){if(n>=SET1){setChip(L.setDone,0);hideTiles(1);line&&(line.style.width="100%");return}
 var u=new Date(n+18e6),m=u.getUTCHours()*60+u.getUTCMinutes();setChip(n<SET0?L.up:(m>=660&&m<1080?L.setLive:(m<660?L.setLater:L.setTom)),n>=SET0&&m>=660&&m<1080);
 setTiles(SET1-n);line&&(line.style.width=Math.max(0,Math.min(100,(n-SET0)/(SET1-SET0)*100)).toFixed(2)+"%")}
/* Розыгрыш: чеки 1 ноября – 25 декабря, эфир 26 декабря */
var DR0=at("2026-11-01",0),DR1=at("2026-12-26",0),DR2=at("2026-12-27",0);
function drTick(n){if(n<DR0){setChip(L.up,0);setTiles(DR0-n)}else if(n<DR1){setChip(L.drOpen,1);setTiles(DR1-n)}else{setChip(n<DR2?L.drClosed:L.drDone,0);hideTiles(1);cap&&(cap.textContent=cap.getAttribute("data-end"))}}
function tick(){var n=now();kind==="gh"?ghTick(n):kind==="set"?setTick(n):drTick(n)}
tick();setInterval(tick,1e3);
/* появление блоков */
var rv=[].slice.call(root.querySelectorAll(".rv:not(.day)"));
rv.forEach(function(e){var p=e.parentNode,k=[].indexOf.call(p.children,e);e.style.setProperty("--dl",(Math.min(k,6)*.15)+"s")});
if(rm||!("IntersectionObserver" in window))rv.forEach(function(e){e.classList.add("in")});
else{var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){io.unobserve(x.target);x.target.classList.add("in")}})},{rootMargin:"0px 0px -8% 0px"});rv.forEach(function(e){io.observe(e)})}
}();
