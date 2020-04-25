// analitics.js
// console.log('include analitics.js');
win = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
$ = win.$;

const pffAnalitics = {
  addActions() {
    const PFF = win.PFF;
    // показывается в задаче, где одно и то же планируется на каждый день
    // TODO: больше не используется
    if (win.PlanfixPage.task == 116702) {
      var dates = pffAnalitics.getDates(1, 5);
      var analitics_arr = $.map(dates, function(date) {
        return {
          group: 'Планируемое время работы',
          date: date,
          begin: '09:00',
          end: '09:30',
        };
      });
      PFF.addTaskBlock('План на неделю', analitics_arr);

      PFF.addTaskBlock('План на день', {name: 'План на день', count: 1});
    }

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

  /**
   * Возвращает массив дат d-m-Y от dayofweek в кол-ве count
   * Если текущая дата совпадает с dayofweek, берется сегодня,
   * иначе этот ближайший день недели
   */
  getDates(dayofweek, count) {
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
      dates.push(pad(d.getDate()) + '-' + pad(1 + d.getMonth()) + '-' +
          d.getFullYear());
      d.setTime(d.getTime() + 86400000);
    }

    return dates;
  },

  /**
   * Считает, сколько всего минут во всех аналитиках действия,
   * Предупреждает, если есть незаполненные или ошибочные
   * TODO: больше не нужна
   */
  countTotalAnalitics: function() {
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
  },

  /**
   * Умолчальные аналитики (задачи) из массива
   */
  getDefaultAnalitics: function() {
    var tasks = [];
    $.each(PFF.analitics_default, function(i, item) {
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
  getRemoteAnaliticsUrl: function() {
    var store = $.parseJSON(localStorage.pff_remote_analitics_url);
    return store || PFF.analitics_remote_default;
  },

  /**
   * Сохраняет урл удаленных аналитик,
   * Если пусто или изменено, чистим кеш
   */
  setRemoteAnaliticsUrl: function(remote) {
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
   * Отдает promise, в нем аналитики
   * Отдает кешированные аналитики
   * Или грузит по урлу и отдает, здесь же проверяется свежесть кеша
   * Удаленные возвращают умолчальные аналитики в случае неудачи
   */
  getAnalitics: function() {
    const PFF = win.PFF;
    var deferred = $.Deferred();
    if (PFF._analitics.length === 0) {
      var mtime = localStorage.pff_analitics_mtime || new Date().getTime();
      var cache_age = new Date().getTime() - mtime;
      if (cache_age > PFF.analitics_remote_cache_lifetime * 1000) {
        PFF.clearCache();
      }
      PFF._analitics = $.parseJSON(localStorage.pff_analitics) || [];

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

  parseRemoteAnalitics: function(opts) {
    var deferred = $.Deferred();
    $.get(opts.url, function(data) {
      var tasks = [];
      if (opts.format == 'text') {
        tasks = pffAnalitics.text2tasks(data);
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

  /**
   *
   * @param  {[string]} text текст, разделенный табами,
   * 0 табов - задача,
   * 1 таб - аналитика,
   * если в конце аналитики через дефис написана цифра - 1, она превратится в количество
   * @return массив, пригодный для addAnalitics()
   */
  text2tasks: function(text) {
    var lines = text.split('\n');
    var lastLevel = -1;
    var tasks = [];
    var task;
    $.each(lines, function(i, line) {
      if (line === '') return;

      var level = line.match(/^\t*/)[0].length;
      var text = $.trim(line);

      if (level === 0) {
        if (lastLevel != -1) tasks.push(task);
        task = {name: text, analitics: []};
      }
      if (level == 1) {
        task.analitics.push(text);
      }
      lastLevel = level;
    });
    if (lines.length > 0) tasks.push(task);
    return tasks;
  },

};
