import Charter from './charter/charter.js';
import Analyser from './charter/analyser.js';
import Stats from './charter/stats.js';

const selectors = {
	code: '.js-codebook__code',
	source: '.js-codebook__source'
};

const dataSelectors = {
	set: 'data-codebook-set',
	log: 'data-codebook-log',
	chart: 'data-codebook-chart'
};

const module = {
	init: function () {
		let sets = module._createCodeSets();

		for (let setName in sets) {
			let set = sets[setName];

			module._runSet(set);
		}
	},

	_createCodeSets: function () {
		let $code = document.querySelectorAll(`${selectors.code}, ${selectors.source}`);
		let setNames = [];
		let sets = {};

		$code.forEach($el => {
			let setName = $el.getAttribute(dataSelectors.set);
			let set;
			if (setNames.indexOf(setName) === -1) {
				setNames.push(setName);

				set = module._newSet();
				sets[setName] = set;
			} else {
				set = sets[setName];
			}

			if ($el.matches(selectors.source)) {
				set.source.push($el);
			} else {
				set.code.push($el);
			}
		});

		return sets;
	},

	_newSet: function () {
		return {
			source: [],
			code: []
		};
	},

	_runSet: function (set) {
		let code = set.code.reduce(module._combineCode, '');
		let source = set.source.reduce(module._combineCode, '');

		let fileLoadedFnFactory = new Function('Charter', 'Analyser', 'Stats', '_log', '_chart', `return function (data) {
'use strict';
let _$log = null;
let log = function () {};

let _$chart = null;
let chart = function () {};

let rows = data.rows;
let cols = data.cols;

${code}
}`);
		let fileLoadedFn = fileLoadedFnFactory(Charter, Analyser, Stats, module._logOutput, module._chartOutput);

		let loadSrcFn = new Function ('Charter', 'Analyser', 'Stats', 'analyseData', source);

		loadSrcFn(Charter, Analyser, Stats, fileLoadedFn);
	},

	_combineCode: function (allCode, $newCode) {
		let newCode = module._decodeHtml($newCode.innerHTML);

		let logId = $newCode.getAttribute(dataSelectors.log);
		if (logId) {
			newCode = `_$log = document.getElementById('${logId}');
log = function (output) {
	_log(output, _$log);
};

${newCode}

log = function () {};`;
		}

		let chartId = $newCode.getAttribute(dataSelectors.chart);
		if (chartId) {
			newCode = `_$chart = document.getElementById('${chartId}');
chart = function (output) {
	_chart(output, _$chart);
};

${newCode}

chart = function () {};`;
		}

		let combinedCode = `${allCode}\n${newCode}`;

		return combinedCode;
	},

	_logOutput: function (output, $log) {
		if ($log) {
			if (typeof output === 'object') {
				output = JSON.stringify(output, null, '\t');
			}

			$log.innerHTML += output + '\n';
		}
	},

	_chartOutput: function (output, $chart) {
		if ($chart) {
			$chart.innerHTML = output;
		}
	},

	_decodeHtml: function (htmlString) {
		// We don't want to see things like =&gt; in code when we really mean =>

		let $textarea = document.createElement('textarea');
		$textarea.innerHTML = htmlString;

		let decodedString = $textarea.value;

		return decodedString;
	}
};

module.init();
