# Генератор тёмной темы: цвета каждого правила → тёмная палитра (винный+золото), размеры и места не трогаем
import json, re, sys, colorsys
S = sys.argv[1]
OUT = sys.argv[2]
rules = json.load(open(S + '/css_rules.json'))
inline = json.load(open(S + '/inline_styles.json'))

PAGE = (11, 7, 8)        # фон страницы
CARD = (22, 16, 18)      # карточки, окна
SURF = (31, 23, 25)      # чипы, поля, вторичные поверхности
SURF2 = (42, 32, 35)
TXT = (243, 238, 233)
MUT = (243, 238, 233, .6)
LINE = (255, 236, 214, .12)

NAMED = {'white': (255, 255, 255, 1), 'black': (0, 0, 0, 1), 'transparent': (0, 0, 0, 0)}
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


def sat(c):
    h, l, s = colorsys.rgb_to_hls(c[0] / 255, c[1] / 255, c[2] / 255)
    return s if 0.05 < l < 0.95 else 0


def map_bg(c):
    a = c[3]
    if a == 0:
        return c
    L, s = lum(c), sat(c)
    if s > .25 and L < .9:          # винный, золото, зелёный — оставляем
        return c
    if s > .25:                       # светлый оттенок (розоватый фон и т.п.)
        return (42, 22, 28, a)
    if a < .999:                      # полупрозрачные: белое «стекло» → тёмное стекло; чёрные затемнения — как есть
        return (PAGE[0], PAGE[1], PAGE[2], a) if L > .6 else c
    if L >= .985: return CARD + (1,)
    if L >= .955: return PAGE + (1,)
    if L >= .88: return SURF + (1,)
    if L >= .7: return SURF2 + (1,)
    return c                          # тёмные — уже тёмные


def map_fg(c):
    a = c[3]
    L, s = lum(c), sat(c)
    if s > .3:
        if L < .4:                    # тёмный винный текст → светлый винный
            return (240, 150, 168, a)
        return c
    if L < .3: return TXT + (a,)
    if L < .65: return MUT[:3] + (min(1, a) * MUT[3],)
    return c


def map_line(c):
    a = c[3]
    if a == 0: return c
    L, s = lum(c), sat(c)
    if s > .3: return c
    if L > .6: return LINE
    if a < .999: return (255, 255, 255, min(.2, a * 1.3))
    return LINE


def remap(val, fn):
    return CRE.sub(lambda m: fmt(fn(parse(m))), val)


SKIP = re.compile(r'\b(ctxc|ctx-|cup|pk-|bw|clsn|stn|ann|hf-|promo-card|st-sky|draw-|ghost)')
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
    colored_bg = any(sat(c) > .25 and c[3] > .5 and lum(c) > .3 for c in bgcols)
    for k, (v, imp) in d.items():
        if clip_text and k in ('background-color', 'background-image'):
            continue
        if colored_bg and k in ('color', '-webkit-text-fill-color', 'fill', 'stroke'):
            continue
        if k == 'background-color': nv = remap(v, map_bg)
        elif k == 'background-image':
            if 'gradient' not in v: continue
            nv = remap(v, map_bg)
        elif k in ('color', 'fill', 'stroke', 'caret-color', '-webkit-text-fill-color', 'text-decoration-color'):
            if v in ('currentcolor', 'none', 'inherit', 'transparent') or 'url(' in v: continue
            nv = remap(v, map_fg)
        elif k == 'box-shadow':
            if 'inset' not in v and not re.search(r'rgba?\(\s*2[0-5]\d', v): continue  # обычные тёмные тени не трогаем
            nv = remap(v, map_line)
        else: nv = remap(v, map_line)
        if nv != v:
            decl.append('%s:%s!important' % (k, nv))
    if not decl:
        continue
    sels = ','.join('html.dk ' + s.strip() if not s.strip().startswith(('html', ':root')) else s.strip().replace('html', 'html.dk', 1) for s in sel.split(','))
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
        b = 'html.dk [style*="%s"]{%s:%s!important}' % (frag.replace('"', '\\"'), prop, nv)
        if b not in seen: seen.add(b); inl_out.append(b)

HF = '''
/* Тёмная тема в духе Higgsfield: только цвета и подача, места и размеры не меняются */
html.dk{color-scheme:dark;background:#0b0708}
html.dk body{background-color:#0b0708!important;background-image:radial-gradient(rgba(255,236,214,.045) 1px,transparent 1px)!important;background-size:14px 14px!important;color:#f3eee9}
html.dk .item-card{box-shadow:inset 0 0 0 1px rgba(255,236,214,.07),0 10px 30px rgba(0,0,0,.35)!important}
html.dk .add-btn,html.dk .btn-main,html.dk #dadd{box-shadow:0 8px 24px rgba(160,22,52,.42)!important}
html.dk .nav-dot.op{box-shadow:0 0 10px #34d36b}
html.dk img{filter:none}
html.dk input::placeholder,html.dk textarea::placeholder{color:rgba(243,238,233,.38)!important}
html.dk input,html.dk textarea,html.dk select{color:#f3eee9!important}
html.dk .nav-theme svg{color:#e9c98b}
html.dk .pz-set{--acc:#ec9fb1;--hl:rgba(255,236,214,.12);--lab:rgba(236,159,177,.72)}
html.dk .pz-dream{--ink:#eef1f5;--hl:rgba(255,255,255,.1);--acc:#e6a582;--lab:rgba(230,165,130,.85)}
'''
css = HF + '\n'.join(out) + '\n' + '\n'.join(inl_out) + '\n'
open(OUT, 'w', encoding='utf-8').write(css)
print('правил:', len(out), '| встроенных:', len(inl_out), '| размер:', len(css) // 1024, 'КБ')
