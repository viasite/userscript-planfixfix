(function () {
win = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
var $ = win.$;

function debug() {
  if (PFF.debug) console.log(...arguments);
}

win.onerror = function (error, file, line) {
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

  fields: {
    vyrabotka: {
      name: '[data-fid="741"] select',
      count: '[data-fid="747"] input',
      comment: '[data-fid="749"] textarea',
      hours_per_count: '.analitic-data[data-fid="741:h915"]'
    },
    realization: {
      count: '[data-fid="990"] input',
      price: '[data-fid="994"] input',
      date: '[data-fid="996"] input'
    },
  },
  // Шаблоны
  tmplsRecord: {
    handbook: 146, // id справочника
    name: 960, // id названия
    text: 962 // id текста
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

  init: function () {
    // init once
    if ($('body').hasClass('pff_inited')) return false;
    $('body').addClass('pff_inited');

    // не пугаем планфикс своими ошибками
    win.onerror = function () {
      return;
    };

    // очередь аналитик
    PFF.resetDeferred();

    PFF.actionAlter();

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
  addCustomAnalitics: function () {
    // показывается в задаче, где одно и то же планируется на каждый день
    if (win.PlanfixPage.task == 116702) {
      var dates = PFF.getDates(1, 5);
      var analitics_arr = $.map(dates, function (date) {
        return {
          group: 'Планируемое время работы',
          date: date,
          begin: '09:00',
          end: '09:30',
        };
      });
      PFF.addTaskBlock('План на неделю', analitics_arr);

      PFF.addTaskBlock('План на день', { name: 'План на день', count: 1 });
    }

    PFF.addTaskBlock('План', '[Планируемое время работы]');
    PFF.addTaskBlock('|');
    PFF.addTaskBlock('Выработка', {});
    PFF.addTaskBlock('|');

    var userPost = Current.loginedPost;
    switch (userPost) {
      case 'Программист':
        PFF.addTaskBlock('Программирование', { name: 'Поминутная работа программиста' });
        break;
      case 'Менеджер по сопровождению заказов':
        PFF.addTaskBlock('тел. лёгкий', { name: 'Лёгкий разговор по телефону' });
        PFF.addTaskBlock('тел. обычный', { name: 'Обычный разговор по телефону' });
        PFF.addTaskBlock('тел. сложный', { name: 'Сложный разговор по телефону' });
        PFF.addTaskBlock('письмо лёгкое', { name: 'Лёгкое письмо' });
        PFF.addTaskBlock('письмо обычное', {
          name: 'Письмо средней сложности / обычное письмо',
        });
        PFF.addTaskBlock('письмо сложное', { name: 'Сложное письмо' });
        break;
    }

    if (
      Current.logined == 9230 ||
      userPost == 'Менеджер по сопровождению заказов' ||
      userPost == 'Руководитель отдела продаж'
    ) {
      PFF.addTaskBlock('|');
      PFF.addTaskBlock('Инструкция', { group: 'Особые пометки', name: 'Инструкции' });
      PFF.addTaskBlock('|');
      PFF.addTaskBlock('Оформить смету', smeta.run);
    }

    // парсим массив подготовленных аналитик
    PFF.getAnalitics().then(function (tasks) {
      PFF.addTaskBlock('|');
      $.each(tasks, function (i, task) {
        PFF.addTaskBlock(task.name, task.analitics);
      });
    });

    // быстрые ответы
    PFF.getTemplates().then(function (tmpls) {
      PFF.addTextTemplates(tmpls);
    });

    // тестовый вызов добавления аналитики
    /* if (PFF.debug) {
      PFF.addTaskBlock('|');
      PFF.addTaskBlock('Удалить все', function () { // удалить аналитики из действия
        $('.task-add-analitic').click();
        setTimeout(function () {
          $('[data-action="remove-all-analitics"]').click();
        }, 200);
      });
    } */
  },

  insertTemplate(textRaw) {
    const editor = win.CKEDITOR.instances.ActionDescription;
    let text = textRaw.replace(/\n/g, '<br>');

    text = text.replace(/---.*/, '').replace(/<p>$/, ''); // отсекаем примечания

    const tokens = text.match(/(%[a-zа-яё_-]+%)/gi);
    if (tokens) {
      const inputs = tokens.map((token) => {
        const name = token.replace(/%/g, '').replace(/_/g, ' ');
        let cls = 'text-box'
        if(name.match(/Дата/)) cls += ' dialog-date';
        return `<span class="task-create-field task-create-field-custom-99 task-create-field-line-first task-create-field-break-after">
              <span class="task-create-field-label task-create-field-label-first">${name}</span>
              <span class="task-create-field-input"><input name="${name}" data-token="${token}" type="text" class="${cls}" /></span>
              </span>`;
      });

      const btns = `
<div class="dialog-btn-wrapper">
<button class="btn-main btn-create action-edit-save js-action-pff-insert-template">Вставить</button>
<button class="btn-main btn-cancel">Отмена</button>
</div>`;

      const html =
        '<div class="pff-tmpl-form">' +
        '<div class="task-create-panel-fields">' +
        inputs.join('\n') +
        '</div>' +
        `<div class="pff-tmpl-preview">${text}</div>` +
        btns +
        '</div>';

      const dialog = new win.CommonDialogScrollableJS();
      dialog.closeByEsc = true;
      dialog.isMinimizable = true;
      dialog.draw(html);
      dialog.setHeader('Вставка шаблона');
      dialog.setCloseHandler(
        () =>
          new Promise((resolve, reject) => {
            let isValid = true;
            $('.pff-tmpl-form input').each(function () {
              if ($(this).val() == '') {
                isValid = false;
              }
            });
            if (isValid) {
              editor.insertHtml($('.pff-tmpl-preview').html());
              resolve(true);
            } else {
              reject('required');
            }
          })
      );
      //win.drawDialog(300, 'auto', 300, html);

      const redrawPreview = () => {
        let pt = text;
        $('.pff-tmpl-form input').each(function () {
          const input = $(this);
          const t = input.data('token');
          const v = input.val();
          if (v == '') pt = pt.replace(t, `<span style="background:#ffff00">${t}</span>`);
          else pt = pt.replace(t, v);
        });
        $('.pff-tmpl-preview').html(pt);
      };

      setTimeout(() => {
        redrawPreview();
        $('.pff-tmpl-form input').on('keypress blur change', () => { setTimeout(redrawPreview, 50); });
        $('.pff-tmpl-form input').first().focus();
        $('.pff-tmpl-form .btn-cancel').click(() => { dialog.close(); });
        $('.js-action-pff-insert-template').click(() => {
          editor.insertHtml($('.pff-tmpl-preview').html());
          dialog.close();
          //$('.pff-tmpl-form').parents('.dialogWin').find('.destroy-button').click();
        });
      }, 100);
    } else {
      editor.insertHtml(text);
    }
  },

  updateTmplsMRU({id, name, text, cat}) {
    const mru = localStorage.pff_templates_mru ? JSON.parse(localStorage.pff_templates_mru) : {};
    if(mru[id]){
      mru[id].text = text;
      mru[id].cat = cat;
      mru[id].count++;
    }
    else {
      mru[id] = { id, name, text, cat, count: 1 };
    }
    localStorage.pff_templates_mru = JSON.stringify(mru);
  },

  // кнопка "вставить шаблон" в редакторе
  templateSelect: function() {
    var editor = CKEDITOR.instances.ActionDescription;
    editor.fire('pffTemplatesOpened');

    var editorSelection = editor.getSelection();
    var caretPosition = editorSelection.getRanges();

    var handbookSelectDialog = new HandbookSelectDialogJS();

    setTimeout(() => {
      $(`[data-handbookid="${PFF.tmplsRecord.handbook}"]`).click();
      setTimeout(() => {
        $(`[data-columnid="${PFF.tmplsRecord.name}"]`).click()
      }, 700);
    }, 1000);

    handbookSelectDialog.onInsertData = function(type, exportData) {
      editor.focus();

      setTimeout(function() {
        editor.getSelection().selectRanges(caretPosition);
        if ('record' == type) {
          const opts = {
            command: 'handbook:getDataStringByKey',
            handbook: exportData.handbookId,
            key: exportData.key
          };
          AjaxJS.request({
            data: opts,
            success: (data) => {
              let id = exportData.key, name, text;
              let cat = data.NamedPath[0]?.Name || 'Общие';
              for (f of data.Items[0].String) {
                if(f.Field.ID == PFF.tmplsRecord.name){
                  name = f.Value;
                }
                if(f.Field.ID == PFF.tmplsRecord.text){
                  text = f.Value;
                  PFF.insertTemplate(text);
                }
              }
              PFF.updateTmplsMRU({id, name, text, cat});
            }
          });

        } else if('text' == type) {
          PFF.insertTemplate(exportData.text);
        }
      }, 200);
    };

    handbookSelectDialog.onClose = function() {
      editor.fire('pffTemplatesClosed');
    };

    handbookSelectDialog.drawDialog(); // editor.extraHandbookData
  },


  // быстрые ответы в редактор
  addTextTemplates: function (tmpls) {
    const tplsBlock = $('<div class="pff-tpls-content"></div>');

    PFF.addTaskBlock('Шаблон', PFF.templateSelect);

    for (let cat in tmpls) {
      const catDiv = $(`<div class="pff-cat-content"></div>`);
      for (let tpl in tmpls[cat]) {
        let item = tmpls[cat][tpl];
        if(typeof tmpls[cat][tpl] == 'string') item = { name: tpl, text: tmpls[cat][tpl] };
        const textRaw = item.text.replace(/^\n/, '');
        const title = textRaw.replace(/"/g, "'").replace(/<p>/g, '').replace(/<br ?\/?>/g, '\n');
        let link = 'javascript:';
        if(item.id) link = `https://${location.hostname}/?action=handbookdataview&handbook=${PFF.tmplsRecord.handbook}&key=${item.id}`;
        catDiv.append(
          $(`<a href="${link}" title="${title}">${item.name.replace(/ /g, '&nbsp;')}</a>`).click(
            () => {
              PFF.insertTemplate(textRaw);
              return false;
            }
          )
        );
      }
      tplsBlock.append(
        $(`<div class="pff-cat"><span class="pff-cat-title">${cat}:</span> </div>`).append(catDiv)
      );
    }
    $('.task-add-block')
      .last()
      .after(
        $(
          '<div class="pff-tpls"><span class="pff-tpls-title"><b>Шаблоны</b></span></div>'
        ).append(tplsBlock)
      );
  },

  /**
   * Переопределяет стили
   */
  addStyles: function () {
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
</style>`
    );
  },

  actionAlter: function () {
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
        if (PFF.debug) console.log('after createAction');
        PFF.addCustomAnalitics();
      });
    };
    /*win.ActionJS.prototype.createNewAction = function() {
      this.createNewAction_orig();
      if (PFF.debug) console.log('after createNewAction');
      setTimeout(PFF.addCustomAnalitics, 2000);
    };*/
    win.ActionJS.prototype.editDraft = function (draftid, task, insertBefore, actionList) {
      this.editDraft_orig(draftid, task, insertBefore, actionList);
      if (PFF.debug) console.log('after editDraft');
      setTimeout(PFF.addCustomAnalitics, 1000);
    };
    win.ActionJS.prototype.edit = function (id, task, data, actionNode) {
      this.edit_orig(id, task, data, actionNode);
      setTimeout(PFF.addCustomAnalitics, 1000);
    };
    /*win.ActionJS.restoreAnaliticsForEdit = function(data){
      win.ActionJS.restoreAnaliticsForEdit_orig(data);
      setTimeout(PFF.countTotalAnalitics, 2000);
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
          // кнопка "Реализовать"
          addAnaliticAction('Реализовать', smetaToRelization);

          // кнопка "Сортировать смету"
          addAnaliticAction('Сортировать смету', smetaOrder);

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

    /*$('body').delegate(PFF.fields.vyrabotka.count, 'change keypress', PFF.countTotalAnalitics);
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
   */
  addAnalitics: function (analitics_arr) {
    analitics_arr = PFF.normalizeAnalitics(analitics_arr);
    $.each(analitics_arr, function (i, opts) {
      PFF._addAnalitic(opts);
    });
    PFF.deferred.then(PFF.countTotalAnalitics);
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
   * Добавление идет через PFF.deferred, очередь добавления
   * В deferred создержится последняя добавляемая аналитика
   * @param {object} opts { name, group, count, scrollTo, select }
   */
  _addAnalitic: function (opts) {
    var deferred = $.Deferred();

    PFF.deferred.then(function () {
      $('.task-add-analitic').click();

      var timeout = $('.analitics-form').size() === 0 ? 500 : 10;
      //var timeout = 2000;
      setTimeout(function () {
        var div = $('.analitics-form').last();
        if (opts.scrollTo) PFF.scrollTo(div);

        setTimeout(function () {
          // выбор группы аналитик
          var select = div.find('select');
          if (PFF.debug) console.log('select', select);

          var option = select.find('option').filter(function () {
            return $(this).text() == opts.group;
          });
          select.val(option.val()).change();

          var analitic = div.find('.af-tbl-tr');
          if (PFF.debug) console.log('analitic', analitic);

          var select_handbook = analitic.find('select[data-handbookid]:first');
          if (PFF.debug) console.log('select_handbook', select_handbook);
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
                if (PFF.debug) console.log('results', results);
                if (results.length == 1 || opts.select) {
                  results.first().mouseup();
                  analitic.find(PFF.fields.vyrabotka.count).focus();
                }
                // задержка из-за лага chosen
                setTimeout(function () {
                  if (count_focused) return;
                  count_focused = true;
                  analitic.removeClass('silentChosen');

                  if (opts.count) {
                    analitic.find(PFF.fields.vyrabotka.count).val(opts.count);
                    analitic.find(PFF.fields.vyrabotka.comment).focus();
                  } else {
                    analitic
                      .find(PFF.fields.vyrabotka.count)
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

    PFF.deferred = deferred;
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

    PFF.deferred.then(function () {
      // добавить другую аналитику
      $('[data-action="add-new-analitic"]').click();

      setTimeout(() => {
        const div = $('.analitics-form').last();
        if (opts.scrollTo) PFF.scrollTo(div);

        setTimeout(() => {
          // выбор группы аналитик
          var select = div.find('select');
          if (PFF.debug) console.log('select', select);
          const option = select.find('option').filter(function () {
            return $(this).text() == opts.group;
          });
          select.val(option.val()).change();

          const analitic = div.find('[data-aname="' + opts.group + '"] .af-tbl-tr').last();
          if (PFF.debug) console.log('analitic', analitic);

          const select_handbook = analitic.find('select[data-handbookid]:first');
          if (PFF.debug) console.log('select_handbook', select_handbook);
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
              if (PFF.debug) console.log('results', results);
              if (results.length == 1 || opts.select) {
                results.first().mouseup();
                analitic.find(PFF.fields.vyrabotka.count).focus();
              }
              // задержка из-за лага chosen
              setTimeout(() => {
                if (count_focused) return;
                count_focused = true;
                analitic.removeClass('silentChosen');

                if (opts.count) {
                  analitic.find(PFF.fields.realization.count).val(opts.count);
                }
                if (opts.price) {
                  analitic.find(PFF.fields.realization.price).val(opts.price);
                }
                if (opts.date) {
                  analitic.find(PFF.fields.realization.date).val(opts.date);
                }
              }, 2000);

              deferred.resolve();
            });
          }, 500);
        });
      }, 500);
    });

    PFF.deferred = deferred;
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
        PFF.resetDeferred();
        if ($.isArray(action) || typeof action == 'object' || typeof action == 'string') {
          PFF.addAnalitics(action);
        } else if ($.isFunction(action)) {
          action();
        }
      });
    //if (PFF.debug) console.log(block);
    if ($.isArray(action) || typeof action == 'object' || typeof action == 'string') {
      var analitics = $.map(PFF.normalizeAnalitics(action), function (analitic) {
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
    if (PFF._analitics.length === 0) {
      var mtime = localStorage.pff_analitics_mtime || new Date().getTime();
      var cache_age = new Date().getTime() - mtime;
      if (cache_age > PFF.analitics_remote_cache_lifetime * 1000) {
        PFF.clearCache();
      }
      PFF._analitics = $.parseJSON(localStorage.pff_analitics) || [];

      /*if(PFF._analitics.length===0){
                    deferred = PFF.parseRemoteAnalitics(
                        PFF.getRemoteAnaliticsUrl()
                    );
                }*/
    }
    if (PFF._analitics.length > 0) {
      deferred.resolve(PFF._analitics);
    }
    return deferred.promise();
  },

  /**
   * Отдает promise, в нем шаблоны ответов
   * Отдает кешированные шаблоны
   * Или грузит по урлу и отдает, здесь же проверяется свежесть кеша
   * Удаленные возвращают умолчальные шаблоны в случае неудачи
   */
  getTemplates: function () {
    return new Promise((resolve, reject) => {
      var mtime = localStorage.pff_templates_mtime || new Date().getTime();
      var cache_age = new Date().getTime() - mtime;
      if (cache_age > PFF.templates_remote_cache_lifetime * 1000) {
        delete localStorage.pff_templates;
      }

      if (!localStorage.pff_templates) {
        const remoteUrl = PFF.getRemoteTemplatesUrl();
        if(remoteUrl.url){
          PFF.parseRemoteTemplates().then((tmpls) => {
            resolve(tmpls);
          });
        }
        else if(localStorage.pff_templates_mru) {
          // convert mru to text templates
          const mru = JSON.parse(localStorage.pff_templates_mru);
          let items = [];
          for(let id in mru) {
            items.push(mru[id]);
          }
          items.sort((a, b) => {
            if(a.count > b.count) return -1;
            if(a.count < b.count) return 1;
            return 0;
          });

          let defaultCat = 'Часто используемые'; // TODO: var
          const tmpls = {[defaultCat]: []};
          let itemsObj = {}
          for(let item of items) {
            itemsObj[item.name] = item.text;
            if(!item.cat) item.cat = defaultCat;
            if(!tmpls[item.cat]) tmpls[item.cat] = [];
            tmpls[item.cat].push(item)
          }

          resolve(tmpls);
        }
      } else {
        const tmpls = JSON.parse(localStorage.pff_templates) || {};
        debug('use cached templates:', tmpls);
        resolve(tmpls);
      }
    });
  },

  /**
   * Умолчальные аналитики (задачи) из массива
   */
  getDefaultAnalitics: function () {
    var tasks = [];
    $.each(PFF.analitics_default, function (i, item) {
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
    var store = $.parseJSON(localStorage.pff_remote_analitics_url);
    return store || PFF.analitics_remote_default;
  },

  /**
   * Возвращает сохраненный или дефолтный урл
   */
  getRemoteTemplatesUrl: function () {
    var store = $.parseJSON(localStorage.pff_remote_templates_url);
    return store || PFF.templates_remote_default;
  },

  /**
   * Сохраняет урл удаленных аналитик,
   * Если пусто или изменено, чистим кеш
   */
  setRemoteAnaliticsUrl: function (remote) {
    if (remote.url == PFF.analitics_remote_default.url) {
      return true;
    }
    if (remote.url === '') {
      delete localStorage.pff_remote_analitics_url;
      PFF.clearCache();
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
    PFF.clearCache();
    localStorage.pff_remote_analitics_url = JSON.stringify(remote);
    return true;
  },

  /**
   * Сохраняет урл удаленных аналитик,
   * Если пусто или изменено, чистим кеш
   */
  setRemoteTemplatesUrl: function (remote) {
    if (remote.url == PFF.templates_remote_default.url) {
      return true;
    }
    if (remote.url === '') {
      delete localStorage.pff_remote_templates_url;
      delete localStorage.pff_templates;
      return true;
    }
    if (!remote.url.match(/^https:\/\//)) {
      alert('Возможны только https URL');
      return false;
    }
    if (remote.format != 'yml') {
      alert('Возможны только yml файлы');
      return false;
    }
    delete localStorage.pff_templates;
    localStorage.pff_remote_templates_url = JSON.stringify(remote);
    return true;
  },

  parseRemoteAnalitics: function (opts) {
    var deferred = $.Deferred();
    $.get(opts.url, function (data) {
      var tasks = [];
      if (opts.format == 'text') {
        tasks = PFF.text2tasks(data);
      }
      if (tasks.length > 0) {
        PFF._analitics = tasks;
        localStorage.pff_analitics = JSON.stringify(tasks);
        localStorage.pff_analitics_mtime = new Date().getTime();
      }
      if (tasks.length === 0) tasks = PFF.getDefaultAnalitics();
      deferred.resolve(tasks);
    });
    return deferred;
  },

  parseRemoteTemplates: function (opts) {
    return new Promise((resolve, reject) => {
      if (opts.format != 'yml') {
        console.log('only yml possible');
        return reject(false);
      }
      GM_xmlhttpRequest({
        method: 'GET',
        url: opts.url,
        onload: function (response) {
          const tpls = jsyaml.load(response.responseText);

          const tplsCount = Object.keys(tpls).length;
          if (tplsCount > 0) {
            debug('parsed remote templates:', tpls);
            PFF._tpls = tpls;
            localStorage.pff_templates = JSON.stringify(tpls);
            localStorage.pff_templates_mtime = new Date().getTime();
            resolve(tpls);
          } else {
            debug('failed parse remote templates:', response.responseText);
            resolve(PFF.getDefaultTemplates());
          }
        },
      });
    });
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
    delete localStorage.pff_analitics;
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

      var counts = $(PFF.fields.vyrabotka.count);
      var totals = 0;
      counts.each(function (i, count_field) {
        var analitic = $(count_field).parents('.add-analitic-block');
        var count = $(count_field).val();
        var hours_per_count = analitic
          .find(PFF.fields.vyrabotka.hours_per_count)
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
    PFF.deferred = $.Deferred().resolve();
  },

  /**
   * Добавляет пункт меню в главное меню "Еще"
   * Настройки скрипта:
   * - url для удаленной загрузки аналитик
   */
  addMenu: function () {
    $('<a href="javascript:" class="without-dragging main-menu-config-item">PFF</a>')
      .appendTo('.main-config-ddl-wrapper')
      .click(function () {
        var remoteAnalitics = PFF.getRemoteAnaliticsUrl();
        var remoteTemplates = PFF.getRemoteTemplatesUrl();
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
        $('.pff-settings [type="button"]').click(function () {
          var isSave = PFF.setRemoteAnaliticsUrl({
            url: $('[name="pff_analitics_remote_url"]').val(),
            format: 'text',
          });
          isSave = isSave && PFF.setRemoteTemplatesUrl({
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
win.PFF = PFF;
const pad = function (num) {
  const A = num.toString();
  if (A.length > 1) return A;
  else return ('00' + A).slice(-2);
};

$(function () {
  PFF.init();
});
})();
