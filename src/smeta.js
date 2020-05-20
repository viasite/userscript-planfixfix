// smeta.js
// console.log('include smeta.js');
win = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
$ = $ || win.$;

// оформление сметы в 1 клик, https://tagilcity.planfix.ru/task/604890
const pffSmeta = {
  addActions() {
    const PFF = win.PFF;
    if (PFF.isAdmin() || PFF.isManager()
    ) {
      PFF.addTaskBlock('|');
      PFF.addTaskBlock(
          'Оформить смету',
          pffSmeta.run,
          {class: 'no-only-selection'},
      );
    }
  },

  addAnaliticActions() {
    const PFF = win.PFF;
    const smetaAid = PFF.fields.smeta.aid;

    PFF.waitFor(`[data-aid="${smetaAid}"] .tbl-list`).then(smetaTable => {
      // смета на разработку
      if(smetaTable.length === 0) return;

      // кнопка "Реализовать"
      const realizeLink = PFF.addAnaliticAction('Реализовать', pffSmeta.toRelization, smetaAid);

      // кнопка "Сортировать смету"
      const sortLink = PFF.addAnaliticAction('Сортировать смету', pffSmeta.order, smetaAid);

      // удалить кнопки при изменении сметы
      smetaTable.on('click.pff_modified', () => {
        smetaTable.off('click.pff_modified');
        sortLink.remove();
        realizeLink.remove();
      });

      // удаление переноса контента
      const contentServices = smetaTable.find(PFF.fields.smeta.name).filter(function() {
        const text = $(this).text();
        return text.match(/Перенос контента/) || text.match(/Редиректы URL/);
      });
      if(contentServices.length > 0) {
        const link = PFF.addAnaliticAction(
            `Удалить перенос контента`,
            () => {
              contentServices.each(function(){
                const row = $(this).parents('tr');
                row.find('[data-acr="delete"]').trigger('click');
              });
              link.remove();
            }, smetaAid,
        );
      }

      // удаление аналитик по блокам (этапам)
      const sections = {};
      smetaTable.find(PFF.fields.smeta.block).each(function() {
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
        const link = PFF.addAnaliticAction(
            `Удалить ${sec.name} (${sec.count})`,
            () => {
              for (let row of sec.rows) {
                row.find('[data-acr="delete"]').trigger('click');
                row.remove();
              }
              link.remove();
            }, smetaAid,
        );
      }
    });
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
      if (line.replace(/(;nbsp| )/g, '') === '') continue;

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
      if (h && line.indexOf(':') === -1) {
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
            /(.*?):\s([0-9\s&nbsp;]+[&nbsp;\s]+руб\.)(, старая цена:)?([0-9\s.&nbsp;]+(руб\.)?)? ?(.*)?/,
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

  // вход в "Оформить смету"
  run() {
    // оформить
    if($('.pff_editor-selection').length > 0){
      const html = win.PFF.editorGetSelection();
      if(html.length === 0){
        win.show_sys_message('Сначала выделите текст сметы', 'ERROR', undefined, undefined, {})
        return;
      }

      const styledHtml = pffSmeta.processHtml(html);
      win.PFF.editorInsertHtml(styledHtml);
    }
    else {
      // сделать отчёт во всплывалке
      const link = `https://tagilcity.planfix.ru/?action=report&id=${win.PFF.fields.smeta.reportId}&task=${win.PlanfixPage.task}&run=1`;
      const linkTable = `https://tagilcity.planfix.ru/?action=report&id=${win.PFF.fields.smeta.reportTableId}&task=${win.PlanfixPage.task}&run=1`;
      const html = `<div class="pff-report-frame"><iframe src="${link}" width="100%" height="600"></iframe></div>`;

      // noinspection JSValidateTypes
      const dialog = new win.CommonDialogScrollableJS('pff-report-frame-wrapper');
      dialog.customClass = true;
      dialog.closeByEsc = true;
      dialog.isMinimizable = true;
      dialog.draw(html);
      dialog.setHeader('Отчёт');

      /**
       * @param iframe.contentWindow.ReportJS.expandLevel
       */
      const iframe = $('.pff-report-frame iframe').get(0);
      win.PFF.waitFor('.tbl-report', 1000, 10, iframe).then(() => {
        iframe.contentWindow.ReportJS.expandLevel(0);
        iframe.contentWindow.$('.report-view-ddl').after(`<a href="${linkTable}" target="_blank">В виде таблицы</a>`)
      });
    }
  },

  // сортировать смету, https://tagilcity.planfix.ru/task/608083
  order(opts) {
    opts = {
      ...{
        analiticAid: win.PFF.fields.smeta.aid,
        orderByFids: win.PFF.fields.smeta.orderByFids
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

        rowData[fid] = td.find('input:hidden').val();
      });

      rowsData.push(rowData);
    });

    // сортируем массив данных по нужным колонкам, предполагаем, что там int/float
    const rowsDataSorted = rowsData.concat().sort((a, b) => {
      for (let sfid of opts.orderByFids) {
        if (a[sfid] === b[sfid]) continue;

        // remove "
        a[sfid] = a[sfid].replace(/"/g, '').replace(/,/g, '.');
        //console.log(a[sfid]);
        b[sfid] = b[sfid].replace(/"/g, '').replace(/,/g, '.');
        //console.log(`a[${sfid}]:${a[sfid]}, b[${sfid}]:${b[sfid]}, a>b: ${parseFloat(a[sfid]) > parseFloat(b[sfid])}`);
        return parseFloat(a[sfid]) > parseFloat(b[sfid]) ? 1 : -1;
      }
      return 0;
    });
    // console.log(rowsData);
    // console.log(rowsDataSorted);

    // прогоняем оригинальный массив, но вписываем туда значения из сортированного массива
    rowsData.map(function(row, ind) {
      const elem = $(row.elem);
      const newData = rowsDataSorted[ind];
      for (let fid in newData) {
        if(!newData.hasOwnProperty(fid)) continue;
        elem.find(`[data-fid="${fid}"] input:hidden`).val(newData[fid]);
      }
    });

    // обозначаем окончание цветом (визуально данные не поменяются)
    t.css('background', '#e5ffe5');
    setTimeout(
        () => { t.parents('.analitics-form').find('.btn-create').trigger('click'); },
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
    const PFF = win.PFF;

    const pad = function(num) {
      const A = num.toString();
      if (A.length > 1) return A;
      else return ('00' + A).slice(-2);
    };

    const smetaTable = $(`[data-aid="${PFF.fields.smeta.aid}"] .tbl-list`);
    smetaTable.find('tr').each(function() {
      const tr = $(this);
      if (tr.find('input').length === 0) return;

      const d = new Date();

      const name = tr.find(PFF.fields.smeta.name).text().trim();
      const itemPrice = tr.find(PFF.fields.smeta.price).text();
      const customPrice = tr.find(PFF.fields.smeta.customPrice).text();
      let price = parseInt(customPrice ? customPrice : itemPrice);
      const discont = parseInt(tr.find(PFF.fields.smeta.discont).text());
      if (discont > 0) price = Math.round(price * discont / 100);
      const date = pad(d.getDate()) + '-' + pad(1 + d.getMonth()) + '-' +
          d.getFullYear();

      if (name === '') {
        win.show_sys_message('Заполните пустые аналитики в реализации!',
            'ERROR', undefined, undefined, {});
      }

      pffSmeta._addRealization({
        name: name,
        group: PFF.fields.realization.analiticName,
        price: price,
        date: date,
      });
    });
  },

  pause(i) {
    return new Promise((resolve) => {
      setTimeout(resolve, i);
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
    return new Promise((resolve) => {
      $('[data-action="add-new-analitic"]').trigger('click');

      let div, analitic, select_handbook;

      pffSmeta.pause(500).then(() => {

        div = $('.analitics-form').last();
        if (opts.scrollTo) PFF.scrollTo(div);
      }).then(() => {
        return pffSmeta.pause(500);
      }).then(() => {

        // выбор группы аналитик
        const select = div.find('select');
        PFF.debug('select', select);

        const option = select.find('option').filter(function() {
          return $(this).text() === opts.group;
        });
        select.val(option.val()).change();

        analitic = div.find(
            '[data-aname="' + opts.group + '"] .af-tbl-tr').last();
        PFF.debug('analitic', analitic);

        select_handbook = analitic.find(
            'select.task-custom-field-val:first');
        PFF.debug('select_handbook', select_handbook);
        select_handbook.trigger('liszt:focus');
      }).then(() => {
        return pffSmeta.pause(2000);
      }).then(() => {
        if (opts.count) {
          analitic.find(PFF.fields.realization.count).val(opts.count);
        }
        if (opts.price) {
          analitic.find(PFF.fields.realization.price).val(opts.price);
        }
        if (opts.date) {
          analitic.find(PFF.fields.realization.date).val(opts.date);
        }

        if(opts.name) {
          analitic.addClass('silentChosen');
          analitic.find('.chzn-search:first input').
              val(opts.name).
              trigger('keyup');
          let count_focused = false;

          select_handbook.on('liszt:updated', function() {
            const results = analitic.find('.chzn-results .active-result');
            PFF.debug('results', results);
            if (results.length === 1 || opts.select) {
              results.first().trigger('mouseup');
              analitic.find(PFF.fields.realization.count).trigger('focus');
            }
            // задержка из-за лага chosen
            setTimeout(() => {
              if (count_focused) return;
              count_focused = true;
              analitic.removeClass('silentChosen');

            }, 2000);

            resolve();
          });
        }
      });
    });
  }
};
