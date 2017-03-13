define(
	[
		'jquery',
		'templayed',
		'papaparse',
		'd3',

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
		d3,

		tableTemplate,
		barChartTemplate,
		barChartHTemplate,
		lineGraphTemplate,
		scatterPlotTemplate
	) {
		var numericAxisDefaults = {
			values: 4,
			// When gridlines is set to null, it interhits its value from values
			gridlines: null,

			toFixed: 0,
			percentage: false,

			// When roundTo is set to null, it will be set to the power of
			// 10 at the same order of magnitude as the maximum value
			roundTo: null,

			// When min or max are set to null, they will be calculated
			min: 0,
			max: null
		};

		var qualitativeAxisDefaults = {
			valuesEvery: 1,

			// When gridlinesEvery is set to null,
			// it inherits its value from valuesEvery
			gridlinesEvery: null
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
			/////////////////
			// CSV PARSING //
			/////////////////
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

			getDisplayNumber: function (number, axisConfig) {
				// TODO: Allow minimum significant figures to be specified,
				// so toFixed can be calculated for small scales

				axisConfig = Charter._getNumericAxisOptions(axisConfig);

				if (typeof number !== 'number') {
					number = Charter._extractNumber(number);
				}

				if (axisConfig.percentage) {
					number = number * 100;
				}

				number = number.toFixed(axisConfig.toFixed);

				number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

				if (axisConfig.percentage) {
					number = number + '%';
				}

				return number;
			},

			///////////////////
			// CREATING AXES //
			///////////////////
			_getNumericAxisOptions: function (axisConfig) {
				axisConfig = axisConfig || {};

				var options = {},
					prop;

				for (prop in numericAxisDefaults) {
					options[prop] = numericAxisDefaults[prop];
				}

				for (prop in axisConfig) {
					options[prop] = axisConfig[prop];
				}

				if ((!options.gridlines) && options.gridlines !== 0) {
					options.gridlines = axisConfig.values;
				}

				return options;
			},

			_getQualitativeAxisOptions: function (axisConfig) {

				axisConfig = axisConfig || {};

				var options = {},
					prop;

				for (prop in qualitativeAxisDefaults) {
					options[prop] = qualitativeAxisDefaults[prop];
				}

				for (prop in axisConfig) {
					options[prop] = axisConfig[prop];
				}

				if ((!options.gridlinesEvery) && options.gridlinesEvery !== 0) {
					options.gridlinesEvery = axisConfig.valuesEvery;
				}

				return options;
			},

			_getRange: function (chartData, axisConfig) {
				// Get the minimum and maximum value in a chart's data
				// then round them according to the axisConfig

				axisConfig = Charter._getNumericAxisOptions(axisConfig);

				var i,
					roundTo,
					min, max;

				min = max = chartData.data[0].value;
				for (i = 0; i < chartData.data.length; i++) {
					min = Math.min(min, chartData.data[i].value);
					max = Math.max(max, chartData.data[i].value);
				}

				if (axisConfig.roundTo !== null) {
					roundTo = axisConfig.roundTo;
				} else {
					// log10 not supported in IE, so substitute ln(x)/ln(10)
					roundTo = ('log10' in Math) ? Math.log10(max) : Math.log(max) / Math.log(10);
					roundTo = Math.pow(10, Math.floor(max));
				}

				if (axisConfig.min !== null) {
					min = axisConfig.min;
				} else {
					min = Math.floor(min / roundTo) * roundTo;
				}

				if (axisConfig.max !== null) {
					max = axisConfig.max;
				} else {
					max = Math.ceil(max / roundTo) * roundTo;
				}

				return [min, max];
			},

			_createNumericAxis: function (chartData, axisConfig) {
				// Calculates axis range
				// then creates gridlines

				axisConfig = Charter._getNumericAxisOptions(axisConfig);

				var axis = {
						values: [],
						gridlines: []
					},

					i,
					value, displayValue,
					range,
					max, min;

				range = Charter._getRange(chartData, axisConfig);
				min = range[0];
				max = range[1];

				for (i = 0; i <= axisConfig.gridlines; i++) {
					value = Math.round(((max-min) * i / axisConfig.gridlines) + min);
					displayValue = Charter.getDisplayNumber(value, axisConfig);

					axis.gridlines.push({
						value: value,
						displayValue: displayValue
					});
				}

				for (i = 0; i <= axisConfig.values; i++) {
					value = Math.round(((max-min) * i / axisConfig.values) + min);
					displayValue = Charter.getDisplayNumber(value, axisConfig);

					axis.values.push({
						value: value,
						displayValue: displayValue
					});
				}

				return axis;
			},

			_createQualitativeAxis: function (chartData, axisConfig) {
				// Creates axis with qualitative values, typically strings
				// Because the values are qualitative, there can be no interpolation

				axisConfig = Charter._getQualitativeAxisOptions(axisConfig);

				var axis = {
						values: [],
						gridlines: []
					},

					i,
					displayValue,
					range,
					max, min;

				if (axisConfig.gridlinesEvery === 1 || (chartData.data.length % axisConfig.gridlinesEvery) === 1) {
					// The gridlines will fit perfectly into the data

					for (i = 0; i < chartData.data.length; i += axisConfig.gridlinesEvery) {
						displayValue = chartData.data[i].label;

						axis.gridlines.push({
							displayValue: displayValue
						});
					}
				} else {
					// TODO: Handle this
					// Somehow have space left over after the last gridline,
					// depending on the result of chartData.data.length % axisConfig.gridlinesEvery
				}

				if (axisConfig.valuesEvery === 1 || (chartData.data.length % axisConfig.valuesEvery) === 1) {
					// The gridlines will fit perfectly into the data

					for (i = 0; i < chartData.data.length; i += axisConfig.valuesEvery) {
						displayValue = chartData.data[i].label;

						axis.values.push({
							displayValue: displayValue
						});
					}
				} else {
					// TODO: Handle this
					// Somehow have space left over after the last gridline,
					// depending on the result of chartData.data.length % axisConfig.valuesEvery
				}

				return axis;
			},

			_getDisplayValues: function (chartData, axisConfig) {
				var i;

				for (i = 0; i < chartData.data.length; i++) {
					// Add commas for display values
					chartData.data[i].displayValue = Charter.getDisplayNumber(chartData.data[i].value, axisConfig);
				}

				return chartData;
			},

			_getValuePercentages: function (chartData, axisConfig) {
				// Calculates the percentage to use for displaying each value

				var i,
					range,
					min, max;

				range = Charter._getRange(chartData, axisConfig);
				min = range[0];
				max = range[1];

				for (i = 0; i < chartData.data.length; i++) {
					// Calculate percentage as this is used for height
					chartData.data[i].percentage = (chartData.data[i].value-min) / (max-min) * 100;
				}

				return chartData;
			},

			_getIndependentAxisPercentages: function (chartData, axisConfig) {
				// Calculates the percentage to position each piece of data on the independent axis
				// Currently assumes uniform distribution per qualitative axis

				var i;

				for (i = 0; i < chartData.data.length; i++) {
					chartData.data[i].index = 100 * i / (chartData.data.length-1);
				}

				return chartData;
			},

			///////////////////////
			// CREATING DISPLAYS //
			///////////////////////
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

			createBarChart: function (chartData, axisConfig) {
				// Takes in basic chart data,
				// constructs data for independent axis based on axisConfig,
				// creates display values based on axisConfig,
				// then uses the combined data to build the markup for a bar chart

				axisConfig = Charter._getNumericAxisOptions(axisConfig);

				chartData.dependentAxis = Charter._createNumericAxis(chartData, axisConfig);
				chartData = Charter._getValuePercentages(chartData, axisConfig);
				chartData = Charter._getDisplayValues(chartData, axisConfig);

				$chart = $(templayed(axisConfig.horizontal ? barChartHTemplate : barChartTemplate)(chartData));
				$chart.data('chartData', chartData);
				$chart.data('dependentAxisConfig', axisConfig);

				return $chart;
			},

			createLineGraph: function (chartData, independentAxisConfig, dependentAxisConfig) {
				return Charter._create2DChart(chartData, independentAxisConfig, dependentAxisConfig, lineGraphTemplate);
			},

			createScatterPlot: function (chartData, independentAxisConfig, dependentAxisConfig) {
				return Charter._create2DChart(chartData, independentAxisConfig, dependentAxisConfig, scatterPlotTemplate);
			},

			_create2DChart: function (chartData, independentAxisConfig, dependentAxisConfig, template) {
				// Takes in basic chart data,
				// constructs data for axes based on axisConfig,
				// creates display values based on axisConfig,
				// then uses the combined data to build the markup for the specific chart

				// TODO: Numeric independent axis
					// As part of this: allow unequally spaced data across the horizontal axis
				// TODO: Allow multiple datasets, e.g. multiple lines
				// TODO: Legend
				// TODO: Allow secondary vertical axis

				// Construct independent qualitative axis and dependent numeric axis
				chartData.independentAxis = Charter._createQualitativeAxis(chartData, dependentAxisConfig);
				chartData.dependentAxis = Charter._createNumericAxis(chartData, independentAxisConfig);

				// Calculate percentage values to use for display on each axis
				chartData = Charter._getValuePercentages(chartData, independentAxisConfig);
				chartData = Charter._getIndependentAxisPercentages(chartData, independentAxisConfig);

				// Create display values to show on axes and tooltips
				chartData = Charter._getDisplayValues(chartData, independentAxisConfig);

				// Render chart with specified template
				$chart = $(templayed(template)(chartData));
				$chart.data('chartData', chartData);

				return $chart;
			},

			////////////
			// UPDATE //
			////////////
			updateBarChart: function (chart, data, titleText) {
				// Takes a .js-chart DOM element, an array of data values, and titleText
				// Updates it to reflect the new data and titleText

				// Currently assumes the data will match the current number of bars

				var $chart,

					axisValues, x,

					bars,
					tooltips,
					title;

				$chart = $(chart);
				chartData = $chart.data('chartData');
				axisConfig = $chart.data('dependentAxisConfig');

				chart = d3.select(chart);

				axisValues = chartData.dependentAxis.values;
				x = d3.scaleLinear()
					.domain([axisValues[0].value, axisValues[axisValues.length-1].value])
					.range([0, 100]);

				bars = chart.selectAll('.js-chart-bar')
					.data(data);
				tooltips = chart.selectAll('.js-chart-tooltip')
					.data(data);
				title = chart.selectAll('.js-chart-title')
					.data([titleText]);

				bars
					.style(axisConfig.horizontal ? 'width' : 'height', function (d) { return x(d) + '%'; })
					.attr('title', function (d) { return Charter.getDisplayNumber(d, axisConfig); });

				tooltips
					.text(function (d) { return Charter.getDisplayNumber(d, axisConfig); });

				title
					.text(function (d) { return titleText; });
			}
		};

		return Charter;
	}
);