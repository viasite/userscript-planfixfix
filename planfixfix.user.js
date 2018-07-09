// ==UserScript==
// @name           PlanfixFix
// @author         popstas
// @version        0.3.7
// @namespace      viasite.ru
// @description    Some planfix.ru improvements
// @unwrap
// @noframes
// @run-at         document-end
// @updateURL      https://raw.githubusercontent.com/viasite/userscript-planfixfix/master/planfixfix.user.js
// @include        https://tagilcity.planfix.ru/*
// @match          https://tagilcity.planfix.ru/*
// ==/UserScript==

(function(){
	var u ='undefined', win = typeof unsafeWindow !=u ? unsafeWindow: window;
	var $ = win.$;

	win.onerror = function(error, file, line){
		console.log(error +' (line '+line+')');
	};

    if(win.top != win.self){
        return false; // ignore iframes
    }

    if (location.hostname !== "tagilcity.planfix.ru"){
        return;
    }

	PlanfixFix = {
		debug: false,
		deferred: false,
		fields: {
			name: '[data-fid="741"] select',
			count: '[data-fid="747"] input',
			comment: '[data-fid="749"] textarea',
			hours_per_count: '.analitic-data[data-fid="741:h915"]'
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
			['Правки, тесты, отчет', [
				{ name:'Поиск места проблемы, (в т.ч. по алгоритму поиска)', count:1 },
				'Обработка простая на вводе или выводе',
				'Тестирование',
				'Замена / вставка любого контента',
				{ name:'Создание пояснительной записки по внесенным изменениям', count:1 }
			]],
			['Задание', 'Задание'],
			['Консультация', 'с коллегой'],
			['Записка', 'Создание пояснительной записки'],
		],
		_analitics: [],

		init: function(){
			// init once
			if($('body').hasClass('fixes')) return false;
			$('body').addClass('fixes');

			// не пугаем планфикс своими ошибками
			win.onerror = function(){
				return;
			};

			if(PlanfixFix.debug) console.log('init');

			// очередь аналитик
			PlanfixFix.resetDeferred();

			PlanfixFix.actionAlter();

			PlanfixFix.addStyles();

			//PlanfixFix.addMenu();

            if(PlanfixFix.debug) setTimeout(function(){ 
                $('.actions-quick-add-block-text').click();
                PlanfixFix.addAnalitics({ name: 'Поминутная работа программиста' });
            }, 1000);
        },

		/**
		 * Переопределяет стили
		 */
		addStyles: function(){
			$('body').append('<style>'+
			'.chzn-container .chzn-results{ max-height:400px !important; }'+
			'.chzn-drop{ width:850px !important; border-style:solid !important; border-width:1px !important; }'+
			'.silentChosen .chzn-container .chzn-results{ max-height:1px !important; }'+
			'.silentChosen .chzn-drop{ width:1px !important; }'+
			'</style');
		},

		/**
		 * Добавляет пункт меню в главное меню "Еще"
		 * Настройки скрипта:
		 * - url для удаленной загрузки аналитик
		 */
		addMenu: function(){
			var li = $('<li class="b-ddl-menu-li-action b-ddl-menu-li-item b-ddl-menu-li-group-0"><span></span><a href="#">PlanfixFix</a></li>')
				.appendTo('.b-main-menu-more ul')
				.click(function(){
					var remote = PlanfixFix.getRemoteAnaliticsUrl();
					var html = '<div class="planfixfix-settings">'+
						'<div class="form">'+
						'<div>URL для обновления аналитик, обязательно https://</div>'+
						'<input style="width:400px" class="text-box" name="planfixfix_remote_url" value="'+remote.url+'"/>'+
						//.append('<input type="hidden" name="planfixfix_remote_format" value="text"/>')
						'</div>'+
						'<input type="button" value="Сохранить"/>'+
						'</div>'
					;
					win.drawDialog(300, 'auto', 300, html);
					$('.planfixfix-settings [type="button"]').click(function(){
						var isSave = PlanfixFix.setRemoteAnaliticsUrl({
							url: $('[name="planfixfix_remote_url"]').val(),
							format: 'text'
						});
						if(isSave){
							$('.dialogWin .destroy-button').click();
						}
					});
					return false;
				});
		},

		actionAlter: function(){
			win.ActionJS.create_orig = win.ActionJS.prototype.createNewAction;
			//win.ActionJS.edit_orig = win.ActionJS.edit;
			//win.ActionJS.restoreAnaliticsForEdit_orig = win.ActionJS.restoreAnaliticsForEdit;
			win.ActionJS.prototype.createNewAction = function() {
			  return win.ActionJS.create_orig().then(function() {
			    PlanfixFix.addCustomAnalitics();
			  });
			};
			/*win.ActionJS.prototype.createNewAction = function(task, insertBefore, actionDescription) {
			  return win.ActionJS.create_orig(task, insertBefore, actionDescription).then(function() {
			    PlanfixFix.addCustomAnalitics();
			  });
			};*/

            /*win.ActionJS.edit = function(id, task){
				win.ActionJS.edit_orig(id, task);
				setTimeout(function(){
					PlanfixFix.addCustomAnalitics();
				}, 1000);
			};
			win.ActionJS.restoreAnaliticsForEdit = function(data){
				win.ActionJS.restoreAnaliticsForEdit_orig(data);
				setTimeout(function(){
					PlanfixFix.countTotalAnalitics();
				}, 2000);
			};*/

			/*$('body').delegate(PlanfixFix.fields.count, 'change keypress', PlanfixFix.countTotalAnalitics);

			$('body').delegate(PlanfixFix.fields.name, 'change', function(){
				var hours_field = $(this).parents('.add-analitic-block').find(PlanfixFix.fields.hours_per_count);
				hours_field.attr('title', (hours_field.val().replace(',', '.')*60).toFixed(1));
			});*/

			/*$('body').delegate('.attach-new-analitic td.td-item-add-ex:first span.fakelink-dashed', 'click', function(e){
				PlanfixFix.addAnalitics([{}]);
			});*/

		},
        
		addCustomAnalitics: function(){
			// показывается в задаче, где одно и то же планируется на каждый день
			if(PlanfixFix.debug) console.log('addCustomAnalitics');
			if(win.PlanfixPage.task==116702){
				var dates = PlanfixFix.getDates(1, 5);
				var analitics_arr = $.map(dates, function(date){
					return {
						group: 'Планируемое время работы',
						date: date,
						begin: '09:00',
						end: '09:30'
					};
				});
				PlanfixFix.addTaskBlock('План на неделю', analitics_arr);

				PlanfixFix.addTaskBlock('План на день', { name:'План на день', count:1 });
			}

			PlanfixFix.addTaskBlock('План', '[Планируемое время работы]');
			PlanfixFix.addTaskBlock('|');
			PlanfixFix.addTaskBlock('Выработка', {});
			PlanfixFix.addTaskBlock('|');

            var userPost = Current.loginedPost;
            switch(userPost){
                case "Программист":
                    PlanfixFix.addTaskBlock('Программирование', { name: 'Поминутная работа программиста' });
                    break;
                case "Менеджер по сопровождению заказов":
                    PlanfixFix.addTaskBlock('тел. лёгкий', { name: 'Лёгкий разговор по телефону' });
                    PlanfixFix.addTaskBlock('тел. обычный', { name: 'Обычный разговор по телефону' });
                    PlanfixFix.addTaskBlock('тел. сложный', { name: 'Сложный разговор по телефону' });
                    PlanfixFix.addTaskBlock('письмо лёгкое', { name: 'Лёгкое письмо' });
                    PlanfixFix.addTaskBlock('письмо обычное', { name: 'Письмо средней сложности / обычное письмо' });
                    PlanfixFix.addTaskBlock('письмо сложное', { name: 'Сложное письмо' });
                    break;
            }

			// парсим массив подготовленных аналитик
			PlanfixFix.getAnalitics().then(function(tasks){
				PlanfixFix.addTaskBlock('|');
				$.each(tasks, function(i, task){
					PlanfixFix.addTaskBlock(task.name, task.analitics);
				});
			});

			if(PlanfixFix.debug){
				PlanfixFix.addTaskBlock('|');
				PlanfixFix.addTaskBlock('Удалить все', function(){
                    $('.task-add-analitic').click();
                    setTimeout(function(){
                        $('[data-action="remove-all-analitics"]').click();
                    }, 200);
				});
			}
		},

		/**
		 * Тупая функция, добавляет все аналитики из массива
		 */
		addAnalitics: function(analitics_arr){
			analitics_arr = PlanfixFix.normalizeAnalitics(analitics_arr);
			$.each(analitics_arr, function(i, opts){
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
		normalizeAnalitics: function(analitics_arr){
			var analitics = [];
			if(!$.isArray(analitics_arr)) analitics_arr = [analitics_arr];
			$.each(analitics_arr, function(i, opts){
				var isFirst = i===0;
				var isLast = i===analitics_arr.length-1;
				if(typeof opts == 'string'){
					opts = { name: opts };
				}
				
				opts = $.extend({
					name: '',
					group: 'Выработка',
					scrollTo: isFirst,
					select: !isLast
				}, opts);

				var count = opts.name.match(/ - (\d+)$/) || '';
				if(count!==''){
					opts.name = opts.name.replace(count[0], '');
					opts.count = count[1];
				}

				var group = opts.name.match(/^\[(.*?)\] ?/) || '';
				if(group!==''){
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
		_addAnalitic: function(opts){
			var deferred = $.Deferred();

			PlanfixFix.deferred.then(function(){
				$('.task-add-analitic').click();
				
				var timeout = $('.analitics-form').size() === 0 ? 500 : 10;
				//var timeout = 2000;
				setTimeout(function(){
					var div = $('.analitics-form').last();
					if(opts.scrollTo) PlanfixFix.scrollTo(div);

                    setTimeout(function(){
                        // выбор группы аналитик
                        var select = div.find('select');
                        if(PlanfixFix.debug) console.log('select', select);

                        var option = select.find('option').filter(function(){ return $(this).text() == opts.group; });
                        select.val(option.val()).change();

                        var analitic = div.find('.af-tbl-tr');
                        if(PlanfixFix.debug) console.log('analitic', analitic);

                        var select_handbook = analitic.find('select[data-handbookid]:first');
                        if(PlanfixFix.debug) console.log('select_handbook', select_handbook);
                        select_handbook.trigger('liszt:focus');

                        // выработка
                        if(opts.name){
                            // выбор конкретной аналитики
                            // задержка из-за того, что иногда выбирается выработка "заказ такси"
                            setTimeout(function(){
                                analitic.addClass('silentChosen');
                                analitic.find('.chzn-search:first input').val(opts.name)/*.focus()*/.keyup();
                                var count_focused = false;
                                select_handbook.bind("liszt:updated", function(e){
                                    var results = analitic.find('.chzn-results .active-result');
                                    if(PlanfixFix.debug) console.log('results', results);
                                    if(results.length==1 || opts.select){
                                        results.first().mouseup();
                                        analitic.find(PlanfixFix.fields.count).focus();
                                    }
                                    // задержка из-за лага chosen
                                    setTimeout(function(){
                                        if(count_focused) return;
                                        count_focused = true;
                                        analitic.removeClass('silentChosen');

                                        if(opts.count){
                                            analitic.find(PlanfixFix.fields.count).val(opts.count);
                                            analitic.find(PlanfixFix.fields.comment).focus();
                                        } else {
                                            analitic.find(PlanfixFix.fields.count)
                                                .focus()
                                                .on('keypress', function(e){
                                                if(e.which == 13){
                                                    if(e.ctrlKey){
                                                        $('[data-action="saveParent"]').click();
                                                    } else {
                                                        $('[data-action="save"]').click();
                                                    }
                                                }
                                            });
                                        }

                                        // планируемое время
                                        if(opts.date){
                                            analitic.find('input.date').val(opts.date);
                                        }
                                        if(opts.begin){
                                            analitic.find('select.timeperiodbegin').val(opts.begin);
                                        }
                                        if(opts.end){
                                            analitic.find('select.timeperiodend').val(opts.end);
                                        }
                                    }, 1000);

                                    deferred.resolve();
                                });
                            }, 500);
                        }

                        if(!opts.name){
                            deferred.resolve();
                        }
                    }, 500);
                }, timeout);
			});

			PlanfixFix.deferred = deferred;
			return deferred.promise();
		},

		/**
		 * Добавляет ссылку на добавление аналитики в панель
		 * В ссылку вписывается список аналитик
		 * Можно передавать вместо аналитик произвольную функцию
		 */
		addTaskBlock: function(name, action){
			var block = $('<div class="task-add-block"></div>')
				.html(name)
				.click(function(){
					PlanfixFix.resetDeferred();
					if($.isArray(action) || typeof action == 'object' || typeof action == 'string'){
						PlanfixFix.addAnalitics(action);
					}
					else if($.isFunction(action)){
						action();
					}
				})
			;
			if(PlanfixFix.debug) console.log(block);
			if($.isArray(action) || typeof action == 'object' || typeof action == 'string'){
				var analitics = $.map(PlanfixFix.normalizeAnalitics(action), function(analitic){
					return analitic.name;
				});
				block.attr('title', analitics.join("\n"));
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
		getAnalitics: function(){
			var deferred = $.Deferred();
			if(PlanfixFix._analitics.length===0){
				var mtime = localStorage.planfixfix_analitics_mtime || new Date().getTime();
				var cache_age = new Date().getTime() - mtime;
				if(cache_age > PlanfixFix.analitics_remote_cache_lifetime * 1000){
					PlanfixFix.clearCache();
				}
				PlanfixFix._analitics = $.parseJSON(localStorage.planfixfix_analitics) || [];

				/*if(PlanfixFix._analitics.length===0){
					deferred = PlanfixFix.parseRemoteAnalitics(
						PlanfixFix.getRemoteAnaliticsUrl()
					);
				}*/
			}
			if(PlanfixFix._analitics.length > 0){
				deferred.resolve(PlanfixFix._analitics);
			}
			return deferred.promise();
		},

		/**
		 * Умолчальные аналитики (задачи) из массива
		 */
		getDefaultAnalitics: function(){
			var tasks = [];
			$.each(PlanfixFix.analitics_default, function(i, item){
				tasks.push({
					name: item[0],
					analitics: item[1]
				});
			});
			return tasks;
		},

		/**
		 * Возвращает сохраненный или дефолтный урл
		 */
		getRemoteAnaliticsUrl: function(){
			var store = $.parseJSON(localStorage.planfixfix_remote_analitics_url);
			return store || PlanfixFix.analitics_remote_default;
		},

		/**
		 * Сохраняет урл удаленных аналитик,
		 * Если пусто или изменено, чистим кеш
		 */
		setRemoteAnaliticsUrl: function(remote){
			if(remote.url==PlanfixFix.analitics_remote_default.url){
				return true;
			}
			if(remote.url===''){
				delete localStorage.planfixfix_remote_analitics_url;
				PlanfixFix.clearCache();
				return true;
			}
			if(!remote.url.match(/^https:\/\//)){
				alert('Возможны только https URL');
				return false;
			}
			if(remote.format!='text'){
				alert('Возможны только текстовые файлы');
				return false;
			}
			PlanfixFix.clearCache();
			localStorage.planfixfix_remote_analitics_url = JSON.stringify(remote);
			return true;
		},

		parseRemoteAnalitics: function(opts){
			var deferred = $.Deferred();
			$.get(opts.url, function(data){
				var tasks = [];
				if(opts.format=='text'){
					tasks = PlanfixFix.text2tasks(data);
				}
				if(tasks.length > 0){
					PlanfixFix._analitics = tasks;
					localStorage.planfixfix_analitics = JSON.stringify(tasks);
					localStorage.planfixfix_analitics_mtime = new Date().getTime();
				}
				if(tasks.length===0) tasks = PlanfixFix.getDefaultAnalitics();
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
		text2tasks: function(text){
			var lines = text.split("\n");
			var lastLevel = -1;
			var tasks = [];
			var task;
			$.each(lines, function(i, line){
				if(line==='') return;

				var level = line.match(/^\t*/)[0].length;
				var text = $.trim(line);

				if(level===0){
					if(lastLevel!=-1) tasks.push(task);
					task = { name:text, analitics:[] };
				}
				if(level==1){
					task.analitics.push(text);
				}
				lastLevel = level;
			});
			if(lines.length>0) tasks.push(task);
			return tasks;
		},

		/**
		 * Чистит сохраненные аналитики, которые загружались удаленно
		 */
		clearCache: function(){
			delete localStorage.planfixfix_analitics;
		},

		/**
		 * Считает, сколько всего минут во всех аналитиках действия,
		 * Предупреждает, если есть незаполненные или ошибочные
		 */
		countTotalAnalitics: function(){
			setTimeout(function(){
				var count_div = $('.analitics-total-wrap');
				var btn = $('.tr-action-commit .btn:first, .action-edit-save');

				var highlight = function(state){
					if(state){
						count_div.css('color', 'red');
						btn.css('border-color', 'red');
					}
					else{
						count_div.css('color', 'inherit');
						btn.css('border-color', 'inherit');
					}
				};

				if(count_div.length===0){
					count_div = $('<div class="analitics-total-wrap"></div>')
						.attr('style', "float:right; margin-right:15px")
						.html('Всего: <span class="analitics-total-count"></span>')
					;
					$('.attach-new-analitic td.td-item-add-ex:first').append(count_div);
				}
				highlight(false);

				var counts = $(PlanfixFix.fields.count);
				var totals = 0;
				counts.each(function(i, count_field){
					var analitic = $(count_field).parents('.add-analitic-block');
					var count = $(count_field).val();
					var hours_per_count = analitic.find(PlanfixFix.fields.hours_per_count).text().replace(',', '.');
					var hours = count * hours_per_count;
					if(count==='' || hours_per_count==='') highlight(true);
					totals += hours;
				});
				totals = (totals * 60).toFixed(1).replace(/\.0$/, '');
				if(isNaN(totals) || totals===0) highlight(true);

				count_div.find('.analitics-total-count').html(totals);
			}, 10);
		},

		/**
		 * Прокручивает до селектора, используется функция планфикса
		 */
		scrollTo: function(elem){
			win.TaskCardPoolJS.getInstance(win.PlanfixPage.task).scroller.scrollToBlock(elem);
		},

		/**
		 * Записывает в последнего в очереди чистый deferred,
		 * следующий _addAnalitic() исполнится мгновенно
		 */
		resetDeferred: function(){
			PlanfixFix.deferred = $.Deferred().resolve();
		},

		/**
		 * Возвращает массив дат d-m-Y от dayofweek в кол-ве count
		 * Если текущая дата совпадает с dayofweek, берется сегодня,
		 * иначе этот ближайший день недели
		 */
		getDates: function(dayofweek, count){
			var dates = [];
			
			// next or current monday
			d = new Date();
			var day = d.getDay();
			if(day===0) day = 7;
			if(day!=dayofweek){
			  var diff = (dayofweek+7-day) * 86400 * 1000;
			  d.setTime(d.getTime() + diff);
			}

            var pad = function(num){
                var A = num.toString();
                if(A.length > 1) return A;
                else return ("00" + A).slice(-2);
            };
            
			for(var i = 0; i < count; i++){
				dates.push(
                    pad(d.getDate()) + '-' + pad(1+d.getMonth()) + '-' + d.getFullYear()
                );
				d.setTime( d.getTime() + 86400000 );
			}

			return dates;
		}
	};

	$(function(){
		PlanfixFix.init();
	});
})();
