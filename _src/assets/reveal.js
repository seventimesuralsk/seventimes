/* Плавное появление блоков при прокрутке и счётчики цифр (страницы «О компании», «Рестораны») */
!function(){
var els=[].slice.call(document.querySelectorAll(".rv"));if(!els.length)return;
var rm=false;try{rm=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
var live={};
function liveCount(el){var u=el.getAttribute("data-live");if(!u)return Promise.resolve();
 if(!live[u])live[u]=fetch(u,{cache:"no-cache"}).then(function(r){return r.json()}).then(function(d){var ids={},n=0;
  Object.keys(d&&d.categories||{}).forEach(function(c){if(/Прибор/.test(c))return;(d.categories[c]||[]).forEach(function(i){var k=String(i&&(i.id||i.name)||"");if(k&&i.name&&!i.teaser&&!ids[k]){ids[k]=1;n++}})});return n}).catch(function(){return 0});
 return live[u].then(function(n){if(n>0)el.setAttribute("data-count",String(n))})}
function count(el){if(el.getAttribute("data-live")&&!el._lv){el._lv=1;var t0=Date.now();liveCount(el).then(function(){if(Date.now()-t0<1500)count(el);else{el.textContent=el.getAttribute("data-count")}});return}
var t=el.getAttribute("data-count")||"",n=parseInt(t,10),suf=t.replace(/^\d+/,"");if(!n)return;if(rm){el.textContent=t;return}var s=null,d=1300;
 function f(ts){s=s||ts;var p=Math.min(1,(ts-s)/d),e=1-Math.pow(1-p,3);el.textContent=Math.round(n*e)+(p>=1?suf:"");p<1&&requestAnimationFrame(f)}el.textContent="0";requestAnimationFrame(f)}
function show(el,i){el.style.setProperty("--rd",(i%6)*0.07+"s");el.classList.remove("rv-wait");el.classList.add("rv-in");[].forEach.call(el.querySelectorAll("[data-count]"),count)}
if(!("IntersectionObserver" in window)||rm){els.forEach(function(e){[].forEach.call(e.querySelectorAll("[data-count]"),count)});return}
var vh=innerHeight,first=[];
els.forEach(function(e){if(e.getBoundingClientRect().top<vh-20)first.push(e);else e.classList.add("rv-wait")});
first.forEach(function(e,i){show(e,i)});
var io=new IntersectionObserver(function(en){var k=0;en.forEach(function(x){if(x.isIntersecting){io.unobserve(x.target);show(x.target,k++)}})},{rootMargin:"0px 0px -8% 0px"});
els.forEach(function(e){if(e.classList.contains("rv-wait"))io.observe(e)});
}();
