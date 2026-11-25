# Генератор темы Higgsfield: цвета каждого правила сайта → чёрный + неоновый лайм.
# Вход: css_rules.json и inline_styles.json (собирает collect_css.js со всех страниц).
# Выход: assets/hf.css = перекраска всех правил (под html.hf) + ручные компоненты из hf_components.css.
import json, re, sys, os, colorsys
S = sys.argv[1]
OUT = sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
rules = json.load(open(S + '/css_rules.json'))
inline = json.load(open(S + '/inline_styles.json'))

PAGE = (10, 11, 13)      # фон страницы
CARD = (19, 21, 25)      # карточки, окна
SURF = (26, 29, 34)      # чипы, поля
SURF2 = (34, 37, 43)
TXT = (245, 245, 247)
MUT = (245, 245, 247, .56)
LINE = (255, 255, 255, .09)
ACC = (215, 255, 58)     # лайм
ACCT = (10, 11, 13)      # текст на лайме
ERR = (255, 107, 107)

NAMED = {'white': (255, 255, 255, 1), 'black': (0, 0, 0, 1)}
CRE = re.compile(r'rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+%?))?\s*\)|\b(white|black)\b|#([0-9a-fA-F]{3,8})\b')


def parse(m):
    if m.group(5):
        return NAMED[m.group(5)]
    if m.group(6):
        h = m.group(6)
        if len(h) in (3, 4):
            h = ''.join(c * 2 for c in h)
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1
        return (r, g, b, a)
    a = m.group(4)
    a = 1 if a is None else (float(a[:-1]) / 100 if a.endswith('%') else float(a))
    return (float(m.group(1)), float(m.group(2)), float(m.group(3)), a)


def fmt(c):
    r, g, b = [int(round(x)) for x in c[:3]]
    a = c[3] if len(c) > 3 else 1
    return 'rgb(%d,%d,%d)' % (r, g, b) if a >= .999 else 'rgba(%d,%d,%d,%s)' % (r, g, b, ('%.3f' % a).rstrip('0').rstrip('.'))


def lum(c):
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255


def hls(c):
    h, l, s = colorsys.rgb_to_hls(c[0] / 255, c[1] / 255, c[2] / 255)
    return h * 360, l, s


def sat(c):
    h, l, s = hls(c)
    return s if 0.05 < l < 0.95 else 0


def is_wine(c):        # фирменный бордовый #7a1128 и его оттенки
    h, l, s = hls(c)
    return s > .45 and (h >= 330 or h <= 8) and .16 <= l < .41


def is_wine_dark(c):   # почти чёрный бордовый фон
    h, l, s = hls(c)
    return s > .25 and (h >= 320 or h <= 15) and l < .16


def is_err(c):         # красный ошибок
    h, l, s = hls(c)
    return s > .4 and (h >= 345 or h <= 15) and l >= .41


def map_bg(c):
    a = c[3]
    if a == 0:
        return c
    if is_wine(c): return ACC + (a,)
    if is_wine_dark(c): return CARD + (a,)
    L, s = lum(c), sat(c)
    if s > .25 and L < .9:
        return c
    if s > .25:
        return SURF + (a,)
    if a < .999:
        return (PAGE[0], PAGE[1], PAGE[2], a) if L > .6 else c
    if L >= .985: return CARD + (1,)
    if L >= .955: return PAGE + (1,)
    if L >= .88: return SURF + (1,)
    if L >= .7: return SURF2 + (1,)
    return c


def map_fg(c):
    a = c[3]
    if is_wine(c) or is_wine_dark(c): return ACC + (a,)
    if is_err(c): return ERR + (a,)
    L, s = lum(c), sat(c)
    if s > .3:
        return TXT + (a,) if L < .25 else c
    if L < .3: return TXT + (a,)
    if L < .65: return MUT[:3] + (min(1, a) * MUT[3],)
    return c


def map_line(c):
    a = c[3]
    if a == 0: return c
    if is_wine(c): return ACC + (a,)
    if is_err(c): return ERR + (a,)
    L, s = lum(c), sat(c)
    if s > .3: return c
    if L > .6: return LINE
    if a < .999: return (255, 255, 255, min(.16, a * 1.3))
    return LINE


