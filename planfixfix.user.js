// ==UserScript==
// @name           PlanfixFix
// @author         popstas
// @version        0.6.0
// @namespace      viasite.ru
// @description    Some planfix.ru improvements
// @unwrap
// @noframes
// @run-at         document-end
// @updateURL      https://raw.githubusercontent.com/viasite/userscript-planfixfix/master/planfixfix.user.js
// @include        https://tagilcity.planfix.ru/*
// @match          https://tagilcity.planfix.ru/*
// ==/UserScript==

(function () {
  var u = 'undefined',
    win = typeof unsafeWindow != u ? unsafeWindow : window;
  var $ = win.$;

  win.onerror = function (error, file, line) {
    console.log(error + ' (line ' + line + ')');
  };

  if (win.top != win.self) {
    return false; // ignore iframes
  }

  if (location.hostname !== 'tagilcity.planfix.ru') {
    return;
  }

  const PlanfixFix = {
    debug: false,
    deferred: false,
    fields: {
      name: '[data-fid="741"] select',
      count: '[data-fid="747"] input',
      comment: '[data-fid="749"] textarea',
      hours_per_count: '.analitic-data[data-fid="741:h915"]',
      realization: {
        count: '[data-fid="990"] input',
        price: '[data-fid="994"] input',
        date: '[data-fid="996"] input',
      },
    },

    default_handbook: 'Инструкции и стандарты',

    analitics_remote_default: {
      url: 'https://dev.viasite.ru/planfix_analitics.txt',
      format: 'text',
    },
    analitics_remote_cache_lifetime: 3600,

    analitics_default: [
      ['Поиск глюка', 'Поиск места'],
      ['Тесты', 'Тестирование'],
      [
        'Правки, тесты, отчет',
        [
          { name: 'Поиск места проблемы, (в т.ч. по алгоритму поиска)', count: 1 },
          'Обработка простая на вводе или выводе',
          'Тестирование',
          'Замена / вставка любого контента',
          { name: 'Создание пояснительной записки по внесенным изменениям', count: 1 },
        ],
      ],
      ['Задание', 'Задание'],
      ['Консультация', 'с коллегой'],
      ['Записка', 'Создание пояснительной записки'],
    ],
    _analitics: [],

    init: function () {
      // init once
      if ($('body').hasClass('fixes')) return false;
      $('body').addClass('fixes');

      // не пугаем планфикс своими ошибками
      win.onerror = function () {
        return;
      };

      // очередь аналитик
      PlanfixFix.resetDeferred();

      PlanfixFix.actionAlter();

      PlanfixFix.addStyles();

      //PlanfixFix.addMenu();

      // тестовое открытие нового действия
      if (PlanfixFix.debug) {
        console.log('debug: init');
        setTimeout(() => {
          //console.log('debug: new action');
          //$('.actions-quick-add-block-text').click(); // create
          //console.log('debug: edit-draft-action');
          //$('.edit-draft-action').click(); // edit
          //PlanfixFix.addAnalitics({ name: 'Поминутная работа программиста' });
        }, 2000);
      }
    },

    /**
     * Переопределяет стили
     */
    addStyles: function () {
      $('body').append(
        '<style>' +
          '.chzn-container .chzn-results{ max-height:400px !important; }' +
          '.chzn-drop{ width:850px !important; border-style:solid !important; border-width:1px !important; }' +
          '.silentChosen .chzn-container .chzn-results{ max-height:1px !important; }' +
          '.silentChosen .chzn-drop{ width:1px !important; }' +
          '</style'
      );
    },

    /**
     * Добавляет пункт меню в главное меню "Еще"
     * Настройки скрипта:
     * - url для удаленной загрузки аналитик
     */
    addMenu: function () {
      var li = $(
        '<li class="b-ddl-menu-li-action b-ddl-menu-li-item b-ddl-menu-li-group-0"><span></span><a href="#">PlanfixFix</a></li>'
      )
        .appendTo('.b-main-menu-more ul')
        .click(function () {
          var remote = PlanfixFix.getRemoteAnaliticsUrl();
          var html =
            '<div class="planfixfix-settings">' +
            '<div class="form">' +
            '<div>URL для обновления аналитик, обязательно https://</div>' +
            '<input style="width:400px" class="text-box" name="planfixfix_remote_url" value="' +
            remote.url +
            '"/>' +
            //.append('<input type="hidden" name="planfixfix_remote_format" value="text"/>')
            '</div>' +
            '<input type="button" value="Сохранить"/>' +
            '</div>';
          win.drawDialog(300, 'auto', 300, html);
          $('.planfixfix-settings [type="button"]').click(function () {
            var isSave = PlanfixFix.setRemoteAnaliticsUrl({
              url: $('[name="planfixfix_remote_url"]').val(),
              format: 'text',
            });
            if (isSave) {
              $('.dialogWin .destroy-button').click();
            }
          });
          return false;
        });
    },

    actionAlter: function () {
      if (PlanfixFix.debug) console.log('actionAlter');

      // save original functions
      win.ActionListJS.prototype.createAction_orig = win.ActionListJS.prototype.createAction;
      //win.ActionJS.prototype.createNewAction_orig = win.ActionJS.prototype.createNewAction;
      win.ActionJS.prototype.editDraft_orig = win.ActionJS.prototype.editDraft;
      win.ActionJS.prototype.edit_orig = win.ActionJS.prototype.edit;
      //win.ActionJS.restoreAnaliticsForEdit_orig = win.ActionJS.restoreAnaliticsForEdit;
      win.AnaliticsWinJS.prototype.show_orig = win.AnaliticsWinJS.prototype.show;

      // decorate original functions
      win.ActionListJS.prototype.createAction = function () {
        return this.createAction_orig().then(function () {
          if (PlanfixFix.debug) console.log('after createAction');
          PlanfixFix.addCustomAnalitics();
        });
      };
      /*win.ActionJS.prototype.createNewAction = function() {
        this.createNewAction_orig();
        if (PlanfixFix.debug) console.log('after createNewAction');
        setTimeout(PlanfixFix.addCustomAnalitics, 2000);
      };*/
      win.ActionJS.prototype.editDraft = function (draftid, task, insertBefore, actionList) {
        this.editDraft_orig(draftid, task, insertBefore, actionList);
        if (PlanfixFix.debug) console.log('after editDraft');
        setTimeout(PlanfixFix.addCustomAnalitics, 1000);
      };
      win.ActionJS.prototype.edit = function (id, task, data, actionNode) {
        this.edit_orig(id, task, data, actionNode);
        setTimeout(PlanfixFix.addCustomAnalitics, 1000);
      };
      /*win.ActionJS.restoreAnaliticsForEdit = function(data){
        win.ActionJS.restoreAnaliticsForEdit_orig(data);
        setTimeout(PlanfixFix.countTotalAnalitics, 2000);
      };*/

      // редактор аналитик
      win.AnaliticsWinJS.prototype.show = function (options) {
        this.show_orig(options);

        const addAnaliticAction = (name, action) => {
          const link = $(
            '<span style="margin-left:1em" class="fakelink-dashed">' + name + '</span>'
          ).click(action);
          $('.af-row-btn-add').append(link);
        };

        setTimeout(() => {
          const smetaTable = $('[data-aid="314"] .tbl-list');
          // смета на разработку
          if (smetaTable.length > 0) {
            // кнопка "Сортировать смету"
            if (Current.logined == 9230) {
              addAnaliticAction('Сортировать смету', smetaOrder);
            }

            // удаление аналитик по блокам (этапам)
            const sections = {};
            smetaTable.find('div[data-fid="950"]').each(function () {
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
              let sec = sections[fid];
              addAnaliticAction(`Удалить ${sec.name} (${sec.count})`, () => {
                for (let row of sec.rows) {
                  row.find('[data-acr="delete"]').click();
                  //row.remove();
                }
                link.remove();
              });
            }
          }

          addAnaliticAction('Реализовать', smetaToRelization);
        }, 3000);
      };

      /*$('body').delegate(PlanfixFix.fields.count, 'change keypress', PlanfixFix.countTotalAnalitics);
      $('body').delegate(PlanfixFix.fields.name, 'change', function(){
      var hours_field = $(this).parents('.add-analitic-block').find(PlanfixFix.fields.hours_per_count);
      hours_field.attr('title', (hours_field.val().replace(',', '.')*60).toFixed(1));
      });*/

      /*$('body').delegate('.attach-new-analitic td.td-item-add-ex:first span.fakelink-dashed', 'click', function(e){
        PlanfixFix.addAnalitics([{}]);
      });*/
    },

    // добавляет быстрые действия в блок действия
    addCustomAnalitics: function () {
      // показывается в задаче, где одно и то же планируется на каждый день
      if (PlanfixFix.debug) console.log('addCustomAnalitics');
      if (win.PlanfixPage.task == 116702) {
        var dates = PlanfixFix.getDates(1, 5);
        var analitics_arr = $.map(dates, function (date) {
          return {
            group: 'Планируемое время работы',
            date: date,
            begin: '09:00',
            end: '09:30',
          };
        });
        PlanfixFix.addTaskBlock('План на неделю', analitics_arr);

        PlanfixFix.addTaskBlock('План на день', { name: 'План на день', count: 1 });
      }

      PlanfixFix.addTaskBlock('План', '[Планируемое время работы]');
      PlanfixFix.addTaskBlock('|');
      PlanfixFix.addTaskBlock('Выработка', {});
      PlanfixFix.addTaskBlock('|');

      var userPost = Current.loginedPost;
      switch (userPost) {
        case 'Программист':
          PlanfixFix.addTaskBlock('Программирование', { name: 'Поминутная работа программиста' });
          break;
        case 'Менеджер по сопровождению заказов':
          PlanfixFix.addTaskBlock('тел. лёгкий', { name: 'Лёгкий разговор по телефону' });
          PlanfixFix.addTaskBlock('тел. обычный', { name: 'Обычный разговор по телефону' });
          PlanfixFix.addTaskBlock('тел. сложный', { name: 'Сложный разговор по телефону' });
          PlanfixFix.addTaskBlock('письмо лёгкое', { name: 'Лёгкое письмо' });
          PlanfixFix.addTaskBlock('письмо обычное', {
            name: 'Письмо средней сложности / обычное письмо',
          });
          PlanfixFix.addTaskBlock('письмо сложное', { name: 'Сложное письмо' });
          break;
      }

      if (
        Current.logined == 9230 ||
        userPost == 'Менеджер по сопровождению заказов' ||
        userPost == 'Руководитель отдела продаж'
      ) {
        PlanfixFix.addTaskBlock('|');
        PlanfixFix.addTaskBlock('Оформить смету', smetaStyle.run);
      }

      // парсим массив подготовленных аналитик
      PlanfixFix.getAnalitics().then(function (tasks) {
        PlanfixFix.addTaskBlock('|');
        $.each(tasks, function (i, task) {
          PlanfixFix.addTaskBlock(task.name, task.analitics);
        });
      });

      // тестовый вызов добавления аналитики
      if (PlanfixFix.debug) {
        PlanfixFix.addTaskBlock('|');
        PlanfixFix.addTaskBlock('Удалить все', function () {
          $('.task-add-analitic').click();
          setTimeout(function () {
            $('[data-action="remove-all-analitics"]').click();
          }, 200);
        });
      }
    },

    /**
     * Тупая функция, добавляет все аналитики из массива
     */
    addAnalitics: function (analitics_arr) {
      analitics_arr = PlanfixFix.normalizeAnalitics(analitics_arr);
      $.each(analitics_arr, function (i, opts) {
        PlanfixFix._addAnalitic(opts);
      });
      PlanfixFix.deferred.then(PlanfixFix.countTotalAnalitics);
    },

    /**
     * Создает массив, элементы которого скармливаются в _addAnalitic() без изменений
     * Может парсить строки типа:
     * [Группа аналитик] Название аналитики - кол-во
     * Группа по умолчанию - Выработка
     */
    normalizeAnalitics: function (analitics_arr) {
      var analitics = [];
      if (!$.isArray(analitics_arr)) analitics_arr = [analitics_arr];
      $.each(analitics_arr, function (i, opts) {
        var isFirst = i === 0;
        var isLast = i === analitics_arr.length - 1;
        if (typeof opts == 'string') {
          opts = { name: opts };
        }

        opts = $.extend(
          {
            name: '',
            group: 'Выработка',
            scrollTo: isFirst,
            select: !isLast,
          },
          opts
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
     * Добавление идет через PlanfixFix.deferred, очередь добавления
     * В deferred создержится последняя добавляемая аналитика
     * @param {object} opts { name, group, count, scrollTo, select }
     */
    _addAnalitic: function (opts) {
      var deferred = $.Deferred();

      PlanfixFix.deferred.then(function () {
        $('.task-add-analitic').click();

        var timeout = $('.analitics-form').size() === 0 ? 500 : 10;
        //var timeout = 2000;
        setTimeout(function () {
          var div = $('.analitics-form').last();
          if (opts.scrollTo) PlanfixFix.scrollTo(div);

          setTimeout(function () {
            // выбор группы аналитик
            var select = div.find('select');
            if (PlanfixFix.debug) console.log('select', select);

            var option = select.find('option').filter(function () {
              return $(this).text() == opts.group;
            });
            select.val(option.val()).change();

            var analitic = div.find('.af-tbl-tr');
            if (PlanfixFix.debug) console.log('analitic', analitic);

            var select_handbook = analitic.find('select[data-handbookid]:first');
            if (PlanfixFix.debug) console.log('select_handbook', select_handbook);
            select_handbook.trigger('liszt:focus');

            // выработка
            if (opts.name) {
              // выбор конкретной аналитики
              // задержка из-за того, что иногда выбирается выработка "заказ такси"
              setTimeout(function () {
                analitic.addClass('silentChosen');
                analitic
                  .find('.chzn-search:first input')
                  .val(opts.name) /*.focus()*/
                  .keyup();
                var count_focused = false;
                select_handbook.bind('liszt:updated', function (e) {
                  var results = analitic.find('.chzn-results .active-result');
                  if (PlanfixFix.debug) console.log('results', results);
                  if (results.length == 1 || opts.select) {
                    results.first().mouseup();
                    analitic.find(PlanfixFix.fields.count).focus();
                  }
                  // задержка из-за лага chosen
                  setTimeout(function () {
                    if (count_focused) return;
                    count_focused = true;
                    analitic.removeClass('silentChosen');

                    if (opts.count) {
                      analitic.find(PlanfixFix.fields.count).val(opts.count);
                      analitic.find(PlanfixFix.fields.comment).focus();
                    } else {
                      analitic
                        .find(PlanfixFix.fields.count)
                        .focus()
                        .on('keypress', function (e) {
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

      PlanfixFix.deferred = deferred;
      return deferred.promise();
    },

    /**
     * Добавляет аналитику "Реализация"
     */
    _addRealization: function (opts) {
      opts = {
        ...{ count: 1 },
        ...opts,
      };
      var deferred = $.Deferred();

      PlanfixFix.deferred.then(function () {
        // добавить другую аналитику
        $('[data-action="add-new-analitic"]').click();

        setTimeout(() => {
          const div = $('.analitics-form').last();
          if (opts.scrollTo) PlanfixFix.scrollTo(div);

          setTimeout(() => {
            // выбор группы аналитик
            var select = div.find('select');
            if (PlanfixFix.debug) console.log('select', select);
            const option = select.find('option').filter(function () {
              return $(this).text() == opts.group;
            });
            select.val(option.val()).change();

            const analitic = div.find('[data-aname="' + opts.group + '"] .af-tbl-tr').last();
            if (PlanfixFix.debug) console.log('analitic', analitic);

            const select_handbook = analitic.find('select[data-handbookid]:first');
            if (PlanfixFix.debug) console.log('select_handbook', select_handbook);
            select_handbook.trigger('liszt:focus');

            setTimeout(() => {
              analitic.addClass('silentChosen');
              analitic
                .find('.chzn-search:first input')
                .val(opts.name) /*.focus()*/
                .keyup();
              var count_focused = false;
              select_handbook.bind('liszt:updated', function (e) {
                var results = analitic.find('.chzn-results .active-result');
                if (PlanfixFix.debug) console.log('results', results);
                if (results.length == 1 || opts.select) {
                  results.first().mouseup();
                  analitic.find(PlanfixFix.fields.count).focus();
                }
                // задержка из-за лага chosen
                setTimeout(() => {
                  if (count_focused) return;
                  count_focused = true;
                  analitic.removeClass('silentChosen');

                  if (opts.count) {
                    analitic.find(PlanfixFix.fields.realization.count).val(opts.count);
                  }
                  if (opts.price) {
                    analitic.find(PlanfixFix.fields.realization.price).val(opts.price);
                  }
                  if (opts.date) {
                    analitic.find(PlanfixFix.fields.realization.date).val(opts.date);
                  }
                }, 2000);

                deferred.resolve();
              });
            }, 500);
          });
        }, 500);
      });

      PlanfixFix.deferred = deferred;
      return deferred.promise();
    },

    /**
     * Добавляет ссылку на добавление аналитики в панель
     * В ссылку вписывается список аналитик
     * Можно передавать вместо аналитик произвольную функцию
     */
    addTaskBlock: function (name, action) {
      var block = $('<div class="task-add-block"></div>')
        .html(name)
        .click(function () {
          PlanfixFix.resetDeferred();
          if ($.isArray(action) || typeof action == 'object' || typeof action == 'string') {
            PlanfixFix.addAnalitics(action);
          } else if ($.isFunction(action)) {
            action();
          }
        });
      if (PlanfixFix.debug) console.log(block);
      if ($.isArray(action) || typeof action == 'object' || typeof action == 'string') {
        var analitics = $.map(PlanfixFix.normalizeAnalitics(action), function (analitic) {
          return analitic.name;
        });
        block.attr('title', analitics.join('\n'));
      }
      $('.task-add-block').last().after(block);
      return block;
    },

    /**
     * Отдает promise, в нем аналитики
     * Отдает кешированные аналитики
     * Или грузит по урлу и отдает, здесь же проверяется свежесть кеша
     * Удаленные возвращают умолчальные аналитики в случае неудачи
     */
    getAnalitics: function () {
      var deferred = $.Deferred();
      if (PlanfixFix._analitics.length === 0) {
        var mtime = localStorage.planfixfix_analitics_mtime || new Date().getTime();
        var cache_age = new Date().getTime() - mtime;
        if (cache_age > PlanfixFix.analitics_remote_cache_lifetime * 1000) {
          PlanfixFix.clearCache();
        }
        PlanfixFix._analitics = $.parseJSON(localStorage.planfixfix_analitics) || [];

        /*if(PlanfixFix._analitics.length===0){
					  deferred = PlanfixFix.parseRemoteAnalitics(
						  PlanfixFix.getRemoteAnaliticsUrl()
					  );
				  }*/
      }
      if (PlanfixFix._analitics.length > 0) {
        deferred.resolve(PlanfixFix._analitics);
      }
      return deferred.promise();
    },

    /**
     * Умолчальные аналитики (задачи) из массива
     */
    getDefaultAnalitics: function () {
      var tasks = [];
      $.each(PlanfixFix.analitics_default, function (i, item) {
        tasks.push({
          name: item[0],
          analitics: item[1],
        });
      });
      return tasks;
    },

    /**
     * Возвращает сохраненный или дефолтный урл
     */
    getRemoteAnaliticsUrl: function () {
      var store = $.parseJSON(localStorage.planfixfix_remote_analitics_url);
      return store || PlanfixFix.analitics_remote_default;
    },

    /**
     * Сохраняет урл удаленных аналитик,
     * Если пусто или изменено, чистим кеш
     */
    setRemoteAnaliticsUrl: function (remote) {
      if (remote.url == PlanfixFix.analitics_remote_default.url) {
        return true;
      }
      if (remote.url === '') {
        delete localStorage.planfixfix_remote_analitics_url;
        PlanfixFix.clearCache();
        return true;
      }
      if (!remote.url.match(/^https:\/\//)) {
        alert('Возможны только https URL');
        return false;
      }
      if (remote.format != 'text') {
        alert('Возможны только текстовые файлы');
        return false;
      }
      PlanfixFix.clearCache();
      localStorage.planfixfix_remote_analitics_url = JSON.stringify(remote);
      return true;
    },

    parseRemoteAnalitics: function (opts) {
      var deferred = $.Deferred();
      $.get(opts.url, function (data) {
        var tasks = [];
        if (opts.format == 'text') {
          tasks = PlanfixFix.text2tasks(data);
        }
        if (tasks.length > 0) {
          PlanfixFix._analitics = tasks;
          localStorage.planfixfix_analitics = JSON.stringify(tasks);
          localStorage.planfixfix_analitics_mtime = new Date().getTime();
        }
        if (tasks.length === 0) tasks = PlanfixFix.getDefaultAnalitics();
        deferred.resolve(tasks);
      });
      return deferred;
    },

    /**
     *
     * @param  {[string]} text текст, разделенный табами,
     * 0 табов - задача,
     * 1 таб - аналитика,
     * если в конце аналитики через дефис написана цифра - 1, она превратится в количество
     * @return массив, пригодный для addAnalitics()
     */
    text2tasks: function (text) {
      var lines = text.split('\n');
      var lastLevel = -1;
      var tasks = [];
      var task;
      $.each(lines, function (i, line) {
        if (line === '') return;

        var level = line.match(/^\t*/)[0].length;
        var text = $.trim(line);

        if (level === 0) {
          if (lastLevel != -1) tasks.push(task);
          task = { name: text, analitics: [] };
        }
        if (level == 1) {
          task.analitics.push(text);
        }
        lastLevel = level;
      });
      if (lines.length > 0) tasks.push(task);
      return tasks;
    },

    /**
     * Чистит сохраненные аналитики, которые загружались удаленно
     */
    clearCache: function () {
      delete localStorage.planfixfix_analitics;
    },

    /**
     * Считает, сколько всего минут во всех аналитиках действия,
     * Предупреждает, если есть незаполненные или ошибочные
     */
    countTotalAnalitics: function () {
      setTimeout(function () {
        var count_div = $('.analitics-total-wrap');
        var btn = $('.tr-action-commit .btn:first, .action-edit-save');

        var highlight = function (state) {
          if (state) {
            count_div.css('color', 'red');
            btn.css('border-color', 'red');
          } else {
            count_div.css('color', 'inherit');
            btn.css('border-color', 'inherit');
          }
        };

        if (count_div.length === 0) {
          count_div = $('<div class="analitics-total-wrap"></div>')
            .attr('style', 'float:right; margin-right:15px')
            .html('Всего: <span class="analitics-total-count"></span>');
          $('.attach-new-analitic td.td-item-add-ex:first').append(count_div);
        }
        highlight(false);

        var counts = $(PlanfixFix.fields.count);
        var totals = 0;
        counts.each(function (i, count_field) {
          var analitic = $(count_field).parents('.add-analitic-block');
          var count = $(count_field).val();
          var hours_per_count = analitic
            .find(PlanfixFix.fields.hours_per_count)
            .text()
            .replace(',', '.');
          var hours = count * hours_per_count;
          if (count === '' || hours_per_count === '') highlight(true);
          totals += hours;
        });
        totals = (totals * 60).toFixed(1).replace(/\.0$/, '');
        if (isNaN(totals) || totals === 0) highlight(true);

        count_div.find('.analitics-total-count').html(totals);
      }, 10);
    },

    /**
     * Прокручивает до селектора, используется функция планфикса
     */
    scrollTo: function (elem) {
      win.TaskCardPoolJS.getInstance(win.PlanfixPage.task).scroller.scrollToBlock(elem);
    },

    /**
     * Записывает в последнего в очереди чистый deferred,
     * следующий _addAnalitic() исполнится мгновенно
     */
    resetDeferred: function () {
      PlanfixFix.deferred = $.Deferred().resolve();
    },

    /**
     * Возвращает массив дат d-m-Y от dayofweek в кол-ве count
     * Если текущая дата совпадает с dayofweek, берется сегодня,
     * иначе этот ближайший день недели
     */
    getDates: function (dayofweek, count) {
      var dates = [];

      // next or current monday
      const d = new Date();
      var day = d.getDay();
      if (day === 0) day = 7;
      if (day != dayofweek) {
        var diff = (dayofweek + 7 - day) * 86400 * 1000;
        d.setTime(d.getTime() + diff);
      }

      for (var i = 0; i < count; i++) {
        dates.push(pad(d.getDate()) + '-' + pad(1 + d.getMonth()) + '-' + d.getFullYear());
        d.setTime(d.getTime() + 86400000);
      }

      return dates;
    },
  };

  // оформление сметы в 1 клик, https://tagilcity.planfix.ru/task/604890
  const smetaStyle = {
    // style html
    processHtml(html) {
      const newlines = [];
      const headerPrices = [];
      let discontSection = 0;
      let discontTotal = 0;

      const getPlural = (number, one, two, five) => {
        let n = Math.abs(number);
        n %= 100;
        if (n >= 5 && n <= 20) return five;
        n %= 10;
        if (n === 1) return one;
        if (n >= 2 && n <= 4) return two;
        return five;
      };

      const outSectionSummary = function () {
        let lastPrice = headerPrices[headerPrices.length - 1];
        lastPrice = new Intl.NumberFormat().format(lastPrice);
        discontTotal += discontSection;

        const discontSectionFormat = new Intl.NumberFormat().format(discontSection);
        const plural = getPlural(discontSection, 'рубль', 'рубля', 'рублей');
        let discontText = discontSection ? `, экономия ${discontSectionFormat} ${plural}` : '';
        newlines.push(`<b>Итого: ${lastPrice} рублей${discontText}</b><br /><br /><br /><br />`);
        discontSection = 0;
      };

      html = html.replace(/<p>/g, '<br />').replace(/<\/p>/g, '');
      const lines = html.split(/<br ?\/?>/);

      //console.log(lines);

      if (lines.length === 0) return;

      for (let line of lines) {
        //console.log(line);

        // empty line
        if (line.replace(/(;nbsp| )/g, '') == '') continue;

        // ignore summary for double conversion
        if (line.match(/^Итого.*?:/)) continue;

        // trim trailing spaces
        line = line.replace(/(&nbsp;| )+$/, '');

        // for double conversion
        if (line.match(/рублей$/)) {
          line = line.replace(/:/g, '').replace(' рублей', '.00');
        }

        const h = line.match(/(.*?)(&nbsp;| )+([0-9 ]+)\..*/);
        //console.log(h);

        // is header?
        if (h && line.indexOf(':') == -1) {
          const name = h[1];
          const price = h[3];

          // section end
          if (newlines.length > 0) {
            newlines.push('</ul><br />');
            outSectionSummary();
          }

          // save int price
          headerPrices.push(parseInt(price.replace(/ /g, '')));

          newlines.push(`<b>${name}:&nbsp;${price} рублей</b>`);

          newlines.push('<ul>');
        } else {
          const item = line.match(
            /(.*?):\s([0-9\s&nbsp;]+[&nbsp;\s]+руб\.)(, старая цена:)?([0-9\s\.&nbsp;]+(руб\.)?)? ?(.*)?/
          );
          //console.log(item);

          // non-standard line
          if (!item) {
            newlines.push(`<li style="margin-bottom:1em">${line}</li>`);
            continue;
          }

          const name = item[1];
          let price = item[2];

          // double conversion fix
          if (item[5]) {
            price = item[4].trim();
          }

          let desc = '';
          if (item[6]) {
            // remove .)
            desc = item[6].replace('.)', ')');

            // style desc
            desc = ` <span style="color:#7f8c8d"><em>${desc}</em></span>`;
          }

          // old price
          if (item[4] && item[4].trim()) {
            //console.log(item);
            let oldprice;

            // double conversion fix, для строк типа 9 900 руб. 5 500 руб.
            if (item[5]) {
              oldprice = item[2];
              price = item[4].trim();
            } else {
              oldprice = item[4];
            }

            oldprice = oldprice
              .replace(' руб.', '')
              .replace(/&nbsp;/g, '')
              .replace('.00', ' руб.')
              .trim();
            price = price
              .replace(/&nbsp;/g, '')
              .replace('руб.', '')
              .replace(/\s/g, '');

            let discont = parseInt(oldprice) - parseInt(price);
            discontSection += discont;

            oldprice = new Intl.NumberFormat().format(parseInt(oldprice));
            price = price.replace(/\s/g, '&nbsp;') + '&nbsp;руб.';
            //console.log(item[4]);
            price = `<s>${oldprice}&nbsp;руб.</s> ${price}`;
          } else {
            price = price.replace(/&nbsp;/g, ' ').replace(' руб.', '') + ' руб.';
            price = price.replace(/\s/g, '&nbsp;');
          }

          newlines.push(`<li style="margin-bottom:1em">${name}: ${price}${desc}</li>`);
        }
      }

      // last section end
      newlines.push('</ul><br />');
      outSectionSummary();

      // summary:
      let sumPrice = headerPrices.reduce((a, c) => a + c);
      let oldsumPrice = new Intl.NumberFormat().format(sumPrice + discontTotal);
      sumPrice = new Intl.NumberFormat().format(sumPrice);
      const discontTotalFormat = new Intl.NumberFormat().format(discontTotal);
      const plural = getPlural(discontTotal, 'рубль', 'рубля', 'рублей');
      let discontText = discontTotal ? `, экономия ${discontTotalFormat} ${plural}` : '';
      let oldsumText = discontTotal ? `<s>${oldsumPrice} рублей</s> ` : '';
      newlines.push(`<b>Итого за все этапы: ${oldsumText}${sumPrice} рублей${discontText}</b>`);

      return `<p>${newlines.join('\n')}</p>`;
    },

    // get selection html from ckeditor
    getSelectionHtml(editor) {
      const sel = editor.getSelection();
      const ranges = sel.getRanges();
      const el = new win.CKEDITOR.dom.element('div');
      for (let i = 0, len = ranges.length; i < len; ++i) {
        el.append(ranges[i].cloneContents());
      }
      return el.getHtml();
    },

    // main function
    run() {
      const editor = win.CKEDITOR.instances.ActionDescription;
      const html = smetaStyle.getSelectionHtml(editor);
      const styledHtml = smetaStyle.processHtml(html);

      editor.insertHtml(styledHtml);
      //document.getElementsByClassName('b-task-description')[0].innerHTML = styledHtml;
      //console.log('html: '+html);
    },
  };

  // сортировать смету, https://tagilcity.planfix.ru/task/608083
  const smetaOrder = function (opts) {
    opts = {
      ...{
        analiticAid: 314, // смета на разработку
        orderByFids: [950, 1093], // тип работ, №
      },
      ...opts,
    };

    const t = $('[data-aid="' + opts.analiticAid + '"] .tbl-list');
    const rows = t.find('tr');
    const rowsData = [];

    // собираем массив с данными таблицы (ключ-значение по fid)
    // сохраняем также ссылку на DOM-элемент ряда
    rows.each(function () {
      const r = $(this);
      if (r.find('.td-head').length > 0) return;

      const rowData = {
        elem: this,
      };

      r.find('td').each(function () {
        const td = $(this);

        const fid = td.find('[data-fid]').data('fid');
        // ignore subfids
        if (!fid || fid.toString().indexOf(':') !== -1) return;

        const val = td.find('input:hidden').val();

        rowData[fid] = val;
      });

      rowsData.push(rowData);
    });

    // сортируем массив данных по нужным колонкам, предполагаем, что там int/float
    const rowsDataSorted = rowsData.concat().sort((a, b) => {
      for (let sfid of opts.orderByFids) {
        if (a[sfid] == b[sfid]) continue;

        // remove "
        a[sfid] = a[sfid].replace(/"/g, '').replace(/,/g, '.');
        //console.log(a[sfid]);
        b[sfid] = b[sfid].replace(/"/g, '').replace(/,/g, '.');
        //console.log(`a[${sfid}]:${a[sfid]}, b[${sfid}]:${b[sfid]}, a>b: ${parseFloat(a[sfid]) > parseFloat(b[sfid])}`);
        return parseFloat(a[sfid]) > parseFloat(b[sfid]) ? 1 : -1;
      }
      return 0;
    });
    const newrows = [];
    //console.log(rowsData);
    //console.log(rowsDataSorted);

    // прогоняем оригинальный массив, но вписываем туда значения из сортированного массива
    rowsData.map(function (row, ind) {
      const elem = $(row.elem);
      const newData = rowsDataSorted[ind];
      for (let fid in newData) {
        elem.find('[data-fid="' + fid + '"] input:hidden').val(newData[fid]);
      }
    });

    // обозначаем окончание цветом (визуально данные не поменяются)
    t.css('background', '#e5ffe5');
    alert(`Использование:
1. Сделать копию задачи
2. Открыть в копии редактор аналитик. Не должно быть отредактированных полей, то есть открыли и сразу переходим к следующему шагу.
3. Запустить сниппет
4. Таблица окрасится в зелёный цвет, это значит, что сортировка прошла
5. Нажать "Сохранить аналитику"
6. Открыть оригинальную задачу и скопированную отсортированную, проверить, что сортировка прошла правильно
7. Удалить копию, прогнать шаги 2-5 на оригинале`);
  };

  /**
   * Копирует аналитики "Смета на разработку" в "Реализация"
   */
  const smetaToRelization = function () {
    const smetaTable = $('[data-aid="314"] .tbl-list');
    smetaTable.find('tr').each(function () {
      const tr = $(this);
      if (tr.find('input').length == 0) return;

      const d = new Date();

      const name = tr.find('[data-fid="934"]').text().trim();
      const itemPrice = tr.find('[data-fid="934:h1016"]').text();
      const customPrice = tr.find('[data-fid="1089"]').text();
      const price = customPrice ? customPrice : itemPrice;
      const date = pad(d.getDate()) + '-' + pad(1 + d.getMonth()) + '-' + d.getFullYear();

      PlanfixFix._addRealization({
        name: name,
        group: 'Реализация',
        price: price,
        date: date,
      });
    });
  };

  const pad = function (num) {
    const A = num.toString();
    if (A.length > 1) return A;
    else return ('00' + A).slice(-2);
  };

  $(function () {
    PlanfixFix.init();
  });
})();
