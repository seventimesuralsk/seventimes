# Погода в Уральске для приветствия: фактическое наблюдение метеостанции аэропорта Уральска (METAR UARR,
# aviationweather.gov — открытые данные), запасной вариант — прогноз MET Norway на текущий час (CC BY 4.0).
# Пишет menu/weather.json: {"c": температура, "s": погода (как у MET Norway: clearsky, cloudy, lightrain, heavysnow…), "at": время наблюдения}.
# Сайт показывает погоду, только если ей меньше 90 минут.
import json, re, sys, time, urllib.request

UA = {"User-Agent": "seventimes-site/1.0 github.com/seventimesuralsk/seventimes"}
OUT = sys.argv[1] if len(sys.argv) > 1 else "menu/weather.json"


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def from_metar(m):
    if not m or not isinstance(m.get("temp"), (int, float)):
        return None
    w = str(m.get("wxString") or "")
    cov = " ".join(str(c.get("cover", "")) for c in (m.get("clouds") or []))
    raw = str(m.get("rawOb") or "")
    inten = "heavy" if "+" in w else "light" if "-" in w else ""
    if "TS" in w:
        s = inten + "rainandthunder" if re.search(r"RA|SH", w) else "thunder"
    elif re.search(r"FZRA|FZDZ|PL", w) or (re.search(r"RA|DZ", w) and re.search(r"SN|GS|GR", w)):
        s = inten + "sleet"
    elif re.search(r"SN|SG|IC", w):
        s = inten + "snow"
    elif re.search(r"RA|DZ", w):
        s = (inten or ("light" if "DZ" in w else "")) + "rain"
    elif re.search(r"FG|BR", w):
        s = "fog"
    elif re.search(r"OVC|BKN", cov) or " VV" in raw:
        s = "cloudy"
    elif re.search(r"SCT|FEW", cov):
        s = "partlycloudy"
    else:
        s = "clearsky"
    at = int(m.get("obsTime") or 0)
    return {"c": round(m["temp"]), "s": s, "at": at}


def from_metno(j):
    d = j["properties"]["timeseries"][0]["data"]
    sym = ((d.get("next_1_hours") or d.get("next_6_hours") or {}).get("summary") or {}).get("symbol_code", "")
    return {"c": round(d["instant"]["details"]["air_temperature"]), "s": re.sub(r"_(day|night|polartwilight)$", "", sym), "at": int(time.time())}


new = None
try:
    a = get("https://aviationweather.gov/api/data/metar?ids=UARR&format=json")
    w = from_metar(a[0] if a else None)
    if w and time.time() - w["at"] < 7200:
        new = w
except Exception as e:
    print("::warning::METAR не получен:", e)
if not new:
    try:
        new = from_metno(get("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=51.23&lon=51.37"))
    except Exception as e:
        print("::warning::погода не получена:", e)
if new:
    try:
        old = json.load(open(OUT, encoding="utf-8"))
    except Exception:
        old = {}
    if (old.get("c"), old.get("s"), old.get("at")) != (new["c"], new["s"], new["at"]):
        json.dump(new, open(OUT, "w", encoding="utf-8"), separators=(",", ":"))
        print("погода:", new)
