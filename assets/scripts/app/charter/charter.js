define(
	[
		'jquery',
		'templayed',
		'papaparse',

		'text!templates/table.html',
		'text!templates/bar-chart.html',
		'text!templates/bar-chart-h.html',
		'text!templates/line-graph.html',
		'text!templates/scatter-plot.html'
	],

	function (
		$,
		templayed,
		Papa,

		tableTemplate,
		barChartTemplate,
		barChartHTemplate,
		lineGraphTemplate,
		scatterPlotTemplate
	) {
		var defaults = {
			numTicks: 4,

			// When roundTo is set to null, it will be set to the power of
			// 10 at the same order of magnitude as the maximum value
			roundTo: null,

			// When min or max are set to null, they will be calculated
			min: 0,
			max: null
		};

		// Expected format of basic chart data:
		// {
		//	title: 'Title',
		// 	data: [
		// 		{
		// 			label: 'Label 1',
		// 			value: 1
		// 		}
		// 	]
		// }

		var Charter = {
			parseCsv: function (csv, callback) {
				// Parse a CSV file then process the data

				Papa.parse(csv, {
					complete: Charter._csvParsed(callback)
				});
			},

			_csvParsed: function (callback) {
				// Convert strings to numbers where appropriate,
				// then pass the data to a callback function

				return function (csv) {
					Charter._extractCellNumbers(csv.data);

					if (callback && typeof callback === 'function') {
						callback(csv.data);
					}
				};
			},

			_extractCellNumbers: function (csv) {
				// Use _extractNumber on each cell

				var i, j;

				for (i = 0; i < csv.length; i++) {
					for (j = 0; j < csv[i].length; j++) {
						csv[i][j] = Charter._extractNumber(csv[i][j]);
					}
				}
			},

			_extractNumber: function (string) {
				// Convert strings to numbers where possible

				var val = string.replace(/,|%$/g, ''),
					length;

				if (parseFloat(val) === +val) {
					if (string.match(/%$/)) {
						// If the value is a percentage, divide by 100

						// Convert to string to see how many places after the point, to round after dividing
						// Otherwise you'll get numbers like 0.10800000000000001
						length = (val + '');
						length.replace(/^[^.]+/, '');
						length = length.length;

						val = val / 100;
						val = val.toFixed(length+2);
					}
					return +val;
				} else {
					return string;
				}
			},

			_getDisplayNumber: function (number, config) {
				config = config || {};
				config = $.extend({}, defaults, config);

				if (typeof number !== 'number') {
					number = Charter._extractNumber(number);
				}

				if (config.percentage) {
					number = number * 100;
				}

				if (typeof config.toFixed !== 'undefined') {
					number = number.toFixed(config.toFixed);
				}

				number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

				if (config.percentage) {
					number = number + '%';
				}

				return number;
			},

			createTable: function (rows) {
				// Create the necessary data structure to build a table of the data

				var data = {
						headers: rows[0],
						rows: []
					},
					row,
					i, j;

				for (i = 1; i < rows.length; i++) {
					row = {
						cells: []
					};

					for (j = 0; j < rows[i].length; j++) {
						row.cells.push(rows[i][j]);
					}

					data.rows.push(row);
				}

				return templayed(tableTemplate)(data);
			},

			_getRange: function (chartData, config) {
				// Get the minimum and maximum value in a chart's data
				// then round them according to the config

				config = config || {};
				config = $.extend({}, defaults, config);

				var i,
					roundTo,
					min, max;

				min = max = chartData.data[0].value;
				for (i = 0; i < chartData.data.length; i++) {
					min = Math.min(min, chartData.data[i].value);
					max = Math.max(max, chartData.data[i].value);
				}

				if (config.roundTo !== null) {
					roundTo = config.roundTo;
				} else {
					roundTo = Math.pow(10, Math.floor(Math.log10(max)));
				}

				if (config.min !== null) {
					min = config.min;
				} else {
					min = Math.floor(min / roundTo) * roundTo;
				}

				if (config.max !== null) {
					max = config.max;
				} else {
					max = Math.ceil(max / roundTo) * roundTo;
				}

				return [min, max];
			},

			_createAxis: function (chartData, config) {
				// Takes simple chart data and calculates values to use for axes based on config

				config = config || {};
				config = $.extend({}, defaults, config);

				var axisValues = [],

					i, value,
					range,
					max, min;

				range = Charter._getRange(chartData, config);
				min = range[0];
				max = range[1];

				for (i = 0; i <= config.numTicks; i++) {
					value = Math.round(((max-min) * i / config.numTicks) + min);

					axisValues.push({
						value: value,
						displayValue: Charter._getDisplayNumber(value, config)
					});
				}

				return axisValues;
			},

			_getDisplayNumbers: function (chartData, config) {
				var i;

				for (i = 0; i < chartData.data.length; i++) {
					// Add commas for display values
					chartData.data[i].displayValue = Charter._getDisplayNumber(chartData.data[i].value, config);
				}

				return chartData;
			},

			_getPercentages: function (chartData, config) {
				var i,
					range,
					min, max;

				range = Charter._getRange(chartData, config);
				min = range[0];
				max = range[1];

				for (i = 0; i < chartData.data.length; i++) {
					// Calculate percentage as this is used for height
					chartData.data[i].percentage = (chartData.data[i].value-min) / (max-min) * 100;
				}

				return chartData;
			},

			createBarChart: function (chartData, config) {
				// Takes in basic chart data,
				// constructs data for axes based on config,
				// creates display values based on config,
				// then uses the combined data to build the markup for a bar chart

				config = config || {};
				config = $.extend({}, defaults, config);

				chartData.axisValues = Charter._createAxis(chartData, config);
				chartData = Charter._getPercentages(chartData, config);
				chartData = Charter._getDisplayNumbers(chartData, config);

				$chart = $(templayed(config.horizontal ? barChartHTemplate : barChartTemplate)(chartData));
				$chart.data('chartData', chartData);

				return $chart;
			},

			createLineGraph: function (chartData, config) {
				// Takes in basic chart data,
				// constructs data for axes based on config,
				// creates display values based on config,
				// then uses the combined data to build the markup for a line chart

				config = config || {};
				config = $.extend({}, defaults, config);

				// TODO: Split vertical and horizontal axes
				// TODO: Get percentage across the graph
				// TODO: Allow unequally spaced data across the horizontal axis
				// TODO: Allow the number of horizontal axis labels to be picked
					// This can't be interpolated, so it should be a factor of the total or
					// it won't have a label at both the first and last position
				// TODO: Allow multiple lines
				// TODO: Legend
				// TODO: Allow secondary vertical axis

				chartData.axisValues = Charter._createAxis(chartData, config);
				chartData = Charter._getPercentages(chartData, config);
				chartData = Charter._getDisplayNumbers(chartData, config);

				for (var i = 0; i < chartData.data.length; i++) {
					chartData.data[i].index = 100 * i / (chartData.data.length-1);
				}

				$chart = $(templayed(lineGraphTemplate)(chartData));
				$chart.data('chartData', chartData);

				return $chart;
			}

			// TODO: createScatterPlot
				// Will be identical to createLineGraph, but with a different template
		};

		return Charter;
	}
);