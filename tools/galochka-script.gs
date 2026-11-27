/**
 * Seven Times — галочка в профиле гостя. ОТДЕЛЬНЫЙ скрипт и ОТДЕЛЬНАЯ таблица
 * («Seven Times — Галочка (заявки)»). Основной скрипт меню не трогается.
 *
 * Как работает:
 *  - Гость в профиле → «Статистика» → «Получить галочку» → в этой таблице появляется строка.
 *  - В последней колонке «Одобрено» пишете «да» → у гостя в профиле появляется синяя галочка.
 *  - Пусто (или что угодно, кроме «да») → галочки нет. Стерли «да» → галочка пропадёт.
 *
 * Установка (один раз):
 *  1) Открыть таблицу → Расширения → Apps Script.
 *  2) Стереть всё в редакторе, вставить этот код, сохранить (значок дискеты).
 *  3) Начать развертывание → Новое развертывание → тип «Веб-приложение».
 *     Запуск от имени: «Я». Доступ: «Все». → Развернуть → Разрешить доступ.
 *  4) Скопировать «URL веб-приложения» (…/exec) и прислать.
 */
var SHEET = 'Галочка';
var HEAD = ['Дата', 'Имя', 'Телефон', 'Код', 'Заказов', 'С нами с', 'Язык', 'Одобрено (пишите да)'];
var COL_CODE = 4, COL_OK = 8, MAX_ROWS = 5000;

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(SHEET) || ss.getSheets()[0];
  if (s.getName() !== SHEET) s.setName(SHEET);
  if (s.getLastRow() === 0) s.appendRow(HEAD);
  if (!s.getFrozenRows()) {
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
    s.getRange(2, COL_OK, MAX_ROWS, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['да'], true).setAllowInvalid(true).build());
  }
  return s;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// текст из сайта — без формул и мусора
function clean_(v, n) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').replace(/^[=+\-@]/, "'$&").slice(0, n);
}

function isYes_(v) {
  return String(v == null ? '' : v).trim().toLowerCase().replace(/[.!]+$/, '') === 'да';
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var code = String(p.c || '').toUpperCase();
  if (!/^V[A-Z0-9]{5}$/.test(code)) return out_({ status: 'error' });
  try {
    if (p.action === 'vrfAsk') {
      var phone = clean_(p.phone, 24);
      if (phone.replace(/\D/g, '').length !== 11) return out_({ status: 'error' });
      var lock = LockService.getScriptLock();
      lock.waitLock(5000);
      try {
        var s = sheet_(), last = s.getLastRow();
        if (last > MAX_ROWS) return out_({ status: 'error' });
        if (last > 1) {
          var codes = s.getRange(2, COL_CODE, last - 1, 1).getValues();
          for (var i = 0; i < codes.length; i++) if (String(codes[i][0]) === code) return out_({ status: 'success', dup: true });
        }
        s.appendRow([new Date(), clean_(p.name, 60), phone, code, clean_(p.n, 6), clean_(p.since, 20), clean_(p.lang, 4), '']);
      } finally { lock.releaseLock(); }
      return out_({ status: 'success' });
    }
    if (p.action === 'vrfCheck') {
      var s2 = sheet_(), l2 = s2.getLastRow();
      if (l2 > 1) {
        var v = s2.getRange(2, COL_CODE, l2 - 1, COL_OK - COL_CODE + 1).getValues();
        for (var j = v.length - 1; j >= 0; j--)
          if (String(v[j][0]) === code) return out_({ status: 'success', found: true, ok: isYes_(v[j][COL_OK - COL_CODE]) });
      }
      return out_({ status: 'success', found: false, ok: false });
    }
  } catch (err) {}
  return out_({ status: 'error' });
}
