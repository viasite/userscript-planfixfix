(function() {
  console.log('exec _planfixfix.js');
  win = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
  var $ = win.$;

  function debug() {
    if (PFF.debug) console.log(...arguments);
  }

  win.onerror = function(error, file, line) {
    console.log(error + ' (line ' + line + ')');
  };

  if (win.top != win.self) {
    return false; // ignore iframes
  }

  if (location.hostname !== 'tagilcity.planfix.ru') {
    return;
  }

  const PFF = {
    debug: true,
    deferred: false,
    adminId: 9230, // тестовый пользователь

    isManager() {
      return userPost == 'Менеджер по сопровождению заказов' ||
          userPost == 'Руководитель отдела продаж';
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
      if ($('body').hasClass('pff_inited')) return false;
      $('body').addClass('pff_inited');

      // не пугаем планфикс своими ошибками
      win.onerror = function() {
        return;
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
      if (PFF.debug) {
        console.log('debug: init');
        setTimeout(() => {
          win.onbeforeunload = undefined; // отменить предупреждение о закрытии окна
          //console.log('debug: new action');
          $('.actions-quick-add-block-text').click(); // создание действия
          //console.log('debug: edit-draft-action');
          //$('.edit-draft-action').click(); // edit
          //PFF.addAnalitics({ name: 'Поминутная работа программиста' });
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
          if (PFF.debug) console.log('after createAction');
          PFF.addActions();
        });
      };
      /*win.ActionJS.prototype.createNewAction = function() {
        this.createNewAction_orig();
        if (PFF.debug) console.log('after createNewAction');
        setTimeout(PFF.addActions, 2000);
      };*/
      win.ActionJS.prototype.editDraft = function(
          draftid, task, insertBefore, actionList) {
        this.editDraft_orig(draftid, task, insertBefore, actionList);
        if (PFF.debug) console.log('after editDraft');
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

        const addAnaliticAction = (name, action) => {
          const link = $(
              '<span style="margin-left:1em" class="fakelink-dashed">' + name +
              '</span>',
          ).click(action);
          $('.af-row-btn-add').append(link);
          return link;
        };

        setTimeout(() => {
          const smetaTable = $('[data-aid="314"] .tbl-list');
          // смета на разработку
          if (smetaTable.length > 0) {
            // кнопка "Реализовать"
            addAnaliticAction('Реализовать', PFF.smeta.toRelization);

            // кнопка "Сортировать смету"
            addAnaliticAction('Сортировать смету', PFF.smeta.order);

            // удаление аналитик по блокам (этапам)
            // TODO: to pffSmeta
            const sections = {};
            smetaTable.find('div[data-fid="950"]').each(function() {
              const val = $(this).find('input:hidden').val();
              if (!sections[val]) {
                sections[val] = {
                  name: $(this).text(),
                  count: 0,
                  rows: [],
                };
              }
              sections[val].count++;
              sections[val].rows.push($(this).parents('tr'));
            });
            for (let fid in sections) {
              const sec = sections[fid];
              const link = addAnaliticAction(
                  `Удалить ${sec.name} (${sec.count})`, () => {
                    for (let row of sec.rows) {
                      row.find('[data-acr="delete"]').click();
                      row.remove();
                    }
                    link.remove();
                  });
            }
          }
        }, 3000);
      };

      // menuitem
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
        PFF.addAnalitics([{}]);
      });*/
    },

    /**
     * Тупая функция, добавляет все аналитики из массива
     * TODO: to pffAnalitics
     */
    addAnalitics: function(analitics_arr) {
      analitics_arr = PFF.normalizeAnalitics(analitics_arr);
      $.each(analitics_arr, function(i, opts) {
        PFF._addAnalitic(opts);
      });
      PFF.deferred.then(PFF.analitics.countTotalAnalitics);
    },

    /**
     * Создает массив, элементы которого скармливаются в _addAnalitic() без изменений
     * Может парсить строки типа:
     * [Группа аналитик] Название аналитики - кол-во
     * Группа по умолчанию - Выработка
     */
    normalizeAnalitics: function(analitics_arr) {
      var analitics = [];
      if (!$.isArray(analitics_arr)) analitics_arr = [analitics_arr];
      $.each(analitics_arr, function(i, opts) {
        var isFirst = i === 0;
        var isLast = i === analitics_arr.length - 1;
        if (typeof opts == 'string') {
          opts = {name: opts};
        }

        opts = $.extend(
            {
              name: '',
              group: 'Выработка',
              scrollTo: isFirst,
              select: !isLast,
            },
            opts,
        );

        var count = opts.name.match(/ - (\d+)$/) || '';
        if (count !== '') {
          opts.name = opts.name.replace(count[0], '');
          opts.count = count[1];
        }

        var group = opts.name.match(/^\[(.*?)\] ?/) || '';
        if (group !== '') {
          opts.name = opts.name.replace(group[0], '');
          opts.group = group[1];
        }

        analitics.push(opts);
      });
      return analitics;
    },

    /**
     * Добавляет аналитику в действие
     * Добавление идет через PFF.deferred, очередь добавления
     * В deferred создержится последняя добавляемая аналитика
     * @param {object} opts { name, group, count, scrollTo, select }
     */
    _addAnalitic: function(opts) {
      var deferred = $.Deferred();

      PFF.deferred.then(function() {
        $('.task-add-analitic').click();

        var timeout = $('.analitics-form').size() === 0 ? 500 : 10;
        //var timeout = 2000;
        setTimeout(function() {
          var div = $('.analitics-form').last();
          if (opts.scrollTo) PFF.scrollTo(div);

          setTimeout(function() {
            // выбор группы аналитик
            var select = div.find('select');
            if (PFF.debug) console.log('select', select);

            var option = select.find('option').filter(function() {
              return $(this).text() == opts.group;
            });
            select.val(option.val()).change();

            var analitic = div.find('.af-tbl-tr');
            if (PFF.debug) console.log('analitic', analitic);

            var select_handbook = analitic.find(
                'select[data-handbookid]:first');
            if (PFF.debug) console.log('select_handbook', select_handbook);
            select_handbook.trigger('liszt:focus');

            // выработка
            if (opts.name) {
              // выбор конкретной аналитики
              // задержка из-за того, что иногда выбирается выработка "заказ такси"
              setTimeout(function() {
                analitic.addClass('silentChosen');
                analitic.find('.chzn-search:first input').
                    val(opts.name).
                    keyup();
                var count_focused = false;
                select_handbook.bind('liszt:updated', function(e) {
                  var results = analitic.find('.chzn-results .active-result');
                  if (PFF.debug) console.log('results', results);
                  if (results.length == 1 || opts.select) {
                    results.first().mouseup();
                    analitic.find(PFF.fields.vyrabotka.count).focus();
                  }
                  // задержка из-за лага chosen
                  setTimeout(function() {
                    if (count_focused) return;
                    count_focused = true;
                    analitic.removeClass('silentChosen');

                    if (opts.count) {
                      analitic.find(PFF.fields.vyrabotka.count).val(opts.count);
                      analitic.find(PFF.fields.vyrabotka.comment).focus();
                    } else {
                      analitic.find(PFF.fields.vyrabotka.count).
                          focus().
                          on('keypress', function(e) {
                            if (e.which == 13) {
                              if (e.ctrlKey) {
                                $('[data-action="saveParent"]').click();
                              } else {
                                $('[data-action="save"]').click();
                              }
                            }
                          });
                    }

                    // планируемое время
                    if (opts.date) {
                      analitic.find('input.date').val(opts.date);
                    }
                    if (opts.begin) {
                      analitic.find('select.timeperiodbegin').val(opts.begin);
                    }
                    if (opts.end) {
                      analitic.find('select.timeperiodend').val(opts.end);
                    }
                  }, 1000);

                  deferred.resolve();
                });
              }, 500);
            }

            if (!opts.name) {
              deferred.resolve();
            }
          }, 500);
        }, timeout);
      });

      PFF.deferred = deferred;
      return deferred.promise();
    },

    /**
     * Добавляет ссылку на добавление аналитики в панель
     * В ссылку вписывается список аналитик
     * Можно передавать вместо аналитик произвольную функцию
     */
    addTaskBlock: function(name, action) {
      var block = $('<div class="task-add-block"></div>').
          html(name).
          click(function() {
            PFF.resetDeferred();
            if ($.isArray(action) || typeof action == 'object' ||
                typeof action == 'string') {
              PFF.addAnalitics(action);
            } else if ($.isFunction(action)) {
              action();
            }
          });
      //if (PFF.debug) console.log(block);
      if ($.isArray(action) || typeof action == 'object' || typeof action ==
          'string') {
        var analitics = $.map(PFF.normalizeAnalitics(action),
            function(analitic) {
              return analitic.name;
            });
        block.attr('title', analitics.join('\n'));
      }
      $('.task-add-block').last().after(block);
      return block;
    },

    /**
     * Чистит сохраненные аналитики, которые загружались удаленно
     */
    clearCache: function() {
      delete localStorage.pff_analitics;
    },

    /**
     * Прокручивает до селектора, используется функция планфикса
     */
    scrollTo: function(elem) {
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
          click(function() {
            var remoteAnalitics = PFF.analitics.getRemoteAnaliticsUrl();
            var remoteTemplates = PFF.tmpls.getRemoteTemplatesUrl();
            var html =
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
            win.drawDialog(300, 'auto', 300, html);
            $('.pff-settings [type="button"]').click(function() {
              var isSave = PFF.analitics.setRemoteAnaliticsUrl({
                url: $('[name="pff_analitics_remote_url"]').val(),
                format: 'text',
              });
              isSave = isSave && PFF.tmpls.setRemoteTemplatesUrl({
                url: $('[name="pff_templates_remote_url"]').val(),
                format: 'yml',
              });
              if (isSave) {
                $('.dialogWin .destroy-button').click();
              }
            });
            return false;
          });
    },
  };
  win.PFF = PFF;

// used in PFF.analitics.getDates, PFF.smeta.toRelization
  const pad = function(num) {
    const A = num.toString();
    if (A.length > 1) return A;
    else return ('00' + A).slice(-2);
  };

  $(function() {
    // без этой задержки файлы не успевают подключаться
    setTimeout(() => {
      console.log('pff init');
      PFF.init();
    }, 10);
  });
})();
