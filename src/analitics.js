// analitics.js
// console.log('include analitics.js');
win = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
$ = $ || win.$;

const pffAnalitics = {
  addActions() {
    const PFF = win.PFF;
    PFF.addTaskBlock('План', '[Планируемое время работы]');
    PFF.addTaskBlock('|');
    PFF.addTaskBlock('Выработка', {});
    PFF.addTaskBlock('|');

    const userPost = Current.loginedPost;
    switch (userPost) {
      case 'Программист':
        PFF.addTaskBlock('Программирование',
            {name: 'Поминутная работа программиста'});
        break;
      case 'Менеджер по сопровождению заказов':
        PFF.addTaskBlock('тел. лёгкий', {name: 'Лёгкий разговор по телефону'});
        PFF.addTaskBlock('тел. обычный', {name: 'Обычный разговор по телефону'});
        PFF.addTaskBlock('тел. сложный', {name: 'Сложный разговор по телефону'});
        PFF.addTaskBlock('письмо лёгкое', {name: 'Лёгкое письмо'});
        PFF.addTaskBlock('письмо обычное', {
          name: 'Письмо средней сложности / обычное письмо',
        });
        PFF.addTaskBlock('письмо сложное', {name: 'Сложное письмо'});
        break;
    }

    PFF.addTaskBlock('|');
    PFF.addTaskBlock('Инструкция',
        {group: 'Особые пометки', name: 'Инструкции'});

    // парсим массив подготовленных аналитик
    pffAnalitics.getAnalitics().then(function(tasks) {
      PFF.addTaskBlock('|');
      $.each(tasks, function(i, task) {
        PFF.addTaskBlock(task.name, task.analitics);
      });
    });

    // тестовый вызов добавления аналитики
    /* if (PFF.isDebug) {
      PFF.addTaskBlock('|');
      PFF.addTaskBlock('Удалить все', function () { // удалить аналитики из действия
        $('.task-add-analitic').click();
        setTimeout(function () {
          $('[data-action="remove-all-analitics"]').click();
        }, 200);
      });
    } */
  },

  /**
   * Умолчальные аналитики (задачи) из массива
   */
  /*getDefaultAnalitics: function() {
    var tasks = [];
    $.each(PFF.analitics_default, function(i, item) {
      tasks.push({
        name: item[0],
        analitics: item[1],
      });
    });
    return tasks;
  },*/

  /**
   * Создает массив, элементы которого скармливаются в _addAnalitic() без изменений
   * Может парсить строки типа:
   * [Группа аналитик] Название аналитики - кол-во
   * Группа по умолчанию - Выработка
   */
  normalizeAnalitics: function(analitics_arr) {
    const analitics = [];
    if (!Array.isArray(analitics_arr)) analitics_arr = [analitics_arr];
    $.each(analitics_arr, function(i, opts) {
      const isFirst = i === 0;
      const isLast = i === analitics_arr.length - 1;
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

      const count = opts.name.match(/ - (\d+)$/) || '';
      if (count !== '') {
        opts.name = opts.name.replace(count[0], '');
        opts.count = count[1];
      }

      const group = opts.name.match(/^\[(.*?)] ?/) || '';
      if (group !== '') {
        opts.name = opts.name.replace(group[0], '');
        opts.group = group[1];
      }

      analitics.push(opts);
    });
    return analitics;
  },

  /**
   * добавляет все аналитики из массива
   */
  addAnalitics: function(analitics_arr) {
    analitics_arr = win.PFF.normalizeAnalitics(analitics_arr);
    $.each(analitics_arr, function(i, opts) {
      pffAnalitics._addAnalitic(opts);
    });
    //PFF.deferred.then(PFF.analitics.countTotalAnalitics);
  },

  /**
   * Добавляет аналитику в действие
   * Добавление идет через PFF.deferred, очередь добавления
   * В deferred создержится последняя добавляемая аналитика
   * @param {object} opts { name, group, count, scrollTo, select }
   */
  _addAnalitic: function(opts) {
    const PFF = win.PFF;
    const deferred = $.Deferred();

    PFF.deferred.then(function() {
      $('.task-add-analitic').trigger('click');

      const timeout = $('.analitics-form').length === 0 ? 500 : 10;
      //var timeout = 2000;
      setTimeout(function() {
        const div = $('.analitics-form').last();
        if (opts.scrollTo) PFF.scrollTo(div);

        setTimeout(function() {
          // выбор группы аналитик
          const select = div.find('select');
          PFF.debug('select', select);

          const option = select.find('option').filter(function() {
            return $(this).text() === opts.group;
          });
          select.val(option.val()).trigger('change');

          const analitic = div.find('.af-tbl-tr');
          PFF.debug('analitic', analitic);

          const select_handbook = analitic.find(
              'select[data-handbookid]:first');
          PFF.debug('select_handbook', select_handbook);
          select_handbook.trigger('liszt:focus');

          // выработка
          if (opts.name) {
            // выбор конкретной аналитики
            // задержка из-за того, что иногда выбирается выработка "заказ такси"
            setTimeout(function() {
              analitic.addClass('silentChosen');
              analitic.find('.chzn-search:first input').
                  val(opts.name).
                  trigger('keyup');
              let count_focused = false;
              select_handbook.on('liszt:updated', function() {
                const results = analitic.find('.chzn-results .active-result');
                // PFF.debug('results', results);
                if (results.length === 1 || opts.select) {
                  results.first().trigger('mouseup');
                  analitic.find(PFF.fields.vyrabotka.count).trigger('focus');
                }
                // задержка из-за лага chosen
                setTimeout(function() {
                  if (count_focused) return;
                  count_focused = true;
                  analitic.removeClass('silentChosen');

                  if (opts.count) {
                    analitic.find(PFF.fields.vyrabotka.count).val(opts.count);
                    analitic.find(PFF.fields.vyrabotka.comment).trigger('focus');
                  } else {
                    analitic.find(PFF.fields.vyrabotka.count).
                        trigger('focus').
                        on('keypress', function(e) {
                          if (e.which === 13) {
                            if (e.ctrlKey) {
                              $('[data-action="saveParent"]').trigger('click');
                            } else {
                              $('[data-action="save"]').trigger('click');
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
   * Чистит сохраненные аналитики, которые загружались удаленно
   */
  clearCache: function() {
    delete localStorage.pff_analitics;
  },

  /**
   * Возвращает сохраненный или дефолтный урл
   */
  getRemoteAnaliticsUrl: function() {
    const store = localStorage.pff_remote_analitics_url ? JSON.parse(localStorage.pff_remote_analitics_url) : false;
    return store || win.PFF.analitics_remote_default;
  },

  /**
   * Сохраняет урл удаленных аналитик,
   * Если пусто или изменено, чистим кеш
   */
  setRemoteAnaliticsUrl: function(remote) {
    if (remote.url === win.PFF.analitics_remote_default.url) {
      return true;
    }
    if (remote.url === '') {
      delete localStorage.pff_remote_analitics_url;
      pffAnalitics.clearCache();
      return true;
    }
    if (!remote.url.match(/^https:\/\//)) {
      alert('Возможны только https URL');
      return false;
    }
    if (remote.format !== 'text') {
      alert('Возможны только текстовые файлы');
      return false;
    }
    pffAnalitics.clearCache();
    localStorage.pff_remote_analitics_url = JSON.stringify(remote);
    return true;
  },

  /**
   * Отдает promise, в нем аналитики
   * Отдает кешированные аналитики
   * Или грузит по урлу и отдает, здесь же проверяется свежесть кеша
   * Удаленные возвращают умолчальные аналитики в случае неудачи
   */
  getAnalitics: function() {
    const PFF = win.PFF;
    const deferred = $.Deferred();
    if (PFF._analitics.length === 0) {
      const mtime = localStorage.pff_analitics_mtime || new Date().getTime();
      const cache_age = new Date().getTime() - mtime;
      if (cache_age > PFF.analitics_remote_cache_lifetime * 1000) {
        pffAnalitics.clearCache();
      }
      PFF._analitics = localStorage.pff_analitics ? JSON.parse(localStorage.pff_analitics) : [];

      /*if(PFF._analitics.length===0){
                    deferred = pffAnalitics.parseRemoteAnalitics(
                        pffAnalitics.getRemoteAnaliticsUrl()
                    );
                }*/
    }
    if (PFF._analitics.length > 0) {
      deferred.resolve(PFF._analitics);
    }
    return deferred.promise();
  },

  // не используется
  /*parseRemoteAnalitics: function(opts) {
    const deferred = $.Deferred();
    $.get(opts.url, function(data) {
      let tasks = [];
      if (opts.format === 'text') {
        tasks = pffAnalitics.text2tasks(data);
      }
      if (tasks.length > 0) {
        win.PFF._analitics = tasks;
        localStorage.pff_analitics = JSON.stringify(tasks);
        localStorage.pff_analitics_mtime = new Date().getTime();
      }
      if (tasks.length === 0) tasks = pffAnalitics.getDefaultAnalitics();
      deferred.resolve(tasks);
    });
    return deferred;
  },*/

  /**
   *
   * @param  {[string]} text текст, разделенный табами,
   * 0 табов - задача,
   * 1 таб - аналитика,
   * если в конце аналитики через дефис написана цифра - 1, она превратится в количество
   * @return массив, пригодный для addAnalitics()
   */
  /*text2tasks: function(text) {
    const lines = text.split('\n');
    let lastLevel = -1;
    const tasks = [];
    if (lines.length > 0) {
      let task = {};
      $.each(lines, function(i, line) {
        if (line === '') return;

        const level = line.match(/^\t*!/)[0].length;
        const text = $.trim(line);

        if (level === 0) {
          if (lastLevel !== -1) tasks.push(task);
          task = {name: text, analitics: []};
        }
        if (level === 1) {
          task.analitics.push(text);
        }
        lastLevel = level;
      });
      tasks.push(task);
    }
    return tasks;
  },*/

  /**
   * Считает, сколько всего минут во всех аналитиках действия,
   * Предупреждает, если есть незаполненные или ошибочные
   * больше не нужна
   */
  /*countTotalAnalitics: function() {
    setTimeout(function() {
      var count_div = $('.analitics-total-wrap');
      var btn = $('.tr-action-commit .btn:first, .action-edit-save');

      var highlight = function(state) {
        if (state) {
          count_div.css('color', 'red');
          btn.css('border-color', 'red');
        } else {
          count_div.css('color', 'inherit');
          btn.css('border-color', 'inherit');
        }
      };

      if (count_div.length === 0) {
        count_div = $('<div class="analitics-total-wrap"></div>').
            attr('style', 'float:right; margin-right:15px').
            html('Всего: <span class="analitics-total-count"></span>');
        $('.attach-new-analitic td.td-item-add-ex:first').append(count_div);
      }
      highlight(false);

      var counts = $(win.PFF.fields.vyrabotka.count);
      var totals = 0;
      counts.each(function(i, count_field) {
        var analitic = $(count_field).parents('.add-analitic-block');
        var count = $(count_field).val();
        var hours_per_count = analitic.find(
            win.PFF.fields.vyrabotka.hours_per_count).text().replace(',', '.');
        var hours = count * hours_per_count;
        if (count === '' || hours_per_count === '') highlight(true);
        totals += hours;
      });
      totals = (totals * 60).toFixed(1).replace(/\.0$/, '');
      if (isNaN(totals) || totals === 0) highlight(true);

      count_div.find('.analitics-total-count').html(totals);
    }, 10);
  },*/

};
