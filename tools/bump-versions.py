# Обновить ?v=<md5[:8]> у всех assets/*.js|css во всех HTML и sw.js (кэш браузера и Service Worker).
# python3 tools/bump-versions.py
import re,hashlib,glob,os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),".."))
files=[f for f in glob.glob("**/*.html",recursive=True) if not f.startswith("_src")]+["sw.js"]
for f in files:
    s=open(f,encoding="utf8").read();kk=f.startswith("kk/")
    def rep(m):
        p=m.group(1)
        for root in (["kk"] if kk else [])+["."]:
            q=os.path.normpath(os.path.join(root,p.lstrip("./")))
            if os.path.exists(q): return p+"?v="+hashlib.md5(open(q,"rb").read()).hexdigest()[:8]
        return m.group(0)
    s2=re.sub(r'((?:\.\./)*(?:\./)?assets/[\w.-]+\.(?:js|css))\?v=[0-9a-f]+',rep,s)
    if s2!=s: open(f,"w",encoding="utf8").write(s2)
h=hashlib.md5(b"".join(open(x,"rb").read() for x in sorted(glob.glob("assets/*")+glob.glob("kk/assets/*")))).hexdigest()[:8]
s=open("sw.js",encoding="utf8").read();s=re.sub(r'seventimes-app-[0-9a-f]{8}','seventimes-app-'+h,s);open("sw.js","w",encoding="utf8").write(s)
print("versions bumped, APP_CACHE",h)
