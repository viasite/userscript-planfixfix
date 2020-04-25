// smeta.js
// console.log('include smeta.js');
win = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
var $ = win.$;

// оформление сметы в 1 клик, https://tagilcity.planfix.ru/task/604890
const pffSmeta = {
  addActions() {
    if (
        Current.logined == win.PFF.adminId ||
        win.PFF.isManager()
    ) {
      win.PFF.addTaskBlock('|');
      win.PFF.addTaskBlock('Оформить смету', pffSmeta.run);
    }
  },

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

    const outSectionSummary = function() {
      let lastPrice = headerPrices[headerPrices.length - 1];
      lastPrice = new Intl.NumberFormat().format(lastPrice);
      discontTotal += discontSection;

      const discontSectionFormat = new Intl.NumberFormat().format(
          discontSection);
      const plural = getPlural(discontSection, 'рубль', 'рубля', 'рублей');
      let discontText = discontSection
          ? `, экономия ${discontSectionFormat} ${plural}`
          : '';
      newlines.push(
          `<b>Итого: ${lastPrice} рублей${discontText}</b><br /><br /><br /><br />`);
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
      if (line.match(/^Общий бюджет на запуск сайта.*?:/)) continue;

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
            /(.*?):\s([0-9\s&nbsp;]+[&nbsp;\s]+руб\.)(, старая цена:)?([0-9\s\.&nbsp;]+(руб\.)?)? ?(.*)?/,
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
        /*if (item[5]) {
          price = item[4].trim();
        }*/

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
          /*if (item[5]) {
            oldprice = item[2];
            price = item[4].trim();
          } else {
            oldprice = item[4];
          }*/
          oldprice = item[4];

          oldprice = oldprice.replace(/&nbsp;/g, '').
              replace('руб.', '').
              replace('.00', ' руб.').
              trim();
          price = price.replace(/&nbsp;/g, '').
              replace('руб.', '').
              replace(/\s/g, '');

          let discont = parseInt(oldprice) - parseInt(price);
          discontSection += discont;

          oldprice = new Intl.NumberFormat().format(parseInt(oldprice));
          price = price.replace(/\s/g, '&nbsp;') + '&nbsp;руб.';
          //console.log(item[4]);
          price = `${price}, старая цена: <s>${oldprice}&nbsp;руб.</s> `;
        } else {
          price = price.replace(/&nbsp;/g, ' ').replace(' руб.', '') + ' руб.';
          price = price.replace(/\s/g, '&nbsp;');
        }

        newlines.push(
            `<li style="margin-bottom:1em">${name}: ${price}${desc}</li>`);
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
    let discontText = discontTotal
        ? `, экономия ${discontTotalFormat} ${plural}`
        : '';
    let oldsumText = discontTotal ? `<s>${oldsumPrice} рублей</s> ` : '';
    newlines.push(
        `<b>Общий бюджет на запуск сайта: ${oldsumText}${sumPrice} рублей${discontText}</b>`);

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
    const html = pffSmeta.getSelectionHtml(editor);
    const styledHtml = pffSmeta.processHtml(html);

    editor.insertHtml(styledHtml);
    //document.getElementsByClassName('b-task-description')[0].innerHTML = styledHtml;
    //console.log('html: '+html);
  },

  // сортировать смету, https://tagilcity.planfix.ru/task/608083
  order(opts) {
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
    rows.each(function() {
      const r = $(this);
      if (r.find('.td-head').length > 0) return;

      const rowData = {
        elem: this,
      };

      r.find('td').each(function() {
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
    rowsData.map(function(row, ind) {
      const elem = $(row.elem);
      const newData = rowsDataSorted[ind];
      for (let fid in newData) {
        elem.find('[data-fid="' + fid + '"] input:hidden').val(newData[fid]);
      }
    });

    // обозначаем окончание цветом (визуально данные не поменяются)
    t.css('background', '#e5ffe5');
    setTimeout(
        () => { t.parents('.analitics-form').find('.btn-create').click(); },
        1000);
    /*alert(`Использование:
    1. Сделать копию задачи
    2. Открыть в копии редактор аналитик. Не должно быть отредактированных полей, то есть открыли и сразу переходим к следующему шагу.
    3. Запустить сниппет
    4. Таблица окрасится в зелёный цвет, это значит, что сортировка прошла
    5. Нажать "Сохранить аналитику"
    6. Открыть оригинальную задачу и скопированную отсортированную, проверить, что сортировка прошла правильно
    7. Удалить копию, прогнать шаги 2-5 на оригинале`);*/
  },

  /**
   * Копирует аналитики "Смета на разработку" в "Реализация"
   */
  toRelization() {
    const smetaTable = $('[data-aid="314"] .tbl-list');
    smetaTable.find('tr').each(function() {
      const tr = $(this);
      if (tr.find('input').length == 0) return;

      const d = new Date();

      const name = tr.find('[data-fid="934"]').text().trim();
      const itemPrice = tr.find('[data-fid="934:h1016"]').text();
      const customPrice = tr.find('[data-fid="1089"]').text();
      const price = customPrice ? customPrice : itemPrice;
      const date = pad(d.getDate()) + '-' + pad(1 + d.getMonth()) + '-' +
          d.getFullYear();

      pffSmeta._addRealization({
        name: name,
        group: 'Реализация',
        price: price,
        date: date,
      });
    });
  },

  /**
   * Добавляет аналитику "Реализация"
   */
  _addRealization: function(opts) {
    const PFF = win.PFF;
    opts = {
      ...{count: 1},
      ...opts,
    };
    var deferred = $.Deferred();

    PFF.deferred.then(function() {
      // добавить другую аналитику
      $('[data-action="add-new-analitic"]').click();

      setTimeout(() => {
        const div = $('.analitics-form').last();
        if (opts.scrollTo) PFF.scrollTo(div);

        setTimeout(() => {
          // выбор группы аналитик
          var select = div.find('select');
          if (PFF.debug) console.log('select', select);
          const option = select.find('option').filter(function() {
            return $(this).text() == opts.group;
          });
          select.val(option.val()).change();

          const analitic = div.find(
              '[data-aname="' + opts.group + '"] .af-tbl-tr').last();
          if (PFF.debug) console.log('analitic', analitic);

          const select_handbook = analitic.find(
              'select[data-handbookid]:first');
          if (PFF.debug) console.log('select_handbook', select_handbook);
          select_handbook.trigger('liszt:focus');

          setTimeout(() => {
            analitic.addClass('silentChosen');
            analitic.find('.chzn-search:first input').
                val(opts.name) /*.focus()*/
                .
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

};
