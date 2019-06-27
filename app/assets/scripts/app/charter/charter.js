define(
	[
		'jquery',
		'templayed',
		'papaparse',
		'd3',

		'stats/stats',

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

		Stats,

		tableTemplate,
		barChartTemplate,
		barChartHTemplate,
		lineGraphTemplate,
		scatterPlotTemplate
	) {
		var numericAxisDefaults = {
			values: 5, // Will always fit when max is a multiple of 10
			valuesAt: [],
			// When gridlines is set to null, it interhits its value from values
			gridlines: null,

			showTooltips: false,

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
			// Show every N values on the axis
			valuesEvery: 1,
			// Skip N values at the start before showing them
			// Will typically be less than valuesEvery, used to offset
			valuesSkip: 0,

			// When gridlinesEvery is set to null,
			// it inherits its value from valuesEvery
			gridlinesEvery: null,

			// When gridlinesSkip is set to null,
			// it inherits its value from valuesSkip
			gridlinesSkip: null
		};

		// Expected format of basic chart data:
		// {
		// 	title: 'Title',
		//	showLegend: true,
		// 	labels: ['Label 1', 'Label 2'],
		// 	dataSeries: [
		// 		{
		//			name: 'Series Name',
		// 			color: '#fff',
		// 			dataPoints: [1, 2]
		// 		}
		// 	],
		// 	smoothing: 2
		// }

		var Charter = {
			_extractNumber: function (string) {
				// Convert strings to numbers where possible
				// TODO: find a better solution than duplicating this code from analyser
				// it doesn't seem like enough to set up a new dependency though

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

			_getDisplayNumber: function (number, axisConfig) {
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
					options.gridlines = options.values;
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
					options.gridlinesEvery = options.valuesEvery;
				}

				if ((!options.gridlinesSkip) && options.gridlinesSkip !== 0) {
					options.gridlinesSkip = options.valuesSkip;
				}

				return options;
			},

			_mapToRange: function (value, min, max) {
				// Takes in a value and maps it to a percentage
				// between the passed min and max values

				return (value-min) / (max-min) * 100;
			},

			_getRange: function (dataSeries, axisConfig) {
				// Get the minimum and maximum value in a chart's data
				// across all dataSeries, rounded according to the axisConfig

				var i,
					ranges = [],
					finalRange = [];

				for (i = 0; i < dataSeries.length; i++) {
					if (dataSeries[i].dataPoints.length) {
						ranges.push(Charter._getRangeSingle(dataSeries[i], axisConfig));
					}
				}

				finalRange = [ranges[0][0], ranges[0][1]];
				for (i = 1; i < ranges.length; i++) {
					finalRange[0] = Math.min(finalRange[0], ranges[i][0]);
					finalRange[1] = Math.max(finalRange[1], ranges[i][1]);
				}

				return Charter._roundRange(finalRange, axisConfig);
			},

			_roundRange: function (dataRange, axisConfig) {
				// Ensure all values in the axis are
				// divisible by axisConfig.roundTo

				// This requires that both min and max are
				// divisible by axisConfig.roundTo, and the
				// difference between them must be divisible
				// by axisConfig.roundTo * axisConfig.values

				// Assume min and max are both already
				// divisible by axisConfig.roundTo

				axisConfig = Charter._getNumericAxisOptions(axisConfig);

				var min = dataRange[0];
				var max = dataRange[1];

				if (axisConfig.roundTo !== null) {
					var range = max - min;
					var roundTo = axisConfig.roundTo;
					var values = axisConfig.values;
					var factor = roundTo * values;
					var remainder = range % factor;
					var increment;

					if (remainder !== 0) {
						// Increment max until the difference between
						// it and min is the smallest number above range
						// that is divisible by factor
						increment = factor - remainder;
						max += increment;

						if (axisConfig.min === null) {
							// If min is determined (i.e. null was passed), then
							// also push min out instead of only incrementing max

							// Decrease max and min by half (or slightly less)
							// of the amount max was incremented was

							increment = increment / 2;
							remainder = increment % roundTo;
							if (remainder !== 0) {
								increment -= remainder;
							}

							max -= increment;
							min -= increment;
						}
					}
				}

				return [min, max];
			},

			_getRangeSingle: function (dataSeries, axisConfig) {
				// Get the minimum and maximum value of a dataSeries
				// then round them according to the axisConfig

				axisConfig = Charter._getNumericAxisOptions(axisConfig);

				var i,
					roundTo,
					min, max;

				min = max = dataSeries.dataPoints[0].value;
				for (i = 0; i < dataSeries.dataPoints.length; i++) {
					min = Math.min(min, dataSeries.dataPoints[i].value);
					max = Math.max(max, dataSeries.dataPoints[i].value);
				}

				if (axisConfig.roundTo !== null) {
					roundTo = axisConfig.roundTo;
				} else {
					// log10 not supported in IE, so substitute ln(x)/ln(10)
					roundTo = ('log10' in Math) ? Math.log10(max) : Math.log(max) / Math.log(10);
					roundTo = Math.pow(10, Math.floor(roundTo));
				}

				if (axisConfig.min !== null) {
					min = axisConfig.min;
				} else {
					min = roundTo && Math.floor(min / roundTo) * roundTo;
				}

				if (axisConfig.max !== null) {
					max = axisConfig.max;
				} else {
					max = roundTo && Math.ceil(max / roundTo) * roundTo;
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

				range = Charter._getRange(chartData.dataSeries, axisConfig);
				min = range[0];
				max = range[1];

				for (i = 0; i <= axisConfig.gridlines; i++) {
					value = ((max-min) * i / axisConfig.gridlines) + min;
					displayValue = Charter._getDisplayNumber(value, axisConfig);

					axis.gridlines.push({
						value: value,
						displayValue: displayValue,
						percentage: Charter._mapToRange(value, min, max)
					});
				}

				for (i = 0; i <= axisConfig.values; i++) {
					value = ((max-min) * i / axisConfig.values) + min;
					displayValue = Charter._getDisplayNumber(value, axisConfig);

					axis.values.push({
						value: value,
						displayValue: displayValue,
						percentage: Charter._mapToRange(value, min, max)
					});
				}

				if (axisConfig.valuesAt.length) {
					for (i = 0; i < axisConfig.valuesAt.length; i++) {
						value = ((max-min) * (axisConfig.valuesAt[i] / max)) + min;
						displayValue = Charter._getDisplayNumber(value, axisConfig);

						axis.gridlines.push({
							value: value,
							displayValue: displayValue,
							percentage: Charter._mapToRange(value, min, max)
						});

						axis.values.push({
							value: value,
							displayValue: displayValue,
							percentage: Charter._mapToRange(value, min, max)
						});
					}

					axis.gridlines.sort(function (a, b) {
						return a.value - b.value;
					});
					axis.values.sort(function (a, b) {
						return a.value - b.value;
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

				if (axisConfig.gridlinesEvery !== 0) {
					for (i = axisConfig.gridlinesSkip; i < chartData.labels.length; i += axisConfig.gridlinesEvery) {
						displayValue = chartData.labels[i];

						axis.gridlines.push({
							displayValue: displayValue,
							percentage: i / (chartData.labels.length-1) * 100
						});
					}
				}

				if (axisConfig.valuesEvery !== 0) {
					for (i = axisConfig.valuesSkip; i < chartData.labels.length; i += axisConfig.valuesEvery) {
						displayValue = chartData.labels[i];

						axis.values.push({
							displayValue: displayValue,
							percentage: i / (chartData.labels.length-1) * 100
						});
					}
				}

				return axis;
			},

			_processQualitativeLabels: function (labels, axisConfig) {
				// Process a set of labels for a given axis config
				// Currently will only set some labels to a blank string,
				// depending on whether or not axisConfig has a "valuesEvery"
				// property that is not 1.

				var incr;
				var i;
				var j;
				var newLabels = [];
				for (i = 0; i < labels.length; i++) {
					newLabels.push(labels[i]);
				}

				if (axisConfig && typeof axisConfig.valuesEvery !== 'undefined' && axisConfig !== 1) {
					incr = axisConfig.valuesEvery;

					for (i = 0; i < newLabels.length+incr; i += incr) {
						for (j = 1; j < incr && (i+j) < newLabels.length; j++) {
							newLabels[i+j] = '';
						}
					}
				}

				return newLabels;
			},

			_getDisplayValues: function (chartData, axisConfig) {
				var i, j,
					dataSeries, dataPoint;

				for (i = 0; i < chartData.dataSeries.length; i++) {
					dataSeries = chartData.dataSeries[i];
					for (j = 0; j < dataSeries.dataPoints.length; j++) {
						dataPoint = dataSeries.dataPoints[j];

						// Add commas for display values
						dataPoint.displayValue = Charter._getDisplayNumber(dataPoint.value, axisConfig);
						dataPoint.label = chartData.labels[j];
						dataPoint.dataSeries = dataSeries.name;
						dataPoint.hasDataSeries = !!dataPoint.dataSeries;
					}
				}

				return chartData;
			},

			_getValuePercentages: function (chartData, axisConfig) {
				// Calculates the percentage to use for displaying each value

				var i, j,
					range,
					min, max,
					dataSeries, dataPoint;

				range = Charter._getRange(chartData.dataSeries, axisConfig);
				min = range[0];
				max = range[1];

				for (i = 0; i < chartData.dataSeries.length; i++) {
					dataSeries = chartData.dataSeries[i];
					for (j = 0; j < dataSeries.dataPoints.length; j++) {
						dataPoint = dataSeries.dataPoints[j];
						dataPoint.percentage = (dataPoint.value-min) / (max-min) * 100 || 0;
					}
				}

				return chartData;
			},

			_getIndependentAxisPercentages: function (chartData, axisConfig) {
				// Calculates the percentage to position each piece of data on the independent axis
				// Currently assumes uniform distribution per qualitative axis

				var i, j,
					dataSeries, dataPoint;

				for (i = 0; i < chartData.dataSeries.length; i++) {
					dataSeries = chartData.dataSeries[i];
					for (j = 0; j < dataSeries.dataPoints.length; j++) {
						dataPoint = dataSeries.dataPoints[j];
						dataPoint.index = 100 * j / (dataSeries.dataPoints.length-1);
					}
				}

				return chartData;
			},

			///////////////////////////
			// PROCESSING DATASERIES //
			///////////////////////////
			_processDataSeries: function (dataSeries) {
				// Takes in an array of dataSeries from chartData
				// For each dataSeries, if necessary, convert its
				// array of dataPoints from raw values into objects
				// with a value and an inherited colour from the series

				var i, series,
					j, dataPoint,
					obj,
					objArray;

				for (i = 0; i < dataSeries.length; i++) {
					series = dataSeries[i];
					objArray = [];

					for (j = 0; j < series.dataPoints.length; j++) {
						dataPoint = series.dataPoints[j];
						obj = {};

						if (dataPoint instanceof Object) {
							obj = {
								value: dataPoint.value,
								color: dataPoint.color || series.color
							};
						} else {
							obj = {
								value: dataPoint,
								color: series.color
							};
						}

						obj.hasColor = !!obj.color;

						objArray.push(obj);
					}

					dataSeries[i].dataPoints = objArray;
				}

				return dataSeries;
			},

			_combineStackedDataSeries: function (dataSeries) {
				// Takes in an array of dataSeries from chartData
				// Combines them into a single dataSeries, where each
				// point's value is the sum of the value at that position
				// for all dataSeries, and its colour is a gradient using
				// the appropriate proportions from each different dataSeries.
				// The resultant newDataSeriesArray will keep vestigial
				// dataSeries in order to build the legend.

				// The last dataSeries in the list will be at the bottom
				// of the stack, so as to keep the same order as the legend
				// and to be reflected in the order in the code.

				var i, series, seriesLength,
					j, dataPoint,
					newDataSeriesArray = [],
					stackedSeries, value;

				// Create a copy so its order can be
				// changed without affecting the original
				dataSeries = dataSeries.concat();
				dataSeries.reverse();

				// Create newDataSeriesArray, including vestigial dataSeries
				for (i = 0; i < dataSeries.length; i++) {
					series = dataSeries[i];

					newDataSeriesArray.push({
						name: series.name,
						color: series.color,
						dataPoints: []
					});
				}
				stackedSeries = newDataSeriesArray[0].dataPoints;

				// Create new dataPoints with summed values
				for (i = 0; i < dataSeries.length; i++) {
					series = dataSeries[i];

					for (j = 0; j < series.dataPoints.length; j++) {
						dataPoint = series.dataPoints[j];

						if (j >= stackedSeries.length) {
							stackedSeries.push({
								value: 0,
								valueBreakdown: {}
							});
						}

						stackedSeries[j].value += dataPoint.value;
						stackedSeries[j].valueBreakdown[dataPoint.color] = dataPoint.value;
					}
				}

				// Create gradients for each dataPoint
				for (i = 0; i < stackedSeries.length; i++) {
					dataPoint = stackedSeries[i];

					dataPoint.color = 'linear-gradient(to top, ';
					value = 0;
					for (j in dataPoint.valueBreakdown) {
						if (dataPoint.valueBreakdown[j]) {
							dataPoint.color += j + ' ' + (value / dataPoint.value * 100) + '%, ';
							value += dataPoint.valueBreakdown[j];
							dataPoint.color += j + ' ' + (value / dataPoint.value * 100) + '%';

							if (value < dataPoint.value) {
								dataPoint.color += ', ';
							}
						}
					}
					dataPoint.color += ')';
				}

				// Undo reversing, now that colour gradient has been calculated
				newDataSeriesArray.reverse();

				return newDataSeriesArray;
			},

			_getDataSeriesByLabel: function (labels, dataSeries) {
				var dataSeriesByLabel = [];
				var i;
				var dataPointsForLabel;
				var j;

				for (i in labels) {
					dataPointsForLabel = [];

					for (j in dataSeries) {
						dataPointsForLabel.push(dataSeries[j].dataPoints[i]);
					}

					dataSeriesByLabel.push({
						label: labels[i],
						dataPoints: dataPointsForLabel
					});
				}

				return dataSeriesByLabel;
			},

			///////////////////////
			// CREATING DISPLAYS //
			///////////////////////
			createTable: function (rows, cols) {
				// Create the necessary data structure to build a table of the data

				var reverseColMap = {};
				var headers = [];

				var data;
				var row;
				var i, j;

				for (i in cols) {
					reverseColMap[cols[i]] = i;
				}
				for (i = 0; i < rows.length; i++) {
					if (typeof reverseColMap[i] !== 'undefined') {
						headers.push(reverseColMap[i]);
					}
				}

				data = {
					headers: headers,
					rows: []
				};

				for (i = 0; i < rows.length; i++) {
					row = {
						cells: []
					};

					for (j in cols) {
						row.cells.push(rows[i][cols[j]]);
					}

					data.rows.push(row);
				}

				return templayed(tableTemplate)(data);
			},

			createBarChart: function (chartData, dependentAxisConfig, independentAxisConfig) {
				// Takes in basic chart data,
				// constructs data for dependent axis based on dependentAxisConfig,
				// creates display values based on dependentAxisConfig,
				// then uses the combined data to build the markup for a bar chart

				// Bar charts should only have a single dataSeries, but if multiple
				// are included their total length should match the length of the axis
				// labels array, and the dataSeries will be displayed one after another

				chartData.dataSeries = Charter._processDataSeries(chartData.dataSeries);

				dependentAxisConfig = Charter._getNumericAxisOptions(dependentAxisConfig);

				chartData.labels = Charter._processQualitativeLabels(chartData.labels, independentAxisConfig);

				chartData.dependentAxis = Charter._createNumericAxis(chartData, dependentAxisConfig);
				chartData = Charter._getValuePercentages(chartData, dependentAxisConfig);
				chartData = Charter._getDisplayValues(chartData, dependentAxisConfig);

				chartData.dataSeriesByLabel = Charter._getDataSeriesByLabel(chartData.labels, chartData.dataSeries);

				$chart = $(templayed(dependentAxisConfig.horizontal ? barChartHTemplate : barChartTemplate)(chartData));
				$chart.data('chartData', chartData);
				$chart.data('dependentAxisConfig', dependentAxisConfig);

				return $chart;
			},

			createLineGraph: function (chartData, dependentAxisConfig, independentAxisConfig) {
				return Charter._create2DChart(chartData, independentAxisConfig, dependentAxisConfig, lineGraphTemplate);
			},

			createScatterPlot: function (chartData, dependentAxisConfig, independentAxisConfig) {
				return Charter._create2DChart(chartData, independentAxisConfig, dependentAxisConfig, scatterPlotTemplate);
			},

			_create2DChart: function (chartData, dependentAxisConfig, independentAxisConfig, template) {
				// Takes in basic chart data,
				// constructs data for axes based on axisConfig,
				// creates display values based on axisConfig,
				// then uses the combined data to build the markup for the specific chart

				// TODO: Numeric independent axis
					// As part of this: allow unequally spaced data across the horizontal axis
				// TODO: Legend
				// TODO: Allow secondary vertical axis

				var i, dataSeries;

				// Apply any necessary smoothing
				if (chartData.smoothing > 1) {
					chartData.labels.splice(0, chartData.smoothing-1);

					for (i = 0; i < chartData.dataSeries.length; i++) {
						dataSeries = chartData.dataSeries[i];

						dataSeries.dataPoints = Stats.smooth(dataSeries.dataPoints, chartData.smoothing);
					}
				}

				dataSeries = Charter._processDataSeries(chartData.dataSeries);

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
				bars
					.style(axisConfig.horizontal ? 'width' : 'height', function (d) { return x(d) + '%'; })
					.attr('title', function (d) { return Charter._getDisplayNumber(d, axisConfig); });


				tooltips = chart.selectAll('.js-chart-tooltip')
					.data(data);
				tooltips
					.text(function (d) { return Charter._getDisplayNumber(d, axisConfig); });


				if (titleText) {
					title = chart.selectAll('.js-chart-title')
						.data([titleText]);
					title
						.text(function (d) { return titleText; });
				}
			}
		};

		return {
			createTable: Charter.createTable,
			createBarChart: Charter.createBarChart,
			createLineGraph: Charter.createLineGraph,
			createScatterPlot: Charter.createScatterPlot,

			updateBarChart: Charter.updateBarChart
		};
	}
);