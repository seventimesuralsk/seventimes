var _0x0f09d=["LmFw","ZGF0YS1wcmU=","","KHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSk=","YXAtanM=","bWVudS9zYW1hbC5qc29u","bm8tY2FjaGU=","","fA==","W2RhdGEtcGxd","ZGF0YS1wbA==","W2RhdGEtbGl2ZV0=","ZGF0YS1jb3VudA==","ZGF0YS1jb3VudA==","ZGF0YS1jb3VudA==","MA==","","YXBNcTE=","YXBNcTI=","","PGltZyBzcmM9Ig==","aW1nL20v","LTQwMC53ZWJwIiBhbHQ9IiIgbG9hZGluZz0ibGF6eSIgZGVjb2Rpbmc9ImFzeW5jIj4=","aW1n","LmFwLXJ2","SW50ZXJzZWN0aW9uT2JzZXJ2ZXI=","aW4=","aW4=","MHB4IDBweCAtMTAlIDBweA==","LmFwLWhlcm8=","LmFwLXNjYWxl","LmFwLXdvcmRz","LmFwLXc=","b24=","W2RhdGEtY291bnRd","LS1w","MQ==","LS1ocA==","LS1w","b24=","b24=","W2RhdGEtY291bnRd","b24=","b24=","c2Nyb2xs","cmVzaXpl"],_0xfe75d=[];
function _0x5d904(i){return _0xfe75d[i]!==undefined?_0xfe75d[i]:(_0xfe75d[i]=decodeURIComponent(escape(atob(_0x0f09d[i]))))}
!function () {
    var root = document.querySelector(_0x5d904(0x0));
    if (!root)
        return;
    var pre = root.getAttribute(_0x5d904(0x1)) || _0x5d904(0x2);
    var rm = false;
    try {
        rm = matchMedia(_0x5d904(0x3)).matches;
    }
    catch (e) { }
    document.documentElement.classList.add(_0x5d904(0x4));
    var menuP = null;
    function menu() { if (!menuP)
        menuP = fetch(pre + _0x5d904(0x5), { cache: _0x5d904(0x6) }).then(function (r) { return r.json(); }).catch(function () { return null; }); return menuP; }
    function countItems(d) { var ids = {}, n = 0; Object.keys(d && d.categories || {}).forEach(function (c) { if (/Прибор/.test(c))
        return; (d.categories[c] || []).forEach(function (i) { var k = String(i && (i.id || i.name) || _0x5d904(0x7)); if (k && i.name && !i.teaser && !ids[k]) {
        ids[k] = 1;
        n++;
    } }); }); return n; }
    function plural(n, f) { f = f.split(_0x5d904(0x8)); var a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 1 : 2]; }
    function setPl(el, n) { var w = el.parentNode && el.parentNode.querySelector(_0x5d904(0x9)); if (w)
        w.textContent = plural(n, w.getAttribute(_0x5d904(0xa))); }
    var live = root.querySelector(_0x5d904(0xb));
    if (live)
        menu().then(function (d) { var n = countItems(d); if (n > 0) {
            live.setAttribute(_0x5d904(0xc), String(n));
            if (live._done || rm) {
                live.textContent = String(n);
            }
            setPl(live, n);
        } });
    function count(el) {
        if (el._c)
            return;
        el._c = 1;
        var n = parseInt(el.getAttribute(_0x5d904(0xd)), 10);
        if (!n)
            return;
        if (rm) {
            el.textContent = n;
            return;
        }
        var s = null, d = 1400;
        function f(ts) { s = s || ts; var p = Math.min(1, (ts - s) / d), e = 1 - Math.pow(1 - p, 3), m = parseInt(el.getAttribute(_0x5d904(0xe)), 10) || n; el.textContent = Math.round(m * e); if (p < 1)
            requestAnimationFrame(f);
        else {
            el._done = 1;
            el.textContent = m;
        } }
        el.textContent = _0x5d904(0xf);
        requestAnimationFrame(f);
    }
    menu().then(function (d) {
        var ids = [], seen = {};
        Object.keys(d && d.categories || {}).forEach(function (c) { if (/Прибор/.test(c))
            return; (d.categories[c] || []).forEach(function (i) { var u = String(i && i.photo || _0x5d904(0x10)), m = u.match(/\/d\/([a-zA-Z0-9_-]{20,})/) || u.match(/[?&]id=([a-zA-Z0-9_-]{20,})/); if (m && !seen[m[1]] && !i.teaser && !i.stopped) {
            seen[m[1]] = 1;
            ids.push(m[1]);
        } }); });
        if (ids.length < 6)
            return;
        for (var j = ids.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1)), t = ids[j];
            ids[j] = ids[k];
            ids[k] = t;
        }
        ids = ids.slice(0, 24);
        var half = Math.ceil(ids.length / 2);
        [[_0x5d904(0x11), ids.slice(0, half)], [_0x5d904(0x12), ids.slice(half)]].forEach(function (r) {
            var box = document.getElementById(r[0]);
            if (!box || !r[1].length)
                return;
            var h = _0x5d904(0x13);
            r[1].concat(r[1]).forEach(function (id) { h += _0x5d904(0x14) + pre + _0x5d904(0x15) + id + _0x5d904(0x16); });
            box.innerHTML = h;
            [].forEach.call(box.querySelectorAll(_0x5d904(0x17)), function (im) { im.onerror = function () { im.remove(); }; });
        });
    });
    var rv = [].slice.call(root.querySelectorAll(_0x5d904(0x18)));
    if (rm || !(_0x5d904(0x19) in window))
        rv.forEach(function (e) { e.classList.add(_0x5d904(0x1a)); });
    else {
        var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) {
            io.unobserve(x.target);
            x.target.classList.add(_0x5d904(0x1b));
        } }); }, { rootMargin: _0x5d904(0x1c) });
        rv.forEach(function (e) { io.observe(e); });
    }
    var hero = root.querySelector(_0x5d904(0x1d)), sc = root.querySelector(_0x5d904(0x1e)), wd = root.querySelector(_0x5d904(0x1f)), lines = wd ? [].slice.call(wd.querySelectorAll(_0x5d904(0x20))) : [];
    function prog(el) { var r = el.getBoundingClientRect(), h = r.height - innerHeight; return h > 0 ? Math.max(0, Math.min(1, -r.top / h)) : (r.top < 0 ? 1 : 0); }
    if (rm) {
        lines.forEach(function (l) { l.classList.add(_0x5d904(0x21)); [].forEach.call(l.querySelectorAll(_0x5d904(0x22)), count); });
        if (sc)
            sc.style.setProperty(_0x5d904(0x23), _0x5d904(0x24));
        return;
    }
    var tick = false;
    function upd() {
        tick = false;
        if (hero) {
            var hr = hero.getBoundingClientRect(), hp = Math.max(0, Math.min(1, -hr.top / Math.max(1, hr.height)));
            hero.style.setProperty(_0x5d904(0x25), hp.toFixed(3));
        }
        if (sc)
            sc.style.setProperty(_0x5d904(0x26), prog(sc).toFixed(3));
        if (wd) {
            var wr = wd.getBoundingClientRect(), p = wr.top > innerHeight * .3 ? -1 : prog(wd), n = lines.length;
            lines.forEach(function (l, i) { var on = p >= (i / n) * .92 - .02; if (on && !l.classList.contains(_0x5d904(0x27))) {
                l.classList.add(_0x5d904(0x28));
                [].forEach.call(l.querySelectorAll(_0x5d904(0x29)), count);
            }
            else if (!on && l.classList.contains(_0x5d904(0x2a)))
                l.classList.remove(_0x5d904(0x2b)); });
        }
    }
    function req() { if (!tick) {
        tick = true;
        requestAnimationFrame(upd);
    } }
    addEventListener(_0x5d904(0x2c), req, { passive: true });
    addEventListener(_0x5d904(0x2d), req);
    upd();
}();
