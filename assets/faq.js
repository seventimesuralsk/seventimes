var _0x1be33=["LnBnLXRpdGxl","","c3Atdg==","c3BIb21l","LnNwLXY=","c3BIb21l","ZGF0YS10","c3AtcXY=","0J/QvtC00LTQtdGA0LbQutCwOiDQvtGC0LrRgNGL0Lsg0LLQvtC/0YDQvtGB","ZGF0YS1x","aGFzaGNoYW5nZQ==","Y2xpY2s=","LnNwMiBhW2hyZWYqPSIjIl0=","Li8=","ZGF0YS1w","","","Iw==","","c3BR","c3BSZXM=","c3BNYWlu","LnNwLXF2","ZGF0YS1x","","0LU=","","0LU=","","YQ==","c3Atcm93","ZmFxLyM=","c3Bhbg==","c3AtcnQ=","aQ==","c3AtY2g=","cA==","c3Atbm9uZQ==","ZGF0YS1ub25l","aW5wdXQ=","c3BCbg==","c3BEb3Rz","b24=","","c2Nyb2xs","c21vb3Ro","dG91Y2hzdGFydA==","dG91Y2hlbmQ="],_0xf07a4=[];
function _0xda632(i){return _0xf07a4[i]!==undefined?_0xf07a4[i]:(_0xf07a4[i]=decodeURIComponent(escape(atob(_0x1be33[i]))))}
!function () {
    var D = document, title = D.querySelector(_0xda632(0x0)), T0 = title ? title.textContent : _0xda632(0x1), depth = 0;
    function $(i) { return D.getElementById(i); }
    function show(id) {
        var t = id ? $(id) : null;
        if (!t || !t.classList.contains(_0xda632(0x2))) {
            id = _0xda632(0x3);
            t = $(id);
        }
        [].forEach.call(D.querySelectorAll(_0xda632(0x4)), function (v) { v.hidden = v !== t; });
        if (title)
            title.textContent = id === _0xda632(0x5) ? T0 : (t.getAttribute(_0xda632(0x6)) || T0);
        window.scrollTo(0, 0);
        if (t.classList.contains(_0xda632(0x7))) {
            try {
                logGuestEvent(_0xda632(0x8), t.getAttribute(_0xda632(0x9)));
            }
            catch (e) { }
        }
    }
    function route() { show(location.hash.slice(1)); }
    window.addEventListener(_0xda632(0xa), route);
    D.addEventListener(_0xda632(0xb), function (e) { var a = e.target.closest && e.target.closest(_0xda632(0xc)); if (a)
        depth++; }, true);
    window.spBack = function () {
        var h = location.hash.slice(1);
        if (!h || !$(h)) {
            try {
                goBack();
            }
            catch (e) {
                location.href = _0xda632(0xd);
            }
            return;
        }
        if (depth > 0) {
            depth--;
            history.back();
            return;
        }
        var p = $(h).getAttribute(_0xda632(0xe)) || _0xda632(0xf);
        history.replaceState(null, _0xda632(0x10), location.pathname + location.search + (p ? _0xda632(0x11) + p : _0xda632(0x12)));
        route();
    };
    var q = $(_0xda632(0x13)), res = $(_0xda632(0x14)), main = $(_0xda632(0x15)), idx = [];
    [].forEach.call(D.querySelectorAll(_0xda632(0x16)), function (v) { idx.push({ id: v.id, q: v.getAttribute(_0xda632(0x17)), t: (v.textContent || _0xda632(0x18)).toLowerCase().replace(/ё/g, _0xda632(0x19)) }); });
    function search() {
        var s = (q.value || _0xda632(0x1a)).trim().toLowerCase().replace(/ё/g, _0xda632(0x1b));
        if (!s) {
            res.hidden = true;
            main.hidden = false;
            return;
        }
        main.hidden = true;
        res.hidden = false;
        res.innerHTML = _0xda632(0x1c);
        var w = s.split(/\s+/), n = 0;
        idx.forEach(function (x) {
            if (w.every(function (k) { return x.t.indexOf(k) >= 0; })) {
                var a = D.createElement(_0xda632(0x1d));
                a.className = _0xda632(0x1e);
                a.href = _0xda632(0x1f) + x.id;
                var r = D.createElement(_0xda632(0x20));
                r.className = _0xda632(0x21);
                r.textContent = x.q;
                var c = D.createElement(_0xda632(0x22));
                c.className = _0xda632(0x23);
                a.appendChild(r);
                a.appendChild(c);
                res.appendChild(a);
                n++;
            }
        });
        if (!n) {
            var e = D.createElement(_0xda632(0x24));
            e.className = _0xda632(0x25);
            e.textContent = res.getAttribute(_0xda632(0x26));
            res.appendChild(e);
        }
    }
    q && q.addEventListener(_0xda632(0x27), search);
    var bn = $(_0xda632(0x28)), dots = $(_0xda632(0x29)), cur = 0, tm = null;
    function setDot(i) { if (!dots)
        return; [].forEach.call(dots.children, function (d, k) { d.className = k === i ? _0xda632(0x2a) : _0xda632(0x2b); }); cur = i; }
    if (bn) {
        bn.addEventListener(_0xda632(0x2c), function () { var w = bn.clientWidth + 10; setDot(Math.round(bn.scrollLeft / w)); }, { passive: true });
        var go = function () { if (D.hidden || !bn.offsetParent)
            return; var n = bn.children.length, i = (cur + 1) % n; bn.scrollTo({ left: i * (bn.clientWidth + 10), behavior: _0xda632(0x2d) }); };
        var start = function () { clearInterval(tm); tm = setInterval(go, 4500); };
        bn.addEventListener(_0xda632(0x2e), function () { clearInterval(tm); }, { passive: true });
        bn.addEventListener(_0xda632(0x2f), start, { passive: true });
        start();
    }
    route();
}();
