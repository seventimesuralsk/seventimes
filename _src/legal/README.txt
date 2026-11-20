Оферта и Политика конфиденциальности (RU/KK) — исходники. Папка _src на сайт не публикуется.
Выкладка после получения реквизитов:
1) создать _src/legal/rekv.json: {"ORG":"...","BIN":"...","ADDR":"...","EMAIL":"...","DPO":"...","N_HOURS":"..."}
2) git apply _src/legal/draft.patch  (ссылки в формах вместо taplink, стили, страницы oferta/ и privacy/)
3) python3 _src/legal/build.py  (пересобрать страницы с реквизитами), затем tools/build-obf.sh для vacancy.js и tools/bump-versions.py

ВНИМАНИЕ (ноябрь 2026): анкета вакансий упрощена до 3 полей (должность, имя, телефон), отдельного шага согласия больше нет —
согласие теперь строкой под формой (HR_T.consent в _src/assets/vacancy.js и _src/kk/assets/vacancy.js).
Хунки draft.patch для vacancy.js устарели: при выкладке реквизитов ссылку на Политику конфиденциальности добавить в HR_T.consent вручную.
