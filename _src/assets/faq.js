/* Поддержка в стиле справочника: поиск, баннер, разделы; в разделе вопросы с номерами — ответ раскрывается под вопросом,
   открытие другого вопроса закрывает предыдущий. «Поделиться», «Ответ был полезным?», форма «Забытые вещи» (WhatsApp, только 12:00–01:30). */
!function(){
var D=document,title=D.querySelector(".pg-title"),T0=title?title.textContent:"",depth=0,kk=D.documentElement.lang==="kk";
var WA="77760709898";
var TX=kk?{copied:"Сілтеме көшірілді",thanks:"Пікіріңізге рахмет!",eN:"Атыңызды көрсетіңіз",eP:"Телефон нөмірін дұрыс көрсетіңіз",eB:"Филиалды таңдаңыз",eC:"Затты сипаттаңыз",
  closed:"Қазір жіберу қолжетімсіз. Өтініштер күн сайын 12:00-ден 01:30-ға дейін қабылданады",open:"Жіберу күн сайын 12:00-ден 01:30-ға дейін қолжетімді",btn:"WhatsApp-қа жіберу",btnC:"12:00-ден бастап қолжетімді",
  msg:["Сәлеметсіз бе! Ұмытылған зат бойынша өтініш.","Филиал: ","Аты: ","Телефон: ","Сипаттама: "]}
 :{copied:"Ссылка скопирована",thanks:"Спасибо за отзыв!",eN:"Укажите имя",eP:"Укажите корректный номер телефона",eB:"Выберите филиал",eC:"Опишите вещь",
  closed:"Сейчас отправка недоступна. Обращения принимаются ежедневно с 12:00 до 01:30",open:"Отправка доступна ежедневно с 12:00 до 01:30",btn:"Отправить в WhatsApp",btnC:"Доступно с 12:00",
  msg:["Здравствуйте! Обращение по забытой вещи.","Филиал: ","Имя: ","Телефон: ","Описание: "]};
function $(i){return D.getElementById(i)}
function log(a,b){try{logGuestEvent(a,b)}catch(e){}}
function toast(t){try{showToast(t)}catch(e){}}
function setOpen(it,on){it.classList.toggle("open",on);var b=it.querySelector(".sp-qh");b&&b.setAttribute("aria-expanded",on?"true":"false")}
function openItem(it,scroll){
  var v=it.closest(".sp-v");[].forEach.call(v.querySelectorAll(".sp-it.open"),function(x){x!==it&&setOpen(x,false)});
  setOpen(it,true);log("Поддержка: открыл вопрос",it.getAttribute("data-q"));
  if(scroll)setTimeout(function(){var h=D.querySelector(".pg-head"),off=(h?h.offsetHeight:0)+6,y=it.getBoundingClientRect().top+scrollY-off;window.scrollTo({top:y,behavior:"smooth"})},320);
}
function show(id){
  var t=id?$(id):null,item=null;
  if(t&&t.classList.contains("sp-it")){item=t;t=t.closest(".sp-v")}
  if(!t||!t.classList.contains("sp-v")){t=$("spHome")}
  [].forEach.call(D.querySelectorAll(".sp-v"),function(v){v.hidden=v!==t});
  if(title)title.textContent=t.id==="spHome"?T0:(t.getAttribute("data-t")||T0);
  [].forEach.call(t.querySelectorAll(".sp-it.open"),function(x){x!==item&&setOpen(x,false)});
  if(item){window.scrollTo(0,0);openItem(item,true)}else window.scrollTo(0,0);
}
function route(){show(location.hash.slice(1))}
window.addEventListener("hashchange",route);
D.addEventListener("click",function(e){
  var a=e.target.closest&&e.target.closest('.sp2 a[href*="#"]');if(a){depth++;return}
  var q=e.target.closest&&e.target.closest(".sp-qh");
  if(q){var it=q.parentNode;if(it.classList.contains("open")){setOpen(it,false)}else{openItem(it,true)}
    var id=it.getAttribute("data-ref")||it.id;if(!it.getAttribute("data-ref"))history.replaceState(null,"",location.pathname+location.search+"#"+it.closest(".sp-v").id);return}
  var sh=e.target.closest&&e.target.closest(".sp-share");
  if(sh){var it2=sh.closest(".sp-it"),ref=it2.getAttribute("data-ref")||it2.id,u=location.origin+location.pathname+"#"+ref,qq=it2.getAttribute("data-q");
    log("Поддержка: поделился",qq);
    if(navigator.share){navigator.share({title:qq,text:qq,url:u}).catch(function(){})}
    else if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){toast(TX.copied)},function(){})}
    return}
  var fb=e.target.closest&&e.target.closest(".sp-fb button");
  if(fb){var box=fb.closest(".sp-fb"),it3=box.closest(".sp-it"),yes=fb.getAttribute("data-v")==="1";
    log("Поддержка: ответ "+(yes?"полезен":"не полезен"),it3.getAttribute("data-q"));
    try{localStorage.setItem("st_fb_"+(it3.getAttribute("data-ref")||it3.id),yes?"1":"0")}catch(x){}
    box.classList.add("done");box.innerHTML="";var p=D.createElement("p");p.textContent=TX.thanks;box.appendChild(p);return}
},false);
[].forEach.call(D.querySelectorAll(".sp-it"),function(it){var k=null;try{k=localStorage.getItem("st_fb_"+(it.getAttribute("data-ref")||it.id))}catch(e){}
  if(k!==null){var box=it.querySelector(".sp-fb");if(box){box.classList.add("done");box.innerHTML="";var p=D.createElement("p");p.textContent=TX.thanks;box.appendChild(p)}}});
