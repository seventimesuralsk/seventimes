var _0xa72fe=["LnB6","cHotanM=","","a2s=","ZGF0YS1raW5k","KHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSk=","SEVBRA==","bm8tc3RvcmU=","RGF0ZQ==","","LQ==","0LrSr9C9","0YHQsNKT","0LzQuNC9","0YHQtdC6","0JbQsNKb0YvQvdC00LA=","0JTTmdC7INKb0LDQt9GW0YAg0LbSr9GA0ZbQvyDQttCw0YLRi9GA","0JbQsNC70pPQsNGB0Ysg4oCUIDE0OjAwLdC00LXQvQ==","0JDRj9Kb0YLQsNC70LTRiw==","MTg6MDAt0LPQtSDQtNC10LnRltC9","06nRgtGC0ZY=","0pvQsNC30ZbRgA==","0LDQu9C00LA=","0JHSr9Cz0ZbQvSAxODowMC3Qs9C1INC00LXQudGW0L0=","0JHSr9Cz0ZbQvSAxMTowMC3QtNC10L0=","0JXRgNGC0LXSoyAxMTowMC3QtNC10L0=","0JDRj9Kb0YLQsNC70LTRiw==","0KfQtdC6INKb0LDQsdGL0LvQtNCw0YMg0LDRiNGL0ps=","0KfQtdC6INKb0LDQsdGL0LvQtNCw0YMg0LDRj9Kb0YLQsNC70LTRiw==","0prQvtGA0YvRgtGL0L3QtNGLINGI0YvSk9Cw0YDRi9C70LTRiw==","0LTQvQ==","0Yc=","0LzQuNC9","0YHQtdC6","0KHQutC+0YDQvg==","0JjQtNGR0YIg0YHQtdC50YfQsNGB","0J/RgNC+0LTQvtC70LbQtdC90LjQtSDigJQg0YEgMTQ6MDA=","0JfQsNCy0LXRgNGI0LXQvdC+","0JTQviAxODowMA==","0L/RgNC+0YjRkdC7","0YHQtdC50YfQsNGB","0LLQv9C10YDQtdC00Lg=","0KHQtdCz0L7QtNC90Y8g0LTQviAxODowMA==","0KHQtdCz0L7QtNC90Y8g0YEgMTE6MDA=","0JfQsNCy0YLRgNCwINGBIDExOjAw","0JfQsNCy0LXRgNGI0LXQvdC+","0J/RgNC40ZHQvCDRh9C10LrQvtCyINC+0YLQutGA0YvRgg==","0J/RgNC40ZHQvCDRh9C10LrQvtCyINC30LDQstC10YDRiNGR0L0=","0JjRgtC+0LPQuCDQv9C+0LTQstC10LTQtdC90Ys=","LnRpbGVz","ZGl2","dGlsZQ==","PGI+MDA8L2I+PGk+","PC9pPg==","MA==","","dGs=","dGs=","LmNoaXA=","c3BhbjpsYXN0LWNoaWxk","W2RhdGEtY2FwXQ==","bGl2ZQ==","b2Zm","bm9uZQ==","","MjAyNi0xMS0yMw==","MjAyNi0xMS0yNA==","MjAyNi0xMS0yNQ==","LmRheQ==","ZG9uZQ==","bGl2ZQ==","bmV4dA==","ZGF5IHJ2IGluIA==","ZW0=","LmJhcg==","ZG9uZQ==","bGl2ZQ==","bGl2ZQ==","JQ==","MA==","ZGF0YS1jYXA=","fA==","ZGF0YS1lbmQ=","MjAyNi0xMS0xNA==","MjAyNi0xMS0yMg==","LmxpbmUgaQ==","MTAwJQ==","JQ==","MjAyNi0xMS0wMQ==","MjAyNi0xMi0yNg==","MjAyNi0xMi0yNw==","ZGF0YS1lbmQ=","Z2g=","c2V0","ZHJhdw==","LnJ2Om5vdCguZGF5KQ==","LS1kbA==","cw==","SW50ZXJzZWN0aW9uT2JzZXJ2ZXI=","aW4=","aW4=","MHB4IDBweCAtOCUgMHB4"],_0xb3f34=[];
function _0xb48e8(i){return _0xb3f34[i]!==undefined?_0xb3f34[i]:(_0xb3f34[i]=decodeURIComponent(escape(atob(_0xa72fe[i]))))}
!function () {
    var root = document.querySelector(_0xb48e8(0x0));
    if (!root)
        return;
    document.documentElement.classList.add(_0xb48e8(0x1));
    var kk = (document.documentElement.lang || _0xb48e8(0x2)).indexOf(_0xb48e8(0x3)) === 0, kind = root.getAttribute(_0xb48e8(0x4));
    var rm = false;
    try {
        rm = matchMedia(_0xb48e8(0x5)).matches;
    }
    catch (e) { }
    var off = 0;
    try {
        fetch(location.pathname, { method: _0xb48e8(0x6), cache: _0xb48e8(0x7) }).then(function (r) { var d = Date.parse(r.headers.get(_0xb48e8(0x8)) || _0xb48e8(0x9)); if (d && Math.abs(d - Date.now()) > 6e4) {
            off = d - Date.now();
            tick();
        } }).catch(function () { });
    }
    catch (e) { }
    function now() { return Date.now() + off; }
    function at(ds, min) { var p = ds.split(_0xb48e8(0xa)); return Date.UTC(+p[0], +p[1] - 1, +p[2], 0, min) - 18e6; }
    var L = kk ? { d: _0xb48e8(0xb), h: _0xb48e8(0xc), m: _0xb48e8(0xd), s: _0xb48e8(0xe),
        up: _0xb48e8(0xf), live: _0xb48e8(0x10), next: _0xb48e8(0x11), done: _0xb48e8(0x12),
        until18: _0xb48e8(0x13), dDone: _0xb48e8(0x14), dLive: _0xb48e8(0x15), dNext: _0xb48e8(0x16),
        setLive: _0xb48e8(0x17), setLater: _0xb48e8(0x18), setTom: _0xb48e8(0x19), setDone: _0xb48e8(0x1a),
        drOpen: _0xb48e8(0x1b), drClosed: _0xb48e8(0x1c), drDone: _0xb48e8(0x1d) }
        : { d: _0xb48e8(0x1e), h: _0xb48e8(0x1f), m: _0xb48e8(0x20), s: _0xb48e8(0x21),
            up: _0xb48e8(0x22), live: _0xb48e8(0x23), next: _0xb48e8(0x24), done: _0xb48e8(0x25),
            until18: _0xb48e8(0x26), dDone: _0xb48e8(0x27), dLive: _0xb48e8(0x28), dNext: _0xb48e8(0x29),
            setLive: _0xb48e8(0x2a), setLater: _0xb48e8(0x2b), setTom: _0xb48e8(0x2c), setDone: _0xb48e8(0x2d),
            drOpen: _0xb48e8(0x2e), drClosed: _0xb48e8(0x2f), drDone: _0xb48e8(0x30) };
    var tw = root.querySelector(_0xb48e8(0x31)), T = [];
    if (tw) {
        [L.d, L.h, L.m, L.s].forEach(function (lab) { var t = document.createElement(_0xb48e8(0x32)); t.className = _0xb48e8(0x33); t.innerHTML = _0xb48e8(0x34) + lab + _0xb48e8(0x35); tw.appendChild(t); T.push(t.firstChild); });
    }
    function z(v) { return (v < 10 ? _0xb48e8(0x36) : _0xb48e8(0x37)) + v; }
    function setTiles(ms) {
        if (!T.length)
            return;
        var s = Math.max(0, Math.floor(ms / 1e3)), v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
        T.forEach(function (b, i) { var x = i ? z(v[i]) : String(v[i]); if (b.textContent !== x) {
            b.textContent = x;
            if (!rm) {
                b.classList.remove(_0xb48e8(0x38));
                void b.offsetWidth;
                b.classList.add(_0xb48e8(0x39));
            }
        } });
    }
    var chip = root.querySelector(_0xb48e8(0x3a)), chipT = chip && chip.querySelector(_0xb48e8(0x3b)), cap = root.querySelector(_0xb48e8(0x3c));
    function setChip(txt, live) { if (!chip)
        return; if (chipT.textContent !== txt)
        chipT.textContent = txt; chip.classList.toggle(_0xb48e8(0x3d), !!live); chip.classList.toggle(_0xb48e8(0x3e), !live); }
    function hideTiles(h) { if (tw)
        tw.style.display = h ? _0xb48e8(0x3f) : _0xb48e8(0x40); }
    var GH = [_0xb48e8(0x41), _0xb48e8(0x42), _0xb48e8(0x43)], dayEls = [].slice.call(root.querySelectorAll(_0xb48e8(0x44)));
    function ghTick(n) {
        var cur = -1, nx = -1;
        GH.forEach(function (d, i) { var s = at(d, 840), e = at(d, 1080); if (n >= s && n < e)
            cur = i;
        else if (n < s && nx < 0)
            nx = i; });
        dayEls.forEach(function (el, i) {
            var s = at(GH[i], 840), e = at(GH[i], 1080), st = n >= e ? _0xb48e8(0x45) : (n >= s ? _0xb48e8(0x46) : _0xb48e8(0x47));
            el.className = _0xb48e8(0x48) + st;
            var em = el.querySelector(_0xb48e8(0x49)), bar = el.querySelector(_0xb48e8(0x4a));
            em.textContent = st === _0xb48e8(0x4b) ? L.dDone : st === _0xb48e8(0x4c) ? L.dLive : L.dNext;
            bar.style.width = st === _0xb48e8(0x4d) ? ((n - s) / (e - s) * 100).toFixed(2) + _0xb48e8(0x4e) : _0xb48e8(0x4f);
        });
        if (cur >= 0) {
            setChip(L.live, 1);
            hideTiles(0);
            setTiles(at(GH[cur], 1080) - n);
            cap && (cap.textContent = L.until18);
        }
        else if (nx >= 0) {
            setChip(nx === 0 ? L.up : L.next, 0);
            hideTiles(0);
            setTiles(at(GH[nx], 840) - n);
            cap && (cap.textContent = cap.getAttribute(_0xb48e8(0x50)).split(_0xb48e8(0x51))[nx]);
        }
        else {
            setChip(L.done, 0);
            hideTiles(1);
            cap && (cap.textContent = cap.getAttribute(_0xb48e8(0x52)));
        }
    }
    var SET0 = at(_0xb48e8(0x53), 660), SET1 = at(_0xb48e8(0x54), 1080), line = root.querySelector(_0xb48e8(0x55));
    function setTick(n) {
        if (n >= SET1) {
            setChip(L.setDone, 0);
            hideTiles(1);
            line && (line.style.width = _0xb48e8(0x56));
            return;
        }
        var u = new Date(n + 18e6), m = u.getUTCHours() * 60 + u.getUTCMinutes();
        setChip(n < SET0 ? L.up : (m >= 660 && m < 1080 ? L.setLive : (m < 660 ? L.setLater : L.setTom)), n >= SET0 && m >= 660 && m < 1080);
        setTiles(SET1 - n);
        line && (line.style.width = Math.max(0, Math.min(100, (n - SET0) / (SET1 - SET0) * 100)).toFixed(2) + _0xb48e8(0x57));
    }
    var DR0 = at(_0xb48e8(0x58), 0), DR1 = at(_0xb48e8(0x59), 0), DR2 = at(_0xb48e8(0x5a), 0);
    function drTick(n) { if (n < DR0) {
        setChip(L.up, 0);
        setTiles(DR0 - n);
    }
    else if (n < DR1) {
        setChip(L.drOpen, 1);
        setTiles(DR1 - n);
    }
    else {
        setChip(n < DR2 ? L.drClosed : L.drDone, 0);
        hideTiles(1);
        cap && (cap.textContent = cap.getAttribute(_0xb48e8(0x5b)));
    } }
    function tick() { var n = now(); if (kind === _0xb48e8(0x5c))
        ghTick(n);
    else if (kind === _0xb48e8(0x5d))
        setTick(n);
    else if (kind === _0xb48e8(0x5e))
        drTick(n); }
    tick();
    setInterval(tick, 1e3);
    var rv = [].slice.call(root.querySelectorAll(_0xb48e8(0x5f)));
    rv.forEach(function (e) { var p = e.parentNode, k = [].indexOf.call(p.children, e); e.style.setProperty(_0xb48e8(0x60), (Math.min(k, 6) * .15) + _0xb48e8(0x61)); });
    if (rm || !(_0xb48e8(0x62) in window))
        rv.forEach(function (e) { e.classList.add(_0xb48e8(0x63)); });
    else {
        var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) {
            io.unobserve(x.target);
            x.target.classList.add(_0xb48e8(0x64));
        } }); }, { rootMargin: _0xb48e8(0x65) });
        rv.forEach(function (e) { io.observe(e); });
    }
}();
