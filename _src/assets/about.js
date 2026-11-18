/* «О компании»: приветствие, анимации на прокрутке, живой счётчик позиций, лента блюд */
!function(){
var root=document.querySelector(".ap");if(!root)return;
var pre=root.getAttribute("data-pre")||"";
var rm=false;try{rm=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
document.documentElement.classList.add("ap-js");
var menuP=null;
function menu(){if(!menuP)menuP=fetch(pre+"menu/samal.json",{cache:"no-cache"}).then(function(r){return r.json()}).catch(function(){return null});return menuP}
function countItems(d){var ids={},n=0;Object.keys(d&&d.categories||{}).forEach(function(c){if(/Прибор/.test(c))return;(d.categories[c]||[]).forEach(function(i){var k=String(i&&(i.id||i.name)||"");if(k&&i.name&&!i.teaser&&!ids[k]){ids[k]=1;n++}})});return n}
function plural(n,f){f=f.split("|");var a=n%10,b=n%100;return f[a===1&&b!==11?0:a>=2&&a<=4&&(b<10||b>=20)?1:2]}
function setPl(el,n){var w=el.parentNode&&el.parentNode.querySelector("[data-pl]");if(w)w.textContent=plural(n,w.getAttribute("data-pl"))}
var live=root.querySelector("[data-live]");
if(live)menu().then(function(d){var n=countItems(d);if(n>0){live.setAttribute("data-count",String(n));if(live._done||rm){live.textContent=String(n)}setPl(live,n)}});
function count(el){if(el._c)return;el._c=1;var n=parseInt(el.getAttribute("data-count"),10);if(!n)return;if(rm){el.textContent=n;return}
 var s=null,d=1400;function f(ts){s=s||ts;var p=Math.min(1,(ts-s)/d),e=1-Math.pow(1-p,3),m=parseInt(el.getAttribute("data-count"),10)||n;el.textContent=Math.round(m*e);if(p<1)requestAnimationFrame(f);else{el._done=1;el.textContent=m}}el.textContent="0";requestAnimationFrame(f)}
/* лента блюд из живого меню */
menu().then(function(d){var ids=[],seen={};Object.keys(d&&d.categories||{}).forEach(function(c){if(/Прибор/.test(c))return;(d.categories[c]||[]).forEach(function(i){var u=String(i&&i.photo||""),m=u.match(/\/d\/([a-zA-Z0-9_-]{20,})/)||u.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);if(m&&!seen[m[1]]&&!i.teaser&&!i.stopped){seen[m[1]]=1;ids.push(m[1])}})});
 if(ids.length<6)return;for(var j=ids.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1)),t=ids[j];ids[j]=ids[k];ids[k]=t}
 ids=ids.slice(0,24);var half=Math.ceil(ids.length/2);
 [["apMq1",ids.slice(0,half)],["apMq2",ids.slice(half)]].forEach(function(r){var box=document.getElementById(r[0]);if(!box||!r[1].length)return;var h="";
  r[1].concat(r[1]).forEach(function(id){h+='<img src="'+pre+"img/m/"+id+'-400.webp" alt="" loading="lazy" decoding="async">'});box.innerHTML=h;
  [].forEach.call(box.querySelectorAll("img"),function(im){im.onerror=function(){im.remove()}})})});
/* появление блоков */
var rv=[].slice.call(root.querySelectorAll(".ap-rv"));
if(rm||!("IntersectionObserver" in window))rv.forEach(function(e){e.classList.add("in")});
else{var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){io.unobserve(x.target);x.target.classList.add("in")}})},{rootMargin:"0px 0px -10% 0px"});rv.forEach(function(e){io.observe(e)})}
/* прокрутка: приветствие, фото, слова */
var hero=root.querySelector(".ap-hero"),sc=root.querySelector(".ap-scale"),wd=root.querySelector(".ap-words"),lines=wd?[].slice.call(wd.querySelectorAll(".ap-w")):[];
function prog(el){var r=el.getBoundingClientRect(),h=r.height-innerHeight;return h>0?Math.max(0,Math.min(1,-r.top/h)):(r.top<0?1:0)}
if(rm){lines.forEach(function(l){l.classList.add("on");[].forEach.call(l.querySelectorAll("[data-count]"),count)});if(sc)sc.style.setProperty("--p","1");return}
var tick=false;
function upd(){tick=false;
 if(hero){var hr=hero.getBoundingClientRect(),hp=Math.max(0,Math.min(1,-hr.top/Math.max(1,hr.height)));hero.style.setProperty("--hp",hp.toFixed(3))}
 if(sc)sc.style.setProperty("--p",prog(sc).toFixed(3));
 if(wd){var wr=wd.getBoundingClientRect(),p=wr.top>innerHeight*.3?-1:prog(wd),n=lines.length;lines.forEach(function(l,i){var on=p>=(i/n)*.92-.02;if(on&&!l.classList.contains("on")){l.classList.add("on");[].forEach.call(l.querySelectorAll("[data-count]"),count)}else if(!on&&l.classList.contains("on"))l.classList.remove("on")})}}
function req(){if(!tick){tick=true;requestAnimationFrame(upd)}}
addEventListener("scroll",req,{passive:true});addEventListener("resize",req);upd();
}();
