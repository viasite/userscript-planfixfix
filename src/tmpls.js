// tmpls.js
// console.log('include tmpls.js');
win = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
$ = win.$;

const pffTmpls = {
  addActions() {
    // быстрые ответы
    pffTmpls.getTemplates().then(function(tmpls) {
      pffTmpls.addTextTemplates(tmpls);
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
  insertTemplate(textRaw) {
    const editor = win.CKEDITOR.instances.ActionDescription;
    let text = textRaw.replace(/\n/g, '<br>');

    text = text.replace(/---.*/, '').replace(/<p>$/, ''); // отсекаем примечания

    const tokens = text.match(/(%[a-zа-яё_-]+%)/gi);
    if (tokens) {
      const inputs = tokens.map((token) => {
        const name = token.replace(/%/g, '').replace(/_/g, ' ');
        let cls = 'text-box';
        if (name.match(/Дата/)) cls += ' dialog-date';
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
                $('.pff-tmpl-form input').each(function() {
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
              }),
      );
      //win.drawDialog(300, 'auto', 300, html);

      const redrawPreview = () => {
        let pt = text;
        $('.pff-tmpl-form input').each(function() {
          const input = $(this);
          const t = input.data('token');
          const v = input.val();
          if (v == '') pt = pt.replace(t,
              `<span style="background:#ffff00">${t}</span>`);
          else pt = pt.replace(t, v);
        });
        $('.pff-tmpl-preview').html(pt);
      };

      setTimeout(() => {
        redrawPreview();
        $('.pff-tmpl-form input').
            on('keypress blur change',
                () => { setTimeout(redrawPreview, 50); });
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

  // кнопка "вставить шаблон" в редакторе
  templateSelect: function() {
    var editor = CKEDITOR.instances.ActionDescription;
    editor.fire('pffTemplatesOpened');

    var editorSelection = editor.getSelection();
    var caretPosition = editorSelection.getRanges();

    var handbookSelectDialog = new HandbookSelectDialogJS();

    setTimeout(() => {
      $(`[data-handbookid="${win.PFF.tmplsRecord.handbook}"]`).click();
      setTimeout(() => {
        $(`[data-columnid="${win.PFF.tmplsRecord.name}"]`).click();
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
            key: exportData.key,
          };
          AjaxJS.request({
            data: opts,
            success: (data) => {
              let id = exportData.key, name, text;
              let cat = data.NamedPath[0]?.Name || 'Общие';
              for (f of data.Items[0].String) {
                if (f.Field.ID == win.PFF.tmplsRecord.name) {
                  name = f.Value;
                }
                if (f.Field.ID == win.PFF.tmplsRecord.text) {
                  text = f.Value;
                  pffTmpls.insertTemplate(text);
                }
              }
              pffTmpls.updateMRU({id, name, text, cat});
            },
          });

        } else if ('text' == type) {
          pffTmpls.insertTemplate(exportData.text);
        }
      }, 200);
    };

    handbookSelectDialog.onClose = function() {
      editor.fire('pffTemplatesClosed');
    };

    handbookSelectDialog.drawDialog(); // editor.extraHandbookData
  },

  // быстрые ответы в редактор
  addTextTemplates: function(tmpls) {
    const tplsBlock = $('<div class="pff-tpls-content"></div>');

    win.PFF.addTaskBlock('Шаблон', pffTmpls.templateSelect);

    for (let cat in tmpls) {
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
        catDiv.append(
            $(`<a href="${link}" title="${title}">${item.name.replace(/ /g,
                '&nbsp;')}</a>`).click(
                () => {
                  pffTmpls.insertTemplate(textRaw);
                  return false;
                },
            ),
        );
      }
      tplsBlock.append(
          $(`<div class="pff-cat"><span class="pff-cat-title">${cat}:</span> </div>`).
              append(catDiv),
      );
    }
    $('.task-add-block').last().after(
        $(
            '<div class="pff-tpls"><span class="pff-tpls-title"><b>Шаблоны</b></span></div>',
        ).append(tplsBlock),
    );
  },

  /**
   * Отдает promise, в нем шаблоны ответов
   * Отдает кешированные шаблоны
   * Или грузит по урлу и отдает, здесь же проверяется свежесть кеша
   * Удаленные возвращают умолчальные шаблоны в случае неудачи
   */
  getTemplates: function() {
    return new Promise((resolve, reject) => {
      var mtime = localStorage.pff_templates_mtime || new Date().getTime();
      var cache_age = new Date().getTime() - mtime;
      if (cache_age > PFF.templates_remote_cache_lifetime * 1000) {
        delete localStorage.pff_templates;
      }

      if (!localStorage.pff_templates) {
        const remoteUrl = pffTmpls.getRemoteTemplatesUrl();
        if (remoteUrl.url) {
          pffTmpls.parseRemoteTemplates().then((tmpls) => {
            resolve(tmpls);
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

          let defaultCat = 'Часто используемые'; // TODO: var
          const tmpls = {[defaultCat]: []};
          let itemsObj = {};
          for (let item of items) {
            itemsObj[item.name] = item.text;
            if (!item.cat) item.cat = defaultCat;
            if (!tmpls[item.cat]) tmpls[item.cat] = [];
            tmpls[item.cat].push(item);
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
   * Возвращает сохраненный или дефолтный урл
   */
  getRemoteTemplatesUrl: function() {
    var store = $.parseJSON(localStorage.pff_remote_templates_url);
    return store || PFF.templates_remote_default;
  },

  /**
   * Сохраняет урл удаленных аналитик,
   * Если пусто или изменено, чистим кеш
   */
  setRemoteTemplatesUrl: function(remote) {
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

  parseRemoteTemplates: function(opts) {
    return new Promise((resolve, reject) => {
      if (opts.format != 'yml') {
        console.log('only yml possible');
        return reject(false);
      }
      GM_xmlhttpRequest({
        method: 'GET',
        url: opts.url,
        onload: function(response) {
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

};