window.spBack=function(){
  var h=location.hash.slice(1);
  if(!h||!$(h)){try{goBack()}catch(e){location.href="./"}return}
  if(depth>0){depth--;history.back();return}
  history.replaceState(null,"",location.pathname+location.search);route();
};
// поиск
var q=$("spQ"),res=$("spRes"),main=$("spMain"),idx=[];
[].forEach.call(D.querySelectorAll(".sp-acc:not(#stop) .sp-it"),function(v){idx.push({id:v.id,q:v.getAttribute("data-q"),t:(v.textContent||"").toLowerCase().replace(/ё/g,"е")})});
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
// баннер
var bn=$("spBn"),dots=$("spDots"),cur=0,tm=null;
function setDot(i){if(!dots)return;[].forEach.call(dots.children,function(d,k){d.className=k===i?"on":""});cur=i}
if(bn){
  bn.addEventListener("scroll",function(){var w=bn.clientWidth+10;setDot(Math.round(bn.scrollLeft/w))},{passive:true});
  var go=function(){if(D.hidden||!bn.offsetParent)return;var n=bn.children.length,i=(cur+1)%n;bn.scrollTo({left:i*(bn.clientWidth+10),behavior:"smooth"})};
  var start=function(){clearInterval(tm);tm=setInterval(go,4500)};
  bn.addEventListener("touchstart",function(){clearInterval(tm)},{passive:true});
  bn.addEventListener("touchend",start,{passive:true});start();
}
// форма «Забытые вещи»: только 12:00–01:30 по Уральску
var lf=$("spLost");
function kzMin(){var d=new Date(Date.now()+18e6);return d.getUTCHours()*60+d.getUTCMinutes()}
function lfOpen(){var m=kzMin();return m>=720||m<90}
function lfGate(){if(!lf)return;var o=lfOpen();lf.classList.toggle("closed",!o);
  [].forEach.call(lf.querySelectorAll(".sp-in,.sp-lf-btn"),function(x){x.disabled=!o});
  $("lfS").textContent=o?TX.btn:TX.btnC;$("lfT").textContent=o?TX.open:TX.closed}
if(lf){lfGate();setInterval(lfGate,30000);
  $("lfS").addEventListener("click",function(){
    if(!lfOpen()){lfGate();return}
    var n=$("lfN").value.trim(),p=$("lfP").value.trim(),b=$("lfB").value,c=$("lfC").value.trim(),E=$("lfE"),ok=function(){try{return validPhone(p)}catch(e){return p.replace(/\D/g,"").length===11}}();
    E.textContent=n.length<2?TX.eN:!ok?TX.eP:!b?TX.eB:c.length<5?TX.eC:"";if(E.textContent)return;
    var m=TX.msg,txt=m[0]+"\n\n"+m[1]+b+"\n"+m[2]+n+"\n"+m[3]+p+"\n"+m[4]+c;
    log("Поддержка: забытая вещь",b);
    var a=D.createElement("a");a.href="https://wa.me/"+WA+"?text="+encodeURIComponent(txt);a.target="_blank";a.rel="noopener noreferrer";D.body.appendChild(a);a.click();D.body.removeChild(a);
  })}
route();
}();
