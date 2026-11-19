/* «Армандар орындалады»: отправка мечты (action=submitWish в таблицу), вместо формы — тёплое «спасибо» */
!function(){var b=document.getElementById("dwBtn");if(!b)return;var kk=(document.documentElement.lang||"").indexOf("kk")===0;
var L=kk?{n:"Атыңызды жазыңыз",p:"Телефон нөмірін дұрыс енгізіңіз",t:"Сәл толығырақ жазыңыз",net:"Жіберілмеді, қайталап көріңіз",snd:"Жіберілуде…",btn:"Арманды жіберу",ty:"Сенгеніңіз үшін\u00a0рахмет",ty2:"Арманыңыз бізде. Оны үлкен ықыласпен оқимыз."}
 :{n:"Напишите, как вас зовут",p:"Проверьте номер телефона",t:"Расскажите чуть подробнее",net:"Не получилось отправить, попробуйте ещё раз",snd:"Отправляем…",btn:"Отправить мечту",ty:"Спасибо, что доверились\u00a0нам",ty2:"Ваша мечта уже у нас. Мы прочитаем её очень бережно."};
function g(i){return document.getElementById(i)}
function er(i,m){var e=g(i);e&&(e.textContent=m||"")}
[["dwName","dwNameE"],["dwPhone","dwPhoneE"],["dwText","dwTextE"]].forEach(function(x){var e=g(x[0]);e&&e.addEventListener("input",function(){er(x[1])})});
b.addEventListener("click",function(){var n=g("dwName").value.trim(),p=g("dwPhone").value.trim(),d=g("dwText").value.trim(),ok=true;
 er("dwNameE");er("dwPhoneE");er("dwTextE");
 if(n.length<2){er("dwNameE",L.n);ok=false}
 if(typeof validPhone!=="function"||!validPhone(p)){er("dwPhoneE",L.p);ok=false}
 if(d.length<5){er("dwTextE",L.t);ok=false}
 if(!ok)return;
 if(typeof apiGet!=="function"){er("dwTextE",L.net);return}
 b.disabled=true;b.textContent=L.snd;
 try{logGuestEvent("Армандар орындалады: отправил мечту","")}catch(x){}
 apiGet({action:"submitWish",name:n,phone:p,dream:d},function(){var s=g("dwSec");s.innerHTML='<div class="thanks">'+L.ty+"<span>"+L.ty2+"</span></div>";try{s.scrollIntoView({behavior:"smooth",block:"center"})}catch(x){}},function(){b.disabled=false;b.textContent=L.btn;er("dwTextE",L.net)})});
}();
