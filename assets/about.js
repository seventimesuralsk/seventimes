var _0x7b3bf=["LmFw","ZGF0YS1wcmU=","","KHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSk=","YXAtanM=","bWVudS9zYW1hbC5qc29u","bm8tY2FjaGU=","","fA==","W2RhdGEtcGxd","ZGF0YS1wbA==","W2RhdGEtc2luY2Vd","ZGF0YS1zaW5jZQ==","ZGF0YS1jb3VudA==","W2RhdGEtbGl2ZV0=","ZGF0YS1jb3VudA==","ZGF0YS1jb3VudA==","ZGF0YS1jb3VudA==","MA==","","YXBNcTE=","YXBNcTI=","","PGltZyBzcmM9Ig==","aW1nL20v","LTQwMC53ZWJwIiBhbHQ9IiIgbG9hZGluZz0ibGF6eSIgZGVjb2Rpbmc9ImFzeW5jIj4=","aW1n","LmFwLXJ2","SW50ZXJzZWN0aW9uT2JzZXJ2ZXI=","aW4=","aW4=","MHB4IDBweCAtMTAlIDBweA==","LmFwLWhlcm8=","LmFwLXNjYWxl","LmFwLXdvcmRz","LmFwLXc=","b24=","W2RhdGEtY291bnRd","SW50ZXJzZWN0aW9uT2JzZXJ2ZXI=","LS1w","MQ==","LS1ocA==","LS1w","c2Nyb2xs","cmVzaXpl"],_0x92c98=[];
function _0xb6072(i){return _0x92c98[i]!==undefined?_0x92c98[i]:(_0x92c98[i]=decodeURIComponent(escape(atob(_0x7b3bf[i]))))}
!function () {
    var root = document.querySelector(_0xb6072(0x0));
    if (!root)
        return;
    var pre = root.getAttribute(_0xb6072(0x1)) || _0xb6072(0x2);
    var rm = false;
    try {
        rm = matchMedia(_0xb6072(0x3)).matches;
    }
    catch (e) { }
    document.documentElement.classList.add(_0xb6072(0x4));
    var menuP = null;
    function menu() { if (!menuP)
        menuP = fetch(pre + _0xb6072(0x5), { cache: _0xb6072(0x6) }).then(function (r) { return r.json(); }).catch(function () { return null; }); return menuP; }
    function countItems(d) { var ids = {}, n = 0; Object.keys(d && d.categories || {}).forEach(function (c) { if (/Прибор/.test(c))
        return; (d.categories[c] || []).forEach(function (i) { var k = String(i && (i.id || i.name) || _0xb6072(0x7)); if (k && i.name && !i.teaser && !ids[k]) {
        ids[k] = 1;
        n++;
    } }); }); return n; }
    function plural(n, f) { f = f.split(_0xb6072(0x8)); var a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 1 : 2]; }
    function setPl(el, n) { var w = el.parentNode && el.parentNode.querySelector(_0xb6072(0x9)); if (w)
        w.textContent = plural(n, w.getAttribute(_0xb6072(0xa))); }
    [].forEach.call(root.querySelectorAll(_0xb6072(0xb)), function (el) { var y = new Date(Date.now() + 18e6).getUTCFullYear() - parseInt(el.getAttribute(_0xb6072(0xc)), 10); if (y > 0) {
        el.setAttribute(_0xb6072(0xd), String(y));
        el.textContent = String(y);
        setPl(el, y);
    } });
    var live = root.querySelector(_0xb6072(0xe));
    if (live)
        menu().then(function (d) { var n = countItems(d); if (n > 0) {
            live.setAttribute(_0xb6072(0xf), String(n));
            if (live._done || rm) {
                live.textContent = String(n);
            }
            setPl(live, n);
        } });
    function count(el) {
        if (el._c)
            return;
        el._c = 1;
        var n = parseInt(el.getAttribute(_0xb6072(0x10)), 10);
        if (!n)
            return;
        if (rm) {
            el.textContent = n;
            return;
        }
        var s = null, d = 1400;
        function f(ts) { s = s || ts; var p = Math.min(1, (ts - s) / d), e = 1 - Math.pow(1 - p, 3), m = parseInt(el.getAttribute(_0xb6072(0x11)), 10) || n; el.textContent = Math.round(m * e); if (p < 1)
            requestAnimationFrame(f);
        else {
            el._done = 1;
            el.textContent = m;
        } }
        el.textContent = _0xb6072(0x12);
        requestAnimationFrame(f);
    }
    menu().then(function (d) {
        var ids = [], seen = {};
        Object.keys(d && d.categories || {}).forEach(function (c) { if (/Прибор/.test(c))
            return; (d.categories[c] || []).forEach(function (i) { var u = String(i && i.photo || _0xb6072(0x13)), m = u.match(/\/d\/([a-zA-Z0-9_-]{20,})/) || u.match(/[?&]id=([a-zA-Z0-9_-]{20,})/); if (m && !seen[m[1]] && !i.teaser && !i.stopped) {
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
        [[_0xb6072(0x14), ids.slice(0, half)], [_0xb6072(0x15), ids.slice(half)]].forEach(function (r) {
            var box = document.getElementById(r[0]);
            if (!box || !r[1].length)
                return;
            var h = _0xb6072(0x16);
            r[1].concat(r[1]).forEach(function (id) { h += _0xb6072(0x17) + pre + _0xb6072(0x18) + id + _0xb6072(0x19); });
            box.innerHTML = h;
            [].forEach.call(box.querySelectorAll(_0xb6072(0x1a)), function (im) { im.onerror = function () { im.remove(); }; });
        });
    });
    var rv = [].slice.call(root.querySelectorAll(_0xb6072(0x1b)));
    if (rm || !(_0xb6072(0x1c) in window))
        rv.forEach(function (e) { e.classList.add(_0xb6072(0x1d)); });
    else {
        var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) {
            io.unobserve(x.target);
            x.target.classList.add(_0xb6072(0x1e));
        } }); }, { rootMargin: _0xb6072(0x1f) });
        rv.forEach(function (e) { io.observe(e); });
    }
    var hero = root.querySelector(_0xb6072(0x20)), sc = root.querySelector(_0xb6072(0x21)), wd = root.querySelector(_0xb6072(0x22)), lines = wd ? [].slice.call(wd.querySelectorAll(_0xb6072(0x23))) : [];
    function light() { lines.forEach(function (l, i) { setTimeout(function () { l.classList.add(_0xb6072(0x24)); [].forEach.call(l.querySelectorAll(_0xb6072(0x25)), count); }, rm ? 0 : i * 420); }); }
    if (wd) {
        if (rm || !(_0xb6072(0x26) in window))
            light();
        else {
            var wio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) {
                wio.disconnect();
                light();
            } }, { threshold: .35 });
            wio.observe(wd);
        }
    }
    if (rm) {
        if (sc)
            sc.style.setProperty(_0xb6072(0x27), _0xb6072(0x28));
        return;
    }
    var tick = false;
    function upd() {
        tick = false;
        var vh = innerHeight;
        if (hero) {
            var hr = hero.getBoundingClientRect(), hp = Math.max(0, Math.min(1, -hr.top / Math.max(1, hr.height)));
            hero.style.setProperty(_0xb6072(0x29), hp.toFixed(3));
        }
        if (sc) {
            var r = sc.getBoundingClientRect();
            if (r.top < vh && r.bottom > 0)
                sc.style.setProperty(_0xb6072(0x2a), Math.max(0, Math.min(1, (vh - r.top) / (vh * .85))).toFixed(3));
        }
    }
    function req() { if (!tick) {
        tick = true;
        requestAnimationFrame(upd);
    } }
    addEventListener(_0xb6072(0x2b), req, { passive: true });
    addEventListener(_0xb6072(0x2c), req);
    upd();
}();
