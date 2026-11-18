/* Поддержка в стиле справочника: поиск, баннер, разделы → вопросы → ответ. Переходы через #адрес (кнопка «назад» работает). */
!function(){
var D=document,title=D.querySelector(".pg-title"),T0=title?title.textContent:"",depth=0;
function $(i){return D.getElementById(i)}
function show(id){
  var t=id?$(id):null;if(!t||!t.classList.contains("sp-v")){id="spHome";t=$(id)}
  [].forEach.call(D.querySelectorAll(".sp-v"),function(v){v.hidden=v!==t});
  if(title)title.textContent=id==="spHome"?T0:(t.getAttribute("data-t")||T0);
  window.scrollTo(0,0);
  if(t.classList.contains("sp-qv")){try{logGuestEvent("Поддержка: открыл вопрос",t.getAttribute("data-q"))}catch(e){}}
}
function route(){show(location.hash.slice(1))}
window.addEventListener("hashchange",route);
D.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('.sp2 a[href*="#"]');if(a)depth++},true);
window.spBack=function(){
  var h=location.hash.slice(1);
  if(!h||!$(h)){try{goBack()}catch(e){location.href="./"}return}
  if(depth>0){depth--;history.back();return}
  var p=$(h).getAttribute("data-p")||"";
  history.replaceState(null,"",location.pathname+location.search+(p?"#"+p:""));route();
};
// поиск
var q=$("spQ"),res=$("spRes"),main=$("spMain"),idx=[];
[].forEach.call(D.querySelectorAll(".sp-qv"),function(v){idx.push({id:v.id,q:v.getAttribute("data-q"),t:(v.textContent||"").toLowerCase().replace(/ё/g,"е")})});
function search(){
  var s=(q.value||"").trim().toLowerCase().replace(/ё/g,"е");
  if(!s){res.hidden=true;main.hidden=false;return}
  main.hidden=true;res.hidden=false;res.innerHTML="";
  var w=s.split(/\s+/),n=0;
  idx.forEach(function(x){if(w.every(function(k){return x.t.indexOf(k)>=0})){
    var a=D.createElement("a");a.className="sp-row";a.href="faq/#"+x.id;
    var r=D.createElement("span");r.className="sp-rt";r.textContent=x.q;var c=D.createElement("i");c.className="sp-ch";
    a.appendChild(r);a.appendChild(c);res.appendChild(a);n++}});
  if(!n){var e=D.createElement("p");e.className="sp-none";e.textContent=res.getAttribute("data-none");res.appendChild(e)}
}
q&&q.addEventListener("input",search);
// баннер: точки + автопрокрутка
var bn=$("spBn"),dots=$("spDots"),cur=0,tm=null;
function setDot(i){if(!dots)return;[].forEach.call(dots.children,function(d,k){d.className=k===i?"on":""});cur=i}
if(bn){
  bn.addEventListener("scroll",function(){var w=bn.clientWidth+10;setDot(Math.round(bn.scrollLeft/w))},{passive:true});
  var go=function(){if(D.hidden||!bn.offsetParent)return;var n=bn.children.length,i=(cur+1)%n;bn.scrollTo({left:i*(bn.clientWidth+10),behavior:"smooth"})};
  var start=function(){clearInterval(tm);tm=setInterval(go,4500)};
  bn.addEventListener("touchstart",function(){clearInterval(tm)},{passive:true});
  bn.addEventListener("touchend",start,{passive:true});
  start();
}
route();
}();
