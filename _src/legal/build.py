import re,os,json,sys,importlib.util
import os; S=os.path.join(os.path.dirname(os.path.abspath(__file__)))
SITE="https://seventimesuralsk.github.io/seventimes/"
R=json.load(open(S+"/rekv.json",encoding="utf8")) if os.path.exists(S+"/rekv.json") else {}
def load(n):
    sp=importlib.util.spec_from_file_location(n,S+"/"+n+".py");m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
def ph(k,kk):
    v=R.get(k)
    if v: return v
    lab={"ORG":("[наименование организации]","[ұйымның атауы]"),"BIN":("[БИН/ИИН]","[БСН/ЖСН]"),"ADDR":("[юридический адрес]","[заңды мекенжайы]"),"EMAIL":("[e-mail]","[e-mail]"),"DPO":("[должность ответственного лица]","[жауапты тұлғаның лауазымы]"),"N_HOURS":("[N]","[N]")}[k]
    return '<span class="ph">%s</span>'%lab[1 if kk else 0]
def rekv(kk):
    if kk: rows=[("Атауы",ph("ORG",kk)),("БСН/ЖСН",ph("BIN",kk)),("Заңды мекенжайы",ph("ADDR",kk)),("Мейрамханалар","Орал қ., Абулхаир Хан даңғылы, 177; Самал, 70/3; Скоробогатов көшесі, 65/1"),("Электрондық пошта",ph("EMAIL",kk)),("Сайт","seventimesuralsk.github.io/seventimes")]
    else: rows=[("Наименование",ph("ORG",kk)),("БИН/ИИН",ph("BIN",kk)),("Юридический адрес",ph("ADDR",kk)),("Рестораны","г. Уральск, проспект Абулхаир Хана, 177; Самал, 70/3; улица Скоробогатова, 65/1"),("Электронная почта",ph("EMAIL",kk)),("Сайт","seventimesuralsk.github.io/seventimes")]
    return '<div class="lg-rk">'+"".join('<div class="r"><i>%s</i><b>%s</b></div>'%r for r in rows)+'</div>'
ED={False:"Редакция от 19 ноября 2026 года",True:"2026 жылғы 19 қарашадағы редакция"}
def body(mod,kk,other_href,other_word):
    h='<div class="pg-body lg"><h1>%s</h1><p class="lg-sub">%s</p><p class="lg-ed">%s</p>'%(mod.TITLE,mod.SUB,ED[kk])
    for head,ps in mod.DOC:
        h+='<h2 id="s%s">%s</h2>'%(head.split('.')[0],head)
        for p in ps:
            if p=="{REKV}": h+=rekv(kk);continue
            t=p.replace("{REKV}",rekv(kk))
            for k in ["ORG","BIN","ADDR","EMAIL","DPO","N_HOURS"]: t=t.replace("{%s}"%k,ph(k,kk))
            if other_word and other_word in t: t=t.replace(other_word,'<a href="%s">%s</a>'%(other_href,other_word),1)
            h+='<p%s>%s</p>'%(' class="dash"' if t.startswith("—") else "",t)
    return h+'</div>'
PAGES=[("ru_oferta",False,"oferta","privacy/","Политика конфиденциальности"),("ru_privacy",False,"privacy","oferta/","Публичной оферты"),
       ("kk_oferta",True,"oferta","privacy/","Құпиялылық саясатында"),("kk_privacy",True,"privacy","oferta/","Жария офертаның")]
for mn,kk,slug,oh,ow in PAGES:
    mod=load(mn);src="kk/about/index.html" if kk else "about/index.html"
    s=open(src,encoding="utf8").read();ru_url=SITE+slug+"/";kk_url=SITE+"kk/"+slug+"/"
    s=s.replace('data-page="about"','data-page="legal"',1)
    s=re.sub(r"<title>.*?</title>","<title>%s — Seven Times</title>"%mod.TITLE,s,1)
    d=("%s Seven Times: %s."%(mod.TITLE,mod.SUB))
    for k in ['<meta name="description" content="','<meta property="og:description" content="']: s=re.sub('('+re.escape(k)+')[^"]*','\\g<1>'+d,s,1)
    s=re.sub(r'(<meta property="og:title" content=")[^"]*','\\g<1>'+mod.TITLE+' — Seven Times',s,1)
    s=s.replace(SITE+"kk/about/",kk_url).replace(SITE+"about/",ru_url)
    s=re.sub(r'<div class="pg-title">[^<]*</div>','<div class="pg-title">%s</div>'%mod.TITLE,s,1)
    a=s.index('<div class="pg-body');b=s.index('</section></div></div>',a)+len('</section></div></div>')
    s=s[:a]+body(mod,kk,oh,ow)+'</div>'+s[b:]
    s=re.sub(r'\s*<script src="(\.\./)?assets/about\.js\?v=[0-9a-f]+" defer></script>','',s,1)
    out=("kk/" if kk else "")+slug+"/index.html";os.makedirs(os.path.dirname(out),exist_ok=True);open(out,"w",encoding="utf8").write(s)
    print(out,len(s),"плейсхолдеров:",s.count('class="ph"'))
