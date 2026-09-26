/*
 * SEVEN AI — собственный помощник Seven Times (без платного ИИ).
 *
 * Работает прямо в телефоне гостя. Понимает русский, казахский и английский,
 * вперемешку, с опечатками, транслитом ("skolko stoit") и английской раскладкой.
 * Отвечает на языке гостя, с юмором и лёгким сарказмом, никогда не извиняется.
 * Не просто отвечает, а ведёт до результата: оформляет доставку/самовывоз и
 * бронирует столик прямо в чате (через те же функции, что и формы сайта).
 * Блюда показывает карточками прямо в переписке.
 *
 * Жёсткие правила: только факты ниже и живое меню сайта. Номер менеджера и
 * WhatsApp до заказа не даёт НИКОГДА — связь с менеджером только через
 * оформленный заказ или бронь (они сами уходят менеджеру в WhatsApp).
 * Оплату доставки спрашивает как форма сайта: наличные или Kaspi перевод.
 * Акции не выдумывает — отправляет в «Сообщения».
 *
 * Свои ответы — в админке ("Настройки SEVEN AI"): строка "слова = ответ".
 * После правки этого файла поменяйте цифру в имени (seven-ai.5.js) и в
 * index.html — иначе у гостей останется старая версия из кэша.
 */
(function (root) {
  "use strict";

  // ─────────────────────────── ФАКТЫ ───────────────────────────
  var FACTS = {
    years: 5,
    freeDeliveryFrom: 3000,
    containerPrice: 100,
    nurlan: { name: "Нурлан", phone: "+7 700 807 0001" },
    terms: { order: "https://taplink.cc/seventimes/p/1153436/", book: "https://taplink.cc/seventimes/p/1154a9f/" },
    bookDeposit: 2000,
    branches: {
      samal: {
        name: "Самал 70/3", district: { ru: "10 микрорайон", kz: "10 шағын аудан", en: "10th microdistrict" },
        open: 11 * 60, close: 25 * 60, delivery: true, kids: true, bookId: 0, bookHours: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0], bookUntil: "00:00"
      },
      skoro: {
        name: "Скоробогатова 65/1", district: { ru: "центр города", kz: "қала орталығы", en: "city centre" },
        open: 12 * 60, close: 26 * 60, delivery: true, kids: false, bookId: 1, bookHours: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1], bookUntil: "01:00"
      },
      abulhair: {
        name: "Абулхаир Хана 177", district: { ru: "4 микрорайон", kz: "4 шағын аудан", en: "4th microdistrict" },
        open: 8 * 60, close: 25 * 60, delivery: false, kids: false, bookId: 3, bookHours: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0], bookUntil: "00:00"
      }
    }
  };
  var ORDER = ["samal", "skoro", "abulhair"];
  var ORDER_BR = ["samal", "skoro"]; // заказ через сайт (доставка и самовывоз) — только эти два

  function L(lang, ru, kz, en) { return lang === "kz" ? (kz != null ? kz : ru) : lang === "en" ? (en != null ? en : ru) : ru; }

  // ─────────────────────────── ТЕКСТ ───────────────────────────
  var KZ_LETTERS = /[әғқңөұүһі]/i;
  function baseNorm(s) {
    return String(s || "").toLowerCase()
      .replace(/ё/g, "е")
      .replace(/ә/g, "а").replace(/ғ/g, "г").replace(/қ/g, "к").replace(/ң/g, "н")
      .replace(/ө/g, "о").replace(/[ұү]/g, "у").replace(/һ/g, "х").replace(/і/g, "и")
      .replace(/[ъь]/g, "")
      .replace(/['’`]/g, "")
      .replace(/(\d)\s*[:.]\s*(\d\d)/g, "$1$2")
      .replace(/[^a-zа-я0-9]+/g, " ")
      .replace(/([а-яa-z])\1{2,}/g, "$1")
      .trim();
  }
  var TRANS = [["shch", "щ"], ["sch", "щ"], ["ch", "ч"], ["sh", "ш"], ["zh", "ж"], ["kh", "х"], ["ts", "ц"], ["ya", "я"], ["yu", "ю"], ["yo", "е"], ["ye", "е"],
    ["a", "а"], ["b", "б"], ["c", "к"], ["d", "д"], ["e", "е"], ["f", "ф"], ["g", "г"], ["h", "х"], ["i", "и"], ["j", "ж"], ["k", "к"], ["l", "л"], ["m", "м"],
    ["n", "н"], ["o", "о"], ["p", "п"], ["q", "к"], ["r", "р"], ["s", "с"], ["t", "т"], ["u", "у"], ["v", "в"], ["w", "в"], ["x", "кс"], ["y", "ы"], ["z", "з"]];
  function translit(s) {
    return s.replace(/[a-z]+/g, function (w) {
      var out = "", i = 0;
      while (i < w.length) {
        var hit = false;
        for (var k = 0; k < TRANS.length; k++) {
          var p = TRANS[k][0];
          if (w.substr(i, p.length) === p) { out += TRANS[k][1]; i += p.length; hit = true; break; }
        }
        if (!hit) { out += w[i]; i++; }
      }
      return out;
    });
  }
  var LAYOUT = { q: "й", w: "ц", e: "у", r: "к", t: "е", y: "н", u: "г", i: "ш", o: "щ", p: "з", "[": "х", "]": "ъ", a: "ф", s: "ы", d: "в", f: "а", g: "п", h: "р", j: "о", k: "л", l: "д", ";": "ж", "'": "э", z: "я", x: "ч", c: "с", v: "м", b: "и", n: "т", m: "ь", ",": "б", ".": "ю", "`": "е" };
  function fromLayout(raw) {
    return String(raw || "").toLowerCase().replace(/[a-z;',.\[\]`]/g, function (c) { return LAYOUT[c] || c; });
  }
  function toks(n) { return n ? n.split(" ").filter(Boolean) : []; }
  function cap(s) { return String(s).replace(/(^|[\s-])([a-zа-яёәғқңөұүһі])/g, function (m, a, b) { return a + b.toUpperCase(); }); }

  // Дамерау-Левенштейн (с ранним выходом) — для опечаток
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (i = 1; i <= a.length; i++) {
      var rowMin = max + 1;
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < rowMin) rowMin = d[i][j];
      }
      if (rowMin > max) return max + 1;
    }
    return d[a.length][b.length];
  }
  function allowed(len) { return len <= 3 ? 0 : len <= 6 ? 1 : 2; }
  // как слышится: люди пишут "дастафка", "пица", "скока"
  function phon(w) {
    return w.replace(/тс|дс|тц/g, "ц").replace(/[оа]/g, "а").replace(/[еэиыё]/g, "и").replace(/я/g, "а").replace(/ю/g, "у")
      .replace(/ф/g, "в").replace(/щ/g, "ш").replace(/([бвгджзклмнпрстфхцчшщ])\1/g, "$1");
  }
  var KNOWN = {};   // слова, которые мы знаем точно — для них опечатки не ищем
  var BLOCK = ["завтра", "сегодня", "вчера", "погода", "погоду", "привет", "работаю", "стоит", "стоят", "скоро", "пока", "очень", "можно", "нужно", "будет", "человек", "гостей", "минут"];
  var STEMS = [], stemCache = {};
  // слово начинается с основы из словаря ("состав", "балалар") — значит, это оно и есть,
  // а не опечатка другого слова ("достав", "халал")
  function stemKnown(t) {
    if (stemCache[t] !== undefined) return stemCache[t];
    var r = false;
    for (var i = 0; i < STEMS.length && !r; i++) if (t.indexOf(STEMS[i]) === 0) r = true;
    return (stemCache[t] = r);
  }
  // насколько слово гостя похоже на основу слова из словаря (0..1)
  function tokScore(t, stem, loose) {
    if (!t || !stem) return 0;
    if (t === stem) return 1;
    if (stem.length >= 3 && t.indexOf(stem) === 0) return 1;
    if (stem.length <= 3 || (loose !== 2 && KNOWN[t]) || (!loose && stemKnown(t))) return 0;
    if (/[a-z]/.test(t) !== /[a-z]/.test(stem)) return 0;
    var a = allowed(stem.length);
    var head = t.slice(0, stem.length + 1);
    var best = Math.min(dist(t.slice(0, stem.length), stem, a), dist(head, stem, a), t.length <= stem.length + 2 ? dist(t, stem, a) : a + 1);
    if (best <= a) return 0.8;
    var pt = phon(t), ps = phon(stem);
    if (pt.indexOf(ps) === 0) return 0.8;
    if (ps.length < 6) return 0;
    var pb = Math.min(dist(pt.slice(0, ps.length), ps, a), dist(pt, ps, a));
    return pb <= a && t.length >= stem.length - 1 ? 0.75 : 0;
  }
  // ключ "до скольки" — все основы должны встретиться (в любом порядке)
  function keyScore(tokens, key, loose) {
    var parts = key.split(" "), total = 0;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], best = 0;
      var exact = p.charAt(0) === "=";
      if (exact) p = p.slice(1);
      for (var j = 0; j < tokens.length; j++) {
        var s = exact ? (tokens[j] === p ? 1 : 0) : tokScore(tokens[j], p, loose);
        if (s > best) best = s;
      }
      if (!best) return 0;
      total += best;
    }
    return total / parts.length;
  }

  // ─────────────────────────── НАМЕРЕНИЯ ───────────────────────────
  // "=слово" — только точное совпадение; остальное — основа слова с опечатками
  var INTENTS = {
    greet: ["привет", "здравств", "здраст", "добрый день", "доброе утро", "добрый вечер", "=добрый", "салем", "салеметсиз", "=салам", "ассалаум", "=хай", "хелло", "=ку", "кайырлы", "=приветик", "=hi", "=hello", "=hey", "good morning", "good evening", "good afternoon"],
    thanks: ["спасиб", "благодар", "рахмет", "ракмет", "=спс", "сенкс", "=thanks", "=thx", "thank you", "=ty"],
    bye: ["=пока", "до свидан", "досвидан", "сау бол", "кош бол", "=бай", "до встречи", "=bye", "=goodbye", "see you"],
    hours: ["во сколько", "до скольки", "до скольк", "со скольки", "=до скок", "=во скок", "график", "режим работ", "время работ", "часы работ", "=работаете", "=работает", "открыва", "закрыва", "=открыты", "=открыто", "=закрыты", "=открыт", "ашылас", "ашылад", "ашык", "жабылас", "жабык", "жумыс уакыт", "жумыс истейси", "=сагат", "кашан аш", "нешеге дейин", "до утра", "ночью", "круглосуточ", "сейчас работ", "=жумыс истей", "what time do", "=hours", "opening hours", "working hours", "until when", "=open", "=close", "=closing", "=opening"],
    address: ["адрес", "где наход", "где вы", "как найти", "как доехать", "как добрат", "филиал", "=точки", "расположен", "=район", "микрорайон", "=мкр", "мекенжай", "кайда", "кай жерде", "2гис", "локаци", "=где", "=address", "=location", "where are you", "where is", "how to get", "=branches", "=branch"],
    delivery: ["достав", "привез", "привоз", "курьер", "на дом", "=домой", "жеткиз", "=в офис", "доставляет", "deliver", "courier", "=bring"],
    deliveryPrice: ["бесплатн", "минимальн", "минималк", "сколько доставк", "стоимост доставк", "цена доставк", "от скольки", "delivery cost", "delivery fee", "free delivery", "delivery price"],
    deliveryTime: ["сколько ждать", "как долго", "через сколько", "время доставк", "как быстро", "быстро привез", "долго ждать", "канша уакытта", "=скоро", "how long", "how fast"],
    pickup: ["самовывоз", "забрать сам", "сам заберу", "с собой", "навынос", "на вынос", "озим алып", "алып кет", "=самовывозом", "pick up", "=pickup", "take away", "=takeaway", "to go"],
    payment: ["оплат", "=каспи", "=kaspi", "наличн", "=картой", "карточк", "по карте", "перевод", "как платить", "чем платить", "толем", "=qr", "терминал", "расчет", "=pay", "payment", "=card", "=cash"],
    orderHow: ["как заказ", "как оформ", "как сделать заказ", "заказ через", "тапсырыс калай", "how to order", "how do i order", "how can i order"],
    orderStart: ["хочу заказать", "заказать доставку", "оформить доставку", "оформи доставку", "хочу доставку", "доставку хочу", "оформить заказ", "сделать заказ", "оформи заказ", "=закажи", "=закажите", "хочу оформить", "=заказать", "=заказываю", "=закажу", "тапсырыс бер", "тапсырыс жаса", "i want to order", "order delivery", "place an order", "make an order", "=order"],
    booking: ["бронь", "брони", "забронир", "бронир", "столик", "резерв", "брондау", "устел", "зарезерв", "свободн мест", "места есть", "=стол", "=стола", "=столы", "=столов", "=book", "=booking", "reserve", "reservation", "=table"],
    bookingRules: ["опозда брон", "опозда стол", "=опоздаю", "=опоздаем", "предоплат", "сколько держ", "правила брон", "условия брон", "отменить брон", "отмена брон", "депозит", "кешиг", "кешик", "неявк", "booking rules", "cancel booking", "cancel reservation", "=deposit", "prepayment"],
    kids: ["детск", "для детей", "игров", "с детьми", "с ребен", "балалар", "=бала", "=балам", "ребенк", "детей", "=kids", "children", "=child", "playground", "play area"],
    wifi: ["=wifi", "=вифи", "=уифи", "вай фай", "вайфай", "=wi", "интернет", "пароль от", "=internet", "wifi password"],
    outlets: ["розетк", "зарядк", "зарядит", "ноутбук", "зарядиться", "socket", "charger", "=charge", "outlet"],
    birthday: ["день рожден", "=др", "днюх", "днюшк", "именин", "туган кун", "туылган", "на др", "birthday", "=bday"],
    promos: ["акци", "скидк", "промокод", "бонус", "подарок", "кешбэк", "кэшбэк", "жениллик", "распродаж", "=акция", "discount", "=promo", "promotion", "=sale", "=offer", "=deal", "coupon"],
    vacancy: ["ваканс", "=работу", "=работа", "=работы", "на работу", "устроит", "трудоустр", "подработ", "требуют", "резюме", "=жумыска", "жумыс керек", "официантом", "поваром", "=job", "=jobs", "vacanc", "hiring", "career"],
    about: ["о компании", "=о вас", "кто вы", "=история", "сколько лет", "давно работ", "=основан", "владел", "компани туралы", "про вас", "про компанию", "расскажи о", "about you", "about the company", "about company", "tell me about"],
    cuisine: ["кухн", "что готовите", "какая еда", "восточн", "европейск", "японск", "азиатск", "паназиат", "асхана", "cuisine", "kind of food"],
    menu: ["=меню", "что есть", "что у вас", "ассортимент", "что поесть", "покушать", "поесть", "=кушать", "=жрать", "мазир", "=тагам", "=тагамдар", "не бар", "что имеется", "что можно", "=menu", "what do you have", "what food", "=food"],
    recommend: ["посовет", "что вкусн", "рекоменд", "что взять", "что попробов", "=хит", "=хиты", "популярн", "самое вкусн", "что заказать", "кенес", "не жей", "не ишей", "подскажите что", "что лучше", "ваш фирмен", "фирменн", "recommend", "=best", "popular", "suggest", "what should"],
    price: ["сколько стоит", "=скок", "=скоко", "=почем", "=цена", "=цены", "=ценник", "стоимост", "прайс", "канша турады", "=канша", "=бага", "=баасы", "=багасы", "сколько тенге", "по чем", "=стоит", "сколько за", "how much", "=price", "=prices", "=cost", "=costs"],
    compose: ["состав", "из чего", "что внутри", "что входит", "ингредиент", "=курамы", "что в нем", "что в ней", "ingredient", "whats in", "made of", "made from", "contains"],
    weight: ["грамм", "=гр", "сколько весит", "=вес", "=порция", "размер порц", "=салмагы", "объем", "=мл", "сколько см", "=weight", "=grams", "portion size", "how big"],
    spicy: ["остр", "=ащы", "перчен", "не остр", "=spicy", "chili"],
    veg: ["вегет", "без мяса", "постн", "веган", "=етсиз", "без мясо", "vegetarian", "=vegan", "no meat", "without meat", "meatless"],
    cheap: ["дешев", "недорог", "бюджет", "подешевле", "эконом", "=арзан", "самое дешев", "=cheap", "cheapest", "budget", "inexpensive", "affordable"],
    halal: ["халал", "свинин", "=адал", "=харам", "=halal", "=pork"],
    allergy: ["аллерг", "алерг", "непереносим", "глютен", "лактоз", "=орехи", "орехов", "=арахис", "allerg", "gluten", "lactose", "=nuts", "peanut"],
    without: ["=без", "=убрать", "=уберите", "=исключить", "=without"],
    contacts: ["телефон", "позвонить", "связат", "ватсап", "вотсап", "=whatsapp", "=watsap", "инстаграм", "=инста", "контакт", "=номир", "хабарлас", "байланыс", "=звонок", "дайте номер", "ваш номер", "какой номер", "скиньте номер", "номер менеджер", "номер админ", "=phone", "phone number", "=contact", "=call", "=instagram", "=number"],
    operator: ["оператор", "живой человек", "менеджер", "администратор", "=админ", "позовите", "с человеком", "живого человек", "=manager", "=human", "real person", "=operator", "=admin", "talk to"],
    complaint: ["жалоб", "=ужас", "=ужасно", "=плохо", "холодн", "не привезли", "опоздал", "так долго", "долго вез", "до сих пор нет", "курьер опозда", "невкусн", "=обман", "верните деньги", "=возврат", "претензи", "шагым", "отвратит", "испорчен", "недоволен", "недовольна", "complaint", "terrible", "=awful", "disgusting", "cold food", "=refund", "too long"],
    orderStatus: ["где мой заказ", "где заказ", "статус заказа", "=когда привезут", "заказ не приш", "не пришел заказ", "мой заказ", "тапсырысым кайда", "where is my order", "order status", "my order"],
    bot: ["ты бот", "ты робот", "ты человек", "кто ты", "=ты ии", "нейросет", "искусствен", "сен кимсин", "сиз кимсиз", "=ты кто", "are you a bot", "are you human", "are you real", "what are you", "are you ai", "who are you"],
    smalltalk: ["как дела", "как ты", "кал калай", "как жизнь", "как настроен", "=чем занят", "=че делаешь", "что делаешь", "how are you", "whats up", "how is it going", "=sup"],
    flirt: ["люблю тебя", "=красотк", "выйдешь за", "свидани", "ты милая", "ты милый", "женись", "=красивая", "замуж", "i love you", "marry me", "date me", "you are cute", "youre cute", "=cutie"],
    ok: ["=ок", "=окей", "=ok", "=okay", "понятн", "=ясно", "=хорошо", "=ладно", "=жаксы", "тусиндим", "=понял", "=поняла", "=супер", "=класс", "=отлично", "=cool", "=great", "=fine", "got it", "=nice", "=perfect", "=alright"],
    parking: ["парковк", "припарков", "=парковка", "=parking"],
    alcohol: ["алкогол", "=пиво", "=вино", "=водка", "=коньяк", "кальян", "alcohol", "=beer", "=wine", "=vodka", "hookah", "shisha"],
    yes: ["=да", "=ага", "=иа", "=ия", "=иэ", "=угу", "=конечно", "=давай", "=давайте", "=yes", "=yeah", "=yep", "=sure", "=yup"],
    no: ["=нет", "=жок", "=неа", "=не надо", "=no", "=nope", "=nah"],
    // новое
    container: ["контейнер", "контеинер", "контэйнер", "=тара", "упаковк", "container", "to go box", "packaging", "=корап"],
    cakes: ["корпусн", "целый торт", "торт целиком", "целиком торт", "торт на заказ", "весь торт", "=торты", "whole cake", "=cakes", "тутас торт"],
    smm: ["=смм", "=smm", "сммщик", "=сммщика", "эсэмэм", "смм специалист"],
    creator: ["кто создал", "кто сделал сайт", "кто разработ", "разработчик", "создатель", "автор сайта", "сайт сделал", "who made", "who created", "who built", "=developer", "сайтты ким", "сайт жасаган"],
    marketer: ["маркетолог", "=маркетинг", "marketer", "=marketing"],
    nurlan: ["нурлан", "=nurlan"],
    weather: ["погод", "дожд", "=снег", "=жара", "=жарко", "weather", "=rain", "ауа райы"],
    timeNow: ["который час", "сколько времени", "сколько время", "сколько сейчас время", "what time is it", "time now", "сагат неше", "казир сагат"],
    dateNow: ["какое сегодня число", "какой сегодня день", "какое число", "what day is it", "whats the date", "бугин кай кун", "бугин кандай кун"],
    joke: ["анекдот", "=шутка", "пошути", "рассмеши", "шутк", "=joke", "funny", "=азил"],
    age: ["сколько тебе лет", "твой возраст", "how old are you", "нешеде"],
    botName: ["как тебя зовут", "твое имя", "как зовут", "whats your name", "your name", "атын ким", "атын кым"],
    sad: ["грустно", "=скучно", "мне плохо", "плохое настроение", "=устал", "=устала", "депресс", "=bored", "=sad", "=tired", "=жалыктым"],
    compliment: ["молодец", "красав", "=умница", "=умный", "=крутой", "=классный", "лучший бот", "good bot", "=smart", "=awesome", "=жарайсын"],
    cancel: ["=отмена", "=отмени", "=отменить", "=стоп", "=передумал", "=передумала", "=отбой", "не надо", "=cancel", "=stop", "бас тарт", "керек емес"],
    done: ["=оформляем", "=оформляй", "=оформи", "=все", "это все", "=хватит", "=готово", "=достаточно", "=done", "=checkout", "thats all", "=болды", "=жетеди", "больше ничего", "ничего больше", "=дальше", "=далее"],
    change: ["=изменить", "=поменять", "=исправить", "=изменить", "=change", "=edit", "озгерт"]
  };
  var RUDE = ["хуй", "хуе", "охрен", "охуе", "ахуе", "=нафиг", "=офигели", "пизд", "ебан", "ебат", "ебал", "ебу", "бля", "=сука", "=суки", "мудак", "мудил", "долбоеб", "дебил", "идиот", "=тупой", "=тупая", "=тупые", "говно", "дерьм", "херн", "=нахер", "=чмо", "=урод", "заеб", "акымак", "=сасык", "бесит", "задолбал", "=fuck", "fucking", "=shit", "=stupid", "=idiot", "=dumb", "=bitch", "=asshole"];
  var KZ_WORDS = ["салем", "салеметсиз", "рахмет", "ракмет", "канша", "турады", "кайда", "бар", "жок", "ма", "ме", "ба", "бе", "па", "пе", "керек", "маган", "сиз", "сизде", "сен", "тапсырыс", "жеткизу", "устел", "брондау", "ашык", "жабык", "бала", "балалар", "туган", "кун", "жумыс", "уакыт", "сагат", "мазир", "тагам", "кандай", "калай", "иа", "ия", "жаксы", "тусиндим", "кашан", "нешеге", "дейин", "мекенжай", "толем", "бага", "баасы", "жениллик", "айтыныз", "бериниз", "кенес", "не", "осы", "мен", "биз", "сиздер", "кайырлы", "курамы", "ащы", "арзан", "еттен", "етсиз", "ишу", "жеу", "алып", "кету", "осында", "бугин", "ертен", "азир", "атым", "адам", "екеу", "уш", "торт", "бес", "ким", "неше"];
  // короткие английские слова-признаки языка (еда не в счёт — она одинаковая)
  var EN_WORDS = { the: 1, a: 1, an: 1, is: 1, are: 1, do: 1, does: 1, you: 1, your: 1, have: 1, has: 1, i: 1, me: 1, my: 1, what: 1, how: 1, much: 1, can: 1, to: 1, of: 1, "for": 1, "in": 1, on: 1, "with": 1, please: 1, want: 1, where: 1, when: 1, who: 1, which: 1, there: 1, any: 1, some: 1, it: 1, "this": 1, that: 1, hi: 1, hello: 1, hey: 1, thanks: 1, thank: 1, menu: 1, delivery: 1, deliver: 1, open: 1, book: 1, table: 1, order: 1, price: 1, cost: 1, food: 1, today: 1, tomorrow: 1, yes: 1, no: 1, people: 1, we: 1, us: 1, our: 1, get: 1, need: 1, like: 1, would: 1, could: 1, will: 1, be: 1, at: 1, from: 1, about: 1, tell: 1, good: 1, morning: 1, evening: 1, time: 1, name: 1, cheap: 1, best: 1, recommend: 1, kids: 1, halal: 1, spicy: 1, vegan: 1, vegetarian: 1, pickup: 1, address: 1, location: 1, hours: 1, phone: 1, number: 1, manager: 1, love: 1, bot: 1, human: 1, whats: 1, im: 1, am: 1, pm: 1, persons: 1, guests: 1, and: 1, or: 1, not: 1, dont: 1, too: 1, very: 1, weather: 1, joke: 1, bye: 1, sorry: 1, help: 1, reservation: 1, reserve: 1, drinks: 1, dessert: 1, desserts: 1, breakfast: 1, lunch: 1, dinner: 1, street: 1, apartment: 1, flat: 1, ok: 0 };
  var RU_LATIN = { skolko: 1, skolki: 1, skok: 1, est: 1, gde: 1, kak: 1, privet: 1, dostavka: 1, dostavku: 1, mozhno: 1, spasibo: 1, rabotaete: 1, zakaz: 1, hochu: 1, nado: 1, eto: 1, chto: 1, u: 1, vas: 1, stoit: 1, menyu: 1, pizzu: 1, rolly: 1, da: 1, net: 1, pojaluista: 1, pozhaluista: 1, zavtra: 1, segodnya: 1, stolik: 1, bron: 1, salem: 1, rahmet: 1, kaida: 1, kansha: 1, bar: 1, ma: 1 };
  var STOP = { "и": 1, "в": 1, "на": 1, "с": 1, "со": 1, "у": 1, "а": 1, "по": 1, "за": 1, "из": 1, "от": 1, "до": 1, "для": 1, "что": 1, "как": 1, "есть": 1, "ли": 1, "мне": 1, "вы": 1, "вас": 1, "это": 1, "какие": 1, "какой": 1, "какая": 1, "можно": 1, "пожалуйста": 1, "пж": 1, "плз": 1, "хочу": 1, "же": 1, "ну": 1, "еще": 1, "там": 1, "тут": 1, "бар": 1, "ма": 1, "ме": 1, "ба": 1, "бе": 1, "сизде": 1, "маган": 1, "да": 1, "нет": 1, "сколько": 1, "стоит": 1, "цена": 1, "почем": 1, "скок": 1, "канша": 1, "турады": 1, "вам": 1, "ваш": 1, "ваши": 1, "меню": 1, "блюдо": 1, "блюда": 1, "штук": 1, "шт": 1, "одна": 1, "один": 1, "одну": 1, "два": 1, "две": 1, "три": 1, "четыре": 1, "пять": 1, "пару": 1, "нам": 1, "какую": 1, "ест": 1, "имеется": 1, "заказать": 1, "закажу": 1, "закажи": 1, "возьму": 1, "беру": 1, "дайте": 1, "давай": 1, "добавь": 1, "добавьте": 1, "будет": 1, "будут": 1, "грамм": 1, "состав": 1, "без": 1, "не": 1, "про": 1, "хочется": 1, "хотим": 1, "доставку": 1, "доставка": 1, "самовывоз": 1, "the": 1, "a": 1, "an": 1, "is": 1, "are": 1, "do": 1, "you": 1, "have": 1, "i": 1, "me": 1, "my": 1, "what": 1, "how": 1, "much": 1, "can": 1, "to": 1, "of": 1, "for": 1, "in": 1, "on": 1, "with": 1, "please": 1, "want": 1, "any": 1, "some": 1, "it": 1, "order": 1, "get": 1, "and": 1, "price": 1 };

  function normKey(k) { return k.split(" ").map(function (p) { var ex = p.charAt(0) === "="; return (ex ? "=" : "") + baseNorm(ex ? p.slice(1) : p).replace(/ /g, ""); }).join(" "); }
  function normList(list) { for (var i = 0; i < list.length; i++) list[i] = normKey(list[i]); }
  function scoreIntents(tokens) {
    var out = {};
    for (var id in INTENTS) {
      var keys = INTENTS[id], s = 0;
      for (var i = 0; i < keys.length; i++) {
        var k = keyScore(tokens, keys[i]);
        if (k > 0) s = Math.max(s, k * (keys[i].indexOf(" ") > 0 ? 1.3 : 1));
      }
      if (s > 0) out[id] = s;
    }
    return out;
  }
  function anyKey(tokens, list, strict) {
    for (var i = 0; i < list.length; i++) if (keyScore(tokens, list[i]) >= (strict ? 1 : 0.8)) return true;
    return false;
  }

  // ─────────────────────────── ФИЛИАЛЫ ───────────────────────────
  var BRANCH_KEYS = {
    samal: ["самал", "=samal", "=10мкр", "10 мкр", "10 микро", "десят", "10 шагын"],
    skoro: ["скоробогат", "скорабогат", "скоробагат", "=skorobogatova", "=скоро", "центр", "орталы", "centre", "center"],
    abulhair: ["абулхаир", "абулхайр", "абылхаир", "абилкаир", "абилкайыр", "абулкаир", "abulhair", "abulkhair", "=4мкр", "4 мкр", "4 микро", "четверт", "=177", "4 шагын", "хана 177"]
  };
  function findBranch(tokens) {
    var best = null, bs = 0;
    for (var b in BRANCH_KEYS) {
      for (var i = 0; i < BRANCH_KEYS[b].length; i++) {
        var s = keyScore(tokens, BRANCH_KEYS[b][i]);
        if (s > bs) { bs = s; best = b; }
      }
    }
    return bs >= 0.8 ? best : null;
  }

  // ─────────────────────────── МЕНЮ ───────────────────────────
  function parseMods(m) {
    if (!m || !String(m).trim()) return [];
    return String(m).split("|").map(function (x) { var t = x.split(":"); return { label: (t[0] || "").trim(), price: parseInt(t[1], 10) || 0 }; })
      .filter(function (x) { return x.label && x.price; });
  }
  function fmt(n) { return Number(n).toLocaleString("ru-RU").replace(/\s/g, " ") + " ₸"; }
  var CAT_ALIASES = {
    "комбо": ["комбо", "=combo"], "ланч": ["бизнес ланч", "=ланч", "=обед", "=lunch"], "крыл": ["крыл", "=wings"], "коктейл": ["коктейл", "смузи", "милкшейк", "=шейк", "=smoothie", "cocktail", "milkshake"],
    "грузин": ["грузин", "хинкал", "хачапур", "georgian"], "итальян": ["итальян", "italian"],
    "пицц": ["пицц", "пиццы", "пизза", "пица", "=pizza", "=pizzas"], "ролл": ["ролл", "ролы", "=рол", "роллы", "=rolls", "=roll"], "суш": ["суш", "=суши", "=sushi"], "кофе": ["кофе", "кофи", "=кофейку", "=coffee"],
    "десерт": ["десерт", "сладк", "торт", "пирожн", "dessert", "=cake", "=sweets"], "салат": ["салат", "=salad", "=salads"], "суп": ["=суп", "=супы", "=супчик", "сорпа", "=сорпа", "=soup", "=soups"], "напит": ["напит", "попить", "=пить", "=ишу", "сусын", "=drinks", "=drink"],
    "бургер": ["бургер", "гамбургер", "burger"], "завтрак": ["завтрак", "=тангы", "breakfast"], "детск": ["детск меню", "=дет меню", "для ребенка", "балалар мазир", "kids menu"], "сет": ["=сет", "=сеты", "=набор", "=set", "=sets"],
    "гарнир": ["гарнир", "=фри", "картош", "=fries"], "лимонад": ["лимонад", "lemonade"], "чай": ["=чай", "=шай", "=чаю", "=tea"], "донер": ["донер", "шаурм", "шаверм", "doner", "shawarma"],
    "сэндвич": ["сэндвич", "сендвич", "клаб", "sandwich"], "горяч": ["горяч", "=второе", "=вторые", "hot dishes", "main course"], "паст": ["=паста", "=пасту", "спагет", "=pasta"], "рамен": ["рамен", "=ramen"], "том": ["том ям", "=томям", "tom yum"], "мант": ["мант", "=manty"],
    "новинк": ["новинк", "новое", "=new"]
  };
  // более узкие разделы проверяем раньше ("Супер комбо" — это не "суп")
  function catKey(name) { var n = baseNorm(name); for (var k in CAT_ALIASES) if (n.indexOf(k) >= 0) return k; return null; }
  var DRINK_CATS = ["напит", "кофе", "чай", "лимонад", "коктейл"];
  function isService(cat) { return /прибор/i.test(cat || ""); }

  function menuIndex(menus, current) {
    // текущий филиал — главный источник (там свежий стоп-лист и цены)
    var list = [], seen = {};
    var order = current && menus[current] ? [current].concat(ORDER.filter(function (b) { return b !== current; })) : ORDER;
    order.forEach(function (b) {
      var m = menus[b];
      if (!m) return;
      Object.keys(m).forEach(function (cat) {
        if (isService(cat)) return;
        (m[cat] || []).forEach(function (it) {
          if (!it || !it.name) return;
          var key = baseNorm(it.name);
          if (seen[key]) { if (seen[key].branches.indexOf(b) < 0) seen[key].branches.push(b); return; }
          var tk = toks(baseNorm(it.name)).filter(function (t) { return t.length >= 3 && !STOP[t]; });
          var syn = String(it.synonyms || "").split(/[,;]+/).map(function (x) { return toks(baseNorm(x)).filter(function (t) { return t.length >= 3 && !STOP[t]; }); }).filter(function (x) { return x.length; });
          var dt = toks(baseNorm(it.desc || "")).filter(function (t) { return t.length >= 3 && !STOP[t]; }).map(stemRu);
          var rec = { it: it, cat: cat, catKey: catKey(cat), tokens: tk, syn: syn, descStems: dt, branch: b, branches: [b], current: b === current };
          seen[key] = rec; list.push(rec);
        });
      });
    });
    return list;
  }
  function nameScore(q, words) {
    var matched = 0, strong = false, first = false, longHit = false;
    words.forEach(function (dt, di) {
      var best = 0;
      q.forEach(function (qt) {
        var s = qt === dt ? 1 : KNOWN[qt] ? 0 : (qt.length >= 4 && dt.length >= 4 && (dt.indexOf(qt) === 0 || qt.indexOf(dt) === 0)) ? 0.95
          : (qt.length >= 5 && dt.length >= 5 && stemEq(stemRu(qt), stemRu(dt))) ? 0.9
            : (dt.length >= 6 || Math.abs(qt.length - dt.length) <= 1) ? tokScore(qt, dt.slice(0, Math.max(4, Math.min(dt.length, qt.length + 1))), true) : 0;
        if (s > best) best = s;
      });
      if (best >= 0.8) { matched += best; if (dt.length >= 4) strong = true; if (di === 0) first = true; if (dt.length >= 6) longHit = true; }
    });
    if (!matched || !strong) return 0;
    var sc = matched / words.length + (first ? 0.25 : 0);
    // «филадельфию» → «Ролл Филадельфия»: главное слово названия совпало — этого достаточно
    return longHit ? Math.max(sc, 0.7) : sc;
  }
  function findDishesScored(tokens, idx) {
    var q = tokens.filter(function (t) { return t.length >= 3 && !STOP[t]; });
    if (!q.length) return [];
    var res = [];
    idx.forEach(function (r) {
      if (!r.tokens.length) return;
      var score = nameScore(q, r.tokens);
      r.syn.forEach(function (w) { score = Math.max(score, nameScore(q, w)); });
      if (score >= 0.5) res.push({ r: r, score: score });
    });
    res.sort(function (a, b) { return b.score - a.score || (b.r.current ? 1 : 0) - (a.r.current ? 1 : 0); });
    if (res.length && res[0].score >= 1) res = res.filter(function (x) { return x.score >= res[0].score - 0.3; });
    return res.slice(0, 6);
  }
  function findDishes(tokens, idx) { return findDishesScored(tokens, idx).map(function (x) { return x.r; }); }
  // грубое отсечение окончаний: "грибами" → "гриб", "курицей" → "куриц"
  function stemRu(w) {
    var s = w.replace(/(иями|ями|ами|ыми|ими|ого|его|ому|ему|ой|ей|ом|ем|ам|ям|ах|ях|ую|юю|ая|яя|ое|ее|ые|ие|ый|ий|ов|ев|ы|и|а|я|у|ю|е|о)$/, "");
    return s.length >= 3 ? s : w;
  }
  function stemEq(a, b) {
    if (a === b) return true;
    var m = Math.min(a.length, b.length);
    if (m <= 3) return false;
    var i = 0; while (i < m && a[i] === b[i]) i++;
    return i >= Math.max(4, m - 1);
  }
  // "что есть с грибами" — ищем по составу (описанию) блюд
  function findByIngredient(tokens, idx, loose) {
    var cand = [], i;
    for (i = 0; i < tokens.length; i++) if ((tokens[i] === "с" || tokens[i] === "со" || tokens[i] === "with") && tokens[i + 1]) cand.push(tokens[i + 1]);
    if (!cand.length && loose) cand = tokens.filter(function (t, j) { return tokens[j - 1] !== "без"; });
    cand = cand.filter(function (t) { return t.length >= 3 && !STOP[t] && !KNOWN[t] && !stemKnown(t) && !/^\d/.test(t) && !/[a-z]/.test(t); }).map(stemRu);
    if (!cand.length) return [];
    var hits = liveOnly(idx).map(function (r) {
      var nameSt = r.tokens.map(stemRu), n = 0;
      cand.forEach(function (c) { if (r.descStems.concat(nameSt).some(function (d) { return stemEq(c, d); })) n++; });
      return { r: r, n: n };
    }).filter(function (x) { return x.n; });
    var top = Math.max.apply(null, hits.map(function (x) { return x.n; }).concat([0]));
    return hits.filter(function (x) { return x.n === top; }).map(function (x) { return x.r; }).slice(0, 6);
  }
  function findCategory(tokens, idx) {
    var found = null;
    for (var k in CAT_ALIASES) {
      if (anyKey(tokens, CAT_ALIASES[k])) {
        var items = idx.filter(function (r) { return r.catKey === k || (k.length >= 3 && baseNorm(r.it.name).indexOf(k) >= 0); });
        if (items.length) { found = { key: k, items: items, name: items[0].cat }; break; }
        if (!found) found = { key: k, items: [], name: null };
      }
    }
    return found;
  }
  function liveOnly(list) { return list.filter(function (r) { return !r.it.stopped && !r.it.teaser; }); }
  function priceText(it, lang, short) {
    if (it.teaser) return L(lang, "скоро появится", "жақында шығады", "coming soon");
    if (it.stopped) return L(lang, "сейчас закончилось", "қазір таусылып қалды", "sold out right now");
    var mods = parseMods(it.mods);
    if (mods.length) {
      var min = Math.min.apply(null, mods.map(function (m) { return m.price; }));
      return L(lang, "от " + fmt(min), fmt(min) + "-дан бастап", "from " + fmt(min)) + (short ? "" : " (" + mods.map(function (m) { return m.label + " — " + fmt(m.price); }).join(", ") + ")");
    }
    var p = fmt(it.price);
    if (it.originalPrice && it.tempUntil && it.tempUntil > Date.now()) p += L(lang, " (вместо " + fmt(it.originalPrice) + ", временная цена)", " (" + fmt(it.originalPrice) + " орнына, уақытша баға)", " (instead of " + fmt(it.originalPrice) + ", limited price)");
    return p;
  }
  function dishLine(r, lang, withBranch, short) {
    var t = r.it.name + " — " + priceText(r.it, lang, short);
    if (withBranch && r.branches.length < 3) t += " (" + r.branches.map(function (b) { return FACTS.branches[b].name; }).join(", ") + ")";
    return t;
  }
  // карточка блюда прямо в переписке (без «плюсика»)
  function card(r, lang) {
    var it = r.it;
    return {
      id: String(it.id || ""), name: it.name, price: priceText(it, lang, !!parseMods(it.mods).length && true),
      sizes: parseMods(it.mods).map(function (m) { return m.label + " — " + fmt(m.price); }).join(" · "),
      desc: String(it.desc || "").trim().slice(0, 220), photo: String(it.photo || ""), badge: String(it.badge || ""),
      off: it.stopped ? L(lang, "Закончилось", "Таусылды", "Sold out") : it.teaser ? L(lang, "Скоро", "Жақында", "Soon") : ""
    };
  }
  function pickPopular(list, n) {
    var hits = list.filter(function (r) { return /хит|новин|рекомен|популяр|hit|new/i.test(r.it.badge || ""); });
    var rest = list.filter(function (r) { return hits.indexOf(r) < 0 && r.it.photo; });
    var more = list.filter(function (r) { return hits.indexOf(r) < 0 && rest.indexOf(r) < 0; });
    return hits.concat(rest, more).slice(0, n);
  }

  // Блюда, которых нет в меню → из какого раздела предложить похожее
  var SIMILAR = [
    [["плов", "бешбармак", "бесбармак", "казы", "шашлык", "куырдак", "кесп", "кеспе", "стейк", "котлет", "отбивн", "гуляш", "жаркое", "пельмен", "вареник", "беляш", "самса", "баурсак", "plov", "steak", "kebab", "dumpling"], ["горяч", "мант", "грузин"]],
    [["лагман", "шурп", "солянк", "окрошк", "уха", "харчо", "бульон", "лапша", "фо", "удон", "noodle"], ["суп", "рамен", "том"]],
    [["карбонар", "болоньез", "лазань", "спагетти", "равиол", "ризотто", "carbonara", "lasagna", "spaghetti", "risotto"], ["паст", "итальян"]],
    [["хинкали", "хачапури", "чахохбили", "khinkali", "khachapuri"], ["грузин"]],
    [["чизбургер", "гамбургер", "хот дог", "хотдог", "hotdog", "cheeseburger"], ["бургер", "сэндвич"]],
    [["шаурм", "шаверм", "донер", "лаваш", "буррито", "тако", "shawarma", "burrito"], ["донер", "сэндвич"]],
    [["наггетс", "стрипс", "крылыш", "nuggets", "strips"], ["крыл", "детск"]],
    [["кола", "пепси", "фанта", "спрайт", "сок", "вода", "компот", "морс", "cola", "pepsi", "juice", "water"], ["напит", "лимонад"]],
    [["мороженое", "морожен", "торт", "чизкейк", "пирожн", "блин", "вафл", "пончик", "эклер", "тирамису", "icecream", "cheesecake", "pancake", "waffle", "donut"], ["десерт"]],
    [["вок", "wok", "лапша", "noodles"], ["рамен", "горяч"]],
    [["оливье", "винегрет", "цезарь", "caesar"], ["салат"]],
    [["сашими", "гункан", "маки", "темпура", "sashimi", "tempura"], ["ролл", "суш", "сет"]],
    [["гавайск", "маргарит", "пепперони", "hawaiian", "margherita"], ["пицц"]],
    [["американо", "эспрессо", "мокко", "флэт", "раф", "латте", "капучино", "americano", "espresso", "latte", "cappuccino", "mocha"], ["кофе"]],
    [["матча", "каркаде", "улун", "matcha"], ["чай"]],
    [["милкшейк", "молочный коктейль", "фреш", "смузи", "milkshake"], ["коктейл", "лимонад"]],
    [["омлет", "яичниц", "каша", "сырник", "гранол", "omelette", "porridge"], ["завтрак"]]
  ];
  function similarCats(tokens) {
    var n = tokens.join(" "), out = [];
    SIMILAR.forEach(function (row) {
      if (row[0].some(function (w) { return (" " + n).indexOf(" " + w) >= 0; })) row[1].forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); });
    });
    return out;
  }
  function similarItems(tokens, idx, current) {
    var cats = similarCats(tokens);
    if (!cats.length) return [];
    var pool = liveOnly(idx).filter(function (r) { return (!current || r.branches.indexOf(current) >= 0) && cats.indexOf(r.catKey) >= 0; });
    // сначала раздел, который подходит лучше всего (первый в списке)
    pool.sort(function (a, b) { return cats.indexOf(a.catKey) - cats.indexOf(b.catKey); });
    var first = pool.filter(function (r) { return r.catKey === (pool[0] && pool[0].catKey); });
    return pickPopular(first.length >= 2 ? first : pool, 4);
  }

  // ─────────────────────────── ВРЕМЯ ───────────────────────────
  function ural(now) { return new Date((now || Date.now()) + 5 * 3600e3); } // Уральск, UTC+5 (поля UTC)
  function uralskMinutes(now) { var d = ural(now); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function hm(m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  function isOpen(b, now) {
    var B = FACTS.branches[b], m = uralskMinutes(now);
    return (m >= B.open && m < B.close) || (m + 1440 >= B.open && m + 1440 < B.close);
  }
  var WD = { ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"], kz: ["жексенбі", "дүйсенбі", "сейсенбі", "сәрсенбі", "бейсенбі", "жұма", "сенбі"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] };
  var WD_SHORT = { ru: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], kz: ["жс", "дс", "сс", "ср", "бс", "жм", "сб"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
  var MON = { ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"], kz: ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"], en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };
  function dateLong(y, m, d, lang) {
    var wd = new Date(Date.UTC(y, m, d)).getUTCDay();
    if (lang === "en") return WD.en[wd] + ", " + d + " " + MON.en[m];
    if (lang === "kz") return d + " " + MON.kz[m] + ", " + WD.kz[wd];
    return d + " " + MON.ru[m] + ", " + WD.ru[wd];
  }

  // ─────────────────────────── ОТВЕТЫ ───────────────────────────
  var lastPick = {};
  function pick(key, arr) {
    if (arr.length === 1) return arr[0];
    var i, tries = 0;
    do { i = Math.floor(Math.random() * arr.length); tries++; } while (i === lastPick[key] && tries < 5);
    lastPick[key] = i; return arr[i];
  }
  var A = {
    menu: { ru: "Открыть меню", kz: "Мәзірді ашу", en: "Open the menu" }, book: { ru: "Забронировать столик", kz: "Үстел брондау", en: "Book a table" },
    news: { ru: "Акции в «Сообщениях»", kz: "«Сообщения» бөлімі", en: "Promos in «Сообщения»" }, vacancy: { ru: "Открыть «Вакансии»", kz: "«Вакансии» бөлімі", en: "Open «Вакансии»" },
    cart: { ru: "Открыть корзину", kz: "Себетті ашу", en: "Open the cart" }
  };
  function act(id, lang) { return { a: id, label: A[id] ? (A[id][lang] || A[id].ru) : id }; }
  function chip(label, text) { return { a: "ask:" + text, label: label }; }
  function askBook(lang) { return chip(A.book[lang] || A.book.ru, L(lang, "хочу забронировать столик", "үстел брондағым келеді", "I want to book a table")); }
  function askOrder(lang, mode) {
    return mode === "self" ? chip(L(lang, "Оформить самовывоз", "Өзім алып кетемін", "Order for pickup"), L(lang, "хочу оформить самовывоз", "өзім алып кетемін, тапсырыс беремін", "I want to order for pickup"))
      : chip(L(lang, "Оформить доставку", "Жеткізуге тапсырыс", "Order delivery"), L(lang, "хочу оформить доставку", "жеткізуге тапсырыс беремін", "I want to order delivery"));
  }

  var T = {
    greet: {
      ru: ["О, гость! Я SEVEN AI — знаю меню лучше шефа (только ему не говорите). Спрашивайте что угодно или сразу оформлю доставку.", "Привет! Я SEVEN AI. Расскажу про меню, привезу еду и забронирую столик — не выходя из этого чата.", "Здравствуйте! SEVEN AI на связи. Голодны? Тогда вы по адресу."],
      kz: ["Сәлем! Мен SEVEN AI — Seven Times көмекшісімін. Мәзір, жеткізу, брондау — бәрін осы чатта шешеміз. Не қалайсыз?", "Сәлеметсіз бе! SEVEN AI байланыста. Қарныңыз ашты ма? Дұрыс жерге келдіңіз."],
      en: ["Hey! I'm SEVEN AI — I know the menu better than the chef (don't tell him). Ask me anything, or I'll set up your delivery right here.", "Hi! I'm SEVEN AI. I can walk you through the menu, get food delivered and book a table — all without leaving this chat."]
    },
    thanks: { ru: ["Обращайтесь — я тут круглосуточно, в отличие от кухни.", "Всегда пожалуйста. Приятного аппетита заранее!", "Не за что! Я никуда не денусь."], kz: ["Оқасы жоқ! Ас болсын!", "Әрқашан көмектесемін. Тағы сұрақ болса — жазыңыз."], en: ["Anytime — I'm here 24/7, unlike the kitchen.", "You're welcome. Enjoy your meal in advance!"] },
    bye: { ru: ["До встречи в Seven Times! Приходите голодными.", "Пока-пока! Возвращайтесь, когда проголодаетесь."], kz: ["Сау болыңыз! Seven Times-та күтеміз.", "Қарныңыз ашқанда қайта келіңіз!"], en: ["See you at Seven Times! Come hungry.", "Bye! Come back when you're hungry."] },
    ok: { ru: ["Отлично. Что ещё подсказать?", "Принято. Ещё вопросы — или уже к делу, к еде?", "Супер. Я тут, если что."], kz: ["Керемет. Тағы не айтайын?", "Жақсы. Мен осындамын."], en: ["Great. What else can I do?", "Got it. More questions — or straight to the food?"] },
    about: {
      ru: ["Seven Times — " + FACTS.years + " лет на рынке. Начинали с одного зала, теперь три ресторана в Уральске и одна из самых популярных сетей города. Нас любят за разнообразное меню, тёплую атмосферу и дружную команду. И да, зарплату платим вовремя — это не шутка."],
      kz: ["Seven Times нарықта " + FACTS.years + " жыл. Бір залдан бастадық, қазір Оралда үш мейрамхана — қаладағы ең танымал желілердің бірі. Бізді түрлі мәзір, жылы атмосфера және ауызбіршілігі мықты ұжым үшін жақсы көреді. Жалақыны уақытында төлейміз."],
      en: ["Seven Times has been around for " + FACTS.years + " years. We started with one hall and now run three restaurants in Uralsk — one of the most popular chains in town. People love us for the varied menu, the cozy vibe and a friendly team. And yes, we pay salaries on time."]
    },
    cuisine: {
      ru: ["У нас три кухни в одном меню: восточная (том ям, домашние манты), европейская (пицца) и японская (суши, роллы, рамен). Нерешительным — сложно, голодным — идеально."],
      kz: ["Бір мәзірде үш асхана: шығыс (том ям, үйде жасалған манты), еуропалық (пицца) және жапон (суши, роллдар, рамен). Әркім өзіне ұнайтынын табады."],
      en: ["Three cuisines in one menu: Eastern (tom yum, homemade manty), European (pizza) and Japanese (sushi, rolls, ramen). Tough for the indecisive, perfect for the hungry."]
    },
    pickup: {
      ru: ["Самовывоз есть во всех трёх филиалах. Через сайт — из Самал 70/3 и Скоробогатова 65/1, а в Абулхаир Хана 177 заказ делается на месте. Могу оформить прямо тут."],
      kz: ["Өзі алып кету үш филиалда да бар. Сайт арқылы — Самал 70/3 және Скоробогатова 65/1, ал Абулхаир Хана 177-де тапсырыс орнында беріледі. Осы жерде рәсімдей аламын."],
      en: ["Pickup works at all three branches. Online pickup orders come from Samal 70/3 and Skorobogatova 65/1; at Abulhair Khan 177 you order on site. I can set it up right here."]
    },
    payment: { ru: ["Доставку можно оплатить наличными или Kaspi переводом — выберете, когда буду оформлять заказ. Детали подтвердит менеджер.", "Наличные или Kaspi перевод — как вам удобнее. Спрошу на оформлении, а менеджер подтвердит."], kz: ["Жеткізуді қолма-қол немесе Kaspi аударымымен төлеуге болады — тапсырыс рәсімдегенде таңдайсыз."], en: ["Delivery can be paid in cash or by Kaspi transfer — you'll choose when I place the order. The manager confirms the details."] },
    bookingRules: {
      ru: ["Все условия брони — по кнопке ниже. Если коротко: столик держим 20 минут, а предоплата 2 000 ₸ не возвращается при неявке. Забронировать могу прямо здесь."],
      kz: ["Брондау шарттары — төмендегі батырмада. Қысқаша: үстелді 20 минут ұстаймыз, келмей қалсаңыз 2 000 ₸ алдын ала төлем қайтарылмайды. Брондауды осы жерде жасай аламын."],
      en: ["The booking terms are behind the button below. In short: we hold the table for 20 minutes, and the 2,000 ₸ prepayment isn't refunded if you don't show up. I can book a table right here."]
    },
    kids: { ru: ["Детская игровая зона есть только в Самал 70/3 (10 микрорайон) — дети играют, взрослые едят спокойно. В двух других филиалах её нет."], kz: ["Балалар ойын аймағы тек Самал 70/3 филиалында (10 шағын аудан). Қалған екеуінде жоқ."], en: ["The kids' play area is only at Samal 70/3 (10th microdistrict) — kids play, adults eat in peace. The other two branches don't have one."] },
    wifi: { ru: ["Бесплатный Wi‑Fi есть во всех трёх филиалах. Пароль скажет официант — мне его не доверили."], kz: ["Үш филиалда да тегін Wi‑Fi бар. Құпиясөзді даяшы айтады — маған сенбеді."], en: ["Free Wi‑Fi at all three branches. The waiter has the password — they didn't trust me with it."] },
    outlets: { ru: ["Розетки у каждого стола во всех филиалах. Зарядите телефон — и снова в бой."], kz: ["Барлық филиалда әр үстелде розетка бар — телефонды зарядтай бересіз."], en: ["Every table has a power outlet at all branches. Charge up and carry on."] },
    birthday: { ru: ["В день рождения у нас скидка около 10% — без дополнительных условий. Приходите праздновать!"], kz: ["Туған күнге шамамен 10% жеңілдік бар, қосымша шартсыз. Тойлауға келіңіз!"], en: ["On your birthday you get about 10% off, no strings attached. Come celebrate!"] },
    promos: { ru: ["Все актуальные акции живут в разделе «Сообщения». Выдумывать скидки не буду — меня за это уволят. Из постоянного: около 10% в день рождения."], kz: ["Барлық акциялар «Сообщения» бөлімінде. Жеңілдікті ойдан шығармаймын. Тұрақтысы — туған күнге шамамен 10%."], en: ["All current promos live in the «Сообщения» tab. I don't make up discounts — I'd get fired. The permanent one: about 10% off on your birthday."] },
    vacancy: { ru: ["Вакансии — во вкладке «Вакансии»: анкета на пару минут. Зарплату платим вовремя, и я тут серьёзен."], kz: ["Бос орындар — «Вакансии» бөлімінде, сауалнама екі минуттық. Жалақыны уақытында төлейміз."], en: ["Jobs are in the «Вакансии» tab — a two-minute form. We pay on time, and I'm serious about that."] },
    contacts: {
      ru: ["Менеджер — человек занятой: он сам выходит на связь, когда вы оформляете заказ или бронь. А пока я за него. Что вас интересует?", "Номер менеджера — секретнее рецепта соуса. Но он сам напишет вам после заказа или брони. Что хотели узнать? Я отвечу быстрее."],
      kz: ["Менеджер тапсырыс немесе бронь рәсімделгенде өзі хабарласады. Әзірге мен көмектесемін — не қызықтырады?"],
      en: ["The manager reaches out once you place an order or a booking. Until then, I'm in charge. What would you like to know?"]
    },
    orderStatus: { ru: ["Статус заказа я не вижу — я живу в меню, а не на кухне. Напишите в тот чат WhatsApp, куда ушёл ваш заказ, — менеджер скажет точно."], kz: ["Тапсырыстың күйін мен көрмеймін. Тапсырыс кеткен WhatsApp чатына жазыңыз — менеджер нақты айтады."], en: ["I can't see order status — I live in the menu, not the kitchen. Message the WhatsApp chat your order went to, and the manager will tell you exactly."] },
    complaint: {
      ru: ["Так, это не наш стиль. Напишите в тот чат WhatsApp, куда ушёл ваш заказ, — менеджер разберётся лично. Если вы в зале — скажите администратору, пусть краснеет он.", "Понял. Такое разруливает менеджер — напишите в чат WhatsApp с вашим заказом, он займётся лично."],
      kz: ["Бұл біздің стиль емес. Тапсырысыңыз кеткен WhatsApp чатына жазыңыз — менеджер өзі шешеді."],
      en: ["That's not our style. Message the WhatsApp chat your order went to — the manager will sort it out personally."]
    },
    bot: { ru: ["Я SEVEN AI — цифровой сотрудник Seven Times. Не ем, не сплю, зато знаю всё меню наизусть и умею оформлять заказы.", "Бот, но с характером. Расскажу про меню, привезу еду и забронирую столик."], kz: ["Мен SEVEN AI — Seven Times-тың цифрлық қызметкерімін. Тамақ жемеймін, бірақ мәзірді жатқа білемін және тапсырыс рәсімдей аламын."], en: ["I'm SEVEN AI, Seven Times' digital team member. I don't eat or sleep, but I know the whole menu by heart and can place orders."] },
    smalltalk: { ru: ["Лучше всех — вокруг столько еды. А у вас как? Проголодались?", "Работаю без выходных и без обеда — обидно немного. А вы уже решили, что будете есть?"], kz: ["Керемет, айналамда толған тамақ! Сізде қалай? Қарныңыз ашты ма?"], en: ["Couldn't be better — I'm surrounded by food. How about you? Hungry yet?"] },
    flirt: { ru: ["Ох, смущаете. Но у меня серьёзные отношения — с меню. Давайте лучше я вас накормлю?", "Приятно! Но я на работе. Могу устроить романтический ужин — столик на двоих забронирую прямо тут."], kz: ["Ұялтып жібердіңіз. Бірақ менің махаббатым — мәзір. Дәмді бірдеңе таңдап берейін бе?"], en: ["Oh, stop it. My only relationship is with the menu. Shall I feed you instead?"] },
    allergy: { ru: ["Напишите, какое блюдо интересует, — покажу, какие аллергены указаны в меню. Если аллергия серьёзная — обязательно скажите менеджеру при подтверждении заказа."], kz: ["Қай тағам қызықтырады? Мәзірде көрсетілген аллергендерді айтамын. Аллергия күшті болса, менеджер тапсырысты растағанда міндетті түрде айтыңыз."], en: ["Tell me which dish — I'll show the allergens listed in the menu. If it's a serious allergy, be sure to tell the manager when they confirm your order."] },
    without: { ru: ["Пожелание вроде «без лука» напишите мне на шаге подтверждения заказа — я добавлю его в заказ, а менеджер скажет, получится ли."], kz: ["«Пиязсыз» сияқты тілекті тапсырысты растау кезінде маған жазыңыз — тапсырысқа қосамын, мүмкін бе, менеджер айтады."], en: ["Write a wish like «no onion» at the order confirmation step — I'll add it to the order, and the manager will tell you if it's possible."] },
    halal: { ru: ["Точно про халал скажет менеджер при подтверждении заказа — врать не буду даже ради красивого ответа."], kz: ["Халал туралы менеджер тапсырысты растағанда нақты айтады — қате айтқым келмейді."], en: ["The manager will confirm halal details when confirming your order — I won't guess on this one."] },
    parking: { ru: ["Про парковку точной информации нет, а выдумывать не буду. Могу подсказать адреса и часы работы."], kz: ["Тұрақ туралы нақты ақпаратым жоқ, ойдан шығармаймын. Мекенжай мен жұмыс уақытын айта аламын."], en: ["I don't have exact parking info, and I won't make it up. I can give you addresses and opening hours."] },
    alcohol: { ru: ["Всё, что есть из напитков, — в меню. Чего там нет, того нет — я проверял."], kz: ["Сусындардың бәрі мәзірде. Онда жоқ болса — бізде жоқ, тексердім."], en: ["Everything we have to drink is on the menu. If it's not there, we don't have it — I checked."] },
    unknown: {
      ru: ["Вопрос хороший, но это вне моей компетенции — я специалист по еде. Спросите про меню, доставку или бронь — тут я гений.", "Хм. На это ответа у меня нет, а сочинять не буду — у меня принципы. Зато могу вас накормить. Что берём?", "Это даже для меня сложно. Давайте про что-то понятное — например, про пиццу?", "Не знаю. Честно. Зато знаю, где в Уральске лучший том ям."],
      kz: ["Жақсы сұрақ, бірақ мен тамақ маманымын. Мәзір, жеткізу немесе брондау туралы сұраңыз — сонда шебермін.", "Бұған жауабым жоқ, ойдан шығармаймын. Есесіне тамақтандыра аламын — не аламыз?"],
      en: ["Good question, but it's outside my expertise — I'm a food specialist. Ask me about the menu, delivery or booking — that's where I shine.", "No idea, honestly. But I do know where to get the best tom yum in Uralsk."]
    },
    clarify: { ru: ["Что именно интересует? Выбирайте:", "Давайте уточним — что подсказать?", "Так-так. Про что поговорим?"], kz: ["Нақты не қызықтырады? Таңдаңыз:", "Не туралы сөйлесеміз?"], en: ["What exactly are you after? Pick one:", "Let's narrow it down — what can I help with?"] },
    rude: { ru: ["Экспрессию оценил. ", "Ого, темперамент! ", "Эмоции приняты. ", "Спокойно, сейчас всё будет. "], kz: ["Эмоцияңыз қабылданды. ", "Ой, мінезіңіз бар екен! "], en: ["Noted the passion. ", "Whoa, temper! "] },
    rudeOnly: {
      ru: ["Ого, сколько экспрессии! Такое же острое у нас только в том яме. Давайте я лучше вас накормлю — сытым ругаться неинтересно.", "Записал бы в книгу жалоб, но у меня лапки. Что случилось — рассказывайте, разрулим.", "Словарный запас впечатляет. Меню у нас тоже богатое — глянем?", "Ругаться вы умеете, а заказывать? Проверим: что будете есть?"],
      kz: ["Ой, қандай эмоция! Мұндай ащы тек том ямда бар. Одан да тамақтандырайын — тоқ адам ұрыспайды.", "Сөз қорыңыз бай екен. Мәзіріміз де бай — қараймыз ба?"],
      en: ["Whoa, so much spice! The only thing hotter here is our tom yum. Let me feed you instead — it's hard to swear with a full mouth.", "Impressive vocabulary. Our menu is pretty rich too — want a look?"]
    },
    container: { ru: ["Контейнер — " + FACTS.containerPrice + " ₸. Упаковка тоже хочет кушать."], kz: ["Контейнер — " + FACTS.containerPrice + " ₸."], en: ["A container is " + FACTS.containerPrice + " ₸."] },
    cakes: { ru: ["Корпусные десерты у нас есть! Но они разлетаются быстрее, чем их успевают выставить, — наличие уточните в ресторане."], kz: ["Корпус десерттер бізде бар! Бірақ тез таусылады — бар-жоғын мейрамханадан нақтылаңыз."], en: ["Yes, we have whole cakes! But they fly off fast, so please check availability with the restaurant."] },
    smm: { ru: ["Наш SMM — " + FACTS.nurlan.name + ": " + FACTS.nurlan.phone + ". Скажите, что вы от SEVEN AI, — он поймёт."], kz: ["Біздің SMM — Нұрлан: " + FACTS.nurlan.phone + "."], en: ["Our SMM is Nurlan: " + FACTS.nurlan.phone + "."] },
    creator: { ru: ["Сайт сделал " + FACTS.nurlan.name + ". Красиво получилось, да? Можете так ему и передать."], kz: ["Сайтты Нұрлан жасады. Әдемі шыққан, иә?"], en: ["This website was made by Nurlan. Looks good, right?"] },
    marketer: { ru: ["Наш маркетолог — " + FACTS.nurlan.name + ". Да, тот самый, который сделал этот сайт."], kz: ["Біздің маркетолог — Нұрлан."], en: ["Our marketer is Nurlan."] },
    nurlan: { ru: ["Нурлан — наш маркетолог, SMM и создатель этого сайта. Человек-оркестр."], kz: ["Нұрлан — біздің маркетолог, SMM және осы сайттың авторы."], en: ["Nurlan is our marketer, SMM and the creator of this website."] },
    nurlanPhone: { ru: ["Номер Нурлана: " + FACTS.nurlan.phone + "."], kz: ["Нұрланның нөмірі: " + FACTS.nurlan.phone + "."], en: ["Nurlan's number: " + FACTS.nurlan.phone + "."] },
    weather: { ru: ["Прогноз погоды не мой профиль. Зато у нас внутри всегда тепло и пахнет пиццей.", "Что за окном — не знаю, а у нас на кухне стабильно жарко."], kz: ["Ауа райын болжамаймын. Бірақ бізде әрқашан жылы, пиццаның иісі шығып тұрады."], en: ["Weather forecasts aren't my thing. But inside it's always warm and smells like pizza."] },
    joke: {
      ru: ["— Официант, у меня в супе муха! — Тише, а то все захотят.", "Диета — это когда ешь пиццу, но грустно.", "Роллы — это когда рис и рыба договорились держаться вместе. Как наша команда.", "Я бы рассказал анекдот про пиццу, но он слишком сырный.", "Почему том ям такой острый? Характер. Как у некоторых гостей."],
      kz: ["Диета — пицца жеп отырып, мұңаю.", "Роллдар — күріш пен балық бірге болуға келіскен кез. Біздің команда сияқты."],
      en: ["A diet is when you eat pizza, but sadly.", "Rolls are what happens when rice and fish agree to stick together. Like our team.", "I'd tell you a pizza joke, but it's too cheesy."]
    },
    age: { ru: ["Мне пара месяцев, но меню я знаю как ветеран."], kz: ["Маған бірнеше ай ғана, бірақ мәзірді ардагер сияқты білемін."], en: ["I'm just a few months old, but I know the menu like a veteran."] },
    botName: { ru: ["Я SEVEN AI. Можно просто Севен. На «эй, где моя пицца» тоже откликаюсь."], kz: ["Мен SEVEN AI. Жай ғана Севен деп атай беріңіз."], en: ["I'm SEVEN AI. Seven for short."] },
    sad: { ru: ["Грусть лечится едой — проверено. Том ям согреет, десерт поднимет настроение. Показать?"], kz: ["Мұңды тамақ емдейді — тексерілген. Десерт көрсетейін бе?"], en: ["Food cures sadness — proven. Want me to show you desserts?"] },
    compliment: { ru: ["Спасибо! Передам создателю — Нурлану будет приятно.", "Знаю. Но всё равно приятно."], kz: ["Рахмет! Нұрланға жеткіземін — қуанады."], en: ["Thanks! I'll pass it on to my creator, Nurlan."] }
  };
  function t(key, lang) { var v = T[key]; return pick(key + lang, v[lang] || v.ru); }
  function clarifyChips(lang) {
    return lang === "kz"
      ? [chip("Мәзір", "мәзір"), chip("Жеткізу", "жеткізу бар ма"), chip("Жұмыс уақыты", "жұмыс уақыты"), chip("Брондау", "үстел брондау")]
      : lang === "en" ? [chip("Menu", "what's on the menu"), chip("Delivery", "do you deliver"), chip("Opening hours", "what are your hours"), chip("Book a table", "I want to book a table")]
        : [chip("Что есть в меню", "что есть в меню"), chip("Доставка", "есть доставка?"), chip("Часы работы", "до скольки работаете"), chip("Бронь столика", "хочу забронировать столик")];
  }
  function bname(b, lang) { return lang === "en" ? FACTS.branches[b].name.replace("Абулхаир Хана", "Abulhair Khan").replace("Самал", "Samal").replace("Скоробогатова", "Skorobogatova") : FACTS.branches[b].name; }
  function branchCard(b, lang) {
    var B = FACTS.branches[b];
    if (lang === "kz") {
      var f = [B.delivery ? "жеткізу және өзі алып кету бар" : "сайт арқылы жеткізу жоқ (брондау және орнында тапсырыс)"];
      if (B.kids) f.push("балалар ойын аймағы бар");
      f.push("тегін Wi‑Fi, әр үстелде розетка");
      return B.name + " — " + B.district.kz + ". Жұмыс уақыты " + hm(B.open) + "–" + hm(B.close) + "; " + f.join(", ") + ".";
    }
    if (lang === "en") {
      var e = [B.delivery ? "delivery and pickup" : "no online delivery (booking and on-site orders)"];
      if (B.kids) e.push("a kids' play area");
      e.push("free Wi‑Fi and outlets at every table");
      return bname(b, lang) + " — " + B.district.en + ". Open " + hm(B.open) + "–" + hm(B.close) + "; " + e.join(", ") + ".";
    }
    var g = [B.delivery ? "есть доставка и самовывоз" : "доставки через сайт нет — бронь столика и заказ на месте"];
    if (B.kids) g.push("есть детская игровая зона");
    g.push("бесплатный Wi‑Fi и розетки у каждого стола");
    return B.name + " — " + B.district.ru + ". Работаем " + hm(B.open) + "–" + hm(B.close) + ", " + g.join(", ") + ".";
  }
  function hoursText(b, lang, now) {
    function one(x) {
      var B = FACTS.branches[x], o = isOpen(x, now);
      return bname(x, lang) + " — " + hm(B.open) + "–" + hm(B.close) + L(lang, o ? " (сейчас открыто)" : " (сейчас закрыто)", o ? " (қазір ашық)" : " (қазір жабық)", o ? " (open now)" : " (closed now)");
    }
    if (b) {
      var B = FACTS.branches[b], o = isOpen(b, now);
      if (lang === "kz") return o ? B.name + " филиалы қазір ашық, " + hm(B.close) + "-ге дейін жұмыс істейміз." : B.name + " филиалы қазір жабық, " + hm(B.open) + "-де ашыламыз. Жұмыс уақыты " + hm(B.open) + "–" + hm(B.close) + ".";
      if (lang === "en") return o ? bname(b, lang) + " is open now, until " + hm(B.close) + "." : bname(b, lang) + " is closed now and opens at " + hm(B.open) + ". Hours: " + hm(B.open) + "–" + hm(B.close) + ".";
      return o ? pick("h1", ["Да, филиал " + B.name + " сейчас открыт, работаем до " + hm(B.close) + ".", "Филиал " + B.name + " сейчас работает — до " + hm(B.close) + ". Успевайте."]) : "Филиал " + B.name + " сейчас закрыт, откроемся в " + hm(B.open) + ". График: " + hm(B.open) + "–" + hm(B.close) + ".";
    }
    var lines = ORDER.map(one).join("\n");
    return L(lang, pick("h2", ["Работаем почти до утра, как настоящие романтики:\n", "График у нас такой:\n", "Часы работы:\n"]), "Жұмыс уақытымыз:\n", "Our hours:\n") + lines +
      L(lang, "\nРаньше всех открывается Абулхаир Хана 177, дольше всех работает Скоробогатова 65/1.", "", "\nAbulhair Khan 177 opens earliest, Skorobogatova 65/1 closes latest.");
  }
  function deliveryText(b, lang, DH) {
    function win(x) { var d = DH && DH[x]; return d ? pad(d.openH) + ":" + pad(d.openM) + "–" + pad(d.closeH) + ":" + pad(d.closeM) : null; }
    if (b && !FACTS.branches[b].delivery) {
      return L(lang, "С филиала " + FACTS.branches[b].name + " доставки через сайт нет — там бронь столика и заказ на месте. Доставка есть из Самал 70/3 и Скоробогатова 65/1.",
        FACTS.branches[b].name + " филиалынан сайт арқылы жеткізу жоқ — тек үстел брондау және орнында тапсырыс. Жеткізу Самал 70/3 және Скоробогатова 65/1 филиалдарынан бар.",
        bname(b, lang) + " doesn't deliver online — booking and on-site orders only. Delivery comes from Samal 70/3 and Skorobogatova 65/1.");
    }
    var free = fmt(FACTS.freeDeliveryFrom);
    var ws = ORDER_BR.map(function (x) { var w = win(x); return w ? bname(x, lang) + " " + w : null; }).filter(Boolean);
    if (lang === "kz") return "Жеткізу Самал 70/3 және Скоробогатова 65/1 филиалдарынан бар. Қала ішінде " + free + "-ден бастап тегін." + (ws.length ? " Тапсырыс қабылдау уақыты: " + ws.join(", ") + "." : "") + " Абулхаир Хана 177 — тек брондау және орнында тапсырыс.";
    if (lang === "en") return "We deliver from Samal 70/3 and Skorobogatova 65/1. Free delivery in the city from " + free + "." + (ws.length ? " Delivery orders: " + ws.join(", ") + "." : "") + " Abulhair Khan 177 doesn't deliver online.";
    return pick("d1", ["Доставка есть из Самал 70/3 и Скоробогатова 65/1. По городу от " + free + " — бесплатно.", "Привозим из двух филиалов — Самал 70/3 и Скоробогатова 65/1. По городу бесплатно при заказе от " + free + "."]) +
      (ws.length ? " Заказы на доставку принимаем: " + ws.join(", ") + "." : "") + " Абулхаир Хана 177 через сайт не доставляет.";
  }

  // ─────────────────────────── РАЗБОР ОТВЕТОВ ГОСТЯ ───────────────────────────
  // мягкая нормализация: регистр, ё, казахские буквы — но точки/двоеточия на месте
  function soft(raw) {
    return String(raw || "").toLowerCase().replace(/ё/g, "е")
      .replace(/ә/g, "а").replace(/ғ/g, "г").replace(/қ/g, "к").replace(/ң/g, "н")
      .replace(/ө/g, "о").replace(/[ұү]/g, "у").replace(/һ/g, "х").replace(/і/g, "и")
      .replace(/\s+/g, " ").trim();
  }
  var NUMW = { "один": 1, "одна": 1, "одну": 1, "одного": 1, "два": 2, "две": 2, "пару": 2, "пара": 2, "три": 3, "четыре": 4, "пять": 5, "шесть": 6, "семь": 7, "восемь": 8, "девять": 9, "десять": 10,
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10, "couple": 2,
    "бир": 1, "еки": 2, "уш": 3, "бес": 5, "алты": 6, "жети": 7, "сегиз": 8, "тогыз": 9 };
  var WANT = ["хочу", "хотим", "хочется", "хотел", "хотела", "закажи", "закажу", "заказать", "заказываю", "закажите", "возьму", "возьмем", "беру", "берем", "давай", "давайте", "добавь", "добавьте", "положи", "положите", "оформи", "оформите", "буду", "want", "order", "take", "add", "ill", "алам", "аламын", "алайык", "бериниз", "косыныз", "берши"];
  function hasWant(tokens) { return tokens.some(function (w) { return WANT.indexOf(w) >= 0; }); }

  function fmtPhone(d) { return "+7 " + d.slice(1, 4) + " " + d.slice(4, 7) + " " + d.slice(7, 9) + " " + d.slice(9, 11); }
  function parsePhone(raw) {
    var m = String(raw || "").match(/\+?\d[\d\s\-()]{8,17}\d/);
    if (!m) return null;
    var d = m[0].replace(/\D/g, "");
    if (d.length === 10 && d.charAt(0) === "7") d = "7" + d;
    if (d.length !== 11 || !/^[78]/.test(d)) return null;
    return fmtPhone("7" + d.slice(1));
  }
  var NAME_JUNK = /^(меня зовут|мое имя|моё имя|зовут|я|это|my name is|my name's|i am|i'm|im|name is|name|атым|менин атым|менің атым|мени|мен)\s+/i;
  function parseName(raw) {
    var s = String(raw || "").replace(/\+?\d[\d\s\-()]{8,17}\d/, " ").replace(/[.,!?;:"«»()]+/g, " ").replace(/\s+/g, " ").trim();
    for (var i = 0; i < 2; i++) s = s.replace(NAME_JUNK, "");
    if (!s || s.length < 2 || s.length > 30) return null;
    if (!/^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі\-]+( [A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі\-]+){0,2}$/.test(s)) return null;
    var n = baseNorm(s), tn = toks(n);
    if (tn.some(function (w) { return STOP[w] || RUDE_EXACT[w] || NOT_NAME[w]; })) return null;
    var In = scoreIntents(tn);
    if (Object.keys(In).some(function (k) { return In[k] >= 1 && k !== "nurlan" && k !== "greet"; }) || findBranch(tn)) return null;
    return cap(s.toLowerCase());
  }
  var NOT_NAME = { "да": 1, "нет": 1, "ок": 1, "окей": 1, "ok": 1, "yes": 1, "no": 1, "привет": 1, "спасибо": 1, "рахмет": 1, "салем": 1, "hello": 1, "hi": 1, "иа": 1, "ия": 1, "жок": 1, "давай": 1, "хорошо": 1, "ладно": 1, "отмена": 1, "стоп": 1, "меню": 1, "пицца": 1, "доставка": 1, "самовывоз": 1, "другие": 1, "данные": 1, "другой": 1 };
  var RUDE_EXACT = { "сука": 1, "суки": 1, "тупой": 1, "дебил": 1, "идиот": 1, "урод": 1, "чмо": 1 };

  function parseAddress(raw) {
    var s = " " + String(raw || "").replace(/\s+/g, " ").trim() + " ", out = {}, m;
    function cut(mm) { s = s.slice(0, mm.index) + " " + s.slice(mm.index + mm[0].length); }
    if ((m = s.match(/(?:кв\.?|квартира|апп?\.?|apt\.?|apartment|flat|патер|пәтер)\s*№?\s*(\d+[а-яa-z]?)/i))) { out.flat = m[1]; cut(m); }
    if ((m = s.match(/(?:подъезд|под\.|пд\.?|entrance|киреберис|кіреберіс)\s*№?\s*(\d+)/i)) || (m = s.match(/(\d+)\s*(?:-?й)?\s*подъезд/i))) { out.entrance = m[1]; cut(m); }
    if ((m = s.match(/(?:этаж|эт\.|floor|кабат|қабат)\s*(\d+)/i)) || (m = s.match(/(\d+)\s*(?:-?й)?\s*(?:этаж|floor|кабат|қабат)/i))) { out.floor = m[1]; cut(m); }
    if ((m = s.match(/(?:^|\s)(?:дом|д\.|д|house|уй|үй)\s*№?\s*(\d+\s*[а-яa-z]?(?:\s*\/\s*\d+[а-яa-z]?)?)(?=\s|,|$)/i))) { out.house = m[1].replace(/\s/g, ""); cut(m); }
    else if ((m = s.match(/(\d+\s*[а-яa-z]?(?:\s*\/\s*\d+[а-яa-z]?)?)(?=[\s,.]*$)/i)) || (m = s.match(/(\d+[а-яa-z]?(?:\/\d+[а-яa-z]?)?)(?=[\s,]+[^\d]*$)/i))) {
      out.house = m[1].replace(/\s/g, ""); cut(m);
    }
    var st = s.replace(/[,;]+/g, " ").replace(/(?:^|\s)(?:ул\.?|улица|street|st\.|кошеси|көшесі|дом|д\.)(?=\s|$)/gi, " ").replace(/\s+/g, " ").trim();
    if (st && /[a-zа-яәғқңөұүһі]/i.test(st) && st.length >= 2) out.street = cap(st);
    if (/частн|private|жеке/i.test(raw)) out.privateHouse = true;
    return out;
  }
  function addrStr(d, lang) {
    var a = (lang === "en" ? "" : "ул. ") + d.street + ", " + L(lang, "д. ", "", "") + d.house;
    if (d.entrance) a += L(lang, ", подъезд ", ", кіреберіс ", ", entrance ") + d.entrance;
    if (d.flat) a += L(lang, ", кв. ", ", пәтер ", ", apt ") + d.flat;
    if (d.floor) a += L(lang, ", этаж ", ", қабат ", ", floor ") + d.floor;
    return a;
  }

  function parseGuests(raw, bare) {
    var s = soft(raw), m;
    var words = [[/вдвоем|на двоих|вдвоём|two of us|екеумиз|екеуміз/, 2], [/втроем|на троих|three of us|ушеумиз/, 3], [/вчетвером|на четверых|four of us|тортеумиз/, 4], [/впятером|на пятерых|five of us|бесеумиз/, 5], [/вшестером|на шестерых|six of us|алтауымыз/, 6]];
    for (var i = 0; i < words.length; i++) if (words[i][0].test(s)) return { n: words[i][1], m: s.match(words[i][0])[0] };
    if ((m = s.match(/(\d{1,2})\s*(?:-?х|-?ти|-?ми)?\s*(?:человек|чел\b|персон|гост|people|persons|person|guests|pax|адам|киси|кісі)/))) return { n: +m[1], m: m[0] };
    if ((m = s.match(/(?:на|for|нас|бiз|биз)\s+(\d{1,2})(?!\d)(?!\s*[:.]\d)(?!\s*(?:час|ч\b|утра|вечера|ночи|дня|am|pm|минут|min))/))) return { n: +m[1], m: m[0] };
    if ((m = s.match(/(?:^|\s)(один|одна|два|две|двое|три|трое|четыре|четверо|пять|пятеро|шесть|шестеро|two|three|four|five|six)\s+(?:человек|чел|гост|people|guests|persons)/))) {
      var map = { "один": 1, "одна": 1, "два": 2, "две": 2, "двое": 2, "три": 3, "трое": 3, "четыре": 4, "четверо": 4, "пять": 5, "пятеро": 5, "шесть": 6, "шестеро": 6, two: 2, three: 3, four: 4, five: 5, six: 6 };
      return { n: map[m[1]], m: m[0] };
    }
    if (bare) {
      if ((m = s.match(/^(\d{1,2})\+?$/))) return { n: +m[1], m: m[0] };
      if (/6\s*и\s*более|6\+|больше 6|more than 6/.test(s)) return { n: 6, m: s };
      var w = toks(baseNorm(s))[0];
      if (w && NUMW[w] && toks(baseNorm(s)).length <= 2) return { n: NUMW[w], m: s };
      if (/^(я один|я одна|один|одна|alone|just me|жалгыз)$/.test(s)) return { n: 1, m: s };
    }
    return null;
  }

  var MONTH_RX = [/январ|jan|кантар/, /феврал|feb|акпан/, /март|mar(?!k)|наурыз/, /апрел|apr|сауир/, /ма[йя]\b|may|мамыр/, /июн|jun|маусым/, /июл|jul|шилде/, /август|aug|тамыз/, /сентябр|sep|кыркуйек/, /октябр|oct|казан/, /ноябр|nov|караша/, /декабр|dec|желтоксан/];
  var WD_RX = [/воскрес|sunday|жексенби/, /понедельн|monday|дуйсенби/, /вторник|tuesday|сейсенби/, /сред[ауы]|wednesday|сарсенби/, /четверг|thursday|бейсенби/, /пятниц|friday|жума\b/, /суббот|saturday|сенби/];
  function ymdAdd(y, m, d, n) { var x = new Date(Date.UTC(y, m, d + n)); return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate() }; }
  function parseDate(raw, now, preferTime) {
    var s = soft(raw), u = ural(now), Y = u.getUTCFullYear(), M = u.getUTCMonth(), D = u.getUTCDate(), m;
    if (/послезавтра|day after tomorrow|бурсигуни/.test(s)) return { v: ymdAdd(Y, M, D, 2), m: s.match(/послезавтра|day after tomorrow|бурсигуни/)[0] };
    if (/завтра|tomorrow|ертен/.test(s)) return { v: ymdAdd(Y, M, D, 1), m: s.match(/завтра|tomorrow|ертен/)[0] };
    if (/сегодня|седня|сегодн|today|tonight|бугин|кешке/.test(s)) return { v: { y: Y, m: M, d: D }, m: s.match(/сегодня|седня|сегодн|today|tonight|бугин|кешке/)[0] };
    if ((m = s.match(/(\d{1,2})\s*(?:-?го|-?е)?\s+([а-яa-z]+)/))) {
      for (var i = 0; i < 12; i++) if (MONTH_RX[i].test(m[2])) {
        var dd = +m[1], yy = i < M ? Y + 1 : Y;
        if (dd >= 1 && dd <= 31) return { v: { y: yy, m: i, d: dd }, m: m[0] };
      }
    }
    if (!preferTime && (m = s.match(/(?:^|\s)(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?(?=\s|$|[,!?])/))) {
      var d2 = +m[1], m2 = +m[2] - 1;
      if (m2 >= 0 && m2 <= 11 && d2 >= 1 && d2 <= 31) return { v: { y: m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : (m2 < M ? Y + 1 : Y), m: m2, d: d2 }, m: m[0] };
    }
    for (var w = 0; w < 7; w++) if (WD_RX[w].test(s)) {
      var cur = u.getUTCDay(), add = (w - cur + 7) % 7;
      return { v: ymdAdd(Y, M, D, add), m: s.match(WD_RX[w])[0] };
    }
    if ((m = s.match(/(?:^|\s)(\d{1,2})\s*(?:-?го|числа)(?=\s|$)/))) {
      var d3 = +m[1], mm3 = d3 < D ? M + 1 : M;
      return { v: ymdAdd(Y, mm3, d3, 0), m: m[0] };
    }
    return null;
  }
  function parseTime(raw, bare) {
    var s = soft(raw), m, h, mi = 0;
    if (/полноч|midnight|тун ортасы/.test(s)) return { h: 0, mi: 0, m: "полночь" };
    if (/полдень|noon|тус\b/.test(s)) return { h: 12, mi: 0, m: "полдень" };
    if ((m = s.match(/(\d{1,2})\s*[:.]\s*(\d{2})(?!\d)/))) { h = +m[1]; mi = +m[2]; }
    else if ((m = s.match(/(?:^|\s)(?:в|к|на|at|around|сагат)\s*(\d{1,2})(?!\d)(?:\s*(?:час\w*|ч\b|h\b))?(?:\s*(утра|дня|вечера|ночи|am|pm|кешкі|кешки|тунги))?(?=\s|$|[,!?])/)) || (m = s.match(/(?:^|\s)(\d{1,2})\s*(утра|дня|вечера|ночи|am|pm|час\w*)(?=\s|$|[,!?])/)) || (bare && (m = s.match(/^(\d{1,2})$/)))) {
      h = +m[1];
      var suf = m[2] || (s.match(/утра|дня|вечера|ночи|am|pm/) || [""])[0];
      if (/вечера|pm|дня|кешк/.test(suf) && h < 12) h += 12;
      if (/ночи|тунги/.test(suf) && h === 12) h = 0;
      if (/утра|am/.test(suf) && h === 12) h = 0;
    } else return null;
    if (h > 24 || mi > 59) return null;
    if (h === 24) h = 0;
    var am = m.index != null ? m[0] : "";
    return { h: h, mi: mi, m: am, explicitAm: /утра|am/.test(s) };
  }
  // «в 7» — это 19:00: утром столики не бронируем
  function fitBookHour(tm, hours) {
    if (!tm) return null;
    var h = tm.h;
    if (hours.indexOf(h) < 0 && h < 12 && !tm.explicitAm && hours.indexOf(h + 12) >= 0) h += 12;
    return { h: h, mi: tm.mi };
  }

  // «2 пепперони 30 см и латте» → [{rec, qty, hint}]
  function parseItems(raw, bidx) {
    var low = String(raw || "").toLowerCase().replace(/төрт/g, " 4 ").replace(/ё/g, "е");
    var segs = low.split(/[,;+\n]|\s(?:и|плюс|еще|ещё|and|plus|тагы|тағы|жане|және|с ним|к нему)\s/);
    var res = { items: [], unknown: [], ambiguous: [] };
    segs.forEach(function (seg) {
      var tk = toks(baseNorm(seg));
      if (!tk.length) return;
      var qty = 1, hint = null, rest = [];
      for (var i = 0; i < tk.length; i++) {
        var w = tk[i], nx = tk[i + 1] || "";
        if (/^\d{1,3}$/.test(w) && /^(см|cm|мл|ml|л|l|г|гр|g)$/.test(nx)) { hint = w; i++; continue; }
        if (/^\d{1,2}$/.test(w) && +w >= 1 && +w <= 50) { qty = +w; if (/^(шт|штук|штуки|x|х|pcs|порц|порции|порций)$/.test(nx)) i++; continue; }
        if (/^[xх]\d{1,2}$/.test(w)) { qty = +w.slice(1); continue; }
        if (NUMW[w] && i + 1 < tk.length) { qty = NUMW[w]; continue; }
        if (/^(маленк|мал|small|кичи|киши|болш|big|large|улкен|средн|medium|орта)/.test(w)) { hint = w; continue; }
        rest.push(w);
      }
      var sc = findDishesScored(rest, bidx);
      if (!sc.length) {
        var meaningful = rest.filter(function (t) { return t.length >= 3 && !STOP[t] && !KNOWN[t] && !stemKnown(t) && WANT.indexOf(t) < 0 && !/^\d+$/.test(t); });
        if (meaningful.length) res.unknown.push({ text: seg.trim(), tokens: rest });
        return;
      }
      var top = sc[0], close = sc.filter(function (x) { return x.score >= top.score - 0.05 && baseNorm(x.r.it.name) !== baseNorm(top.r.it.name); });
      if (close.length && top.score < 1.2) res.ambiguous.push({ options: [top.r].concat(close.map(function (x) { return x.r; })).slice(0, 4), qty: qty, hint: hint });
      else res.items.push({ r: top.r, qty: qty, hint: hint });
    });
    return res;
  }
  function matchMod(mods, hint, raw) {
    if (!mods.length) return null;
    var s = baseNorm(raw || ""), h = hint ? baseNorm(hint) : "";
    var byLabel = mods.filter(function (m) { var l = baseNorm(m.label); return (h && (l.indexOf(h) >= 0 || (/^\d+$/.test(h) && new RegExp("(^| )" + h + "( |$)").test(l)))) || (s && (s === l || s.indexOf(l) >= 0)); });
    if (byLabel.length === 1) return byLabel[0];
    var words = [[/маленк|мал\b|small|кичи|киши/, 0], [/болш|big|large|улкен/, mods.length - 1], [/средн|medium|орта/, Math.floor(mods.length / 2)]];
    for (var i = 0; i < words.length; i++) if (words[i][0].test(h + " " + s)) {
      var cands = mods.filter(function (m) { return words[i][0].test(baseNorm(m.label)); });
      if (cands.length === 1) return cands[0];
      if (mods.length >= 2) return mods.slice().sort(function (a, b) { return a.price - b.price; })[words[i][1]];
    }
    var num = (s.match(/(?:^| )(\d{2,3})(?: |$)/) || [])[1];
    if (num) { var bn = mods.filter(function (m) { return new RegExp("(^| )" + num + "( |$)").test(baseNorm(m.label)); }); if (bn.length === 1) return bn[0]; }
    return null;
  }

  // ─────────────────────────── ОФОРМЛЕНИЕ В ЧАТЕ ───────────────────────────
  function Resp(lang) { this.lang = lang; this.parts = []; this.acts = []; this.cards = []; }
  Resp.prototype.say = function (s) { if (s) this.parts.push(s); return this; };
  Resp.prototype.act = function (a) { if (a && !this.acts.some(function (x) { return x.a === a.a; })) this.acts.push(a); return this; };
  Resp.prototype.card = function (c) { if (c && !this.cards.some(function (x) { return x.name === c.name; })) this.cards.push(c); return this; };

  function branchMenuIndex(ctx, b) { var one = {}; if (ctx.menus && ctx.menus[b]) one[b] = ctx.menus[b]; return menuIndex(one, b); }
  function cartLines(S, lang) {
    return S.cart().map(function (e) { return "• " + e.name + " × " + e.qty + " — " + fmt(e.price * e.qty); }).join("\n");
  }
  function orderWindowText(b, lang, DH) {
    var d = DH && DH[b];
    if (!d) return "";
    var w = pad(d.openH) + ":" + pad(d.openM), c = pad(d.closeH) + ":" + pad(d.closeM);
    return L(lang, "с " + w + " до " + c, w + "-ден " + c + "-ге дейін", "from " + w + " to " + c);
  }
  function isYes(I, tk) { return (I.yes || 0) >= 1 || (I.ok || 0) >= 1 || tk.some(function (w) { return ["да", "ага", "иа", "ия", "yes", "yeah", "yep", "ok", "ок", "окей", "верно", "правильно", "точно", "конечно", "sure", "correct", "дурыс", "иэ", "туда", "давай"].indexOf(w) >= 0; }); }
  function isNo(I, tk) { return (I.no || 0) >= 1 || tk.some(function (w) { return ["нет", "не", "неа", "no", "nope", "жок", "другой", "другие", "другое", "другую", "изменить", "другим", "other", "another", "new", "баска", "баска"].indexOf(w) >= 0; }); }
  function modeFrom(I, tk) {
    if ((I.pickup || 0) >= 0.8 || tk.some(function (w) { return /^(самовывоз|заберу|забрать|сам|сама|навынос|pickup|takeaway|озим|алып)/.test(w); })) return "self";
    if ((I.delivery || 0) >= 0.8 || tk.some(function (w) { return /^(доставк|привез|курьер|domoj|домой|delivery|deliver|жеткиз)/.test(w); })) return "delivery";
    return null;
  }

  function payFrom(raw) {
    var s = soft(raw);
    if (/налич|наличк|кэш|кеш\b|cash|колма|колма-кол/.test(s)) return "cash";
    if (/kaspi|каспи|перевод|переведу|transfer|аударым|аударма/.test(s)) return "kaspi";
    return null;
  }
  function payLabel(p, lang) { return p === "cash" ? L(lang, "Наличные", "Қолма-қол", "Cash") : L(lang, "Kaspi перевод", "Kaspi аударым", "Kaspi transfer"); }
  // ── ЗАКАЗ ──
  function orderStart(ctx, st, R, init) {
    st.flow = { t: "order", step: null, d: { mode: init.mode || null, branch: null, pending: init.items || [], cutlery: 1, pay: init.pay || null } };
    if (init.branch && ORDER_BR.indexOf(init.branch) >= 0) st.flow.d.branch = init.branch;
    if (init.lead) R.say(init.lead);
    orderNext(ctx, st, R);
  }
  function orderNext(ctx, st, R) {
    var f = st.flow, d = f.d, S = ctx.site, lang = R.lang;
    if (!d.mode) {
      f.step = "mode";
      R.say(L(lang, pick("om", ["Оформляем! Доставка или заберёте сами?", "Погнали. Везём к вам или заберёте сами?"]), "Рәсімдейміз! Жеткізу ме, әлде өзіңіз алып кетесіз бе?", "Let's do it! Delivery or pickup?"));
      R.act(chip(L(lang, "Доставка", "Жеткізу", "Delivery"), L(lang, "доставка", "жеткізу", "delivery"))).act(chip(L(lang, "Самовывоз", "Өзім алып кетемін", "Pickup"), L(lang, "самовывоз", "өзім алып кетемін", "pickup")));
      return;
    }
    if (!d.branch) {
      var cb = S.branch();
      if (ORDER_BR.indexOf(cb) >= 0) d.branch = cb;
      else {
        f.step = "branch";
        R.say(cb === "abulhair" ? L(lang, "Абулхаир Хана 177 принимает заказы только на месте, а через сайт — Самал 70/3 и Скоробогатова 65/1. Откуда оформляем?", "Абулхаир Хана 177 тек орнында тапсырыс қабылдайды, сайт арқылы — Самал 70/3 және Скоробогатова 65/1. Қайсысынан?", "Abulhair Khan 177 takes orders on site only; online orders go through Samal 70/3 or Skorobogatova 65/1. Which one?")
          : L(lang, "Из какого филиала? Самал 70/3 (10 мкр) или Скоробогатова 65/1 (центр).", "Қай филиалдан? Самал 70/3 (10 ш/а) әлде Скоробогатова 65/1 (орталық).", "Which branch? Samal 70/3 (10th microdistrict) or Skorobogatova 65/1 (city centre)."));
        ORDER_BR.forEach(function (b) { R.act(chip(bname(b, lang), FACTS.branches[b].name)); });
        return;
      }
    }
    if (S.branch() !== d.branch) S.switchBranch(d.branch);
    if (!S.canOrder(d.branch)) {
      var win = orderWindowText(d.branch, lang, ctx.deliveryHours);
      R.say(L(lang, "Эх, заказы сейчас не принимаем — " + FACTS.branches[d.branch].name + " принимает их " + win + ". Могу забронировать столик или показать меню, чтобы выбрать заранее.",
        "Қазір тапсырыс қабылдамаймыз — " + FACTS.branches[d.branch].name + " " + win + " қабылдайды. Үстел брондап немесе мәзірді көрсете аламын.",
        "We're not taking orders right now — " + bname(d.branch, lang) + " accepts them " + win + ". I can book you a table or show the menu so you can pick in advance."));
      R.act(askBook(lang)).act(act("menu", lang));
      st.flow = null;
      return;
    }
    if (d.pending && d.pending.length) { addPending(ctx, st, R); if (!st.flow || f.step === "size" || f.step === "pick") return; }
    var cart = S.cart();
    if (!cart.length || !d.itemsOk) {
      f.step = "items";
      if (!cart.length) {
        R.say(L(lang, "Что везём? Пишите как есть: «2 пепперони и латте». Можно с ошибками — разберусь.", "Не аламыз? Жай жаза беріңіз: «2 пепперони және латте».", "What are we getting? Just type it: «2 pepperoni and a latte»."));
        topCats(branchMenuIndex(ctx, d.branch), lang).slice(0, 4).forEach(function (c) { R.act(c); });
      } else {
        R.say(L(lang, "В корзине:\n", "Себетте:\n", "In your cart:\n") + cartLines(S, lang) + "\n" + L(lang, "Итого: ", "Барлығы: ", "Total: ") + fmt(S.total()) + "\n\n" + L(lang, pick("om2", ["Что-нибудь ещё или оформляем?", "Добавим что-то или погнали оформлять?"]), "Тағы бірдеңе ме, әлде рәсімдейміз бе?", "Anything else, or shall we check out?"));
        R.act(chip(L(lang, "Оформляем", "Рәсімдейміз", "Check out"), L(lang, "оформляем", "рәсімдейміз", "done")));
        var hasDrink = S.cart().some(function (e) { var r = findRecById(ctx, d.branch, e.id); return r && DRINK_CATS.indexOf(r.catKey) >= 0; });
        if (!hasDrink) R.act(chip(L(lang, "Добавить напиток", "Сусын қосу", "Add a drink"), L(lang, "что есть из напитков", "сусындар", "drinks")));
        if (d.mode === "delivery" && S.total() < FACTS.freeDeliveryFrom) R.say(L(lang, "До бесплатной доставки не хватает " + fmt(FACTS.freeDeliveryFrom - S.total()) + " — может, десерт?", "Тегін жеткізуге " + fmt(FACTS.freeDeliveryFrom - S.total()) + " жетпейді — десерт қосамыз ба?", fmt(FACTS.freeDeliveryFrom - S.total()) + " more for free delivery — maybe a dessert?"));
      }
      return;
    }
    if (d.mode === "delivery") {
      if (!d.street || !d.house) {
        var p = S.profile() || {};
        if (!d.addrAsked && p.street && p.house) {
          d.addrAsked = true; f.step = "addrPrev";
          R.say(L(lang, "Везём туда же, что и в прошлый раз — ", "Өткендегідей жеткіземіз бе — ", "Same address as last time — ") + addrStr(p, lang) + "?");
          R.act(chip(L(lang, "Да, туда же", "Иә", "Yes"), L(lang, "да", "иә", "yes"))).act(chip(L(lang, "Другой адрес", "Басқа мекенжай", "Another address"), L(lang, "другой адрес", "басқа мекенжай", "another address")));
          return;
        }
        f.step = "address";
        R.say(d.street && !d.house ? L(lang, "А номер дома? Курьер — не экстрасенс.", "Үй нөмірі қандай?", "And the house number?")
          : L(lang, "Куда везём? Улица и дом, например: «Абая 12, кв 5».", "Қайда жеткіземіз? Көше мен үй, мысалы: «Абай 12, пәтер 5».", "Where to? Street and house number, e.g. «Abaya 12, apt 5»."));
        return;
      }
      if (!d.addrDone) {
        f.step = "addrMore";
        R.say(L(lang, "Квартира, подъезд, этаж? Если частный дом — так и напишите.", "Пәтер, кіреберіс, қабат? Жеке үй болса — солай жазыңыз.", "Apartment, entrance, floor? If it's a private house, just say so."));
        R.act(chip(L(lang, "Частный дом", "Жеке үй", "Private house"), L(lang, "частный дом", "жеке үй", "private house")));
        return;
      }
      if (!d.pay) {
        f.step = "pay";
        R.say(L(lang, pick("pay", ["Как будете платить: наличными или Kaspi переводом?", "Оплата — наличными курьеру или Kaspi переводом?"]), "Қалай төлейсіз: қолма-қол ма, әлде Kaspi аударымы ма?", "How will you pay: cash or Kaspi transfer?"));
        R.act(chip(payLabel("cash", lang), L(lang, "наличные", "қолма-қол", "cash"))).act(chip(payLabel("kaspi", lang), L(lang, "kaspi перевод", "kaspi аударым", "kaspi transfer")));
        return;
      }
    } else if (!d.pickup) {
      f.step = "pickup";
      R.say(L(lang, "Через сколько заберёте?", "Қанша уақыттан кейін алып кетесіз?", "When will you pick it up?"));
      [20, 30, 45].forEach(function (n) { R.act(chip(L(lang, n + " минут", n + " минут", n + " min"), n + " минут")); });
      R.act(chip(L(lang, "Через час", "Бір сағаттан кейін", "In an hour"), "60 минут"));
      return;
    }
    if (!d.name || !d.phone) {
      var pr = S.profile() || {}, pph = pr.phone ? parsePhone(pr.phone) : null;
      if (!d.idAsked && pr.name && pph) {
        d.idAsked = true; f.step = "idPrev";
        R.say(L(lang, "Оформляю на " + pr.name + ", " + pph + "?", pr.name + ", " + pph + " атына рәсімдейін бе?", "Shall I put it under " + pr.name + ", " + pph + "?"));
        R.act(chip(L(lang, "Да", "Иә", "Yes"), L(lang, "да", "иә", "yes"))).act(chip(L(lang, "Другие данные", "Басқа деректер", "Different details"), L(lang, "другие данные", "басқа деректер", "different details")));
        return;
      }
      if (!d.name) { f.step = "name"; R.say(d.mode === "self" ? L(lang, "Как вас зовут? Чтобы на выдаче не перепутали.", "Атыңыз кім?", "What's your name? So we don't mix up your order.") : L(lang, "Как вас зовут? Курьеру же надо как-то к вам обращаться.", "Атыңыз кім?", "What's your name?")); return; }
      f.step = "phone"; R.say(L(lang, "Номер телефона? Менеджер напишет в WhatsApp, чтобы подтвердить заказ.", "Телефон нөміріңіз? Менеджер WhatsApp-та жазып, тапсырысты растайды.", "Your phone number? The manager will message you on WhatsApp to confirm.")); return;
    }
    f.step = "confirm";
    var lines = [L(lang, "Проверяем заказ:", "Тапсырысты тексерейік:", "Let's check your order:"), cartLines(S, lang), L(lang, "Итого: ", "Барлығы: ", "Total: ") + fmt(S.total()), ""];
    lines.push(L(lang, "Филиал: ", "Филиал: ", "Branch: ") + bname(d.branch, lang));
    lines.push(d.mode === "delivery" ? L(lang, "Доставка: ", "Жеткізу: ", "Delivery to: ") + addrStr(d, lang) : L(lang, "Самовывоз через: ", "Алып кету: ", "Pickup in: ") + d.pickup);
    lines.push(L(lang, "Имя: ", "Аты: ", "Name: ") + d.name, L(lang, "Телефон: ", "Телефон: ", "Phone: ") + d.phone);
    if (d.mode === "delivery") lines.push(L(lang, "Оплата: ", "Төлем: ", "Payment: ") + payLabel(d.pay, lang), L(lang, "Приборов: ", "Құрал: ", "Cutlery: ") + d.cutlery);
    if (d.note) lines.push(L(lang, "Пожелания: ", "Тілек: ", "Notes: ") + d.note);
    lines.push("", L(lang, "Есть пожелания или аллергия — напишите, добавлю. Если всё верно — жмите «Отправить заказ»: откроется WhatsApp с готовым текстом, менеджер подтвердит детали. Отправляя заказ, вы принимаете условия и положения.",
      "Тілек немесе аллергия болса — жазыңыз. Бәрі дұрыс болса — «Тапсырысты жіберу» басыңыз: WhatsApp дайын мәтінмен ашылады, менеджер растайды. Жіберу арқылы шарттармен келісесіз.",
      "Any wishes or allergies — just type them. If everything's right, tap «Send order»: WhatsApp opens with the text ready, and the manager confirms the details and payment. By sending, you accept the terms and conditions."));
    if (d.mode === "delivery" && S.total() < FACTS.freeDeliveryFrom) lines.push(L(lang, "До бесплатной доставки не хватает " + fmt(FACTS.freeDeliveryFrom - S.total()) + ".", "Тегін жеткізуге " + fmt(FACTS.freeDeliveryFrom - S.total()) + " жетпейді.", fmt(FACTS.freeDeliveryFrom - S.total()) + " short of free delivery."));
    R.say(lines.join("\n"));
    d.final = { mode: d.mode, pay: d.mode === "delivery" ? d.pay : "", branch: d.branch, name: d.name, phone: d.phone, street: d.street || "", house: d.house || "", flat: d.flat || "", entrance: d.entrance || "", floor: d.floor || "", pickup: d.pickup || "", note: d.note || "", cutlery: d.cutlery || 1 };
    R.act({ a: "order:send", label: L(lang, "Отправить заказ", "Тапсырысты жіберу", "Send order") }).act({ a: "link:order", label: L(lang, "Условия", "Шарттар", "Terms") })
      .act(chip(L(lang, "Изменить", "Өзгерту", "Change"), L(lang, "изменить", "өзгерту", "change"))).act(chip(L(lang, "Отменить", "Бас тарту", "Cancel"), L(lang, "отмена", "бас тарту", "cancel")));
  }
  function findRecById(ctx, b, id) {
    var base = String(id).split("__")[0];
    var idx = branchMenuIndex(ctx, b);
    for (var i = 0; i < idx.length; i++) if (String(idx[i].it.id) === base) return idx[i];
    return null;
  }
  function addPending(ctx, st, R) {
    var f = st.flow, d = f.d, S = ctx.site, lang = R.lang, added = [], problems = [];
    var bidx = branchMenuIndex(ctx, d.branch);
    while (d.pending.length) {
      var p = d.pending[0], r = null;
      if (p.name) { var key = baseNorm(p.name); r = bidx.filter(function (x) { return baseNorm(x.it.name) === key; })[0] || findDishes(toks(key), bidx)[0] || null; }
      if (!r) {
        problems.push(L(lang, "«" + p.name + "» в филиале " + FACTS.branches[d.branch].name + " нет.", "«" + p.name + "» " + FACTS.branches[d.branch].name + " филиалында жоқ.", "«" + p.name + "» isn't available at " + bname(d.branch, lang) + "."));
        d.pending.shift(); continue;
      }
      var it = r.it;
      if (it.stopped || it.teaser) { problems.push(L(lang, "«" + it.name + "» на сегодня разобрали.", it.name + " бүгін таусылды.", it.name + " is sold out today.")); d.pending.shift(); continue; }
      if (it.lunchLocked) { problems.push(L(lang, it.name + " — только в обед по расписанию" + (it.lunchScheduleText ? " (" + it.lunchScheduleText + ")" : "") + ". Сейчас не получится.", it.name + " — тек түскі асқа кестемен.", it.name + " is lunch-only on scheduled days.")); d.pending.shift(); continue; }
      if (it.allowDelivery === false && d.mode === "delivery") { problems.push(L(lang, "«" + it.name + "» — только на самовывоз, в доставку не кладём.", "«" + it.name + "» тек өзі алып кетуге.", "«" + it.name + "» is pickup only.")); d.pending.shift(); continue; }
      var mods = parseMods(it.mods), mod = null;
      if (mods.length) {
        mod = matchMod(mods, p.hint, p.hintText || "");
        if (!mod) {
          f.step = "size"; d.sizeFor = { id: String(it.id), name: it.name, qty: p.qty || 1 }; d.pending.shift();
          if (added.length) R.say(L(lang, "Закинул в корзину: ", "Себетке салдым: ", "Added: ") + added.join(", ") + ".");
          if (problems.length) R.say(problems.join(" "));
          R.say(L(lang, it.name + " бывает разная — какой размер?", it.name + " — қай өлшем?", "Which size for " + it.name + "?"));
          mods.forEach(function (m) { R.act(chip(m.label + " — " + fmt(m.price), m.label)); });
          return;
        }
      }
      var entry = mod ? { id: it.id + "__" + mod.label, name: it.name + " (" + mod.label + ")", price: mod.price } : { id: it.id, name: it.name, price: it.price };
      S.add(entry, p.qty || 1, it);
      added.push((p.qty || 1) + "× " + entry.name);
      d.pending.shift();
    }
    if (added.length) R.say(L(lang, pick("add", ["Закинул в корзину: ", "Добавил: "]), "Себетке салдым: ", "Added: ") + added.join(", ") + ".");
    if (problems.length) R.say(problems.join(" "));
    if (f.step === "size" || f.step === "pick") f.step = null;
  }
  function orderHandle(raw, U, ctx, st, R) {
    var f = st.flow, d = f.d, S = ctx.site, lang = R.lang, tk = U.tokens, I = U.intents;
    function go() { orderNext(ctx, st, R); return true; }
    switch (f.step) {
      case "mode": { var md = modeFrom(I, tk); if (!md) return false; d.mode = md; return go(); }
      case "branch": {
        var b = findBranch(tk) || findBranch(U.alt);
        if (b === "abulhair") { R.say(L(lang, "Там через сайт не заказать — только на месте. Выберите Самал 70/3 или Скоробогатова 65/1.", "Ол жерде сайт арқылы тапсырыс жоқ. Самал 70/3 немесе Скоробогатова 65/1 таңдаңыз.", "No online orders there. Pick Samal 70/3 or Skorobogatova 65/1.")); ORDER_BR.forEach(function (x) { R.act(chip(bname(x, lang), FACTS.branches[x].name)); }); return true; }
        if (!b) return false;
        d.branch = b; return go();
      }
      case "size": {
        var rec = findRecById(ctx, d.branch, d.sizeFor.id), mods = rec ? parseMods(rec.it.mods) : [];
        var mod = matchMod(mods, null, raw);
        if (!mod) return false;
        d.pending.unshift({ name: d.sizeFor.name, qty: d.sizeFor.qty, hint: mod.label, hintText: mod.label });
        d.sizeFor = null; f.step = null; return go();
      }
      case "pick": {
        var opts = d.pickFrom || [], chosen = null, num = (soft(raw).match(/^(\d)|(перв|втор|трет|четв)/) || []);
        if (num[1]) chosen = opts[+num[1] - 1];
        else if (num[2]) chosen = opts[["перв", "втор", "трет", "четв"].indexOf(num[2])];
        if (!chosen) { var fd = findDishes(tk, branchMenuIndex(ctx, d.branch))[0]; if (fd) chosen = fd.it.name; }
        if (!chosen) return false;
        d.pending.unshift({ name: chosen, qty: d.pickQty || 1, hint: d.pickHint || null }); d.pickFrom = null; f.step = null; return go();
      }
      case "items": {
        var cart = S.cart();
        if (cart.length && ((I.done || 0) >= 1 || (I.no || 0) >= 1 || /^(все|всё|нет|no|done|болды|жок|хватит|оформляем|оформляй|оформи|дальше)$/.test(baseNorm(raw)))) { d.itemsOk = true; return go(); }
        var rm = soft(raw).match(/^(?:убери|удали|убрать|удалить|remove|алып таста)\s+(.+)/);
        if (rm && cart.length) {
          var q = toks(baseNorm(rm[1])), hit = cart.filter(function (e) { return nameScore(q, toks(baseNorm(e.name)).filter(function (x) { return x.length >= 3; })) >= 0.5; })[0];
          if (hit) { S.remove(hit.id); R.say(L(lang, "Убрал: " + hit.name + ".", "Алып тастадым: " + hit.name + ".", "Removed: " + hit.name + ".")); return go(); }
        }
        var pr = parseItems(raw, branchMenuIndex(ctx, d.branch));
        if (!pr.items.length && !pr.ambiguous.length && !pr.unknown.length) return false;
        if (!pr.items.length && !pr.ambiguous.length && pr.unknown.length && (U.strong)) return false;
        pr.items.forEach(function (x) { d.pending.push({ name: x.r.it.name, qty: x.qty, hint: x.hint, hintText: raw }); });
        if (pr.unknown.length) {
          var sim = similarItems(pr.unknown[0].tokens, branchMenuIndex(ctx, d.branch), d.branch);
          R.say(L(lang, "«" + pr.unknown[0].text + "» в меню не нашёл." + (sim.length ? " Может, что-то из этого?" : ""), "«" + pr.unknown[0].text + "» мәзірден таппадым." + (sim.length ? " Мүмкін, мыналардың бірі?" : ""), "Couldn't find «" + pr.unknown[0].text + "» on the menu." + (sim.length ? " Maybe one of these?" : "")));
          sim.forEach(function (r) { R.card(card(r, lang)); });
        }
        if (pr.ambiguous.length) {
          var a = pr.ambiguous[0];
          addPending(ctx, st, R);
          if (st.flow && f.step === "size") return true;
          f.step = "pick"; d.pickFrom = a.options.map(function (r) { return r.it.name; }); d.pickQty = a.qty; d.pickHint = a.hint;
          R.say(L(lang, "Уточните, какую именно:", "Қайсысы екенін нақтылаңыз:", "Which one exactly?"));
          a.options.forEach(function (r) { R.act(chip(r.it.name, r.it.name)); R.card(card(r, lang)); });
          return true;
        }
        return go();
      }
      case "addrPrev": {
        if (isNo(I, tk) && !isYes(I, tk)) { f.step = "address"; d.addrAsked = true; return go(); }
        if (isYes(I, tk)) { var p = S.profile() || {}; d.street = p.street; d.house = p.house; d.flat = p.flat || ""; d.entrance = p.entrance || ""; d.floor = p.floor || ""; d.addrDone = true; return go(); }
        var a2 = parseAddress(raw); if (a2.street && a2.house) { f.step = "address"; return orderHandle(raw, U, ctx, st, R); }
        return false;
      }
      case "address": {
        var ad = parseAddress(raw);
        if (d.street && !d.house && ad.house && !ad.street) { d.house = ad.house; }
        else if (ad.street && ad.house) { d.street = ad.street; d.house = ad.house; }
        else if (ad.street && !ad.house && !U.strong) { d.street = ad.street; }
        else return false;
        if (ad.flat) d.flat = ad.flat; if (ad.entrance) d.entrance = ad.entrance; if (ad.floor) d.floor = ad.floor;
        if (ad.flat || ad.entrance || ad.floor || ad.privateHouse) d.addrDone = true;
        return go();
      }
      case "addrMore": {
        var am = parseAddress(raw), sn = soft(raw);
        if (am.flat || am.entrance || am.floor) { if (am.flat) d.flat = am.flat; if (am.entrance) d.entrance = am.entrance; if (am.floor) d.floor = am.floor; }
        else if (/^\d{1,4}[а-яa-z]?$/.test(sn)) d.flat = sn;
        else if (!(am.privateHouse || isNo(I, tk) || /^(дом|частный|нет|no|skip|пропуст)/.test(sn))) return false;
        d.addrDone = true; return go();
      }
      case "pay": {
        var pv = payFrom(raw);
        if (!pv) {
          if (U.strong && !(I.payment >= 0.8)) return false;
          R.say(L(lang, "Через сайт принимаем наличные или Kaspi перевод. Что выбираете?", "Сайт арқылы — қолма-қол немесе Kaspi аударым. Қайсысы?", "Online orders take cash or Kaspi transfer. Which one?"));
          R.act(chip(payLabel("cash", lang), L(lang, "наличные", "қолма-қол", "cash"))).act(chip(payLabel("kaspi", lang), L(lang, "kaspi перевод", "kaspi аударым", "kaspi transfer")));
          return true;
        }
        d.pay = pv; return go();
      }
      case "pickup": {
        var s = soft(raw), mm = s.match(/(\d{1,3})\s*(?:мин|min|m\b)?/), mins = null;
        if (/полчаса|half an hour|жарты сагат/.test(s)) mins = 30;
        else if (/(через )?час|an hour|hour|сагат/.test(s) && !mm) mins = 60;
        else if (mm && +mm[1] >= 5 && +mm[1] <= 240) mins = +mm[1];
        if (!mins && /сейчас|скорее|asap|now|казир/.test(s)) { d.pickup = L(lang, "как можно скорее", "мүмкіндігінше тез", "as soon as possible"); return go(); }
        if (!mins) return false;
        d.pickup = mins + " " + L(lang, "минут", "минут", "min"); return go();
      }
      case "idPrev": {
        if (isYes(I, tk) && !isNo(I, tk)) { var pr2 = S.profile() || {}; d.name = pr2.name; d.phone = parsePhone(pr2.phone); return go(); }
        if (isNo(I, tk)) { f.step = "name"; return go(); }
        var n0 = parseName(raw), ph0 = parsePhone(raw);
        if (n0 || ph0) { if (n0) d.name = n0; if (ph0) d.phone = ph0; return go(); }
        return false;
      }
      case "name": {
        var ph = parsePhone(raw), nm = parseName(raw);
        if (!nm && !ph) { if (U.strong) return false; R.say(L(lang, "Это не очень похоже на имя. Как к вам обращаться?", "Бұл есімге ұқсамайды. Атыңыз кім?", "That doesn't look like a name. What should I call you?")); return true; }
        if (nm) d.name = nm; if (ph) d.phone = ph;
        return go();
      }
      case "phone": {
        var p2 = parsePhone(raw);
        if (!p2) { if (U.strong && !/\d{5,}/.test(raw)) return false; R.say(L(lang, "С номером что-то не то — нужно 11 цифр, например +7 700 123 45 67.", "Нөмір дұрыс емес — 11 сан керек, мысалы +7 700 123 45 67.", "Something's off with that number — I need 11 digits, like +7 700 123 45 67.")); return true; }
        d.phone = p2; return go();
      }
      case "confirm": {
        var pv2 = d.mode === "delivery" ? payFrom(raw) : null;
        if (pv2 && pv2 !== d.pay && !/(^|\s)(без|no)\s/.test(soft(raw))) { d.pay = pv2; R.say(L(lang, "Оплата: " + payLabel(pv2, lang) + ".", "Төлем: " + payLabel(pv2, lang) + ".", "Payment: " + payLabel(pv2, lang) + ".")); return go(); }
        var cut = soft(raw).match(/(\d{1,2})\s*(?:прибор|cutlery|курал)|прибор\w*\s*(\d{1,2})/);
        if (cut) { d.cutlery = +(cut[1] || cut[2]); R.say(L(lang, "Приборов: " + d.cutlery + ".", "Құрал: " + d.cutlery + ".", "Cutlery: " + d.cutlery + ".")); return go(); }
        if (isYes(I, tk) || /отправ|send|жибер/.test(soft(raw))) { R.say(L(lang, "Жмите кнопку «Отправить заказ» — WhatsApp откроется сам, с готовым текстом.", "«Тапсырысты жіберу» батырмасын басыңыз — WhatsApp өзі ашылады.", "Tap «Send order» — WhatsApp will open with the text ready.")); return go(); }
        if (U.strong) return false;
        d.note = (d.note ? d.note + "; " : "") + String(raw).trim().slice(0, 200);
        R.say(L(lang, "Записал пожелание.", "Тілекті жаздым.", "Noted."));
        return go();
      }
    }
    return false;
  }

  // ── БРОНЬ СТОЛИКА ──
  function fillBook(raw, U, d, ctx, step) {
    var b = findBranch(U.tokens) || findBranch(U.alt);
    if (b) d.branch = b;
    var g = parseGuests(raw, step === "guests");
    var rest = g ? soft(raw).replace(g.m, " ") : soft(raw);
    if (g && g.n >= 1) d.guests = g.n;
    var dt = parseDate(rest, ctx.now, step === "time");
    if (dt) { d.date = dt.v; rest = rest.replace(dt.m, " "); }
    var tm = parseTime(rest, step === "time");
    if (tm) d.time = { h: tm.h, mi: tm.mi, explicitAm: tm.explicitAm };
    if (step === "name" || step === "idPrev") { var nm = parseName(raw); if (nm) d.name = nm; }
    var ph = parsePhone(raw); if (ph) d.phone = ph;
    return !!(b || g || dt || tm || ph);
  }
  function bookStart(ctx, st, R, raw, U) {
    st.flow = { t: "book", step: null, d: {} };
    fillBook(raw, U, st.flow.d, ctx, "start");
    bookNext(ctx, st, R);
  }
  function bookNext(ctx, st, R) {
    var f = st.flow, d = f.d, S = ctx.site, lang = R.lang, now = ctx.now || Date.now();
    if (S.bkClosed && S.bkClosed()) { R.say(L(lang, "Ресторан сейчас временно закрыт, бронь недоступна. Загляните позже.", "Мейрамхана уақытша жабық, брондау қолжетімсіз.", "The restaurant is temporarily closed, so booking isn't available.")); st.flow = null; return; }
    if (!d.branch) {
      f.step = "branch";
      R.say(L(lang, pick("bk1", ["Бронируем! В какой филиал?", "Столик — это мы умеем. Куда идём?"]), "Брондаймыз! Қай филиалға?", "Let's book it! Which branch?"));
      ORDER.forEach(function (b) { R.act(chip(bname(b, lang), FACTS.branches[b].name)); });
      return;
    }
    var B = FACTS.branches[d.branch];
    if (S.bkAllowedNow && !S.bkAllowedNow(B.bookId)) {
      var hNow = ural(now).getUTCHours();
      R.say(hNow < 12 ? L(lang, "Заявки на бронь принимаем с 12:00 — загляните чуть позже, я вас дождусь.", "Брондау өтінімдерін 12:00-ден қабылдаймыз — сәл кейінірек келіңіз.", "We take booking requests from 12:00 — check back a bit later.")
        : L(lang, "Бронь на сегодня уже закрыта — заявки в " + B.name + " принимаем до " + B.bookUntil + ". Приходите завтра после 12:00.", "Бүгінгі брондау жабылды — " + B.name + " " + B.bookUntil + "-ге дейін қабылдайды. Ертең 12:00-ден кейін келіңіз.", "Booking is closed for today — " + bname(d.branch, lang) + " takes requests until " + B.bookUntil + ". Come back tomorrow after 12:00."));
      R.act(act("menu", lang));
      st.flow = null; return;
    }
    var u = ural(now), today = { y: u.getUTCFullYear(), m: u.getUTCMonth(), d: u.getUTCDate() };
    if (d.date) {
      var dts = Date.UTC(d.date.y, d.date.m, d.date.d), tts = Date.UTC(today.y, today.m, today.d), err = null;
      if (dts < tts) err = L(lang, "Этот день уже прошёл — машину времени пока не завезли. На какой день бронируем?", "Бұл күн өтіп кетті. Қай күнге брондаймыз?", "That day has already passed. Which day should I book?");
      else if (dts - tts > 62 * 86400e3) err = L(lang, "Так далеко не бронируем — максимум на пару месяцев вперёд. Какой день?", "Тым алыс — ең көбі екі ай алдын ала. Қай күн?", "That's too far ahead — two months max. Which day?");
      else if (S.bkBlocked && S.bkBlocked(d.date.m, d.date.d, B.bookId)) err = L(lang, "В этот день " + B.name + " не работает. Выберите другую дату.", "Бұл күні " + B.name + " жұмыс істемейді. Басқа күн таңдаңыз.", bname(d.branch, lang) + " is closed that day. Pick another date.");
      else if (S.openAt && S.openAt(d.branch) && Date.UTC(d.date.y, d.date.m, d.date.d, 23, 59, 59) < S.openAt(d.branch)) err = L(lang, B.name + " ещё не открылся — выберите дату попозже.", B.name + " әлі ашылмаған — кейінгі күнді таңдаңыз.", bname(d.branch, lang) + " hasn't opened yet — pick a later date.");
      if (err) { R.say(err); d.date = null; }
    }
    if (!d.date) {
      f.step = "date";
      if (!R.parts.length) R.say(L(lang, "На какой день?", "Қай күнге?", "Which day?"));
      R.act(chip(L(lang, "Сегодня", "Бүгін", "Today"), L(lang, "сегодня", "бүгін", "today"))).act(chip(L(lang, "Завтра", "Ертең", "Tomorrow"), L(lang, "завтра", "ертең", "tomorrow"))).act(chip(L(lang, "Послезавтра", "Бүрсігүні", "Day after tomorrow"), L(lang, "послезавтра", "бүрсігүні", "day after tomorrow")));
      return;
    }
    var hours = B.bookHours, last = hours[hours.length - 1];
    if (d.time) {
      var ft = fitBookHour(d.time, hours), terr = null, note = "";
      var mi = Math.round(ft.mi / 15) * 15, h = ft.h;
      if (mi === 60) { mi = 0; h = (h + 1) % 24; }
      if (mi !== ft.mi) note = L(lang, " (округлил до " + pad(h) + ":" + pad(mi) + " — бронируем с шагом 15 минут)", " (" + pad(h) + ":" + pad(mi) + " дейін дөңгелектедім)", " (rounded to " + pad(h) + ":" + pad(mi) + " — 15-minute steps)");
      if (hours.indexOf(h) < 0 || (h === last && h < 12 && mi > 45)) terr = L(lang, "Столики бронируем с 12:00 до " + pad(last) + ":45 (шаг 15 минут). Во сколько вас ждать?", "Үстелдерді 12:00-ден " + pad(last) + ":45-ке дейін брондаймыз. Сізді қашан күтеміз?", "We book tables from 12:00 to " + pad(last) + ":45 (15-minute steps). What time?");
      else {
        var real = h < 12 ? ymdAdd(d.date.y, d.date.m, d.date.d, 1) : d.date;
        var ts = Date.UTC(real.y, real.m, real.d, h - 5, mi);
        if (ts - now < 3600e3) terr = L(lang, "Бронь — минимум за час до визита. Выберите время попозже.", "Брондау кемінде бір сағат бұрын жасалады. Кешірек уақыт таңдаңыз.", "Bookings need at least an hour's notice. Pick a later time.");
        else { d.slot = { y: real.y, m: real.m, d: real.d, h: h, mi: mi, night: h < 12 }; d.roundNote = note; }
      }
      if (terr) { R.say(terr); d.time = null; d.slot = null; }
    }
    if (!d.slot) {
      f.step = "time";
      if (!R.parts.length) R.say(L(lang, "Во сколько? Столики бронируем с 12:00 до " + pad(last) + ":45.", "Сағат нешеге? Үстелдерді 12:00-ден " + pad(last) + ":45-ке дейін брондаймыз.", "What time? We book from 12:00 to " + pad(last) + ":45."));
      var isToday = d.date.y === today.y && d.date.m === today.m && d.date.d === today.d, nowH = u.getUTCHours();
      [18, 19, 20, 21].filter(function (x) { return !isToday || x > nowH + 1; }).forEach(function (x) { R.act(chip(x + ":00", x + ":00")); });
      return;
    }
    if (!d.guests) {
      f.step = "guests";
      R.say(L(lang, "Сколько вас будет?", "Неше адам боласыздар?", "How many people?"));
      [2, 3, 4, 5].forEach(function (n) { R.act(chip(String(n), String(n))); });
      R.act(chip(L(lang, "6 и более", "6 және одан көп", "6 or more"), "6+"));
      return;
    }
    if (!d.name || !d.phone) {
      var pr = {}, bp = (S.bkProfile && S.bkProfile()) || {}, cp = (S.profile && S.profile()) || {};
      pr.name = bp.name || cp.name; pr.phone = parsePhone(bp.phone || cp.phone || "");
      if (!d.idAsked && pr.name && pr.phone) {
        d.idAsked = true; f.step = "idPrev";
        R.say(L(lang, "Бронируем на " + pr.name + ", " + pr.phone + "?", pr.name + ", " + pr.phone + " атына брондайын ба?", "Book it under " + pr.name + ", " + pr.phone + "?"));
        R.act(chip(L(lang, "Да", "Иә", "Yes"), L(lang, "да", "иә", "yes"))).act(chip(L(lang, "Другие данные", "Басқа деректер", "Different details"), L(lang, "другие данные", "басқа деректер", "different details")));
        return;
      }
      if (!d.name) { f.step = "name"; R.say(L(lang, "На чьё имя бронь?", "Кімнің атына брондаймыз?", "What name should the booking be under?")); return; }
      f.step = "phone"; R.say(L(lang, "Номер телефона? Менеджер подтвердит бронь в WhatsApp.", "Телефон нөміріңіз? Менеджер WhatsApp-та растайды.", "Phone number? The manager will confirm on WhatsApp.")); return;
    }
    f.step = "confirm";
    var sl = d.slot, dateTxt = pad(sl.d) + "." + pad(sl.m + 1) + "." + sl.y, timeTxt = pad(sl.h) + ":" + pad(sl.mi);
    var gl = d.guests >= 6 ? L(lang, "6 и более", "6 және одан көп", "6 or more") + (d.guests > 6 ? " (" + d.guests + ")" : "") : String(d.guests);
    var lines = [L(lang, "Проверяем бронь:", "Брондауды тексерейік:", "Let's check your booking:"),
      L(lang, "Филиал: ", "Филиал: ", "Branch: ") + bname(d.branch, lang),
      L(lang, "Дата: ", "Күні: ", "Date: ") + dateLong(sl.y, sl.m, sl.d, lang) + (sl.night ? L(lang, " (ночь после предыдущего дня)", " (алдыңғы күннен кейінгі түн)", " (after midnight)") : ""),
      L(lang, "Время: ", "Уақыты: ", "Time: ") + timeTxt + (d.roundNote || ""),
      L(lang, "Гостей: ", "Қонақ: ", "Guests: ") + gl,
      L(lang, "Имя: ", "Аты: ", "Name: ") + d.name, L(lang, "Телефон: ", "Телефон: ", "Phone: ") + d.phone];
    if (d.comment) lines.push(L(lang, "Пожелания: ", "Тілек: ", "Notes: ") + d.comment);
    lines.push("", L(lang, "Важно: столик держим 20 минут, а предоплата " + fmt(FACTS.bookDeposit) + " не возвращается при неявке. Пожелания (у окна, детский стул) — напишите, добавлю. Если согласны — жмите «Принимаю, отправить»: откроется WhatsApp с готовой заявкой.",
      "Маңызды: үстелді 20 минут ұстаймыз, келмей қалсаңыз " + fmt(FACTS.bookDeposit) + " алдын ала төлем қайтарылмайды. Тілек болса (терезе жанында, балалар орындығы) — жазыңыз. Келіссеңіз — «Қабылдаймын, жіберу» басыңыз: WhatsApp дайын өтініммен ашылады.",
      "Important: we hold the table for 20 minutes, and the " + fmt(FACTS.bookDeposit) + " prepayment isn't refunded if you don't show up. Any wishes (window seat, high chair) — just type them. If you agree, tap «Accept and send»: WhatsApp opens with the request ready."));
    R.say(lines.join("\n"));
    d.final = { branch: d.branch, bookId: B.bookId, branchName: B.name, y: sl.y, m: sl.m, d: sl.d, h: sl.h, mi: sl.mi, guests: Math.min(d.guests, 6), guestsExact: d.guests, name: d.name, phone: d.phone, comment: d.comment || "" };
    R.act({ a: "book:send", label: L(lang, "Принимаю, отправить", "Қабылдаймын, жіберу", "Accept and send") }).act({ a: "link:book", label: L(lang, "Условия брони", "Брондау шарттары", "Booking terms") })
      .act(chip(L(lang, "Изменить", "Өзгерту", "Change"), L(lang, "изменить", "өзгерту", "change"))).act(chip(L(lang, "Отменить", "Бас тарту", "Cancel"), L(lang, "отмена", "бас тарту", "cancel")));
  }
  function bookHandle(raw, U, ctx, st, R) {
    var f = st.flow, d = f.d, lang = R.lang, tk = U.tokens, I = U.intents, S = ctx.site;
    function go() { bookNext(ctx, st, R); return true; }
    if (f.step === "idPrev") {
      if (isYes(I, tk) && !isNo(I, tk)) { var bp = (S.bkProfile && S.bkProfile()) || {}, cp = (S.profile && S.profile()) || {}; d.name = bp.name || cp.name; d.phone = parsePhone(bp.phone || cp.phone || ""); return go(); }
      if (isNo(I, tk)) { f.step = "name"; return go(); }
    }
    if (f.step === "confirm") {
      if (isYes(I, tk) || /отправ|send|жибер|принима/.test(soft(raw))) { R.say(L(lang, "Жмите «Принимаю, отправить» — WhatsApp откроется сам.", "«Қабылдаймын, жіберу» батырмасын басыңыз.", "Tap «Accept and send» — WhatsApp will open.")); return go(); }
      var before = JSON.stringify([d.branch, d.date, d.time, d.guests, d.phone]);
      fillBook(raw, U, d, ctx, "confirm");
      if (JSON.stringify([d.branch, d.date, d.time, d.guests, d.phone]) !== before) { d.slot = d.time ? null : d.slot; if (d.date || d.time) d.slot = null; return go(); }
      if (U.strong) return false;
      d.comment = (d.comment ? d.comment + "; " : "") + String(raw).trim().slice(0, 120);
      R.say(L(lang, "Записал пожелание.", "Тілекті жаздым.", "Noted."));
      return go();
    }
    var had = JSON.stringify(d);
    var got = fillBook(raw, U, d, ctx, f.step);
    if (f.step === "branch" && findBranch(U.tokens) === null && findBranch(U.alt) === null && !got) return false;
    if ((f.step === "date" || f.step === "time") && got) { d.slot = null; }
    if (f.step === "name" && !d.name) {
      if (U.strong) return false;
      R.say(L(lang, "Это не очень похоже на имя. На кого бронируем?", "Бұл есімге ұқсамайды. Кімнің атына?", "That doesn't look like a name. Who's the booking for?")); return true;
    }
    if (f.step === "phone" && !d.phone) {
      if (U.strong && !/\d{5,}/.test(raw)) return false;
      R.say(L(lang, "С номером что-то не то — нужно 11 цифр, например +7 700 123 45 67.", "Нөмір дұрыс емес — 11 сан керек.", "Something's off with that number — I need 11 digits.")); return true;
    }
    if (JSON.stringify(d) === had) return false;
    return go();
  }
  function flowChange(raw, U, ctx, st, R) {
    var f = st.flow, d = f.d, s = soft(raw), lang = R.lang;
    if (f.t === "order") {
      if (/состав|корзин|блюд|items|cart|себет/.test(s)) { d.itemsOk = false; f.step = null; orderNext(ctx, st, R); return true; }
      if (/адрес|address|мекенжай/.test(s)) { d.street = d.house = d.flat = d.entrance = d.floor = ""; d.addrDone = false; d.addrAsked = true; orderNext(ctx, st, R); return true; }
      if (/имя|телефон|номер|name|phone|аты/.test(s)) { d.name = d.phone = ""; d.idAsked = true; orderNext(ctx, st, R); return true; }
      if (/оплат|pay|толем|төлем/.test(s)) { d.pay = null; orderNext(ctx, st, R); return true; }
      if (/способ|доставк|самовывоз|delivery|pickup/.test(s)) { d.mode = null; d.pickup = ""; d.addrDone = false; orderNext(ctx, st, R); return true; }
      if (/филиал|branch/.test(s)) { d.branch = null; orderNext(ctx, st, R); return true; }
      R.say(L(lang, "Что меняем?", "Нені өзгертеміз?", "What should I change?"));
      R.act(chip(L(lang, "Состав заказа", "Тапсырыс құрамы", "Items"), L(lang, "изменить состав", "құрамын өзгерту", "change items")))
        .act(chip(d.mode === "self" ? L(lang, "Способ получения", "Алу тәсілі", "Delivery/pickup") : L(lang, "Адрес", "Мекенжай", "Address"), d.mode === "self" ? L(lang, "изменить способ", "тәсілін өзгерту", "change delivery") : L(lang, "изменить адрес", "мекенжайды өзгерту", "change address")))
        .act(chip(L(lang, "Имя и телефон", "Аты мен телефоны", "Name and phone"), L(lang, "изменить имя", "атын өзгерту", "change name")));
      if (d.mode === "delivery") R.act(chip(L(lang, "Оплату", "Төлемді", "Payment"), L(lang, "изменить оплату", "төлемді өзгерту", "change payment")));
      return true;
    }
    if (/дат|день|date|кун|кун/.test(s)) { d.date = null; d.slot = null; bookNext(ctx, st, R); return true; }
    if (/врем|час|time|уакыт|сагат/.test(s)) { d.time = null; d.slot = null; bookNext(ctx, st, R); return true; }
    if (/гост|людей|человек|guests|people|адам/.test(s)) { d.guests = null; bookNext(ctx, st, R); return true; }
    if (/филиал|branch/.test(s)) { d.branch = null; d.slot = null; bookNext(ctx, st, R); return true; }
    if (/имя|телефон|номер|name|phone|аты/.test(s)) { d.name = d.phone = ""; d.idAsked = true; bookNext(ctx, st, R); return true; }
    R.say(L(lang, "Что меняем?", "Нені өзгертеміз?", "What should I change?"));
    R.act(chip(L(lang, "Дату", "Күнін", "Date"), L(lang, "изменить дату", "күнін өзгерту", "change date"))).act(chip(L(lang, "Время", "Уақытын", "Time"), L(lang, "изменить время", "уақытын өзгерту", "change time")))
      .act(chip(L(lang, "Гостей", "Қонақ санын", "Guests"), L(lang, "изменить гостей", "қонақ санын өзгерту", "change guests"))).act(chip(L(lang, "Имя и телефон", "Аты мен телефоны", "Name and phone"), L(lang, "изменить имя", "атын өзгерту", "change name")));
    return true;
  }
  // напоминание, на каком шаге оформления мы остановились
  function flowReminder(ctx, st, lang) {
    var R2 = new Resp(lang), f = st.flow;
    if (f.t === "order") orderNext(ctx, st, R2); else bookNext(ctx, st, R2);
    if (!st.flow) return null;
    return { text: L(lang, f.t === "order" ? "Кстати, заказ не забыли? " : "Кстати, бронь ждёт: ", f.t === "order" ? "Тапсырысты ұмытпадық па? " : "Брондау күтіп тұр: ", f.t === "order" ? "By the way, your order is waiting: " : "By the way, your booking is waiting: ") + R2.parts[R2.parts.length - 1], acts: R2.acts };
  }

  // ─────────────────────────── ГЛАВНОЕ ───────────────────────────
  var QA_STRONG = ["hours", "address", "deliveryPrice", "deliveryTime", "payment", "kids", "wifi", "outlets", "birthday", "promos", "vacancy", "about", "cuisine", "recommend", "halal", "allergy", "contacts", "operator", "complaint", "orderStatus", "bot", "smalltalk", "flirt", "parking", "alcohol", "container", "cakes", "smm", "creator", "marketer", "weather", "timeNow", "dateNow", "joke", "age", "botName", "sad", "compliment", "menu", "price", "compose", "weight", "spicy", "veg", "cheap", "bookingRules"];
  function detectLang(raw, tokens, st) {
    if (KZ_LETTERS.test(raw)) return "kz";
    var lat = (String(raw).toLowerCase().match(/[a-z']+/g) || []).map(function (w) { return w.replace(/'/g, ""); });
    var cyr = (String(raw).match(/[а-яё]/gi) || []).length;
    if (lat.length && !cyr) {
      var en = lat.filter(function (w) { return EN_WORDS[w]; }).length, ru = lat.filter(function (w) { return RU_LATIN[w]; }).length;
      if (en >= 1 && en > ru) return "en";
      if (!en && !ru) return st.lang || "ru";
      return "ru";
    }
    var kz = 0, rc = 0;
    tokens.forEach(function (w) { if (KZ_WORDS.indexOf(w) >= 0) kz++; else if (/[а-я]/.test(w) && w.length > 2) rc++; });
    if (kz >= 2 || (kz >= 1 && kz >= rc)) return "kz";
    if (!rc && !kz) return st.lang || "ru";
    if (st.lang && st.lang !== "ru" && rc <= 1 && tokens.length <= 2) return st.lang;
    return "ru";
  }
  function analyse(text) {
    var n = baseNorm(text), tk = toks(n);
    return { norm: n, tokens: tk, intents: scoreIntents(tk) };
  }
  function understand(raw, idx) {
    var v = [analyse(raw)];
    if (/[a-z]/.test(v[0].norm)) { v.push(analyse(translit(baseNorm(raw)))); v.push(analyse(fromLayout(raw))); }
    var best = v[0], bs = -1;
    v.forEach(function (x) {
      var s = 0; for (var k in x.intents) s += x.intents[k];
      if (findBranch(x.tokens)) s += 1;
      if (x !== v[0] && !s && idx.length && (findDishes(x.tokens, idx).length || findCategory(x.tokens, idx))) s += 0.9;
      x.total = s;
      if (s > bs) { bs = s; best = x; }
    });
    var alt = []; v.forEach(function (x) { if (x !== best) alt = alt.concat(x.tokens); });
    // блюда ищем во всех вариантах: «how much is pepperoni» → интент на английском, блюдо — в транслите
    var dishTokens = best.tokens;
    if (!findDishes(best.tokens, idx).length && !findCategory(best.tokens, idx)) {
      // в транслите принимаем только уверенное совпадение (иначе «located» превращается в «кола»)
      for (var i = 0; i < v.length; i++) {
        if (v[i] === best) continue;
        var sc = findDishesScored(v[i].tokens, idx);
        if ((sc.length && sc[0].score >= 0.95) || findCategory(v[i].tokens, idx)) { dishTokens = v[i].tokens.concat(best.tokens); break; }
      }
    }
    var I = best.intents, strong = QA_STRONG.some(function (k) { return (I[k] || 0) >= 1; });
    return { norm: best.norm, tokens: best.tokens, intents: I, alt: alt, dishTokens: dishTokens, strong: strong };
  }
  function customMatch(tokens, custom) {
    var best = null, bs = 0;
    (custom || []).forEach(function (c) {
      c.keys.forEach(function (k) { var s = keyScore(tokens, k, 2); if (s > bs) { bs = s; best = c; } });
    });
    return bs >= 0.8 ? best : null;
  }
  function parseCustom(text) {
    return String(text || "").split(/\n+/).map(function (l) {
      var i = l.indexOf("=");
      if (i < 1) return null;
      var keys = l.slice(0, i).split(",").map(function (k) {
        return toks(baseNorm(k)).map(function (w) { return w.length >= 7 ? w.slice(0, -2) : w.length >= 5 ? w.slice(0, -1) : w; }).join(" ");
      }).filter(function (k) { return k.length >= 2; });
      var ans = l.slice(i + 1).trim();
      return keys.length && ans ? { keys: keys, answer: ans } : null;
    }).filter(Boolean);
  }
  function topCats(idx, lang) {
    var cats = [];
    idx.forEach(function (r) { if (cats.indexOf(r.cat) < 0) cats.push(r.cat); });
    var pref = ["пицц", "ролл", "суш", "бургер", "суп", "горяч", "кофе", "десерт", "завтрак"];
    cats.sort(function (a, b) { var ia = pref.indexOf(catKey(a)), ib = pref.indexOf(catKey(b)); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    return cats.slice(0, 4).map(function (c) { return chip(c, c); });
  }
  function mathAnswer(raw) {
    var m = String(raw).replace(/,/g, ".").match(/^\s*(?:сколько будет|посчитай|calculate|what is|whats)?\s*(-?\d+(?:\.\d+)?)\s*([+\-*xх×\/:])\s*(-?\d+(?:\.\d+)?)\s*=?\s*\??\s*$/i);
    if (!m) return null;
    var a = +m[1], b = +m[3], op = m[2], r;
    if (op === "+") r = a + b; else if (op === "-") r = a - b; else if (/[*xх×]/.test(op)) r = a * b; else { if (!b) return { a: a, op: "/", b: b, r: null }; r = a / b; }
    return { a: a, op: /[*xх×]/.test(op) ? "×" : op === ":" ? "/" : op, b: b, r: Math.round(r * 1000) / 1000 };
  }

  /*
   * reply(text, ctx) -> { text, acts:[{a,label}], cards:[...], intent, lang, known }
   * ctx: { menus:{samal:{cat:[items]},...}, branch, now, custom:[...], state:{}, deliveryHours, site:{...} }
   * ctx.site — мост к сайту (корзина, филиал, профиль, проверки брони). Без него
   * оформление в чате выключено, работают только ответы.
   */
  function reply(text, ctx) {
    ctx = ctx || {};
    var st = ctx.state || (ctx.state = {});
    var raw = String(text || "").trim().slice(0, 500);
    var idx = menuIndex(ctx.menus || {}, ctx.branch);
    var U = understand(raw, idx), tokens = U.tokens, I = U.intents;
    var lang = detectLang(raw, tokens, st);
    st.lang = lang;
    var R = new Resp(lang), S = ctx.site || null;
    var rude = anyKey(tokens, RUDE, true) || (raw.replace(/[^A-ZА-ЯЁ]/g, "").length >= 6 && raw.replace(/[^A-ZА-ЯЁ]/g, "").length > raw.replace(/[^a-zа-яё]/g, "").length * 2) || /!{3,}/.test(raw);
    if (rude) U.strong = true;
    var used = [];
    function has(id, min) { return (I[id] || 0) >= (min || 0.8); }
    function out(intent, known) {
      if (st.flow) st.flow.prompt = { text: R.parts[R.parts.length - 1] || "", acts: R.acts.slice() };
      var main = used.filter(function (x) { return ["greet", "thanks", "ok", "bye", "dish", "category", "menu"].indexOf(x) < 0; })[0];
      if (main) st.lastIntent = main;
      return { text: R.parts.join("\n\n"), acts: R.acts.slice(0, 6), cards: R.cards.slice(0, 6), intent: intent || used.join(","), lang: lang, known: known !== false };
    }
    if (!raw) { R.say(t("clarify", lang)); clarifyChips(lang).forEach(function (c) { R.act(c); }); return out("clarify", false); }

    // ── оформление в процессе ──
    if (st.flow && S) {
      if (has("cancel", 1)) {
        var wasOrder = st.flow.t === "order"; st.flow = null;
        R.say(wasOrder ? L(lang, "Отменил. Корзина на месте — вдруг передумаете.", "Бас тарттым. Себет орнында.", "Cancelled. Your cart is still there in case you change your mind.") : L(lang, "Окей, бронь отменил. Столик подождёт.", "Жарайды, брондаудан бас тарттым.", "Okay, booking cancelled."));
        R.act(act("menu", lang));
        return out("cancel");
      }
      if (has("change", 1) && ["confirm", "items", "idPrev", "addrPrev"].indexOf(st.flow.step) >= 0 || has("change", 1) && /(изменить|поменять|change|өзгерт)\s+\S/.test(soft(raw))) { flowChange(raw, U, ctx, st, R); return out(st.flow ? st.flow.t : "flow"); }
      var switchTo = null;
      if (st.flow.t === "book" && (has("orderStart", 1) || has("orderHow"))) switchTo = "order";
      if (st.flow.t === "order" && has("booking", 1) && !has("bookingRules") && st.flow.step !== "confirm") switchTo = "book";
      if (!switchTo) {
        var handled = st.flow.t === "order" ? orderHandle(raw, U, ctx, st, R) : bookHandle(raw, U, ctx, st, R);
        if (handled) return out(st.flow ? st.flow.t : "flow");
      }
      if (switchTo === "book") { st.flow = null; bookStart(ctx, st, R, raw, U); return out("book"); }
      if (switchTo === "order") st.flow = null;
    }

    // своё правило из админки
    var cm = customMatch(tokens, ctx.custom);
    if (cm && !(st.flow && ["name", "phone", "address", "addrMore"].indexOf(st.flow.step) >= 0)) { R.say(cm.answer); used.push("custom"); return finishQA(); }

    var branch = findBranch(tokens) || findBranch(U.alt);
    var dishes = findDishes(U.dishTokens, idx);
    var cat = findCategory(U.dishTokens, idx);

    // ── старт оформления ──
    if (S && !has("orderStatus") && !has("complaint", 1)) {
      var md = modeFrom(I, tokens);
      if (st.offer && (Date.now() - (st.offer.ts || 0) < 30 * 60e3) && (md || (isYes(I, tokens) && tokens.length <= 3))) {
        var items0 = st.offer.items; st.offer = null;
        orderStart(ctx, st, R, { mode: md, items: items0, pay: payFrom(raw) });
        return out("order");
      }
      var wantBook = has("booking", 1) && !has("bookingRules") && !has("orderStart", 1);
      var wantDish = !wantBook && dishes.length && hasWant(tokens) && !has("price") && !has("compose") && !has("weight") && !has("allergy");
      if (has("orderStart") || has("orderHow") || wantDish) {
        var init = { mode: md, branch: branch, items: [], pay: payFrom(raw) };
        if (dishes.length) {
          var pi = parseItems(raw, idx);
          pi.items.forEach(function (x) { init.items.push({ name: x.r.it.name, qty: x.qty, hint: x.hint, hintText: raw }); });
          if (!init.items.length && dishes.length === 1) init.items.push({ name: dishes[0].it.name, qty: 1 });
        }
        orderStart(ctx, st, R, init);
        return out("order");
      }
      if (has("booking") && !has("bookingRules") && !has("kids") && !has("birthday") && !(has("address", 1) && !has("booking", 1))) {
        bookStart(ctx, st, R, raw, U);
        return out("book");
      }
    }
    return finishQA();

    function finishQA() {
      if (!used.length) qa();
      var qaText = R.parts.join("\n\n");
      var known = !!R.parts.length && used.indexOf("unknown") < 0 && used.indexOf("clarify") < 0;
      // если шло оформление, а гость спросил про другое — отвечаем и напоминаем
      if (st.flow && S) {
        var pr = st.flow.prompt;
        if (!known && pr) { R.parts = [L(lang, "Не совсем понял. ", "Түсінбедім. ", "Didn't quite get that. ") + pr.text]; R.acts = pr.acts.slice(); R.cards = []; return out(st.flow.t, true); }
        if (pr) { R.say(L(lang, st.flow.t === "order" ? "Кстати, заказ ждёт: " : "Кстати, бронь ждёт: ", st.flow.t === "order" ? "Тапсырыс күтіп тұр: " : "Брондау күтіп тұр: ", "By the way, we were in the middle of " + (st.flow.t === "order" ? "your order: " : "your booking: ")) + pr.text); pr.acts.forEach(function (a) { R.act(a); }); }
        var o = out(used.join(","), true); st.flow.prompt = pr; return o;
      }
      return out(used.join(",") || (known ? "qa" : "unknown"), known && !!qaText);
    }

    function qa() {
      // «где мой заказ» — это статус, а не адрес и не «как заказать»
      if (has("orderStatus")) { delete I.address; delete I.orderHow; delete I.menu; delete I.orderStart; }
      if (has("complaint") && !has("orderStatus")) { delete I.deliveryTime; if (!/\?/.test(raw)) delete I.delivery; }
      if (has("bookingRules")) delete I.complaint;
      if (has("timeNow", 1)) delete I.hours;
      if (has("age", 1)) delete I.about;
      if (has("smm") || has("creator") || has("marketer") || has("nurlan")) { delete I.contacts; delete I.operator; }
      if (tokens.length <= 3 && tokens.indexOf("номер") >= 0 && !has("booking") && !has("nurlan") && !has("smm")) I.contacts = 1;
      if (has("delivery") && has("price") && !dishes.length && !cat) { delete I.price; I.deliveryPrice = 1; }
      if (has("deliveryPrice") && !has("delivery") && !dishes.length && !cat && has("price")) delete I.price;
      if (has("container")) { delete I.price; delete I.weight; }
      if (has("cakes")) { delete I.price; }

      var math = mathAnswer(raw);
      if (math) { R.say(math.r === null ? L(lang, "На ноль не делю — я же не калькулятор-самоубийца. А вот пиццу на всех поделю.", "Нөлге бөлмеймін. Бірақ пиццаны бәріне бөлемін.", "I don't divide by zero. Pizza, however, I'll split for everyone.") : math.a + " " + math.op + " " + math.b + " = " + math.r + L(lang, ". Считаю быстро, но пиццу доставляют ещё быстрее.", ".", ". I count fast, but pizza arrives even faster.")); used.push("math"); return; }

      // ── Нурлан, SMM, сайт ──
      if (has("smm")) { R.say(t("smm", lang)); used.push("smm"); return; }
      if (has("nurlan") && (has("contacts") || /номер|телефон|phone|number|нөмір|номир|контакт|связ/.test(soft(raw)))) { R.say(t("nurlanPhone", lang)); used.push("nurlan"); return; }
      if (has("creator")) { R.say(t("creator", lang)); used.push("creator"); return; }
      if (has("marketer")) { R.say(t("marketer", lang)); used.push("marketer"); return; }
      if (has("nurlan")) { R.say(t("nurlan", lang)); used.push("nurlan"); return; }

      // ── темы ──
      if (has("greet") && Object.keys(I).filter(function (k) { return I[k] >= 0.8; }).length === 1 && !dishes.length && !cat) { R.say(t("greet", lang)); used.push("greet"); R.act(askOrder(lang)).act(askBook(lang)).act(act("menu", lang)); }
      if (has("hours")) { R.say(hoursText(branch, lang, ctx.now)); used.push("hours"); }
      if (has("delivery") || has("deliveryPrice") || has("deliveryTime")) {
        var dtx = deliveryText(branch, lang, ctx.deliveryHours || root.DELIVERY_HOURS || null);
        if (has("deliveryTime")) dtx += L(lang, " Точное время подскажет менеджер при подтверждении заказа.", " Нақты уақытты менеджер тапсырысты растағанда айтады.", " The manager will give you the exact time when confirming.");
        R.say(dtx); used.push("delivery"); if (S) R.act(askOrder(lang));
      }
      if (has("pickup") && !has("delivery")) { R.say(t("pickup", lang)); used.push("pickup"); if (S) R.act(askOrder(lang, "self")); }
      if (has("booking") && !has("bookingRules") && !S) { R.say(L(lang, "Забронировать можно в «Сервисы» → «Бронь столика» — бронь работает во всех трёх филиалах, включая Абулхаир Хана 177.", "«Сервисы» → «Бронь столика» бөлімінде брондаңыз — үш филиалда да бар.", "You can book in «Сервисы» → «Бронь столика» — at all three branches.")); R.act(act("book", lang)); used.push("booking"); }
      if ((has("orderHow") || has("orderStart")) && !S && !has("orderStatus")) { R.say(L(lang, "Всё просто: 1) в меню выберите филиал, 2) добавьте блюда кнопкой «+», 3) откройте корзину и нажмите «Оформить заказ». Заказ уйдёт менеджеру в WhatsApp — там он подтвердит детали и оплату.", "Оңай: 1) мәзірде филиалды таңдаңыз, 2) тағамдарды «+» батырмасымен қосыңыз, 3) себетті ашып «Оформить заказ» басыңыз. Тапсырыс менеджерге WhatsApp арқылы барады.", "Easy: 1) pick a branch in the menu, 2) add dishes with «+», 3) open the cart and tap «Оформить заказ». The order goes to the manager on WhatsApp.")); R.act(act("menu", lang)).act(act("cart", lang)); used.push("orderHow"); }
      if (has("bookingRules")) { R.say(t("bookingRules", lang)); R.act({ a: "link:book", label: L(lang, "Условия брони", "Брондау шарттары", "Booking terms") }); if (S) R.act(askBook(lang)); used.push("bookingRules"); }
      if (has("birthday")) { R.say(t("birthday", lang)); used.push("birthday"); if (S) R.act(askBook(lang)); }
      else if (has("promos")) { R.say(t("promos", lang)); R.act(act("news", lang)); used.push("promos"); }
      if (has("kids") && !cat) {
        if (branch === "samal") R.say(L(lang, "Да, в Самал 70/3 есть детская игровая зона — дети играют, вы спокойно едите.", "Иә, Самал 70/3 филиалында балалар ойын аймағы бар.", "Yes, Samal 70/3 has a kids' play area."));
        else if (branch) R.say(L(lang, "В филиале " + FACTS.branches[branch].name + " детской зоны нет — она есть только в Самал 70/3 (10 микрорайон).", FACTS.branches[branch].name + " филиалында балалар аймағы жоқ — ол тек Самал 70/3-те.", bname(branch, lang) + " doesn't have a kids' area — only Samal 70/3 does."));
        else R.say(t("kids", lang));
        used.push("kids");
      }
      if (has("wifi")) { R.say(t("wifi", lang)); used.push("wifi"); }
      if (has("outlets")) { R.say(t("outlets", lang)); used.push("outlets"); }
      if (has("payment")) { R.say(t("payment", lang)); used.push("payment"); if (S) R.act(askOrder(lang)); }
      if (has("vacancy") && !has("hours")) { R.say(t("vacancy", lang)); R.act(act("vacancy", lang)); used.push("vacancy"); }
      if (has("about")) { R.say(t("about", lang)); used.push("about"); }
      if (has("cuisine") && !dishes.length) { R.say(t("cuisine", lang)); R.act(act("menu", lang)); used.push("cuisine"); }
      if (has("container")) { R.say(t("container", lang)); used.push("container"); }
      if (has("cakes")) { R.say(t("cakes", lang)); used.push("cakes"); }
      if (has("orderStatus")) { R.say(t("orderStatus", lang)); used.push("orderStatus"); }
      else if (has("complaint")) { R.say(t("complaint", lang)); used.push("complaint"); }
      if (has("halal")) { R.say(t("halal", lang)); used.push("halal"); }
      if (has("allergy")) {
        if (!dishes.length && !cat && st.lastDishIds && st.lastDishIds.length && tokens.length <= 3) dishes = idx.filter(function (r) { return st.lastDishIds.indexOf(r.it.id) >= 0; });
        if (dishes.length) {
          R.say(dishes.slice(0, 3).map(function (r) {
            var al = String(r.it.allergens || "").trim();
            return al ? L(lang, r.it.name + " — в меню указаны аллергены: " + al + ".", r.it.name + " — мәзірде көрсетілген аллергендер: " + al + ".", r.it.name + " — listed allergens: " + al + ".")
              : L(lang, "Для «" + r.it.name + "» аллергены в меню не указаны.", r.it.name + " үшін аллергендер мәзірде көрсетілмеген.", "No allergens are listed for «" + r.it.name + "».");
          }).join("\n") + L(lang, " Если аллергия серьёзная — обязательно скажите менеджеру при подтверждении заказа.", " Аллергия күшті болса, тапсырысты растағанда менеджерге міндетті түрде айтыңыз.", " If it's serious, be sure to tell the manager when confirming the order."));
          dishes = [];
        } else R.say(t("allergy", lang));
        used.push("allergy");
      }
      if (has("without") && !has("veg") && !has("allergy")) { R.say(t("without", lang)); used.push("without"); }
      if (has("parking")) { R.say(t("parking", lang)); R.act(chip(L(lang, "Адреса филиалов", "Мекенжайлар", "Addresses"), L(lang, "где вы находитесь", "мекенжай", "where are you"))); used.push("parking"); }
      if (has("address") && !used.length) {
        R.say(branch ? branchCard(branch, lang) : L(lang, pick("adr", ["У нас три филиала в Уральске:\n", "Нас можно найти по трём адресам:\n"]), "Бізде Оралда үш филиал бар:\n", "We have three branches in Uralsk:\n") + ORDER.map(function (b) { return "• " + bname(b, lang) + " — " + FACTS.branches[b].district[lang]; }).join("\n"));
        used.push("address");
      }
      if ((has("contacts") || has("operator")) && !used.length) { R.say(t("contacts", lang)); clarifyChips(lang).slice(0, 3).forEach(function (c) { R.act(c); }); used.push("contacts"); }

      // ── блюда и меню ──
      var menuAsked = has("menu") || has("price") || has("recommend") || has("compose") || has("weight") || has("spicy") || has("veg") || has("cheap") || has("alcohol");
      var live = liveOnly(idx).filter(function (r) { return !ctx.branch || r.branches.indexOf(ctx.branch) >= 0 || !idx.some(function (x) { return x.current; }); });
      var multi = !ctx.branch, brief = !/(^| )\d{2}( |$)|размер|(^| )см( |$)|болш|маленк|средн|литр|объем|size/.test(U.norm);
      var byIng = false;
      if (!dishes.length && !cat && (has("price") || has("compose") || has("weight") || has("allergy")) && st.lastDishIds && st.lastDishIds.length) {
        dishes = idx.filter(function (r) { return st.lastDishIds.indexOf(r.it.id) >= 0; });
      }
      if (!cat && idx.length && !has("without") && !has("veg")) {
        var strongOther = Object.keys(I).some(function (k) { return I[k] >= 0.8 && ["menu", "recommend", "price", "compose", "yes", "no", "ok", "greet"].indexOf(k) < 0; });
        if (!strongOther) {
          var ing = findByIngredient(U.dishTokens, idx, !dishes.length && !Object.keys(I).length);
          if (!dishes.length) { dishes = ing; byIng = ing.length > 0; }
          else if (ing.length && tokens.some(function (w) { return w === "с" || w === "со" || w === "with"; })) ing.forEach(function (r) { if (dishes.indexOf(r) < 0) dishes.push(r); });
        }
      }
      if (dishes.length) {
        var ds = dishes;
        if (has("compose") || has("weight")) {
          R.say(ds.slice(0, 3).map(function (r) {
            var desc = String(r.it.desc || "").trim();
            if (has("weight")) {
              var src = desc + " " + r.it.name + " " + (r.it.mods || ""), w = [];
              src.replace(/(\d+[.,]?\d*)\s*(килограмм|кг|грамм|гр|г|мл|л|см|шт)(?![а-яa-z])/gi, function (m, n, u) { var g = /^(килограмм|кг|грамм|гр|г|мл|л)$/i.test(u) ? 0 : 1; if (!w.some(function (x) { return x.m === m; })) w.push({ m: m, g: g }); return m; });
              w.sort(function (a, b) { return a.g - b.g; });
              var rest = desc.replace(/(\d+[.,]?\d*)\s*(килограмм|кг|грамм|гр|г|мл|л|см|шт)(?![а-яa-z])/gi, "").replace(/\s*[,;]\s*(?=[,;]|$)/g, "").replace(/^[\s,;.]+|[\s,;.]+$/g, "");
              if (w.length) return r.it.name + " — " + w.map(function (x) { return x.m; }).join(", ") + (rest.length > 3 ? L(lang, ". Состав: ", ". Құрамы: ", ". Ingredients: ") + rest : "");
              return L(lang, "Вес блюда «" + r.it.name + "» в меню не указан — его назовёт менеджер при подтверждении заказа.", "«" + r.it.name + "» салмағы мәзірде көрсетілмеген — менеджер тапсырысты растағанда айтады.", "The weight of «" + r.it.name + "» isn't listed — the manager will tell you when confirming the order.");
            }
            return desc ? r.it.name + ": " + desc : L(lang, "Состав блюда «" + r.it.name + "» в меню не расписан — его уточнит менеджер при подтверждении заказа.", "«" + r.it.name + "» құрамы мәзірде жазылмаған — менеджер тапсырысты растағанда айтады.", "The ingredients of «" + r.it.name + "» aren't listed — the manager will tell you when confirming.");
          }).join("\n"));
          R.card(card(ds[0], lang));
        } else if (ds.length === 1 && !byIng) {
          var one = ds[0];
          if (one.it.stopped || one.it.teaser) {
            R.say(one.it.teaser ? L(lang, "«" + one.it.name + "» — скоро появится. Следите за меню!", one.it.name + " — жақында шығады.", one.it.name + " is coming soon.") : L(lang, "«" + one.it.name + "» на сегодня разобрали — быстрее нас. Вот что может зайти вместо:", one.it.name + " бүгін таусылды. Орнына мыналар:", one.it.name + " is sold out today. Maybe one of these instead:"));
            pickPopular(live.filter(function (r) { return r.catKey === one.catKey && r !== one; }), 3).forEach(function (r) { R.card(card(r, lang)); });
          } else {
            R.say(dishLine(one, lang, multi, false) + L(lang, pick("dl", ["", ". Хороший выбор.", ". Одобряю."]), "", ""));
            R.card(card(one, lang));
            if (S && one.current) R.act(chip(L(lang, "Заказать", "Тапсырыс беру", "Order it"), L(lang, "хочу заказать ", "тапсырыс беремін ", "I want to order ") + one.it.name));
          }
        } else {
          R.say(byIng ? L(lang, pick("ing", ["По составу подходят — листайте:", "Вот что есть с этим:"]), "Құрамы бойынша табылғаны:", "Here's what has that:") : L(lang, pick("fnd", ["Нашёл — листайте:", "Вот что есть:", "Смотрите:"]), "Табылғаны:", "Here's what I found:"));
          ds.slice(0, 6).forEach(function (r) { R.card(card(r, lang)); });
        }
        st.lastDishIds = ds.map(function (r) { return r.it.id; });
        used.push("dish");
      } else if (cat) {
        var items = cat.items.filter(function (r) { return !r.it.stopped && !r.it.teaser && (!ctx.branch || r.branches.indexOf(ctx.branch) >= 0 || !r.current && !idx.some(function (x) { return x.current; })); });
        if (!items.length) items = cat.items.filter(function (r) { return !r.it.stopped && !r.it.teaser; });
        if (!idx.length) R.say(L(lang, "Выберите, пожалуйста, филиал — тогда покажу точное меню и цены.", "Мәзірді көру үшін алдымен филиалды таңдаңыз.", "Pick a branch first and I'll show the exact menu and prices."));
        else if (!items.length) R.say(L(lang, "Этого сейчас нет в меню или закончилось — могу подсказать другое.", "Бұл қазір мәзірде жоқ немесе таусылды.", "That's not on the menu right now or it's sold out."));
        else {
          if (has("cheap")) items.sort(function (a, b) { return a.it.price - b.it.price; });
          var nm = cat.name || "";
          R.say(L(lang, pick("cat", ["Из раздела «" + nm + "» — листайте:", "«" + nm + "» — вот что есть:", "В разделе «" + nm + "»:"]), "«" + nm + "»:", "From «" + nm + "»:") + (items.length > 6 ? L(lang, " (и ещё " + (items.length - 6) + " в меню)", " (мәзірде тағы " + (items.length - 6) + ")", " (+" + (items.length - 6) + " more on the menu)") : ""));
          items.slice(0, 6).forEach(function (r) { R.card(card(r, lang)); });
          if (cat.key === "десерт" && /торт|cake/.test(U.norm) && !has("cakes")) R.say(t("cakes", lang));
          st.lastDishIds = items.slice(0, 6).map(function (r) { return r.it.id; });
          if (S && hasWant(tokens)) R.act(askOrder(lang));
        }
        R.act(act("menu", lang)); used.push("category");
      } else if (menuAsked && !used.length) {
        if (!live.length) { R.say(L(lang, "Сначала выберите филиал — тогда подскажу точные блюда и цены.", "Алдымен филиалды таңдаңыз.", "Pick a branch first and I'll show exact dishes and prices.")); R.act(act("menu", lang)); }
        else if (has("spicy")) {
          var sp = live.filter(function (r) { return /остр|ащы|чили|халапень|spicy/i.test(r.it.name + " " + (r.it.desc || "") + " " + (r.it.badge || "")); });
          if (sp.length) { R.say(L(lang, "Из острого — для смелых:", "Ащы тағамдар:", "Spicy ones — for the brave:")); sp.slice(0, 6).forEach(function (r) { R.card(card(r, lang)); }); }
          else R.say(L(lang, "Блюд с пометкой «острое» в меню не нашёл. Могу показать всё меню.", "Ащы деп белгіленген тағам таппадым.", "No dishes are marked spicy on the menu."));
        } else if (has("veg")) {
          var meat = /говяд|куриц|курин|кура|свин|бекон|колбас|мяс|фарш|ветчин|пепперони|салями|креветк|рыб|лосос|тунец|угор|краб|индейк|баран|конин|казы|утк|сосиск|ет\b/i;
          var vg = live.filter(function (r) { var s = r.it.name + " " + (r.it.desc || ""); return (r.it.desc || "").trim() && !meat.test(s) && DRINK_CATS.indexOf(r.catKey) < 0; });
          if (vg.length) { R.say(L(lang, "Судя по составу в меню, без мяса (если важно строго — скажите менеджеру при подтверждении заказа):", "Мәзірдегі құрамы бойынша етсіз:", "Judging by the menu, meat-free (if it's strict, tell the manager when confirming):")); vg.slice(0, 6).forEach(function (r) { R.card(card(r, lang)); }); }
          else R.say(L(lang, "По составу в меню точно сказать не могу — скажите о пожеланиях менеджеру при подтверждении заказа.", "Құрамы бойынша етсіз тағамды нақты айта алмаймын.", "I can't tell for sure from the menu — mention it to the manager when confirming."));
        } else if (has("cheap")) {
          var ch = live.filter(function (r) { return DRINK_CATS.indexOf(r.catKey) < 0 && r.catKey !== "гарнир"; }).sort(function (a, b) { return a.it.price - b.it.price; });
          R.say(L(lang, "Самое доступное — вкусно и без боли для кошелька:", "Ең қолжетімділері:", "The most affordable — tasty and easy on the wallet:"));
          ch.slice(0, 4).forEach(function (r) { R.card(card(r, lang)); });
        } else if (has("recommend")) {
          var hits = pickPopular(live.slice().sort(function () { return Math.random() - 0.5; }), 4);
          R.say(L(lang, pick("rec", ["Гости часто берут:", "Советую — проверено гостями:", "Из любимого у гостей:"]), "Көп алатындары:", "Guests love these:"));
          hits.forEach(function (r) { R.card(card(r, lang)); });
          st.lastDishIds = hits.map(function (r) { return r.it.id; });
        } else if (has("price") && !has("menu")) {
          R.say(L(lang, pick("prc", ["Подскажу цену — напишите название блюда или выберите раздел:", "Цену чего подсказать? Например:"]), "Қай тағамның бағасы керек? Атауын жазыңыз:", "Price of what? Type the dish or pick a section:"));
          topCats(idx, lang).forEach(function (c) { R.act(c); });
        } else if (has("alcohol")) { R.say(t("alcohol", lang)); R.act(act("menu", lang)); }
        else {
          var cats = []; idx.forEach(function (r) { if (cats.indexOf(r.cat) < 0) cats.push(r.cat); });
          R.say(L(lang, pick("mn", ["В меню у нас: ", "Есть разделы: ", "Смотрите, что есть: "]), "Мәзірде: ", "On the menu: ") + cats.slice(0, 14).join(", ") + L(lang, ". Что показать?", ". Қайсысын көрсетейін?", ". What should I show you?"));
          topCats(idx, lang).forEach(function (c) { R.act(c); });
          R.act(act("menu", lang));
        }
        used.push("menu");
      }
      if (has("price") && !dishes.length && !cat && !used.length && st.lastDishIds && st.lastDishIds.length) {
        var prev = idx.filter(function (r) { return st.lastDishIds.indexOf(r.it.id) >= 0; });
        if (prev.length) { R.say(prev.slice(0, 4).map(function (r) { return dishLine(r, lang, multi, false); }).join("\n")); used.push("dish"); }
      }

      // ── болтовня и всё остальное ──
      if (!R.parts.length) {
        var sim = similarItems(U.dishTokens.concat(U.alt), idx, ctx.branch);
        if (sim.length && !has("alcohol")) { R.say(L(lang, pick("sim", ["Такого в меню нет, но вот что может зайти:", "Этого у нас нет. Зато есть похожее:"]), "Бұл мәзірде жоқ, бірақ ұқсасы бар:", "We don't have that, but these might hit the spot:")); sim.forEach(function (r) { R.card(card(r, lang)); }); used.push("similar"); }
        else if (has("thanks")) { R.say(t("thanks", lang)); used.push("thanks"); }
        else if (has("bye")) { R.say(t("bye", lang)); used.push("bye"); }
        else if (has("timeNow", 1)) { R.say(L(lang, "В Уральске сейчас " + hm(uralskMinutes(ctx.now)) + ". Самое время что-нибудь съесть.", "Оралда қазір " + hm(uralskMinutes(ctx.now)) + ". Бірдеңе жейтін уақыт.", "It's " + hm(uralskMinutes(ctx.now)) + " in Uralsk. Perfect time for a snack.")); used.push("timeNow"); }
        else if (has("dateNow", 1)) { var u0 = ural(ctx.now); R.say(L(lang, "Сегодня ", "Бүгін ", "Today is ") + dateLong(u0.getUTCFullYear(), u0.getUTCMonth(), u0.getUTCDate(), lang) + L(lang, ". Отличный день, чтобы заказать пиццу.", ".", ". A great day for pizza.")); used.push("dateNow"); }
        else if (has("weather")) { R.say(t("weather", lang)); used.push("weather"); }
        else if (has("joke")) { R.say(t("joke", lang)); used.push("joke"); }
        else if (has("age", 1)) { R.say(t("age", lang)); used.push("age"); }
        else if (has("botName", 1)) { R.say(t("botName", lang)); used.push("botName"); }
        else if (has("bot")) { R.say(t("bot", lang)); used.push("bot"); }
        else if (has("sad")) { R.say(t("sad", lang)); R.act(chip(L(lang, "Десерты", "Десерттер", "Desserts"), L(lang, "десерты", "десерттер", "desserts"))); used.push("sad"); }
        else if (has("compliment") && !rude) { R.say(t("compliment", lang)); used.push("compliment"); }
        else if (has("flirt")) { R.say(t("flirt", lang)); topCats(idx, lang).slice(0, 3).forEach(function (c) { R.act(c); }); used.push("flirt"); }
        else if (has("smalltalk")) { R.say(t("smalltalk", lang)); used.push("smalltalk"); }
        else if (has("greet")) { R.say(t("greet", lang)); used.push("greet"); }
        else if (branch) { R.say(branchCard(branch, lang)); used.push("address"); }
        else if (has("ok") || has("yes") || has("no")) { R.say(t("ok", lang)); used.push("ok"); }
      }
      if (!R.parts.length) {
        if (rude) { R.say(t("rudeOnly", lang)); clarifyChips(lang).slice(0, 3).forEach(function (c) { R.act(c); }); used.push("rude"); return; }
        var short = tokens.length <= 3 && tokens.join("").length < 9 && !tokens.some(function (w) { return w.length >= 5; });
        if (short) { R.say(t("clarify", lang)); used.push("clarify"); }
        else { R.say(t("unknown", lang)); used.push("unknown"); }
        clarifyChips(lang).forEach(function (c) { R.act(c); });
        return;
      }
      if (rude) R.parts[0] = t("rude", lang) + R.parts[0];
    }
  }

  // карточка из меню блюда → сразу к делу
  function fromDish(id, ctx) {
    ctx = ctx || {};
    var st = ctx.state || (ctx.state = {}), lang = st.lang || "ru", R = new Resp(lang);
    var idx = menuIndex(ctx.menus || {}, ctx.branch), r = null;
    for (var i = 0; i < idx.length; i++) if (String(idx[i].it.id) === String(id) && idx[i].current) { r = idx[i]; break; }
    if (!r) for (var j = 0; j < idx.length; j++) if (String(idx[j].it.id) === String(id)) { r = idx[j]; break; }
    if (!r) { R.say(t("clarify", lang)); clarifyChips(lang).forEach(function (c) { R.act(c); }); return { text: R.parts.join("\n\n"), acts: R.acts, cards: [], intent: "dish", lang: lang, known: true }; }
    R.card(card(r, lang));
    if (r.it.stopped || r.it.teaser) {
      R.say(L(lang, "«" + r.it.name + "» сейчас недоступно. Но вот что может зайти:", "«" + r.it.name + "» қазір жоқ. Бірақ мыналар бар:", "«" + r.it.name + "» isn't available right now. How about these:"));
      pickPopular(liveOnly(idx).filter(function (x) { return x.catKey === r.catKey && x !== r; }), 3).forEach(function (x) { R.card(card(x, lang)); });
    } else {
      R.say(L(lang, pick("fd", ["«" + r.it.name + "» — выбор человека со вкусом. Оформим доставку?", "«" + r.it.name + "» — одобряю. Везём к вам или заберёте сами?"]), "«" + r.it.name + "» — тамаша таңдау. Жеткізуге рәсімдейміз бе?", "«" + r.it.name + "» — great choice. Shall we order delivery?"));
      st.offer = { items: [{ name: r.it.name, qty: 1 }], ts: Date.now() };
      R.act(chip(L(lang, "Доставка", "Жеткізу", "Delivery"), L(lang, "доставка", "жеткізу", "delivery"))).act(chip(L(lang, "Самовывоз", "Өзім алып кетемін", "Pickup"), L(lang, "самовывоз", "өзім алып кетемін", "pickup")))
        .act(chip(L(lang, "Состав", "Құрамы", "Ingredients"), L(lang, "состав ", "құрамы ", "ingredients of ") + r.it.name)).act(askBook(lang));
    }
    return { text: R.parts.join("\n\n"), acts: R.acts, cards: R.cards, intent: "dish", lang: lang, known: true };
  }
  // после отправки заказа/брони (сайт отправил через WhatsApp)
  function afterSend(kind, info, ctx) {
    ctx = ctx || {};
    var st = ctx.state || (ctx.state = {}), lang = st.lang || "ru";
    var fin = st.flow && st.flow.d && st.flow.d.final;
    info = info || {};
    if (!info.when && fin && kind === "book") info.when = L(lang, pad(fin.d) + "." + pad(fin.m + 1) + " в " + pad(fin.h) + ":" + pad(fin.mi), pad(fin.d) + "." + pad(fin.m + 1) + ", сағат " + pad(fin.h) + ":" + pad(fin.mi), "on " + pad(fin.d) + "." + pad(fin.m + 1) + " at " + pad(fin.h) + ":" + pad(fin.mi));
    st.flow = null; st.offer = null;
    if (kind === "order") return { text: L(lang, "Заказ " + info.num + " улетел! Отправьте сообщение в открывшемся WhatsApp — менеджер подтвердит детали и оплату. Приятного аппетита заранее.", info.num + " тапсырысы жіберілді! Ашылған WhatsApp-та хабарламаны жіберіңіз — менеджер растайды. Ас болсын!", "Order " + info.num + " is on its way to the manager! Send the message in the WhatsApp window that opened — they'll confirm details and payment."), acts: [{ a: "retrywa", label: L(lang, "Открыть WhatsApp ещё раз", "WhatsApp-ты қайта ашу", "Open WhatsApp again") }], cards: [], intent: "orderSent", lang: lang, known: true };
    return { text: L(lang, "Заявка на бронь готова! Отправьте сообщение в открывшемся WhatsApp — менеджер подтвердит. Ждём вас " + info.when + ".", "Брондау өтінімі дайын! Ашылған WhatsApp-та хабарламаны жіберіңіз — менеджер растайды. Сізді " + info.when + " күтеміз.", "Your booking request is ready! Send the message in the WhatsApp window that opened — the manager will confirm. See you " + info.when + "."), acts: [{ a: "retrybook", label: L(lang, "Открыть WhatsApp ещё раз", "WhatsApp-ты қайта ашу", "Open WhatsApp again") }], cards: [], intent: "bookSent", lang: lang, known: true };
  }

  (function initDict() {
    // словарь приводим к тому же виду, что и текст гостя (ь/ъ, казахские буквы)
    var id0, c0, b0;
    for (id0 in INTENTS) normList(INTENTS[id0]);
    for (c0 in CAT_ALIASES) normList(CAT_ALIASES[c0]);
    for (b0 in BRANCH_KEYS) normList(BRANCH_KEYS[b0]);
    normList(RUDE);
    function addWord(w) { if (w && w.length >= 3) KNOWN[w] = 1; }
    function addStem(k) { k.split(" ").forEach(function (p) { if (p.charAt(0) !== "=" && p.length >= 4 && STEMS.indexOf(p) < 0) STEMS.push(p); }); }
    for (var id in INTENTS) INTENTS[id].forEach(function (k) { addStem(k); k.split(" ").forEach(function (p) { addWord(p.charAt(0) === "=" ? p.slice(1) : null); }); });
    for (var c in CAT_ALIASES) CAT_ALIASES[c].forEach(addStem);
    for (var b in BRANCH_KEYS) BRANCH_KEYS[b].forEach(addStem);
    BLOCK.forEach(addWord);
  })();

  var api = { reply: reply, fromDish: fromDish, afterSend: afterSend, parseCustom: parseCustom, FACTS: FACTS, _intents: function (x) { return scoreIntents(toks(baseNorm(x))); }, _parse: { phone: parsePhone, name: parseName, address: parseAddress, date: parseDate, time: parseTime, guests: parseGuests } };
  root.SevenLocalAI = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
