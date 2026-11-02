# Зеркало фото блюд на GitHub Pages.
# Фото в таблице — ссылки на Google Drive. Drive отдаёт их медленно (лишняя переадресация,
# 0,4–0,7 с на фото) и режет, когда гость открывает меню и браузер просит десятки фото сразу.
# Скрипт кладёт копии рядом с сайтом: img/m/<id Drive>-400.jpg (карточки) и -800.jpg (окно блюда).
# Сайт берёт фото отсюда, а если копии ещё нет (новое фото, прошло <10 мин) — по-старому с Drive.
# python3 .github/mirror_photos.py menu/samal.json img/m
import io, json, os, re, sys, time, urllib.request

from PIL import Image

SNAP, OUT = sys.argv[1], sys.argv[2]
SIZES = (400, 800)
ID = re.compile(r"/d/([A-Za-z0-9_-]{10,})|[?&]id=([A-Za-z0-9_-]{10,})")


def drive_ids(menu):
    ids = []
    for items in menu.get("categories", {}).values():
        for it in items:
            m = ID.search((it or {}).get("photo") or "")
            if m:
                ids.append(m.group(1) or m.group(2))
    return list(dict.fromkeys(ids))


def fetch(fid):
    req = urllib.request.Request("https://drive.google.com/thumbnail?id=%s&sz=w1600" % fid, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        if not r.headers.get("Content-Type", "").startswith("image/"):
            raise ValueError("не картинка")
        return r.read()


def save(data, fid):
    im = Image.open(io.BytesIO(data))
    im = im.convert("RGB")
    for w in SIZES:
        x = im.copy()
        if x.width > w:
            x = x.resize((w, round(x.height * w / x.width)), Image.LANCZOS)
        x.save(os.path.join(OUT, "%s-%d.jpg" % (fid, w)), "JPEG", quality=80, optimize=True, progressive=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    ids = drive_ids(json.load(open(SNAP, encoding="utf8")))
    have = {f.rsplit("-", 1)[0] for f in os.listdir(OUT) if f.endswith(".jpg")}
    new, bad = 0, 0
    for fid in ids:
        if all(os.path.exists(os.path.join(OUT, "%s-%d.jpg" % (fid, w))) for w in SIZES):
            continue
        for attempt in range(3):
            try:
                save(fetch(fid), fid)
                new += 1
                break
            except Exception as e:  # Drive иногда отвечает 429/500 — следующая попытка или следующий запуск
                if attempt == 2:
                    bad += 1
                    print("::warning::фото %s не скачано: %s" % (fid, e))
                time.sleep(2 * (attempt + 1))
        time.sleep(0.3)
    # фото, которых больше нет в меню, убираем (сайт в этом случае сам возьмёт фото с Drive)
    gone = have - set(ids)
    for fid in gone:
        for w in SIZES:
            p = os.path.join(OUT, "%s-%d.jpg" % (fid, w))
            if os.path.exists(p):
                os.remove(p)
    print("фото в меню: %d · скачано новых: %d · не скачано: %d · убрано старых: %d" % (len(ids), new, bad, len(gone)))


main()
