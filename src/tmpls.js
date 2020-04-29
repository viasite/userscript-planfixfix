// tmpls.js
// console.log('include tmpls.js');
win = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
$ = $ || win.$;

const pffTmpls = {
  addActions() {
    const PFF = win.PFF;
    if (!PFF.isManager() && !PFF.isAdmin()) return;

    PFF.addTaskBlock('|');
    PFF.addTaskBlock('Шаблон', pffTmpls.templateSelect);

    // замена "вы" для выделенного в редакторе текста
    [{name: 'Вы', isNew: false}, {name: 'вы', isNew: true}].map(
        ({name, isNew}) => {
          PFF.addTaskBlock(name, () => {
            let html = PFF.editorGetSelection();
            html = pffTmpls.replaceVy(html, isNew);
            PFF.editorInsertHtml(html);
          }, {class: 'only-selection'});
        });

    // быстрые ответы
    pffTmpls.getTemplates().then((tmpls) => {
      pffTmpls.addActionTemplates(tmpls);
    });
  },

  insertRecord(id, handbookId) {
    if(!handbookId) handbookId = win.PFF.tmplsRecord.handbook;

    const opts = {
      command: 'handbook:getDataStringByKey',
      handbook: handbookId,
      key: id,
    };

    /**
     * @param data
     * @param {string[]} data.NamedPath
     * @param data.NamedPath.Name
     * @param {string[]} data.Items
     * @param {Object[]} data.Items[].String
     */
    const afterResponse = (data) => {
      /**
       *
       * @param {Object} f
       * @param {Object} f.Field
       * @param {number} f.Field.ID
       * @param {string} f.Value
       */
      let name, text;
      let cat = data.NamedPath[0]?.Name || 'Общие';
      for (let f of data.Items[0].String) {
        if (f.Field.ID === win.PFF.tmplsRecord.name) {
          name = f.Value;
        }
        if (f.Field.ID === win.PFF.tmplsRecord.text) {
          text = f.Value;
          pffTmpls.insertTemplate(text, id, handbookId);
        }
      }
      pffTmpls.updateMRU({id, name, text, cat});

      // update quick templates
      pffTmpls.getTemplates().then((tmpls) => {
        pffTmpls.addActionTemplates(tmpls);
      });
    };

    /**
     * @param win.AjaxJS запросы к сущностям ПФ
     */
    win.AjaxJS.request({
      data: opts,
      success: afterResponse,
    });
  },

  updateMRU({id, name, text, cat}) {
    const mru = localStorage.pff_templates_mru ? JSON.parse(
        localStorage.pff_templates_mru) : {};
    if (mru[id]) {
      mru[id].text = text;
      mru[id].cat = cat;
      mru[id].count++;
    } else {
      mru[id] = {id, name, text, cat, count: 1};
    }
    localStorage.pff_templates_mru = JSON.stringify(mru);
  },

  // вставка шаблона, окно заполнения подстановок
  insertTemplate(textRaw, recordId, handbookId) {
    let text = textRaw.replace(/\n/g, '<br>');
    text = text.replace(/---.*/, '').replace(/<p>$/, ''); // отсекаем примечания

    let tokens = text.match(/(%[a-zа-яё_-]+%)/gi);
    if (tokens) {
      // inputs
      tokens = tokens.filter((v, i, s) => s.indexOf(v) === i);
      const inputs = tokens.map((token) => {
        const name = token.replace(/%/g, '').replace(/_/g, ' ');
        let cls = 'text-box';
        if (name.match(/Дата/)) cls += ' dialog-date';
        return `<span class="task-create-field task-create-field-custom-99 task-create-field-line-first task-create-field-break-after">
              <span class="task-create-field-label task-create-field-label-first">${name}</span>
              <span class="task-create-field-input"><input name="${name}" data-token="${token}" type="text" class="${cls}" /></span>
              </span>`;
      });

      // record link
      /**
       * @param win.HandbookDataCKEditorJS
       */
      let recordLink = '';
      if(recordId && handbookId) {
        const link = `/?action=handbookdataview&amp;handbook=${handbookId}&amp;key=${recordId}`
        recordLink = `<a href="${link}" class="ckeditor-handbook-data-item" data-handbookid="${handbookId}" data-key="${recordId}" target="_blank">Посмотреть запись</a>`;
      }

      // vyLinks
      const vyLinks = `<div class="pff-tmpl-form-controls">
      <a class="pff-tmpls-you-change" href="javascript:" data-type="old">Вы</a>
      <a class="pff-tmpls-you-change" href="javascript:" data-type="new">вы</a>
      </div>`;

      // buttons
      const btns = `
        <div class="dialog-btn-wrapper">
        <button class="btn-main btn-create action-edit-save js-action-pff-insert-template">Вставить</button>
        <button class="btn-main btn-cancel">Отмена</button>
        </div>`;

      // form template
      const html = '<div class="pff-tmpl-form">' +
          recordLink +
          '<div class="task-create-panel-fields">' +
          inputs.join('\n') +
          vyLinks +
          '</div>' +
          `<div class="pff-tmpl-preview">${text}</div>` +
          btns +
          '</div>';

      // noinspection JSValidateTypes
      /**
       * @param {function} win.CommonDialogScrollableJS.draw
       * @param {function} win.CommonDialogScrollableJS.setHeader
       * @param {function} win.CommonDialogScrollableJS.setCloseHandler
       */
      const dialog = new win.CommonDialogScrollableJS();
      dialog.closeByEsc = true;
      dialog.isMinimizable = true;
      dialog.dateFormat = 'dd.mm.yy';
      dialog.draw(html);
      dialog.setHeader('Вставка шаблона');

      const closeHandler = () => {
        new Promise((resolve) => {
          let isValid = true;
          const inputs = $('.pff-tmpl-form input');
          inputs.each(function() {
            if ($(this).val() === '') {
              isValid = false;
            }
          });
          win.PFF.debug('valid:', isValid);
          if (isValid) {
            insertTokenizedTemplate();
            resolve(true);
          } else {
            resolve(false);
          }
        });
      };
      dialog.setCloseHandler(closeHandler);

      const redrawPreview = () => {
        let pt = text;
        $('.pff-tmpl-form input').each(function() {
          const input = $(this);
          const t = input.data('token');
          const reg = new RegExp(t, 'g');
          const v = input.val().toString();
          if (v === '') {
            pt = pt.replace(reg, `<span style="background:#ffff00">${t}</span>`);
          }
          else pt = pt.replace(reg, v);
        });
        $('.pff-tmpl-preview').html(pt);
      };

      // сохраняет заполненные токены и вставляет текст в редактор
      const insertTokenizedTemplate = () => {
        const inputs = $('.pff-tmpl-form input');
        const tid = win.PlanfixPage.task;
        const taskTokens = localStorage.pff_task_tokens ?
            JSON.parse(localStorage.pff_task_tokens) : {};

        if(!taskTokens[tid]) taskTokens[tid] = {}
        inputs.each(function() {
          const name = $(this).attr('name');
          taskTokens[tid][name] = $(this).val();
        });
        localStorage.pff_task_tokens = JSON.stringify(taskTokens);

        win.PFF.editorInsertHtml($('.pff-tmpl-preview').html());
      };

      // tmpl editor init
      setTimeout(() => {
        const inputs = $('.pff-tmpl-form input');

        inputs.
            on('keypress blur change paste',
                () => { setTimeout(redrawPreview, 50); });
        inputs.first().trigger('focus');

        // record link click
        $('.pff-tmpl-form .ckeditor-handbook-data-item').on('click', function(e) {
          win.HandbookDataCKEditorJS.show($(this), null);
          e.preventDefault();
          return false;
        });

        // stored token values
        const tid = win.PlanfixPage.task;
        const taskTokens = localStorage.pff_task_tokens ?
        JSON.parse(localStorage.pff_task_tokens) : {};
        inputs.each(function() {
          const name = $(this).attr('name');
          if(taskTokens[tid] && taskTokens[tid][name]) {
            $(this).val(taskTokens[tid][name]);
          }

          if(name === 'Мои имя фамилия') $(this).val(win.Current.loginedName);
        });

        // Вы | вы
        $('.pff-tmpls-you-change').on('click', function() {
          const type = $(this).data('type');
          text = pffTmpls.replaceVy(text, type !== 'old');
          redrawPreview();
        });

        // кнопки сохранить / отменить
        $('.pff-tmpl-form .btn-cancel').on('click', () => { dialog.close(); });
        $('.js-action-pff-insert-template').on('click', () => {
          insertTokenizedTemplate();
          dialog.close();
        });

        redrawPreview();

      }, 100);
    } else {
      win.PFF.editorInsertHtml(text);
    }
  },

  // Вы | вы
  replaceVy(html, isNew) {
    const matched = html.match(/(\s|^)(вы|вас|вам|ваш(и|а|ему|его|ей)?)([\s,.!:)?]|$)/ig);
    //win.PFF.debug(matched);
    for(let m of matched) {
      const newL = isNew ? 'в' : 'В';
      const rep = m.replace(/в/i, newL)
      const reg = new RegExp(rep, 'gi');
      //win.PFF.debug(`${m} -> ${rep}`);
      html = html.replace(reg, rep);
    }
    return html;
  },

  // кнопка "вставить шаблон" в редакторе
  templateSelect: function() {
    const PFF = win.PFF;

    /**
     * @param win.HandbookSelectDialogJS
     */
    const handbookSelectDialog = new win.HandbookSelectDialogJS();

    const handbookItemSel = `td[data-handbookid="${PFF.tmplsRecord.handbook}"]`;
    const nameColSel = `[data-columnid="${PFF.tmplsRecord.name}"]`;

    PFF.waitFor(handbookItemSel).then(handbookItem => {
      handbookItem.trigger('click');
      return PFF.waitFor(nameColSel);
    }).then(nameCol => {
      nameCol.trigger('click');

      pffTmpls.getTemplates().then((tmpls) => {
        if(Object.keys(tmpls).length === 0) return;

        const tmplsBlock = pffTmpls.getQuickTemplates(tmpls);
        const tbl = $('.tbl-list-tasks');
        const firstRow = tbl.find('tr:nth-child(1)');

        const colspan = firstRow.find('td').length;
        const tmplsCol = $(`<td colspan="${colspan-2}" style="padding-left: 10px;"></td>`);
        tmplsCol.append(tmplsBlock);
        const tmplsRow = $('<tr></tr>');
        tmplsRow.append('<td colspan="2"></td>');
        tmplsRow.append(tmplsCol);

        firstRow.after(tmplsRow);

        $('.common-filter-value').on('keypress paste', () => tmplsRow.remove());
      });
    });

    /**
     * @param {String} type 'record' | 'text'
     * @param {Object} exportData
     * @param {number} exportData.handbookId
     * @param {number} exportData.key
     * @param {string} exportData.text
     */
    handbookSelectDialog.onInsertData = function(type, exportData) {
      setTimeout(function() {
        if ('record' === type) {
          pffTmpls.insertRecord(exportData.key);
        } else if ('text' === type) {
          pffTmpls.insertTemplate(exportData.text);
        }
      }, 200);
    };

    handbookSelectDialog.drawDialog(); // editor.extraHandbookData
  },

  getQuickTemplates(tmpls) {
    const tmplsBlock = $('<div class="pff-tmpls"></div>');
    for (let cat in tmpls) {
      if(tmpls[cat].length === 0) continue;
      const catDiv = $(`<div class="pff-cat-content"></div>`);
      for (let tpl in tmpls[cat]) {
        let item = tmpls[cat][tpl];
        if (typeof tmpls[cat][tpl] == 'string') item = {
          name: tpl,
          text: tmpls[cat][tpl],
        };
        const textRaw = item.text.replace(/^\n/, '');
        const title = textRaw.replace(/"/g, '\'').
            replace(/<p>/g, '').
            replace(/<br ?\/?>/g, '\n');
        let link = 'javascript:';
        if (item.id) link = `https://${location.hostname}/?action=handbookdataview&handbook=${win.PFF.tmplsRecord.handbook}&key=${item.id}`;
        const name = item.name.replace(/ /g, '&nbsp;');
        const a = $(`<a href="${link}" title="${title}">${name}</a>`);
        if(item.id) a.attr('data-id', item.id);
        if(item.count) a.html(a.text() + `&nbsp;<sup>${item.count}</sup>`);
        a.on('click', () => {
          if(a.data('id')) pffTmpls.insertRecord(a.data('id'));
          else pffTmpls.insertTemplate(textRaw);
          return false;
        });
        a.appendTo(catDiv);
      }
      tmplsBlock.append(
          $(`<div class="pff-cat"><span class="pff-cat-title">${cat}:</span> </div>`).
              append(catDiv),
      );
    }

    return tmplsBlock;
  },

  /**
   * Добавляет быстрые шаблоны под редактор действия
   * @param {array|Object} tmpls
   */
  addActionTemplates(tmpls) {
    if(Array.isArray(tmpls)){
      tmpls = pffTmpls.tmplsArrayToObject(tmpls);
    }

    if(Object.keys(tmpls).length === 0) return;

    const newTmplsBlock = pffTmpls.getQuickTemplates(tmpls);
    const existsTmplsBlock = $('.pff-tmpls');
    if(existsTmplsBlock.length > 0){
      existsTmplsBlock.replaceWith(newTmplsBlock);
    }
    else {
      const tmplsWrap = $('<div class="pff-action-tmpls"></div>');
      const content = $('<div class="pff-tmpls-content"></div>');

      // fast search
      const search = $('<input type="text" class="search-field"/>');
      const searchBlock = $('<div class="search-field-block"></div>');
      searchBlock.append(search);

      // fuse.js init
      const mru = localStorage.pff_templates_mru ? JSON.parse(
          localStorage.pff_templates_mru) : {};
      const items = [];
      for(let id in mru) {
        items.push(mru[id]);
      }
      // noinspection JSUnresolvedFunction
      let fuse = new Fuse(items, {
        includeScore: true,
        keys: [
          {name: 'name', weight: 0.8},
          {name: 'text', weight: 0.4},
        ],
      });

      search.on('click', () => false); // чтобы фокус не прыгал на редактор
      search.on('keydown change paste', function() {
        const input = $(this);
        setTimeout(() => {
          let q = input.val();
          if(q.match(/[a-z]/i)) q = pffTmpls.punto(q);
          // console.log('q:', q);
          if(q === '') {
            pffTmpls.addActionTemplates(items);
            return;
          }

          let filtered = fuse.search(q);
          const list = filtered.map(item => item.item);
          pffTmpls.addActionTemplates(list);
        }, 10);
      });

      const tmplsTitle = $('<span class="pff-tmpls-title">Шаблоны</span>');
      tmplsTitle.on('click', () => {
        tmplsWrap.toggleClass('pff-action-tmpls_expanded');
        setTimeout(() => { search.trigger('focus'); }, 50);
      });

      content.append(searchBlock);
      content.append(newTmplsBlock);

      tmplsWrap.append(tmplsTitle);
      tmplsWrap.append(content);

      $('.task-add-block').last().after(tmplsWrap);
    }
  },

  tmplsArrayToObject(items) {
    let defaultCat = 'Без категории';
    const tmpls = {[defaultCat]: []};
    let itemsObj = {};
    for (let item of items) {
      itemsObj[item.name] = item.text;
      if (!item.cat) item.cat = defaultCat;
      if (!tmpls[item.cat]) tmpls[item.cat] = [];
      tmpls[item.cat].push(item);
    }
    return tmpls;
  },

  punto(s, toLang = 'ru') {
    console.log('s:', s);
    let i = s.length;
    let newText = '';
    while (i--) {newText = pffTmpls.puntoChar(s.charAt(i), toLang) + newText;}
    console.log('newText:', newText);
    return newText;
  },

  puntoChar(char, toLang = 'ru') {
    const en = '`qwertyuiop[]asdfghjkl;\'zxcvbnm,.~/QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?';
    const ru = 'ёйцукенгшщзхъфывапролджэячсмитьбю.ЁЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,';
    let pos = -1;
    if(toLang !== 'en'){
      pos = en.indexOf(char);
      if (pos >= 0) {return ru.substr(pos, 1);}
    }
    if(toLang !== 'ru'){
      pos = ru.indexOf(char);
      if (pos >= 0) {return en.substr(pos, 1);}
    }
    return char;
  },

  /**
   * Отдает promise, в нем шаблоны ответов
   * Отдает кешированные шаблоны
   * Или грузит по урлу и отдает, здесь же проверяется свежесть кеша
   * Удаленные возвращают умолчальные шаблоны в случае неудачи
   */
  getTemplates: function() {
    return new Promise((resolve, reject) => {
      const mtime = localStorage.pff_templates_mtime || new Date().getTime();
      const cache_age = new Date().getTime() - mtime;
      if (cache_age > win.PFF.templates_remote_cache_lifetime * 1000) {
        delete localStorage.pff_templates;
      }

      if (!localStorage.pff_templates) {
        const remoteUrl = pffTmpls.getRemoteTemplatesUrl();
        if (remoteUrl.url) {
          pffTmpls.parseRemoteTemplates().then((tmpls) => {
            return resolve(tmpls);
          });
        } else if (localStorage.pff_templates_mru) {
          // convert mru to text templates
          const mru = JSON.parse(localStorage.pff_templates_mru);
          let items = [];
          for (let id in mru) {
            items.push(mru[id]);
          }
          items.sort((a, b) => {
            if (a.count > b.count) return -1;
            if (a.count < b.count) return 1;
            return 0;
          });

          const tmpls = pffTmpls.tmplsArrayToObject(items);

          return resolve(tmpls);
        }
      } else {
        const tmpls = JSON.parse(localStorage.pff_templates) || {};
        win.PFF.debug('use cached templates:', tmpls);
        return resolve(tmpls);
      }
      resolve({});
      reject();
    });
  },

  /**
   * Возвращает сохраненный или дефолтный урл
   */
  getRemoteTemplatesUrl: function() {
    const store = localStorage.pff_remote_templates_url ? JSON.parse(localStorage.pff_remote_templates_url) : false;
    return store || win.PFF.templates_remote_default;
  },

  /**
   * Сохраняет урл удаленных аналитик,
   * Если пусто или изменено, чистим кеш
   */
  setRemoteTemplatesUrl: function(remote) {
    if (remote.url === win.PFF.templates_remote_default.url) {
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
    if (remote.format !== 'yml') {
      alert('Возможны только yml файлы');
      return false;
    }
    delete localStorage.pff_templates;
    localStorage.pff_remote_templates_url = JSON.stringify(remote);
    return true;
  },

  parseRemoteTemplates: function(opts) {
    return new Promise((resolve, reject) => {
      if (opts.format !== 'yml') {
        console.log('only yml possible');
        return reject(false);
      }

      const storeItem = (response) => {
        const tmpls = jsyaml.load(response.responseText);

        const tmplsCount = Object.keys(tmpls).length;
        if (tmplsCount > 0) {
          win.PFF.debug('parsed remote templates:', tmpls);
          localStorage.pff_templates = JSON.stringify(tmpls);
          localStorage.pff_templates_mtime = new Date().getTime();
          resolve(tmpls);
        } else {
          win.PFF.debug('failed parse remote templates:', response.responseText);
          resolve(win.PFF.templates_default);
        }
      };

      /**
       * @param win.GM_xmlhttpRequest
       */
      GM_xmlhttpRequest({
        method: 'GET',
        url: opts.url,
        onload: storeItem
      });
    });
  },

};
