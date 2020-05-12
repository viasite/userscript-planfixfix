Удобнее всего отлаживать скрипт во внешнем редакторе:

1. Добавить расширению права на открытие файловых ссылок (галочка в настройках расширения)
2. Удалить в расширении весь код, кроме заголовков расширения
3. Добавить в заголовки:
``` js
// @require        file:///C:/projects/js/userscript-planfixfix/planfixfix.user.js
```

Скрипт разделён на файлы. Для разработки нужно подключать файлы через `@require` по алфавиту.

Скрипт сборки просто склеит их по алфавиту.

Чтобы обращаться к глобалам, надо их прокидывать через win.
Начало любого отделённого файла, как правило, будет таким:
``` js
win = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
var $ = win.$;
```

Главный файл должен идти первым, иначе будет ошибка.
С другой стороны, когда он первый, init() срабатывает до подключения остальных файлов.
Поэтому в init() сделана задержка.

В основной window экспортируется один объект PFF.
Все внутрненние файлы подключаются к нему как поля объекта в init().

Обновляйте этот девелоперский кусок кода:
``` js
// ==UserScript==
// @name           PlanfixFix
// @unwrap
// @noframes
// @run-at         document-end
// @include        https://tagilcity.planfix.ru/*
// @match          https://tagilcity.planfix.ru/*
// @grant          GM_xmlhttpRequest
// @require        file:///C:/projects/js/userscript-planfixfix/src/_planfixfix.js
// @require        file:///C:/projects/js/userscript-planfixfix/src/analitics.js
// @require        file:///C:/projects/js/userscript-planfixfix/src/fuse.basic.min.js
// @require        file:///C:/projects/js/userscript-planfixfix/src/jsyaml.js
// @require        file:///C:/projects/js/userscript-planfixfix/src/smeta.js
// @require        file:///C:/projects/js/userscript-planfixfix/src/tmpls.js
// @require        file:///C:/projects/js/userscript-planfixfix/src/vue.min.js
// ==/UserScript==
```

Тест сборки:
``` js
// ==UserScript==
// @name           PlanfixFix
// @unwrap
// @noframes
// @run-at         document-end
// @include        https://tagilcity.planfix.ru/*
// @match          https://tagilcity.planfix.ru/*
// @grant          GM_xmlhttpRequest
// @require        file:///C:/projects/js/userscript-planfixfix/dist/planfixfix.user.js
// ==/UserScript==
```