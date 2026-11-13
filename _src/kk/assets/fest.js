/* Праздники: полоса сверху + окна (Новый год, День Независимости, Наурыз). Подключается синхронно в начале #appShell. */
/* Праздничная полоса сверху (Уральск, без имён): 16–18.12 — День Независимости; 25–31.12 — «С наступающим»; 01–07.01 — «С Новым годом»; 21–23.03 — Наурыз. Проверка: ?bar=ind|pre|new|nz */
!function(){var kk=document.documentElement.lang==="kk",q=location.search,P=[
 ["ind",1797361200000,1797620400000,"#0094b6","#fff",kk?"Тәуелсіздік күні құтты болсын!":"С Днём Независимости Республики Казахстан!"],
 ["pre",1798138800000,1798743600000,"#5a0c1f","#f3d27e",kk?"✦ Келе жатқан Жаңа жылыңызбен! Бізбен бірге болғаныңыз үшін рахмет ✦":"✦ С наступающим Новым годом! Спасибо, что вы с нами ✦"],
 ["new",1798743600000,1799348400000,"#5a0c1f","#f3d27e",kk?"✦ Жаңа жылыңызбен! Бізбен бірге болғаныңыз үшін рахмет ✦":"✦ С Новым годом! Спасибо, что вы с нами ✦"],
 ["nz",1805569200000,1805828400000,"#c8102e","#fff",kk?"Наурыз құтты болсын! Ұлыс оң болсын!":"С праздником Наурыз! Наурыз құтты болсын!"]],
 m=/[?&]bar=(\w+)/.exec(q),n=Date.now(),p=null;if(/[?&]paint=1/.test(q))return;
P.forEach(function(x){if(m?m[1]===x[0]:n>=x[1]&&n<x[2])p=x});if(!p)return;
var b=document.createElement("div");b.className="ann";b.id="annBar";b.setAttribute("role","note");b.style.cssText="background:"+p[3]+";color:"+p[4]+";font-weight:600;white-space:normal;text-align:center;line-height:1.25";
b.textContent=p[5];document.currentScript.parentNode.insertBefore(b,document.currentScript);
var h=b.offsetHeight;document.documentElement.style.setProperty("--bar-h",h+"px");var a=document.getElementById("appShell");a&&(a.style.paddingTop=h+"px")}();;
/* Новогоднее поздравление. 31.12.2026 10:00 – 31.12 23:59 (Уральск): «С наступающим»; 01.01.2027 00:00 – 02.01 23:59: «С Новым годом».
Одно тёплое поздравление для всех: без имён и без числа заказов. Показывается при каждом заходе, один тёплый текст для всех. Проверка: ?ny=pre / ?ny=new */
!function(){var A=1798693200000,B=1798743600000,C=1798916400000,kk=document.documentElement.lang==="kk",q=location.search;
if(/[?&]paint=1/.test(q))return;var m=/[?&]ny=(pre|new)/.exec(q),n=m?(m[1]==="pre"?A+1:B+1):Date.now();if(n<A||n>=C)return;
var ph=n<B?"pre":"new",K="st_ny27_"+ph;
var T=kk?{pre:"Келе жатқан Жаңа жылыңызбен!",new:"Жаңа жылыңызбен!",
 gen:"Биыл бізбен бірге болғаныңыз үшін шын жүректен рахмет — әр кездесу, жылы сөз және сенім үшін. Бұл біз үшін өте қымбат.",wish:"2027 жыл сізге қуаныш, денсаулық және жақындарыңызбен ортақ дастарқан басындағы жылы кездесулер сыйласын.",sig:"Ыстық ықыласпен, Seven Times командасы",btn:"Рахмет"}
 :{pre:"С наступающим Новым годом!",new:"С Новым годом!",
 gen:"Биыл бізбен бірге болғаныңыз үшін шын жүректен рахмет — әр кездесу, жылы сөз және сенім үшін. Бұл біз үшін өте қымбат.",wish:"Пусть 2027 год будет щедрым на радость, здоровье и тёплые встречи с близкими за общим столом.",sig:"С теплом, команда Seven Times",btn:"Спасибо"};
var VV=["Биыл бізбен бірге болғаныңыз үшін шын жүректен рахмет — әр кездесу, жылы сөз және сенім үшін. 2027 жыл сізге қуаныш, денсаулық және жақындарыңызбен ортақ дастарқан басындағы жылы кездесулер сыйласын."];function pk(a,k){var l=-1;try{l=+localStorage.getItem(k)}catch(e){}var i=Math.floor(Math.random()*a.length);if(a.length>1&&i===l)i=(i+1)%a.length;try{localStorage.setItem(k,String(i))}catch(e){}return a[i]}
function go(){var t1=pk(VV,"st_nyv");
 var st=document.createElement("style");st.textContent=
 ".ny-ov{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(10,4,6,.6);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);opacity:0;transition:opacity .35s}.ny-ov.on{opacity:1}"+
 ".ny-c{position:relative;overflow:hidden;width:100%;max-width:330px;border-radius:22px;padding:46px 24px 22px;text-align:center;color:#fff;background:radial-gradient(120% 80% at 50% 0%,#7a1530 0%,#4a0a1a 55%,#2a0510 100%);box-shadow:0 24px 70px rgba(0,0,0,.45),inset 0 0 0 1px rgba(233,196,106,.35);transform:translateY(12px) scale(.98);transition:transform .4s cubic-bezier(.16,1,.3,1)}"+
 ".ny-ov.on .ny-c{transform:none}"+
 ".ny-gl{position:absolute;left:0;right:0;top:0;height:40px;pointer-events:none}.ny-gl svg{position:absolute;inset:0;width:100%;height:100%}"+
 ".ny-gl b{position:absolute;width:9px;height:12px;margin-left:-4.5px;border-radius:50% 50% 45% 45%;animation:nyTw 2.4s ease-in-out infinite}"+
 "@keyframes nyTw{0%,100%{opacity:1;filter:brightness(1.15)}50%{opacity:.35;filter:brightness(.7)}}"+
 ".ny-in{position:absolute;inset:0;pointer-events:none;overflow:hidden}.ny-in i{position:absolute;top:-8px;border-radius:50%;background:#fff;animation:nyFall2 linear infinite}"+
 "@keyframes nyFall2{to{transform:translate3d(14px,520px,0)}}"+
 ".ny-y{position:relative;font-size:58px;font-weight:200;letter-spacing:.06em;line-height:1;background:linear-gradient(100deg,#9c7425 0%,#e9c46a 30%,#fff3c4 45%,#e9c46a 60%,#9c7425 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#e9c46a;animation:nyGold 4s ease-in-out infinite}"+
 "@keyframes nyGold{0%,100%{background-position:100% 0}50%{background-position:0 0}}"+
 ".ny-sp{position:absolute;color:#f6dc8c;font-size:12px;animation:nyTw 1.8s ease-in-out infinite}"+
 ".ny-l{width:40px;height:1px;background:linear-gradient(90deg,transparent,#e9c46a,transparent);margin:14px auto 14px}"+
 ".ny-h{position:relative;font-size:19px;font-weight:700;letter-spacing:-.01em;line-height:1.3}.ny-t{position:relative;margin-top:10px;font-size:14px;line-height:1.5;color:rgba(255,255,255,.82)}"+
 ".ny-s{position:relative;margin-top:14px;font-size:12px;color:#e9c46a;letter-spacing:.04em}"+
 ".ny-b{position:relative;width:100%;margin-top:20px;padding:14px 0;border:0;border-radius:12px;background:linear-gradient(180deg,#f3d27e,#d9ae4f);color:#3a0814;font:700 16px/1 inherit;font-family:inherit;cursor:pointer;box-shadow:0 6px 18px rgba(217,174,79,.35)}"+
 "@media (prefers-reduced-motion:no-preference){.ny-ov{transition-duration:.35s!important}.ny-c{transition-duration:.4s!important}.ny-y{animation-duration:4s!important}.ny-gl b,.ny-sp{animation-duration:var(--d)!important;animation-delay:var(--dl)!important}.ny-in i{animation-duration:var(--d)!important;animation-delay:var(--dl)!important}}"+
 "@media (prefers-reduced-motion:reduce){.ny-in{display:none}}";
 document.head.appendChild(st);
 var ov=document.createElement("div");ov.className="ny-ov";ov.setAttribute("role","dialog");
 ov.innerHTML='<div class="ny-c"><div class="ny-in"></div><div class="ny-gl"><svg viewBox="0 0 330 40" preserveAspectRatio="none"><path d="M0 6 Q41 30 82 10 Q124 30 165 10 Q206 30 248 10 Q289 30 330 6" fill="none" stroke="#2f5a2a" stroke-width="1.6"/></svg></div>'+
  '<div class="ny-y">2027<span class="ny-sp" style="left:-14px;top:2px">✦</span><span class="ny-sp" style="right:-12px;top:30px">✦</span></div><div class="ny-l"></div><div class="ny-h"></div><div class="ny-t"></div><div class="ny-s"></div><button class="ny-b"></button></div>';
 var cols=["#ffd36b","#ff4d5e","#5fd17a","#fff4d6","#6cc4ff"],gl=ov.querySelector(".ny-gl"),xs=[6,15,25,35,44,56,65,75,85,94];
 xs.forEach(function(x,i){var b=document.createElement("b"),c=cols[i%cols.length],ph=(x%25)/25,y=6+Math.sin(ph*Math.PI)*12;b.style.cssText="left:"+x+"%;top:"+(y+3).toFixed(1)+"px;background:"+c+";box-shadow:0 0 8px 2px "+c;var d=(1.6+Math.random()*1.6).toFixed(1)+"s",l="-"+(Math.random()*2).toFixed(1)+"s";b.style.setProperty("--d",d);b.style.setProperty("--dl",l);b.style.animationDuration=d;b.style.animationDelay=l;gl.appendChild(b)});
 ov.querySelectorAll(".ny-sp").forEach(function(s,i){s.style.setProperty("--d",(1.6+i*.5)+"s");s.style.setProperty("--dl","-"+i*.7+"s")});
 var sn=ov.querySelector(".ny-in");for(var i=0;i<22;i++){var f=document.createElement("i"),z=(1.5+Math.random()*2.5).toFixed(1),d=(6+Math.random()*7).toFixed(1)+"s",l="-"+(Math.random()*12).toFixed(1)+"s";
  f.style.cssText="left:"+(Math.random()*100).toFixed(1)+"%;width:"+z+"px;height:"+z+"px;opacity:"+(.3+Math.random()*.5).toFixed(2);f.style.setProperty("--d",d);f.style.setProperty("--dl",l);f.style.animationDuration=d;f.style.animationDelay=l;sn.appendChild(f)}
 var x=ov.querySelectorAll(".ny-t");ov.querySelector(".ny-h").textContent=T[ph];x[0].textContent=t1;ov.querySelector(".ny-s").textContent="— "+T.sig;ov.querySelector(".ny-b").textContent=T.btn;
 document.body.appendChild(ov);
 requestAnimationFrame(function(){ov.classList.add("on")});
 function close(){ov.classList.remove("on");setTimeout(function(){ov.remove()},350)}
 ov.querySelector(".ny-b").onclick=close;ov.addEventListener("click",function(e){if(e.target===ov)close()})}
function run(){setTimeout(go,1500)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",run):run()}();;
/* День Независимости РК: окно-поздравление 16.12.2026 00:00 – 18.12 23:59 (Уральск). Без имён. Каждый заход, один тёплый текст для всех. Проверка: ?nd=1 */
!function(){var A=1797361200000,B=1797620400000,kk=document.documentElement.lang==="kk",q=location.search;if(/[?&]paint=1/.test(q))return;
var t=/[?&]nd=1/.test(q),n=Date.now();if(!t&&(n<A||n>=B))return;var K="st_ind26";
var T=kk?{m:"Желтоқсан",h:"Тәуелсіздік күні құтты болсын!",s:"Қазақстан Республикасының Тәуелсіздік күні",
 t:"Бізбен бірге болғаныңыз үшін рахмет! Еліміздің бейбітшілігі мен береке-бірлігі баянды болсын, сізге және жақындарыңызға амандық пен игілік тілейміз.",sig:"Ыстық ықыласпен, Seven Times командасы",btn:"Рахмет"}
 :{m:"Декабря",h:"С Днём Независимости!",s:"Республики Казахстан",
 t:"Спасибо, что вы с нами. Желаем мира, благополучия и процветания нашей стране, вам и вашим близким.",sig:"С теплом, команда Seven Times",btn:"Спасибо"};
var VV=["Бізбен бірге болғаныңыз үшін рахмет! Еліміздің бейбітшілігі мен береке-бірлігі баянды болсын, сізге және жақындарыңызға амандық пен игілік тілейміз."];function pk(a,k){var l=-1;try{l=+localStorage.getItem(k)}catch(e){}var i=Math.floor(Math.random()*a.length);if(a.length>1&&i===l)i=(i+1)%a.length;try{localStorage.setItem(k,String(i))}catch(e){}return a[i]}
function go(){ var st=document.createElement("style");st.textContent=
 ".nd-ov{position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(5,25,35,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .3s}"+
 ".nd-ov.on{opacity:1}.nd-c{position:relative;overflow:hidden;width:100%;max-width:330px;border-radius:20px;padding:30px 24px 22px;text-align:center;color:#fff;background:linear-gradient(160deg,#00a9c8 0%,#0089a8 55%,#006f8c 100%);box-shadow:0 20px 60px rgba(0,0,0,.35);transform:translateY(10px);transition:transform .35s ease}"+
 ".nd-ov.on .nd-c{transform:none}.nd-c:before{content:'';position:absolute;right:-60px;top:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(255,215,90,.35),rgba(255,215,90,0) 70%);pointer-events:none}"+
 ".nd-g{background:linear-gradient(100deg,#b8892a 0%,#f5d77a 40%,#fff2c2 50%,#f5d77a 60%,#b8892a 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#f5d77a;animation:ndGold 5s ease-in-out infinite}"+
 "@keyframes ndGold{0%,100%{background-position:100% 0}50%{background-position:0 0}}"+
 ".nd-d{font-size:76px;font-weight:700;line-height:.95;letter-spacing:-.03em}.nd-m{margin-top:2px;font-size:13px;font-weight:600;letter-spacing:.22em;text-transform:uppercase}"+
 ".nd-o{margin:14px auto 14px;height:10px;width:150px;background:radial-gradient(circle,#f5d77a 0 2px,transparent 2.5px) 0 50%/15px 10px repeat-x;opacity:.9}"+
 ".nd-h{font-size:19px;font-weight:700;letter-spacing:-.01em;line-height:1.3}.nd-s{margin-top:4px;font-size:12px;opacity:.85;letter-spacing:.04em}"+
 ".nd-t{margin-top:12px;font-size:14px;line-height:1.5;color:rgba(255,255,255,.95)}.nd-sig{margin-top:14px;font-size:12px;opacity:.75}"+
 ".nd-b{width:100%;margin-top:20px;padding:14px 0;border:0;border-radius:12px;background:#f5d77a;color:#05414f;font:700 16px/1 inherit;font-family:inherit;cursor:pointer}"+
 "@media (prefers-reduced-motion:no-preference){.nd-ov{transition-duration:.3s!important}.nd-c{transition-duration:.35s!important}.nd-g{animation-duration:5s!important}}";
 document.head.appendChild(st);
 var ov=document.createElement("div");ov.className="nd-ov";ov.setAttribute("role","dialog");
 ov.innerHTML='<div class="nd-c"><div class="nd-d nd-g">16</div><div class="nd-m nd-g"></div><div class="nd-o"></div><div class="nd-h"></div><div class="nd-s"></div><div class="nd-t"></div><div class="nd-sig"></div><button class="nd-b"></button></div>';
 ov.querySelector(".nd-m").textContent=T.m;ov.querySelector(".nd-h").textContent=T.h;ov.querySelector(".nd-s").textContent=T.s;
 ov.querySelector(".nd-t").textContent=pk(VV,"st_ndv");ov.querySelector(".nd-sig").textContent="— "+T.sig;ov.querySelector(".nd-b").textContent=T.btn;
 document.body.appendChild(ov);
 requestAnimationFrame(function(){ov.classList.add("on")});function close(){ov.classList.remove("on");setTimeout(function(){ov.remove()},300)}
 ov.querySelector(".nd-b").onclick=close;ov.addEventListener("click",function(e){if(e.target===ov)close()})}
function run(){setTimeout(go,1500)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",run):run()}();;
/* Наурыз: окно-поздравление 21.03.2027 00:00 – 23.03 23:59 (Уральск). Без имён. Каждый заход, один тёплый текст для всех. Проверка: ?nz=1 */
!function(){var A=1805569200000,B=1805828400000,kk=document.documentElement.lang==="kk",q=location.search;if(/[?&]paint=1/.test(q))return;
var t=/[?&]nz=1/.test(q),n=Date.now();if(!t&&(n<A||n>=B))return;var K="st_nz27";
var T=kk?{h:"Наурыз құтты болсын!",s:"Ұлыстың ұлы күні",t:"Бізбен бірге болғаныңыз үшін рахмет! Ұлыс оң болсын, ақ мол болсын! Сізге және жақындарыңызға береке, бірлік және амандық тілейміз.",sig:"Ыстық ықыласпен, Seven Times командасы",btn:"Рахмет"}
 :{h:"С праздником Наурыз!",s:"Наурыз құтты болсын!",t:"Спасибо, что вы с нами. Пусть весна принесёт вам и вашим близким тепло, единство и достаток.",sig:"С теплом, команда Seven Times",btn:"Спасибо"};
var SH='<svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="#c9a24a" stroke-width="2"><circle cx="32" cy="32" r="28"/><circle cx="32" cy="32" r="24.5" stroke-width="1.2"/><path d="M22 9Q30 32 22 55M32 7.5V56.5M42 9Q34 32 42 55M9 22Q32 30 55 22M7.5 32H56.5M9 42Q32 34 55 42" stroke-linecap="round"/></svg>';
var HL='<svg viewBox="0 0 330 70" preserveAspectRatio="none" width="100%" height="70"><path d="M0 40 C60 10 110 30 165 34 C220 38 270 12 330 30 V70 H0Z" fill="#9ccf6b"/><path d="M0 52 C70 30 140 48 200 46 C260 44 300 34 330 42 V70 H0Z" fill="#5fa83a"/></svg>';
var VV=["Бізбен бірге болғаныңыз үшін рахмет! Ұлыс оң болсын, ақ мол болсын! Сізге және жақындарыңызға береке, бірлік және амандық тілейміз."];function pk(a,k){var l=-1;try{l=+localStorage.getItem(k)}catch(e){}var i=Math.floor(Math.random()*a.length);if(a.length>1&&i===l)i=(i+1)%a.length;try{localStorage.setItem(k,String(i))}catch(e){}return a[i]}
function go(){ var st=document.createElement("style");st.textContent=
 ".nz-ov{position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(20,30,15,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .3s}"+
 ".nz-ov.on{opacity:1}.nz-c{position:relative;overflow:hidden;width:100%;max-width:330px;border-radius:20px;padding:28px 24px 0;text-align:center;background:linear-gradient(#fff 0%,#fff 60%,#f1f8e9 100%);box-shadow:0 20px 60px rgba(0,0,0,.3);transform:translateY(10px);transition:transform .35s ease}"+
 ".nz-ov.on .nz-c{transform:none}.nz-sh{display:flex;justify-content:center;animation:nzSpin 40s linear infinite}@keyframes nzSpin{to{transform:rotate(360deg)}}"+
 ".nz-h{margin-top:14px;font-size:22px;font-weight:700;letter-spacing:-.01em;line-height:1.25;color:#c8102e}.nz-s{margin-top:4px;font-size:12px;letter-spacing:.06em;color:#a8832f;font-weight:600}"+
 ".nz-t{margin-top:12px;font-size:14px;line-height:1.5;color:#3a3a3c}.nz-sig{margin-top:12px;font-size:12px;color:#86868b}"+
 ".nz-b{position:relative;z-index:1;width:100%;margin-top:18px;padding:14px 0;border:0;border-radius:12px;background:#c8102e;color:#fff;font:600 16px/1 inherit;font-family:inherit;cursor:pointer}"+
 ".nz-hl{display:block;margin:4px -24px 0;line-height:0}"+
 "@media (prefers-reduced-motion:no-preference){.nz-ov{transition-duration:.3s!important}.nz-c{transition-duration:.35s!important}.nz-sh{animation-duration:40s!important}}";
 document.head.appendChild(st);
 var ov=document.createElement("div");ov.className="nz-ov";ov.setAttribute("role","dialog");
 ov.innerHTML='<div class="nz-c"><div class="nz-sh">'+SH+'</div><div class="nz-h"></div><div class="nz-s"></div><div class="nz-t"></div><div class="nz-sig"></div><button class="nz-b"></button><div class="nz-hl">'+HL+'</div></div>';
 ov.querySelector(".nz-h").textContent=T.h;ov.querySelector(".nz-s").textContent=T.s;ov.querySelector(".nz-t").textContent=pk(VV,"st_nzv");
 ov.querySelector(".nz-sig").textContent="— "+T.sig;ov.querySelector(".nz-b").textContent=T.btn;
 document.body.appendChild(ov);
 requestAnimationFrame(function(){ov.classList.add("on")});function close(){ov.classList.remove("on");setTimeout(function(){ov.remove()},300)}
 ov.querySelector(".nz-b").onclick=close;ov.addEventListener("click",function(e){if(e.target===ov)close()})}
function run(){setTimeout(go,1500)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",run):run()}();;
