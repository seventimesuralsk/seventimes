var _0x6c053=["ZHJlYW1Qcm9ncmVzc1Jvdw==","I2RyZWFtU3Rvcmllc092IC5zdG9yaWVzLXNsaWRl","","ZGl2","c3Rvcmllcy1wcm9ncmVzcy10cmFjaw==","ZGl2","c3Rvcmllcy1wcm9ncmVzcy1maWxs","ZHJlYW1XaXNoTmFtZQ==","ZHJlYW1XaXNoUGhvbmU=","ZHJlYW1XaXNoVGV4dA==","","Kzcg","","ZHJlYW1XaXNoTmFtZUVycg==","ZHJlYW1XaXNoUGhvbmVFcnI=","ZHJlYW1XaXNoVGV4dEVycg==","","ZHJlYW1XaXNoU3VibWl0QnRu","0J/QvtC00LXQu9C40YLRjNGB0Y8=","ZHJlYW1XaXNoRm9ybQ==","bm9uZQ==","ZHJlYW1TaGFrZSAuNHM=","I2RyZWFtU3Rvcmllc092IC5zdG9yaWVzLXNsaWRl","YWN0aXZl","I2RyZWFtU3Rvcmllc092IC5zdG9yaWVzLXByb2dyZXNzLWZpbGw=","YW5pbQ==","ZG9uZQ==","MCU=","ZG9uZQ==","","I2RyZWFtU3Rvcmllc092IC5zdG9yaWVzLXByb2dyZXNzLWZpbGxbZGF0YS1pPSI=","Il0=","ZG9uZQ==","","","bXM=","YW5pbQ==","ZHJlYW1XaXNoTmFtZQ==","I2RyZWFtU3Rvcmllc092IC5zdG9yaWVzLXByb2dyZXNzLWZpbGxbZGF0YS1pPSI=","Il0=","cGF1c2Vk","I2RyZWFtU3Rvcmllc092IC5zdG9yaWVzLXByb2dyZXNzLWZpbGxbZGF0YS1pPSI=","Il0=","cnVubmluZw==","bXM=","cnVubmluZw==","ZHJlYW1TdG9yaWVzT3Y=","0J7RgtC60YDRi9C7INGB0LXRgNCy0LjRgQ==","0J/RgNC+0LXQutGCINCQ0YDQvNCw0L3QtNCw0YAg0L7RgNGL0L3QtNCw0LvQsNC00Ys=","cHJvbW9DYXJkLWRyZWFt","c2Vlbg==","LnN0b3JpZXMtc2xpZGVbZGF0YS1zbGlkZT0iMiJd","YmxvY2s=","b3Blbg==","ZHJlYW1TdG9yaWVzT3Y=","b3Blbg==","b3Blbg==","bm9uZQ==","","ZHJlYW1XaXNoTmFtZQ==","ZHJlYW1XaXNoUGhvbmU=","ZHJlYW1XaXNoVGV4dA==","ZHJlYW1XaXNoTmFtZUVycg==","","ZHJlYW1XaXNoUGhvbmVFcnI=","","ZHJlYW1XaXNoVGV4dEVycg==","","ZHJlYW1XaXNoTmFtZUVycg==","0JLQstC10LTQuNGC0LUg0LjQvNGP","ZHJlYW1XaXNoUGhvbmVFcnI=","ZXJyX3Bob25l","ZHJlYW1XaXNoVGV4dEVycg==","0J7Qv9C40YjQuNGC0LUg0YfRg9GC0Ywg0L/QvtC00YDQvtCx0L3QtdC1","ZHJlYW1XaXNoU3VibWl0QnRu","0J7RgtC/0YDQsNCy0LvRj9C10LzigKY=","c3VibWl0V2lzaA==","0J/QvtC00LXQu9C40YLRjNGB0Y8=","ZHJlYW1XaXNoVGV4dEVycg==","0J3QtSDQv9C+0LvRg9GH0LjQu9C+0YHRjCDQvtGC0L/RgNCw0LLQuNGC0YwsINC/0L7Qv9GA0L7QsdGD0LnRgtC1INC10YnRkSDRgNCw0Lc=","I2RyZWFtU3Rvcmllc092IC5zdG9yaWVzLXNsaWRlLmFjdGl2ZQ==","PGRpdiBjbGFzcz0iZHJlYW0tdGhhbmt5b3UtdGV4dCI+0KHQv9Cw0YHQuNCx0L4sINGH0YLQviDQv9C+0LTQtdC70LjQu9C40YHRjDwvZGl2Pg=="],_0x6c4da=[];
function _0xf9f73(i){return _0x6c4da[i]!==undefined?_0x6c4da[i]:(_0x6c4da[i]=decodeURIComponent(escape(atob(_0x6c053[i]))))}
var DREAM_STORY_DURATION = 5e3, _dreamStoryIdx = 0, _dreamStoryTimer = null, _dreamStoryTotal = 0, _dreamHoldStart = 0, _dreamLongPress = false, _dreamWishSubmitted = false, _dreamShowingThankYou = false;
;
function buildDreamStoriesProgress() { var e = document.getElementById(_0xf9f73(0x0)); if (e) {
    _dreamStoryTotal = document.querySelectorAll(_0xf9f73(0x1)).length, e.innerHTML = _0xf9f73(0x2);
    for (var t2 = 0; t2 < _dreamStoryTotal; t2++) {
        var n = document.createElement(_0xf9f73(0x3));
        n.className = _0xf9f73(0x4);
        var o = document.createElement(_0xf9f73(0x5));
        o.className = _0xf9f73(0x6), o.dataset.i = t2, n.appendChild(o), e.appendChild(n);
    }
} }
;
function dreamScheduleAdvance(e) { clearTimeout(_dreamStoryTimer), _dreamStoryIdx >= _dreamStoryTotal - 1 || (_dreamStoryTimer = setTimeout(dreamStoryAdvance, e)); }
;
function resetDreamWishForm() { _dreamWishSubmitted = false; var e = document.getElementById(_0xf9f73(0x7)), t2 = document.getElementById(_0xf9f73(0x8)), n = document.getElementById(_0xf9f73(0x9)); e && (e.value = _0xf9f73(0xa)), t2 && (t2.value = _0xf9f73(0xb)), n && (n.value = _0xf9f73(0xc)), [_0xf9f73(0xd), _0xf9f73(0xe), _0xf9f73(0xf)].forEach(function (e2) { var t3 = document.getElementById(e2); t3 && (t3.textContent = _0xf9f73(0x10)); }); var o = document.getElementById(_0xf9f73(0x11)); o && (o.disabled = false, o.textContent = _0xf9f73(0x12)); }
;
function shakeDreamModal() { var e = document.getElementById(_0xf9f73(0x13)); e && (e.style.animation = _0xf9f73(0x14), e.offsetWidth, e.style.animation = _0xf9f73(0x15)); }
;
function renderDreamStorySlide() { document.querySelectorAll(_0xf9f73(0x16)).forEach(function (e2, t3) { e2.classList.toggle(_0xf9f73(0x17), t3 === _dreamStoryIdx); }); var e = _dreamStoryIdx === _dreamStoryTotal - 1; document.querySelectorAll(_0xf9f73(0x18)).forEach(function (e2) { var t3 = parseInt(e2.dataset.i, 10); e2.classList.remove(_0xf9f73(0x19), _0xf9f73(0x1a)), e2.style.width = _0xf9f73(0x1b), t3 < _dreamStoryIdx && (e2.classList.add(_0xf9f73(0x1c)), e2.style.width = _0xf9f73(0x1d)); }); var t2 = document.querySelector(_0xf9f73(0x1e) + _dreamStoryIdx + _0xf9f73(0x1f)); t2 && (e ? (t2.classList.add(_0xf9f73(0x20)), t2.style.width = _0xf9f73(0x21)) : (t2.offsetWidth, t2.style.width = _0xf9f73(0x22), t2.style.animationDuration = DREAM_STORY_DURATION + _0xf9f73(0x23), t2.classList.add(_0xf9f73(0x24)))), e && setTimeout(function () { var e2 = document.getElementById(_0xf9f73(0x25)); e2 && e2.focus(); }, 400); }
;
function dreamStoryAdvance() { clearTimeout(_dreamStoryTimer), _dreamStoryIdx >= _dreamStoryTotal - 1 ? closeDreamStories() : (_dreamStoryIdx++, renderDreamStorySlide(), dreamScheduleAdvance(DREAM_STORY_DURATION)); }
;
function dreamPauseStart() { _dreamHoldStart = Date.now(), _dreamLongPress = false, clearTimeout(_dreamStoryTimer); var e = document.querySelector(_0xf9f73(0x26) + _dreamStoryIdx + _0xf9f73(0x27)); e && (e.style.animationPlayState = _0xf9f73(0x28)); }
;
function dreamPauseEnd() { var e = document.querySelector(_0xf9f73(0x29) + _dreamStoryIdx + _0xf9f73(0x2a)); if (Date.now() - _dreamHoldStart < 250)
    e && (e.style.animationPlayState = _0xf9f73(0x2b));
else if (_dreamLongPress = true, !(_dreamStoryIdx >= _dreamStoryTotal - 1)) {
    var t2 = DREAM_STORY_DURATION;
    if (e) {
        var n = e.parentElement.getBoundingClientRect().width, o = n ? e.getBoundingClientRect().width / n : 0;
        t2 = Math.max(300, DREAM_STORY_DURATION * (1 - o)), e.style.animationDuration = t2 + _0xf9f73(0x2c), e.style.animationPlayState = _0xf9f73(0x2d);
    }
    dreamScheduleAdvance(t2);
} }
;
function dreamStoriesNext() { if (_dreamLongPress)
    _dreamLongPress = false;
else if (!_dreamShowingThankYou) {
    if (clearTimeout(_dreamStoryTimer), _dreamStoryIdx >= _dreamStoryTotal - 1)
        return _dreamWishSubmitted ? void 0 : void shakeDreamModal();
    _dreamStoryIdx++, renderDreamStorySlide(), dreamScheduleAdvance(DREAM_STORY_DURATION);
} }
;
function dreamStoriesPrev() { _dreamLongPress ? _dreamLongPress = false : _dreamShowingThankYou || (clearTimeout(_dreamStoryTimer), _dreamStoryIdx = Math.max(0, _dreamStoryIdx - 1), renderDreamStorySlide(), dreamScheduleAdvance(DREAM_STORY_DURATION)); }
;
var _dreamFormSlideHTML = null;
;
function openDreamStories() { var e = document.getElementById(_0xf9f73(0x2e)); if (e) {
    logGuestEvent(_0xf9f73(0x2f), _0xf9f73(0x30)), _promoSeen.dream = true;
    var t2 = document.getElementById(_0xf9f73(0x31));
    t2 && t2.classList.add(_0xf9f73(0x32));
    var n = e.querySelector(_0xf9f73(0x33));
    n && (null === _dreamFormSlideHTML ? _dreamFormSlideHTML = n.innerHTML : n.innerHTML = _dreamFormSlideHTML), _dreamShowingThankYou = false, buildDreamStoriesProgress(), _dreamStoryIdx = 0, resetDreamWishForm(), e.style.display = _0xf9f73(0x34), lockBodyScroll(), e.offsetWidth, requestAnimationFrame(function () { e.classList.add(_0xf9f73(0x35)), renderDreamStorySlide(), dreamScheduleAdvance(DREAM_STORY_DURATION); });
} }
;
function closeDreamStories() { var e = document.getElementById(_0xf9f73(0x36)); e && (clearTimeout(_dreamStoryTimer), e.classList.remove(_0xf9f73(0x37)), unlockBodyScroll(), setTimeout(function () { e.classList.contains(_0xf9f73(0x38)) || (e.style.display = _0xf9f73(0x39)); }, 0)); }
;
function dreamOnlyLetters(e) { e.value = e.value.replace(/[^A-Za-zА-Яа-яЁёІіӘәҒғҚқҢңӨөҰұҮүҺһ\s-]/g, _0xf9f73(0x3a)); }
;
function submitDreamWish() { var e = document.getElementById(_0xf9f73(0x3b)).value.trim(), n = document.getElementById(_0xf9f73(0x3c)).value.trim(), o = document.getElementById(_0xf9f73(0x3d)).value.trim(), r = true; if (document.getElementById(_0xf9f73(0x3e)).textContent = _0xf9f73(0x3f), document.getElementById(_0xf9f73(0x40)).textContent = _0xf9f73(0x41), document.getElementById(_0xf9f73(0x42)).textContent = _0xf9f73(0x43), e.length < 2 && (document.getElementById(_0xf9f73(0x44)).textContent = _0xf9f73(0x45), r = false), validPhone(n) || (document.getElementById(_0xf9f73(0x46)).textContent = t(_0xf9f73(0x47)), r = false), o.length < 5 && (document.getElementById(_0xf9f73(0x48)).textContent = _0xf9f73(0x49), r = false), r) {
    var a = document.getElementById(_0xf9f73(0x4a));
    a.disabled = true, a.textContent = _0xf9f73(0x4b), apiGet({ action: _0xf9f73(0x4c), name: e, phone: n, dream: o }, function () { _dreamWishSubmitted = true, showDreamThankYou(); }, function (e2) { a.disabled = false, a.textContent = _0xf9f73(0x4d), document.getElementById(_0xf9f73(0x4e)).textContent = e2 || _0xf9f73(0x4f), shakeDreamModal(); });
}
else
    shakeDreamModal(); }
;
function showDreamThankYou() { clearTimeout(_dreamStoryTimer), _dreamShowingThankYou = true; var e = document.querySelector(_0xf9f73(0x50)); e && (e.innerHTML = _0xf9f73(0x51), setTimeout(function () { closeDreamStories(); }, 3e3)); }
;
!function () { var _c = closeDreamStories; closeDreamStories = function () { _c.apply(this, arguments); goBack(); }; function go() { openDreamStories(); } onReady(go); }();
