/**
 * @param {Object} window.unsafeWindow window
 * @param {Object} win.Current текущий пользователь
 * @param {string} win.Current.logined id пользователя
 * @param {string} win.Current.loginedName имя фамилия
 * @param {string} win.Current.loginedPost должность
 * @param {function} win.show_sys_message всплывалка вверху
 * @param {Object} $ jQuery
 */
let $; // заглушает ошибки в определении $ в модулях
(function() {
  'use strict';
  let win = typeof window.unsafeWindow != 'undefined' ? window.unsafeWindow : window;
  let $ = win.$;

  win.onerror = function(error, file, line) {
    console.log(error + ' (line ' + line + ')');
  };

  if (win.top !== win.self) {
    return false; // ignore iframes
  }

  if (location.hostname !== 'tagilcity.planfix.ru') {
    return;
  }

  const PFF = {
    isDebug: false,
    deferred: false,
    adminIds: [ 9230 ], // тестовые пользователи
    managerPosts: [
      'Руководитель отдела сопровождения заказов',
      'Менеджер по сопровождению заказов',
      'Менеджер по продажам',
      'Руководитель отдела продаж',
      'Коммерческий директор',
      'Директор'
    ],
    sendUserInfoTo: false,
    sendUserInfoInterval: 10, // sec

    debug() {
      if (PFF.isDebug) console.log(...arguments);
    },

    isAdmin() {
      return PFF.adminIds.includes(parseInt(win.Current.logined));
    },

    isManager() {
      return PFF.managerPosts.includes(win.Current.loginedPost);
    },

    fields: {
      vyrabotka: {
        name: '[data-fid="741"] select',
        count: '[data-fid="747"] input',
        comment: '[data-fid="749"] textarea',
        hours_per_count: '.analitic-data[data-fid="741:h915"]',
      },
      realization: {
        analiticName: 'Реализация',
        count: '[data-fid="990"] input',
        price: '[data-fid="994"] input',
        date: '[data-fid="996"] input',
      },
      smeta: {
        aid: 314, // смета на разработку
        reportId: 5469, // id отчёта на смету
        reportTableId: 5467, // id отчёта на смету теблицей
        orderByFids: [950, 1093], // тип работ, №
        name: '[data-fid="934"]',
        price: '[data-fid="934:h1016"]',
        customPrice: '[data-fid="1089"]',
        discont: '[data-fid="942"]',
        block: 'div[data-fid="950"]' // div обязателен
      }
    },
    // Шаблоны
    tmplsRecord: {
      handbook: 146, // id справочника
      name: 960, // id названия
      text: 962, // id текста
    },

    analitics_remote_default: {
      url: 'https://dev.viasite.ru/planfix_analitics.txt',
      format: 'text',
    },
    templates_remote_default: {
      url: '',
      format: 'yml',
    },
    analitics_remote_cache_lifetime: 3600,
    templates_remote_cache_lifetime: 300,

    analitics_default: [
      ['Поиск глюка', 'Поиск места'],
      ['Тесты', 'Тестирование'],
      [
        'Правки, тесты, отчет',
        [
          {
            name: 'Поиск места проблемы, (в т.ч. по алгоритму поиска)',
            count: 1,
          },
          'Обработка простая на вводе или выводе',
          'Тестирование',
          'Замена / вставка любого контента',
          {
            name: 'Создание пояснительной записки по внесенным изменениям',
            count: 1,
          },
        ],
      ],
      ['Задание', 'Задание'],
      ['Консультация', 'с коллегой'],
      ['Записка', 'Создание пояснительной записки'],
    ],
    templates_default: {
      Стандартное: {
        'Уточнение глюка': `URL, скрин, описание`,
        'Запрос доступов': `
          %name%, чтобы начать работы нам нужны:
          
          1. Доступ к панели управления хостинга
          2. Логин и пароль от админки сайта`,
      },
      Предложения: {
        'После аудита': `
          %name%, здравствуйте.
          
          Как и договорились с вами ранее, отправляем предложение по результатам проведенных технического и seo- аудитов.
          Содержимое расчета:
          `,
      },
    },

    _analitics: [],

    init: function() {
      if(!PFF.isDebug && localStorage.pff_debug){
        PFF.isDebug = true;
        console.log('debug set from localStorage');
      }

      // init once
      const body = $('body');
      if (body.hasClass('pff_inited')) return false;
      body.addClass('pff_inited');

      // не пугаем планфикс своими ошибками
      win.onerror = function() {
        return true;
      };

      // подключение модулей из файлов
      PFF.analitics = pffAnalitics;
      PFF.smeta = pffSmeta;
      PFF.tmpls = pffTmpls;

      // очередь аналитик
      PFF.resetDeferred();

      PFF.pfAlter();

      PFF.addStyles();

      // отправка инфы о юзере, для Стаса и Оли
      if (PFF.isAdmin() || [7419, 24242].includes(win.Current.logined)){
        PFF.sendUserInfoTo = 'https://planfix.viasite.ru/planfix-user-info.php';
      }
      PFF.initUserInfoSender();

      if (localStorage.pff_no_spoilers === '1') {
        body.addClass('pff-no-spoilers');
      }

      if (localStorage.pff_avatars_always === '1') {
        body.addClass('pff-avatars-always');
      }

      // копировать html ссылку
      /* if (PFF.isAdmin()){
        PFF.waitFor('.js-task-title').then(taskTitle => {
          // ul.baron_container больше нет
          PFF.waitFor('ul.baron_container').then(() => {
            const menu = taskTitle.parents('.b-green-block').find('ul.baron_container').first();
            menu.find('[data-acr="copyWithLink"]').after($('<li class="b-ddl-menu-li-action b-ddl-menu-li-item b-ddl-menu-li-group-0" data-isaction="1" data-group="0"><span></span><span>Копировать html ссылку</span></li>').
            on('click', () => {
              const taskName = taskTitle.text();
              const link = $('[data-id="18"] a').attr('href');
              const html = `<a href="${link}">${taskName}</a>`;
              // console.log(html);
              PFF.copyFormatted(html);
            }));
          });
        });
      } */

      // тестовое открытие нового действия
      if (PFF.isDebug) {
        console.log('debug: init');
        setTimeout(() => {
          win.onbeforeunload = undefined; // отменить предупреждение о закрытии окна
          //console.log('debug: new action');
          // $('.actions-quick-add-block-text').trigger('click'); // создание действия
          //console.log('debug: edit-draft-action');
          //$('.edit-draft-action').trigger('click'); // edit
          //PFF.analitics.addAnalitics({ name: 'Поминутная работа программиста' });
        }, 2000);
      }
    },

    initUserInfoSender() {
      if (!PFF.sendUserInfoInterval || !PFF.sendUserInfoTo) return;
      // setTimeout(PFF.sendUserInfo, 5000);
      setInterval(PFF.sendUserInfo, 5000);
    },

    sendUserInfo() {
      const randomDelay = Math.floor(Math.random() * 1000);
      setTimeout(() => {
        const user = win.Current.logined;
        const count = win.PlanfixPage.newCount;
        const lastSent = localStorage.pff_tasksCountLastSent || 0;
        const lastCount = localStorage.pff_tasksCountLastCount || 0;
        const sentAgo = Date.now() - lastSent;

        // отправляем не чаще, чем раз в 10 сек, если изменилось
        if (sentAgo < PFF.sendUserInfoInterval * 1000) {
          // console.log('sentAgo: ', sentAgo);
          return;
        }

        // отправляем минимум раз в 10 минут отправляем, даже если не поменялось
        if (lastCount == count && sentAgo < 600 * 1000) {
          // console.log('unreaded no change: ', count);
          // console.log('sentAgo: ', sentAgo);
          return;
        }

        // const time = new Date().toTimeString().split(' ')[0];
        // console.log(`${time}: ${count}`);

        localStorage.pff_tasksCountLastSent = Date.now();
        localStorage.pff_tasksCountLastCount = count;

        const url = `${PFF.sendUserInfoTo}?user=${user}&unreaded=${count}`;
        console.log('url: ', url);

        GM_xmlhttpRequest({
          method: "GET",
          url: url,
        });
      }, randomDelay);
    },

    // добавляет быстрые действия в блок действия
    addActions: function() {
      PFF.analitics.addActions();
      PFF.smeta.addActions();
      PFF.tmpls.addActions();

      PFF.editorSelectionWatch(win.CKEDITOR.instances.ActionDescription);
    },

    /**
     * Переопределяет стили
     */
    addStyles: function() {
      $('body').append(
          `<style>
.task-add-block.only-selection { visibility: hidden; }
.pff_editor-selection .only-selection { visibility: visible; }

/* select fix */
/*.task-custom-field-val { display: inline !important; }*/
.chzn-container .chzn-results{ max-height:400px !important; }
/* .chzn-drop{ width:850px !important; border-style:solid !important; border-width:1px !important; } */
.silentChosen .chzn-container .chzn-results{ max-height:1px !important; }
.silentChosen .chzn-drop{ width:1px !important; }

/* text templates */
.pff-tmpls { line-height: 1.5rem; /* margin-left: 100px; max-width: 200px; */ }
.pff-tmpls-title { font-weight: bold; cursor: pointer; }
.pff-action-tmpls { margin: 5px 0; }
.pff-action-tmpls .pff-tmpls-content { display: none; }
.pff-action-tmpls_expanded .pff-tmpls-content { display: block; }
.pff-action-tmpls .search-field-block { margin: 5px 0; max-width: 300px; }
/*.pff-tmpls:hover { max-width: none; margin-left: 0; }
.pff-tmpls:hover .pff-tmpls-content { display: block; }*/
.pff-cat { margin-bottom: 15px; }
.pff-cat-title { padding-top: 2px; /* border-bottom: 3px solid transparent; */ }
.pff-cat:hover { background: #f6f6f6; }
/*.pff-cat:hover .pff-cat-title { border-bottom-color: #3ba3d0; }*/
.pff-cat-content { margin-left: 0; }
.pff-cat a { display: block; padding: 2px 15px; }

/* отчёт со сметой во вспл. окне */
.pff-report-frame-wrapper .g-popup-win-scroll-content { width: calc(100% - 40px); min-width: 665px; }
.pff-report-frame-wrapper .g-popup-win-scroll-content-main { display: block; max-width: none; padding-bottom: 0; }
.pff-report-frame-wrapper iframe { border: none; }
/*.pff-report-frame { min-width: 900px; }*/

/* вспл. окно вставки шаблона */
.pff-tmpl-form input[type="text"] { width: 200px !important; }
.pff-tmpls-you-change_active { font-weight:bold; }
.pff-tmpls-you-change { padding: 5px 10px; }
.pff-tmpl-form .btn-main { margin-left: 0; }
.pff-tmpl-form .btn-create { float: right; }
.pff-tmpl-preview { width: 360px; margin: 30px 0; }

/* убирание спойлеров у комментов и описаний задач */
.pff-no-spoilers .action-spoiler,
.pff-no-spoilers .task-description-spoiler-text { overflow: visible !important; }
.pff-no-spoilers .task-description-spoiler-text .vanisher { display: none; }
.pff-no-spoilers .spoiler-actionlist.inited,
.pff-no-spoilers .task-description-spoiler,
.pff-no-spoilers .task-description-hide-block { display: none; }
.pff-no-spoilers .b-description-text-shown { max-height: none !important; }

/* связанные задачи */
.task-card-data-custom-78 .js-custom-filed-value-task-link { display: block !important; }

/* современный интерфейс: показать аватарки */
.pff-avatars-always .table-actions-v2 .actions-item-v2-normal .actions-item-v2-normal-meta .actions-item-v2-normal-meta-notified { visibility: visible; }
.pff-avatars-always .task-as-a-chat .table-actions-v2 .actions-item-v2-normal .actions-item-v2-normal-meta { display: block; }
</style>`,
      );
    },

    pfAlter: function() {
      /**
       *
       * @param win.ActionListJS код списка действий
       * @param win.AnaliticsWinJS редактор аналитик
       */
      // save original functions
      win.ActionListJS.prototype.createAction_orig = win.ActionListJS.prototype.createAction;
      //win.ActionJS.prototype.createNewAction_orig = win.ActionJS.prototype.createNewAction;
      /**
       * @param win.ActionJS
       */
      win.ActionJS.prototype.editDraft_orig = win.ActionJS.prototype.editDraft;
      win.ActionJS.prototype.edit_orig = win.ActionJS.prototype.edit;
      //win.ActionJS.restoreAnaliticsForEdit_orig = win.ActionJS.restoreAnaliticsForEdit;
      win.AnaliticsWinJS.prototype.show_orig = win.AnaliticsWinJS.prototype.show;
      // win.ActionV3TS.processActionCancelOrSave_orig = win.ActionV3TS.processActionCancelOrSave;

      win.PlanfixPage.drawTask_orig = PlanfixPage.drawTask;

      // TODO:
     /* win.PlanfixPage.drawTask = function(task) {
        console.log('drawTask');

        setTimeout(() => {
          PFF.fixTaskSummary();
        }, 500);

        return win.PlanfixPage.drawTask_orig(task);;
      } */

      // decorate original functions
      win.ActionListJS.prototype.createAction = function() {
        return this.createAction_orig().then(function() {
          PFF.debug('after createAction');
          PFF.addActions();
        });
      };
      /*win.ActionJS.prototype.createNewAction = function() {
        this.createNewAction_orig();
        PFF.debug('after createNewAction');
        setTimeout(PFF.addActions, 2000);
      };*/
      win.ActionJS.prototype.editDraft = function(
          draftid, task, insertBefore, actionList) {
        this.editDraft_orig(draftid, task, insertBefore, actionList);
        PFF.debug('after editDraft');
        setTimeout(PFF.addActions, 1000);
      };
      win.ActionJS.prototype.edit = function(id, task, data, actionNode) {
        this.edit_orig(id, task, data, actionNode);
        setTimeout(PFF.addActions, 1000);
      };
      /*win.ActionJS.restoreAnaliticsForEdit = function(data){
        win.ActionJS.restoreAnaliticsForEdit_orig(data);
        setTimeout(PFF.analitics.countTotalAnalitics, 2000);
      };*/

      // чат, новые события не переопределяются
      /* win.ActionV3TS.processActionCancelOrSave = function(hide, deleteDraft) {
        console.log('alter chat action');
        win.ActionV3TS.processActionCancelOrSave_orig(hide, deleteDraft);
      } */

      // редактор аналитик
      win.AnaliticsWinJS.prototype.show = function(options) {
        this.show_orig(options);
        PFF.smeta.addAnaliticActions();
      };

      // menuitem
      /**
       *
       * @param win.MainMenuJS главное меню
       */
      win.MainMenuJS.showConfig_orig = win.MainMenuJS.showConfig;
      win.MainMenuJS.showConfig = function(show) {
        win.MainMenuJS.showConfig_orig(show);
        PFF.addMenu();
      };

      /*$('body').delegate(PFF.fields.vyrabotka.count, 'change keypress', PFF.analitics.countTotalAnalitics);
      $('body').delegate(PFF.fields.vyrabotka.name, 'change', function(){
      var hours_field = $(this).parents('.add-analitic-block').find(PFF.fields.vyrabotka.hours_per_count);
      hours_field.attr('title', (hours_field.val().replace(',', '.')*60).toFixed(1));
      });*/

      /*$('body').delegate('.attach-new-analitic td.td-item-add-ex:first span.fakelink-dashed', 'click', function(e){
        PFF.analitics.addAnalitics([{}]);
      });*/

      // спасение кнопки toggl при обновлении шапки, спасает не всегда
      // TODO: это иногда вызывает зависание при попытке вставки записи справочника в коммент
      /* win.PanelLayoutJS.prototype.setBlockPath_orig = PanelLayoutJS.prototype.setBlockPath;
      win.PanelLayoutJS.prototype.setBlockPath = function(container, html) {
        const togglButton = $('.b-toggl-btn');
        if (togglButton.length > 0) togglButton.appendTo('body');

        const $block = this.setBlockPath_orig(container, html);

        if (togglButton.length > 0) console.log('save toggl!');

        if (togglButton.length > 0) togglButton.appendTo('.toggl');

        return $block;
      }; */

    },

    copyFormatted (html) {
      const a = $(html);
      const wrap = $('<div style="opacity:0;"></div>').appendTo('.taskview-actions');
      a.appendTo(wrap);
      const link = a.get(0);
      const range = document.createRange();
      range.selectNode(link);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      wrap.remove();
    },

    // добавляет класс блоку действия, когда выделен текст
    editorSelectionWatch(editor) {
      // https://stackoverflow.com/questions/27348572/enable-ckeditor-toolbar-button-only-with-valid-text-selection
      function refresh() {
        /**
         * @param editor.editable
         * @param editor.getDocument
         * @param win.CKEDITOR.tools.eventsBuffer
         */
        const editable = editor.editable();
        if (!editable) return;

        const range = editable.getDocument().getSelection().getRanges()[0];
        const isSelection = range && !range.collapsed;

        const selClass = 'pff_editor-selection';
        const actionBlock = $('.b-add-action');
        if(isSelection) actionBlock.addClass(selClass);
        else actionBlock.removeClass(selClass);
      }

      const throttledFunction = win.CKEDITOR.tools.eventsBuffer(250, refresh);
      editor.on('selectionCheck', throttledFunction.input);
    },

    // get selection html from ckeditor
    editorGetSelection() {
      /**
       * @param win.CKEDITOR.instances.ActionDescription
       * @param {function} win.CKEDITOR.dom.element
       * @param {function} sel.getRanges
       * @param {function} el.getHtml
       */
      const editor = win.CKEDITOR.instances.ActionDescription;
      const sel = editor.getSelection();
      const ranges = sel.getRanges();
      const Element = win.CKEDITOR.dom.element;
      const el = new Element('div');
      for (let i = 0, len = ranges.length; i < len; ++i) {
        el.append(ranges[i].cloneContents());
      }
      return el.getHtml();
    },

    editorInsertHtml(html) {
      /**
       * @param {function} editor.insertHtml
       */
      const editor = win.CKEDITOR.instances.ActionDescription;
      editor.insertHtml(html);
    },

    // добавляет действие в редактор аналитик
    addAnaliticAction(name, action, analiticAid) {
      const link = $(
          '<span style="margin-left:1em" class="fakelink-dashed">' + name +
          '</span>',
      ).on('click', action);
      if(analiticAid){
        $(`[data-aid="${analiticAid}"] .af-row-btn-add`).append(link);
      } else {
        $('.af-row-btn-add').append(link);
      }
      return link;
    },

    // ждёт появления элемента и возвращает его через promise
    waitFor(selector, delay = 500, attempts = 10, iframe) {
      return new Promise((resolve, reject) => {
        let i = 0;
        const interval = setInterval(() => {
          i++;
          if (i >= attempts){
            clearInterval(interval);
            return reject(false);
          }

          // console.log(`i: ${i}`);
          let elem;
          if(iframe) {
            elem = iframe.contentWindow.$(selector);
            // console.log('elem:', elem);
            if (elem.length === 0) return false;
          }
          else {
            elem = $(selector);
            if (elem.length === 0) return false;
          }

          // found
          clearInterval(interval);
          resolve(elem);
        }, delay);
      });
    },

    /**
     * Добавляет ссылку на добавление аналитики в панель
     * В ссылку вписывается список аналитик
     * Можно передавать вместо аналитик функцию
     */
    addTaskBlock: function(name, action, opts = {}) {
      opts = {
        ...{
          class: '',
        }, ...opts,
      };

      const isAnalitic = (action) => {
        return Array.isArray(action) ||
        typeof action == 'object' ||
        typeof action == 'string';
      };

      const block = $('<div class="task-add-block"></div>').
          html(name).
          on('click', function() {
            PFF.resetDeferred();
            if (isAnalitic(action)) {
              PFF.analitics.addAnalitics(action);
            } else if (typeof action === 'function') {
              action();
            }
          });

      if(opts.class) block.addClass(opts.class);
      //PFF.debug(block);

      if (isAnalitic(action)) {
        const analitics = $.map(
            PFF.analitics.normalizeAnalitics(action),
            (analitic) => analitic.name,
        );
        block.attr('title', analitics.join('\n'));
      }

      // add first elem, for chat feed
      const elem = $('.task-add-block').last();
      // console.log('elem: ', elem);
      if (elem.length === 0) {
        $('.b-add-action').prepend('<div class="task-add-block">...</div>');
      }

      $('.task-add-block').last().after(block);
      return block;
    },

    /**
     * Прокручивает до селектора, используется функция планфикса
     */
    scrollTo: function(elem) {
      /**
       * @param {Object} win.TaskCardPoolJS
       * @param {Object} win.PlanfixPage
       * @param {string} win.PlanfixPage.task
       * @param {function} win.TaskCardPoolJS.getInstance
       * @param task.scroller.scrollToBlock
       */
      const task = win.TaskCardPoolJS.getInstance(win.PlanfixPage.task);
      task.scroller.scrollToBlock(elem);
    },

    /**
     * Записывает в последнего в очереди чистый deferred,
     * следующий _addAnalitic() исполнится мгновенно
     */
    resetDeferred: function() {
      PFF.deferred = $.Deferred().resolve();
    },

    /**
     * Добавляет пункт меню в главное меню "Еще"
     * Настройки скрипта:
     * - url для удаленной загрузки аналитик
     */
    addMenu: function() {
      // noinspection JSUnresolvedVariable
      $('<a href="javascript:" class="without-dragging main-menu-config-item">PlanfixFix '+GM_info.script.version+'</a>').
          appendTo('.main-config-ddl-wrapper').
          on('click', function() {
            const remoteAnalitics = PFF.analitics.getRemoteAnaliticsUrl();
            const remoteTemplates = PFF.tmpls.getRemoteTemplatesUrl();
            const html =
                '<div class="pff-settings">' +
                '<div style="display:none" class="form">' +
                '<div>URL для обновления аналитик, обязательно https://</div>' +
                '<input style="width:400px" class="text-box" name="pff_analitics_remote_url" value="' +
                remoteAnalitics.url +
                '"/>' +
                //.append('<input type="hidden" name="pff_remote_format" value="text"/>')
                '<br>' +

                '<div>URL для обновления шаблонов писем (yml), обязательно https://</div>' +
                '<input style="width:400px" class="text-box" name="pff_templates_remote_url" value="' +
                remoteTemplates.url +
                '"/>' +
                '<input type="button" value="Сохранить"/><br />' +
                '</div>';

            // noinspection JSValidateTypes
            /**
             * @param win.drawDialog простая всплывалка, не модальная
             */
            const dialog = new win.CommonDialogScrollableJS();
            dialog.closeByEsc = true;
            dialog.draw(html);
            // noinspection JSUnresolvedVariable
            dialog.setHeader(`PlanfixFix ${GM_info.script.version}`);

            const settingsDiv = $('.pff-settings');
            // win.drawDialog(300, 'auto', 300, html);
            settingsDiv.find('[type="button"]').on('click', function() {
              let isSave = PFF.analitics.setRemoteAnaliticsUrl({
                url: $('[name="pff_analitics_remote_url"]').val(),
                format: 'text',
              });
              isSave = isSave && PFF.tmpls.setRemoteTemplatesUrl({
                url: $('[name="pff_templates_remote_url"]').val(),
                format: 'yml',
              });
              if (isSave) {
                $('.dialogWin .destroy-button').trigger('click');
              }
            });

            const isNoSpoilers = localStorage.pff_no_spoilers === '1';
            const cb = $('<input type="checkbox" id="pff_no_spoilers"/>');
            const body = $('body');
            cb.prop('checked', isNoSpoilers);
            cb.on('change', () => {
              setTimeout(() => {
                localStorage.pff_no_spoilers = cb.prop('checked') ? '1' : '0';

                if(cb.prop('checked')) body.addClass('pff-no-spoilers');
                else body.removeClass('pff-no-spoilers');
              }, 50);
            });
            settingsDiv.append(cb).append('<label for="pff_no_spoilers">Показывать комментарии без спойлеров</label>');

            let val = localStorage.pff_avatars_always === '1';
            let checkbox = $('<input type="checkbox" id="pff_avatars_always"/>');
            checkbox.prop('checked', val);
            checkbox.on('change', () => {
              setTimeout(() => {
                localStorage.pff_avatars_always = checkbox.prop('checked') ? '1' : '0';

                if(checkbox.prop('checked')) body.addClass('pff-avatars-always');
                else body.removeClass('pff-avatars-always');
              }, 50);
            });
            settingsDiv.append(checkbox).append('<label for="pff_avatars_always">Всегда показывать аватарки</label>');

            settingsDiv.append('<div style="margin-top:15px"><a class="btn btn-main" href="https://github.com/viasite/userscript-planfixfix/raw/master/dist/planfixfix.user.js">Проверить обновление</a></div>');
            return false;
          });
    },

    fixTaskSummary: function() {
      console.log('fixTaskSummary');
      function getTaskGeneral(taskId) {
        const found = Object.entries(TaskCardPoolJS.poolGeneral.task).
          find(e => e[1].taskid == taskId);
        return found ? found[0] : false;
      }
      
      var general = getTaskGeneral(PlanfixPage.task);
      console.log('general: ', general);
      win.show_sys_message(`Номер задачи: ${general}'`, 'OK', undefined, undefined, {})
      $('.table-actions').append(`<span style="display:none" class="task-summary"><span data-id="18"><a>#${general}</a></span></span>`);
      
    }
  };
  win.PFF = PFF;

  $(function() {
    // без этой задержки файлы не успевают подключаться
    setTimeout(() => {
      console.log('pff init');
      PFF.init();
    }, 10);
  });
})();
