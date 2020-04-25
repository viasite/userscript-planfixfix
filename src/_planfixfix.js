/**
 * @param {Object} window.unsafeWindow window
 * @param {Object} win.Current текущий пользователь
 * @param {string} win.Current.logined id пользователя
 * @param {string} win.Current.loginedPost должность
 * @param {Object} $ jQuery
 */
(function() {
  console.log('exec _planfixfix.js');
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
    isDebug: true,
    deferred: false,
    adminId: 9230, // тестовый пользователь

    debug() {
      if (PFF.isDebug) console.log(...arguments);
    },

    isManager() {
      return win.Current.loginedPost === 'Менеджер по сопровождению заказов' ||
          win.Current.loginedPost === 'Руководитель отдела продаж';
    },

    fields: {
      vyrabotka: {
        name: '[data-fid="741"] select',
        count: '[data-fid="747"] input',
        comment: '[data-fid="749"] textarea',
        hours_per_count: '.analitic-data[data-fid="741:h915"]',
      },
      realization: {
        count: '[data-fid="990"] input',
        price: '[data-fid="994"] input',
        date: '[data-fid="996"] input',
      },
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

      // тестовое открытие нового действия
      if (PFF.isDebug) {
        console.log('debug: init');
        setTimeout(() => {
          win.onbeforeunload = undefined; // отменить предупреждение о закрытии окна
          //console.log('debug: new action');
          $('.actions-quick-add-block-text').trigger('click'); // создание действия
          //console.log('debug: edit-draft-action');
          //$('.edit-draft-action').trigger('click'); // edit
          //PFF.analitics.addAnalitics({ name: 'Поминутная работа программиста' });
        }, 2000);
      }
    },

    // добавляет быстрые действия в блок действия
    addActions: function() {
      PFF.analitics.addActions();
      PFF.smeta.addActions();
      PFF.tmpls.addActions();
    },

    /**
     * Переопределяет стили
     */
    addStyles: function() {
      $('body').append(
          `<style>
.chzn-container .chzn-results{ max-height:400px !important; }
.chzn-drop{ width:850px !important; border-style:solid !important; border-width:1px !important; }
.silentChosen .chzn-container .chzn-results{ max-height:1px !important; }
.silentChosen .chzn-drop{ width:1px !important; }

/* text templates */
.pff-tpls { line-height: 1.5rem; margin-left: 100px; max-width: 200px; }
.pff-tpls-content {display: none; }
.pff-tpls:hover { max-width: none; margin-left: 0; }
.pff-tpls:hover .pff-tpls-content { display: block; }
.pff-cat { margin-bottom: 15px; border-bottom: 3px solid transparent; }
.pff-cat:hover { border-bottom-color: #3ba3d0; }
.pff-cat-title { float:left; clear: left; width: 100px; padding-top: 2px; }
.pff-cat-content { margin-left: 100px; }
.pff-cat a { display: inline-block; padding: 2px 10px; }

.pff-tmpl-form input[type="text"] { width: 200px !important; }
.pff-tmpl-form .btn-main { margin-left: 0; }
.pff-tmpl-form .btn-create { float: right; }
.pff-tmpl-preview { width: 360px; margin: 30px 0; }
</style>`,
      );
    },

    pfAlter: function() {
      /**
       *
       * @param win.ActionListJS код блока действий
       * @param win.AnaliticsWinJS редактор аналитик
       */
      // save original functions
      win.ActionListJS.prototype.createAction_orig = win.ActionListJS.prototype.createAction;
      //win.ActionJS.prototype.createNewAction_orig = win.ActionJS.prototype.createNewAction;
      win.ActionJS.prototype.editDraft_orig = win.ActionJS.prototype.editDraft;
      win.ActionJS.prototype.edit_orig = win.ActionJS.prototype.edit;
      //win.ActionJS.restoreAnaliticsForEdit_orig = win.ActionJS.restoreAnaliticsForEdit;
      win.AnaliticsWinJS.prototype.show_orig = win.AnaliticsWinJS.prototype.show;

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
    },

    // добавляет действие в редактор аналитик
    addAnaliticAction(name, action) {
      const link = $(
          '<span style="margin-left:1em" class="fakelink-dashed">' + name +
          '</span>',
      ).on('click', action);
      $('.af-row-btn-add').append(link);
      return link;
    },

    /**
     * Добавляет ссылку на добавление аналитики в панель
     * В ссылку вписывается список аналитик
     * Можно передавать вместо аналитик функцию
     */
    addTaskBlock: function(name, action) {
      const block = $('<div class="task-add-block"></div>').
          html(name).
          on('click', function() {
            PFF.resetDeferred();
            if (Array.isArray(action) || typeof action == 'object' ||
                typeof action == 'string') {
              PFF.analitics.addAnalitics(action);
            } else if (typeof action === 'function') {
              action();
            }
          });

      //PFF.debug(block);
      const isAnalitic = Array.isArray(action) || typeof action == 'object' ||
          typeof action == 'string';

      if (isAnalitic) {
        const analitics = $.map(PFF.analitics.normalizeAnalitics(action),
            function(analitic) {
              return analitic.name;
            });
        block.attr('title', analitics.join('\n'));
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
       */
      win.TaskCardPoolJS.getInstance(win.PlanfixPage.task).
          scroller.
          scrollToBlock(elem);
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
      $('<a href="javascript:" class="without-dragging main-menu-config-item">PlanfixFix</a>').
          appendTo('.main-config-ddl-wrapper').
          on('click', function() {
            const remoteAnalitics = PFF.analitics.getRemoteAnaliticsUrl();
            const remoteTemplates = PFF.tmpls.getRemoteTemplatesUrl();
            const html =
                '<div class="pff-settings">' +
                '<div class="form">' +
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
                '<input type="button" value="Сохранить"/>' +
                '</div>';
            /**
             * @param win.drawDialog простая всплывалка, не модальная
             */
            win.drawDialog(300, 'auto', 300, html);
            $('.pff-settings [type="button"]').on('click', function() {
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
            return false;
          });
    },
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
