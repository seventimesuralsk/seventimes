#!/bin/bash
# Пересобрать обфусцированные assets из читаемых исходников в _src.
# Правим ЛОГИКУ в _src/assets/*.js и _src/kk/assets/*.js, затем: bash tools/build-obf.sh
set -e
cd "$(dirname "$0")/.."
for f in assets/core.js assets/menu.js assets/booking.js assets/projects.js assets/services.js assets/vacancy.js \
         kk/assets/core.js kk/assets/menu.js kk/assets/booking.js kk/assets/projects.js kk/assets/services.js kk/assets/vacancy.js kk/assets/kk.js; do
  node tools/obfuscate.mjs "_src/$f" "$f"
  node --check "$f" || { echo "ПАРСИНГ УПАЛ: $f"; exit 1; }
done
echo "готово — не забудь обновить ?v= версии (tools/bump-versions.py) и APP_CACHE"