def map_shadow(c):
    if is_wine(c): return ACC + (min(.35, c[3] * .7),)
    return map_line(c)


def remap(val, fn):
    return CRE.sub(lambda m: fmt(fn(parse(m))), val)


SKIP = re.compile(r'\b(ctxc|ctx-|cup|bw|clsn|stn|ann|hf-|st-sky|draw-|ghost)')
out = []
seen = set()
for r in rules:
    sel, media, d = r['sel'], r['media'], r['d']
    if SKIP.search(sel):
        continue
    decl = []
    TR = ('transparent', 'rgba(0, 0, 0, 0)')
    clip_text = any(d.get(k, ['', ''])[0] in TR for k in ('color', '-webkit-text-fill-color'))
    bgcols = []
    for kk in ('background-color', 'background-image'):
        if kk in d:
            bgcols += [parse(m) for m in CRE.finditer(d[kk][0])]
    lime_bg = any(is_wine(c) and c[3] > .5 for c in bgcols)
    colored_bg = not lime_bg and any(sat(c) > .25 and c[3] > .5 and lum(c) > .3 for c in bgcols)
    for k, (v, imp) in d.items():
        if clip_text and k in ('background-color', 'background-image'):
            continue
        if colored_bg and k in ('color', '-webkit-text-fill-color', 'fill', 'stroke'):
            continue
        if lime_bg and k in ('color', 'fill', 'stroke', '-webkit-text-fill-color'):
            if v in ('none', 'currentcolor', 'inherit', 'transparent') or 'url(' in v: continue
            decl.append('%s:%s!important' % (k, fmt(ACCT)))
            continue
        if k == 'background-color': nv = remap(v, map_bg)
        elif k == 'background-image':
            if 'gradient' not in v: continue
            nv = remap(v, map_bg)
        elif k in ('color', 'fill', 'stroke', 'caret-color', '-webkit-text-fill-color', 'text-decoration-color'):
            if v in ('currentcolor', 'none', 'inherit', 'transparent') or 'url(' in v: continue
            nv = remap(v, map_fg)
        elif k == 'box-shadow':
            if 'inset' not in v and not re.search(r'rgba?\(\s*2[0-5]\d', v) and not any(is_wine(parse(m)) for m in CRE.finditer(v)): continue
            nv = remap(v, map_shadow)
        else: nv = remap(v, map_line)
        if nv != v:
            decl.append('%s:%s!important' % (k, nv))
    if lime_bg and 'color' not in d:
        decl.append('color:%s!important' % fmt(ACCT))
    if not decl:
        continue
    sels = ','.join('html.hf ' + s.strip() if not s.strip().startswith(('html', ':root')) else s.strip().replace('html', 'html.hf', 1) for s in sel.split(','))
    block = '%s{%s}' % (sels, ';'.join(decl))
    if media: block = '@media %s{%s}' % (media, block)
    if block in seen: continue
    seen.add(block); out.append(block)

# встроенные стили (style="...") — по подстроке
inl_out = []
for st in inline:
    for decl in st.split(';'):
        if ':' not in decl: continue
        k, v = decl.split(':', 1)
        k = k.strip(); v = v.strip()
        if not CRE.search(v): continue
        if k in ('background', 'background-color'):
            nv = remap(v, map_bg); prop = 'background-color' if 'gradient' not in v else 'background'
        elif k == 'color': nv = remap(v, map_fg); prop = 'color'
        elif k.startswith('border'): nv = remap(v, map_line); prop = k
        else: continue
        if nv == v: continue
        frag = decl.strip()
        b = 'html.hf [style*="%s"]{%s:%s!important}' % (frag.replace('"', '\\"'), prop, nv)
        if b not in seen: seen.add(b); inl_out.append(b)

comp = open(os.path.join(HERE, 'hf_components.css'), encoding='utf-8').read()
css = '/* Тема Higgsfield (генерируется tools/dark-theme/gen_hf.py, руками не править) */\n' + '\n'.join(out) + '\n' + '\n'.join(inl_out) + '\n' + comp
open(OUT, 'w', encoding='utf-8').write(css)
print('правил:', len(out), '| встроенных:', len(inl_out), '| размер:', len(css) // 1024, 'КБ')
