Оферта и Политика конфиденциальности (RU/KK) — исходники. Папка _src на сайт не публикуется.
Выкладка после получения реквизитов:
1) создать _src/legal/rekv.json: {"ORG":"...","BIN":"...","ADDR":"...","EMAIL":"...","DPO":"...","N_HOURS":"..."}
2) git apply _src/legal/draft.patch  (ссылки в формах вместо taplink, стили, страницы oferta/ и privacy/)
3) python3 _src/legal/build.py  (пересобрать страницы с реквизитами), затем tools/build-obf.sh для vacancy.js и tools/bump-versions.py
