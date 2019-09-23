define(
	[
		'charter/charter',
		'analyser/analyser',
		'stats/stats',

		'/charter/app/docs/menu.js'
	],

	function (Charter, Analyser, Stats, menu) {
		const docs = (function () {
			const selectors = {
				example: '.js-doc-example',
				code: '.js-doc-example-code, .js-doc-example-code-chart',
				output: '.js-doc-example-output',

				chartCode: '.js-doc-example-code-chart'
			};

			const dataSelectors = {
				input: 'data-doc-example-input'
			};

			const classes = {
				codeEntry: 'code__entry',
				error: 'is-error'
			};

			let data;

			let editingCode = false;

			const module = {
				init: function () {
					module._loadFiles(module._filesLoaded);

					menu.init();
				},

				_loadFiles: function (callback) {
					let fileConfigA = {
						headerRows: 1,
						cols: {
							NAME: Analyser.getColNumber('A'),
							COUNTRY: Analyser.getColNumber('B'),
							POPULATION: Analyser.getColNumber('C'),
							CAPITAL: Analyser.getColNumber('D'),
							PUBLIC_TRANSPORT: Analyser.getColNumber('E'),
							MAYOR_2012: Analyser.getColNumber('F'),
							MAYOR_2018: Analyser.getColNumber('G')
						},
						arrayCols: {},
						aliases: {
							COUNTRY: [
								['New Zealand', 'Aotearoa']
							]
						},
						enumsMap: {}
					};
					fileConfigA.arrayCols[fileConfigA.cols.PUBLIC_TRANSPORT] = ',';
					fileConfigA.arrayCols[fileConfigA.cols.MAYOR_2018] = ',';

					let fileConfigB = {
						headerRows: 1,
						cols: {
							NAME: Analyser.getColNumber('A'),
							COUNTRY: Analyser.getColNumber('B'),
							POPULATION: Analyser.getColNumber('C')
						}
					};
					let fileConfigC = {
						headerRows: 1,
						cols: {
							YEAR: Analyser.getColNumber('A'),
							POPULATION: Analyser.getColNumber('B')
						}
					};

					Analyser.loadFile(
						'/charter/app/docs/data/city example.csv', fileConfigA,
						'/charter/app/docs/data/city example 2.csv', fileConfigB,
						'/charter/app/docs/data/city example 3.csv', fileConfigC,
						callback
					);
				},

				_filesLoaded: function (dataConfigA, dataConfigB, dataConfigC) {
					data = {
						default: dataConfigA,
						'city example.csv': dataConfigA,
						'city example 2.csv': dataConfigB,
						'city example 3.csv': dataConfigC
					};

					module._initEvents();

					let $examples = document.querySelectorAll(selectors.example);
					$examples.forEach($example => module._initExample($example));
				},

				_initEvents: function () {
					let $codeEls = document.querySelectorAll(selectors.code);

					$codeEls.forEach($code => {
						$code.addEventListener('input', module._handleCodeInput);
						$code.addEventListener('keydown', module._handleTabKey);
						$code.addEventListener('keydown', module._handleEscapeKey);


						$code.addEventListener('input', () => editingCode = true);
						$code.addEventListener('blur', () => editingCode = false);
					});
				},

				_initExample: function ($example) {
					let $code = $example.querySelector(selectors.code);

					$code.setAttribute('contenteditable', true);
					$code.setAttribute('spellcheck', false);

					module._runMethodExample($example)
				},

				_runMethodExample: function ($example) {
					let $code = $example.querySelector(selectors.code);
					let $output = $example.querySelector(selectors.output);

					let code = `'use strict';
					${$code.innerText}`;

					let output = [];
					consoleSubstitute = {
						log: module._createOutputEntryOfType('log', output),
						info: module._createOutputEntryOfType('info', output),
						error: module._createOutputEntryOfType('error', output),
						table: module._createOutputEntryOfType('table', output)
					}

					let input = $example.getAttribute(dataSelectors.input);
					let dataConfig = module._getDataConfig(input);

					try {
						let fn = new Function('Charter', 'Analyser', 'Stats', 'dataConfig', 'console', code);
						let fnOutput = fn(Charter, Analyser, Stats, dataConfig, consoleSubstitute);

						let logFnOutput = module._createOutputEntryOfType('output', output);
						if (typeof fnOutput !== 'undefined') {
							logFnOutput(fnOutput);
						}

						if ($code.matches(selectors.chartCode)) {
							module._renderOutputChart(output, $output);
						} else {
							module._renderOutput(output, $output);
						}
						$code.classList.remove(classes.error);
					} catch (e) {
						// console.error(e.message);
						$code.classList.add(classes.error);
					}
				},

				_getDataConfig: function (input) {
					let dataConfig = data[input] || data['default'];

					// Create a deep copy so it can't be messed with
					let filters = Object.assign({}, dataConfig.filters);
					dataConfig = JSON.parse(JSON.stringify(dataConfig));
					dataConfig.filters = filters;

					return dataConfig;
				},

				_createOutputEntryOfType: function (type, output) {
					return function () {
						let args = Array.from(arguments);

						args.forEach(content => {
							output.push({type, content});
						});
					};
				},

				_renderOutput: function (output, $output) {
					if (output.length) {
						$output.innerHTML = '';

						output.forEach(entry => {
							if (entry.type === 'table') {
								module._renderTableEntry(entry, $output);
							} else {
								module._renderSpanEntry(entry, $output);
							}
						});
					}
				},

				_renderTableEntry: function (entry, $output) {
					let $table = document.createElement('table');
					$output.append($table);

					$table.classList.add(classes.codeEntry);
					$table.classList.add(entry.type);

					let entryData = entry.content;
					let headers = Object.keys(entryData[Object.keys(entryData)[0]]);

					let $thead = document.createElement('thead');
					$table.append($thead);
					let $tr = document.createElement('tr');
					$table.append($tr);

					// Insert initial header
					let $th = document.createElement('th');
					$tr.append($th);
					$th.innerText = '(index)';

					// Insert the rest of the headers
					headers.forEach(th => {
						let $th = document.createElement('th');
						$tr.append($th);

						$th.innerText = th;
					});

					let $tbody = document.createElement('tbody');
					$table.append($tbody);

					let keys = Object.keys(entryData);
					keys.forEach(index => {
						let $tr = document.createElement('tr');
						$tbody.append($tr);

						let $td = document.createElement('td');
						$tr.append($td);
						$td.innerText = index;

						let row = entryData[index];
						for (let col in row) {
							let $td = document.createElement('td');
							$tr.append($td);

							$td.innerText = row[col];
						}
					});
				},

				_renderSpanEntry: function (entry, $output) {
					let $span = document.createElement('span');
					$output.append($span);

					let entryData = entry.content;

					if (entryData instanceof Object) {
						entryData = JSON.stringify(entryData, null, '\t');
					}

					$span.classList.add(classes.codeEntry);
					$span.classList.add(entry.type);
					$span.innerText = entryData;
				},

				_renderOutputChart: function (output, $output) {
					let chart = output.find(a => a.type === 'output');
					let $chart;

					if (chart) {
						$chart = chart.content;
					}

					$output.innerHTML = '';

					if ($chart.jquery) {
						$chart.appendTo($output);
					} else {
						$output.innerHTML = $chart;
					}
				},

				_handleCodeInput: function (e) {
					let $target = e.target;
					let $code = $target;
					while ($code.matches(selectors.code) === false) {
						$code = $code.parentElement;
						if ($code === null) {
							return null;
						}
					}
					let $example = $code;

					while ($example.matches(selectors.example) === false) {
						$example = $example.parentElement;
						if ($example === null) {
							return null;
						}
					}

					module._runMethodExample($example);
				},

				_handleTabKey: function (e) {
					if (editingCode === true) {
						let $target = e.target;
						let $code = $target;
						while ($code.matches(selectors.code) === false) {
							$code = $code.parentElement;
							if ($code === null) {
								return null;
							}
						}
						let key = e.key;

						if (key.toLowerCase() === 'tab') {
							if (document.execCommand('insertHtml', false, '\t')) {
								e.preventDefault();
							}
						}
					}
				},

				_handleEscapeKey: function (e) {
					if (editingCode === true) {
						let $target = e.target;
						let $code = $target;
						while ($code.matches(selectors.code) === false) {
							$code = $code.parentElement;
							if ($code === null) {
								return null;
							}
						}
						let key = e.key;

						if (key.toLowerCase() === 'escape') {
							$code.blur();
						}
					}
				}
			};

			return module;
		})();

		docs.init();
	}
);