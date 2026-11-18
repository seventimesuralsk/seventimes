var _0xf5f8f=["LnJ2","KHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSk=","ZGF0YS1saXZl","bm8tY2FjaGU=","","ZGF0YS1jb3VudA==","ZGF0YS1saXZl","ZGF0YS1jb3VudA==","ZGF0YS1jb3VudA==","","","","MA==","LS1yZA==","cw==","cnYtd2FpdA==","cnYtaW4=","W2RhdGEtY291bnRd","SW50ZXJzZWN0aW9uT2JzZXJ2ZXI=","W2RhdGEtY291bnRd","cnYtd2FpdA==","MHB4IDBweCAtOCUgMHB4","cnYtd2FpdA=="],_0xa529f=[];
function _0x28d50(i){return _0xa529f[i]!==undefined?_0xa529f[i]:(_0xa529f[i]=decodeURIComponent(escape(atob(_0xf5f8f[i]))))}
!function () {
    var els = [].slice.call(document.querySelectorAll(_0x28d50(0x0)));
    if (!els.length)
        return;
    var rm = false;
    try {
        rm = matchMedia(_0x28d50(0x1)).matches;
    }
    catch (e) { }
    var live = {};
    function liveCount(el) {
        var u = el.getAttribute(_0x28d50(0x2));
        if (!u)
            return Promise.resolve();
        if (!live[u])
            live[u] = fetch(u, { cache: _0x28d50(0x3) }).then(function (r) { return r.json(); }).then(function (d) {
                var ids = {}, n = 0;
                Object.keys(d && d.categories || {}).forEach(function (c) { if (/Прибор/.test(c))
                    return; (d.categories[c] || []).forEach(function (i) { var k = String(i && (i.id || i.name) || _0x28d50(0x4)); if (k && i.name && !i.teaser && !ids[k]) {
                    ids[k] = 1;
                    n++;
                } }); });
                return n;
            }).catch(function () { return 0; });
        return live[u].then(function (n) { if (n > 0)
            el.setAttribute(_0x28d50(0x5), String(n)); });
    }
    function count(el) {
        if (el.getAttribute(_0x28d50(0x6)) && !el._lv) {
            el._lv = 1;
            var t0 = Date.now();
            liveCount(el).then(function () { if (Date.now() - t0 < 1500)
                count(el);
            else {
                el.textContent = el.getAttribute(_0x28d50(0x7));
            } });
            return;
        }
        var t = el.getAttribute(_0x28d50(0x8)) || _0x28d50(0x9), n = parseInt(t, 10), suf = t.replace(/^\d+/, _0x28d50(0xa));
        if (!n)
            return;
        if (rm) {
            el.textContent = t;
            return;
        }
        var s = null, d = 1300;
        function f(ts) { s = s || ts; var p = Math.min(1, (ts - s) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(n * e) + (p >= 1 ? suf : _0x28d50(0xb)); p < 1 && requestAnimationFrame(f); }
        el.textContent = _0x28d50(0xc);
        requestAnimationFrame(f);
    }
    function show(el, i) { el.style.setProperty(_0x28d50(0xd), (i % 6) * 0.07 + _0x28d50(0xe)); el.classList.remove(_0x28d50(0xf)); el.classList.add(_0x28d50(0x10)); [].forEach.call(el.querySelectorAll(_0x28d50(0x11)), count); }
    if (!(_0x28d50(0x12) in window) || rm) {
        els.forEach(function (e) { [].forEach.call(e.querySelectorAll(_0x28d50(0x13)), count); });
        return;
    }
    var vh = innerHeight, first = [];
    els.forEach(function (e) { if (e.getBoundingClientRect().top < vh - 20)
        first.push(e);
    else
        e.classList.add(_0x28d50(0x14)); });
    first.forEach(function (e, i) { show(e, i); });
    var io = new IntersectionObserver(function (en) { var k = 0; en.forEach(function (x) { if (x.isIntersecting) {
        io.unobserve(x.target);
        show(x.target, k++);
    } }); }, { rootMargin: _0x28d50(0x15) });
    els.forEach(function (e) { if (e.classList.contains(_0x28d50(0x16)))
        io.observe(e); });
}();
