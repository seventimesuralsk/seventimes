
/* «Сервисы»: профиль и история; «повторить заказ» — в меню */
function repeatOrder(i){goPage("./?repeat="+i)}
!function(){function go(){logInterestStat("tab_services");var s=document.getElementById("servicesScreen");s&&(s.style.display="flex");renderServicesProfileRow()}
 onReady(go)}();
