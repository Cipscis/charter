import templayed from './lib/templayed.js';
import Stats from './stats.js';

import tableTemplate from './templates/table.js';
import barChartTemplate from './templates/bar-chart.js';
import barChartHTemplate from './templates/bar-chart-h.js';
import lineGraphTemplate from './templates/line-graph.js';
import scatterPlotTemplate from './templates/scatter-plot.js';

const numericAxisDefaults = {
	label: '',

	values: 5, // Will always fit when max is a multiple of 10
	valuesAt: [],
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

const qualitativeAxisDefaults = {
	label: '',

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

const ChartTypes = {
	BAR_VERTICAL: 'bar-vertical',
	BAR_HORIZONTAL: 'bar-horizontal'
};

const dataAttributes = {
	chartType: 'data-charter-type',

	axisPercentage: 'data-charter-axis-percentage',
	axisToFixed: 'data-charter-axis-to-fixed',

	axisMin: 'data-charter-axis-min',
	axisMax: 'data-charter-axis-max'
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

const Charter = {
	_extractNumber: function (string) {
		// Convert strings to numbers where possible
		// TODO: find a better solution than duplicating this code from analyser
		// it doesn't seem like enough to set up a new dependency though

		let val = string.replace(/,|%$/g, '');

		if (parseFloat(val) === +val) {
			if (string.match(/%$/)) {
				// If the value is a percentage, divide by 100

				// Convert to string to see how many places after the point, to round after dividing
				// Otherwise you'll get numbers like 0.10800000000000001
				let length = (val + '');
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

		let options = {};

		for (let prop in numericAxisDefaults) {
			options[prop] = numericAxisDefaults[prop];
		}

		for (let prop in axisConfig) {
			options[prop] = axisConfig[prop];
		}

		if ((!options.gridlines) && options.gridlines !== 0) {
			options.gridlines = options.values;
		}

		return options;
	},

	_getQualitativeAxisOptions: function (axisConfig) {

		axisConfig = axisConfig || {};

		let options = {};

		for (let prop in qualitativeAxisDefaults) {
			options[prop] = qualitativeAxisDefaults[prop];
		}

		for (let prop in axisConfig) {
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

	// Takes in a value and maps it to a percentage
	// between the passed min and max values
	_mapToRange: (value, min, max) => (value-min) / (max-min) * 100,

	_getRange: function (dataSeries, axisConfig) {
		// Get the minimum and maximum value in a chart's data
		// across all dataSeries, rounded according to the axisConfig

		let ranges = [];

		for (let i = 0; i < dataSeries.length; i++) {
			if (dataSeries[i].dataPoints.length) {
				ranges.push(Charter._getRangeSingle(dataSeries[i], axisConfig));
			}
		}

		let finalRange = [ranges[0][0], ranges[0][1]];
		for (let i = 1; i < ranges.length; i++) {
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

		let min = dataRange[0];
		let max = dataRange[1];

		if (axisConfig.roundTo !== null || axisConfig.values > 1) {
			let range = max - min;
			let values = axisConfig.values || 1;

			// If roundTo is unspecified, figure out what should be
			// used by looking at the greatest power of 10 that fits
			// into the starting maximum value at least values times.
			// If it's above 1 or 1%, use 1 or 1% instead by default.
			let roundTo = axisConfig.roundTo;
			if (!roundTo) {
				let maxOrder = Math.pow(10, Math.floor(Math.log10(max/values)));
				if (axisConfig.percentage) {
					roundTo = Math.min(maxOrder, 0.01);
				} else {
					roundTo = Math.min(maxOrder, 1);
				}
			}
			let factor = roundTo * values;
			let remainder = range % factor;

			if (remainder !== 0) {
				// Increment max until the difference between
				// it and min is the smallest number above range
				// that is divisible by factor
				let increment = factor - remainder;
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

		let min = dataSeries.dataPoints[0].value;
		let max = min;

		for (let i = 0; i < dataSeries.dataPoints.length; i++) {
			min = Math.min(min, dataSeries.dataPoints[i].value);
			max = Math.max(max, dataSeries.dataPoints[i].value);
		}

		let roundTo;
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

	_getGroupMax: function (dataSeries, axisConfig) {
		let groupSums = [];

		for (let i = 0; i < dataSeries.length; i++) {
			for (let j = 0; j < dataSeries[i].dataPoints.length; j++) {
				if (groupSums.length <= j) {
					groupSums.push(0);
				}

				groupSums[j] += dataSeries[i].dataPoints[j].value;
			}
		}

		let groupSumMax = Math.max.apply(null, groupSums);
		let roundedMax = Charter._roundRange([0, groupSumMax], axisConfig)[1];

		return roundedMax;
	},

	_createNumericAxis: function (chartData, axisConfig) {
		// Calculates axis range
		// then creates gridlines

		axisConfig = Charter._getNumericAxisOptions(axisConfig);

		let axis = {
			values: [],
			gridlines: [],
			label: []
		};

		if (axisConfig.label) {
			axis.label.push(axisConfig.label);
		}

		let max = axisConfig.max;
		let min = axisConfig.min;

		let range;
		if (min === null || max === null) {
			range = Charter._getRange(chartData.dataSeries, axisConfig);
			if (min === null) {
				min = range[0];
			}

			if (max === null) {
				if (chartData.stacked === true) {
					// For stacked bar charts, the real max is the
					// greatest sum of all dataPoints for the same label
					max = Charter._getGroupMax(chartData.dataSeries, axisConfig);
				} else {
					max = range[1];
				}
			}
		}

		if (axisConfig.min !== null || axisConfig.max !== null) {
			// If either min or max were specified, ensure the values
			// used on the axis will be rounded appropriately
			range = Charter._roundRange([min, max], axisConfig);
			min = range[0];
			max = range[1];
		}

		for (let i = 0; i <= axisConfig.gridlines; i++) {
			let value = ((max-min) * i / axisConfig.gridlines) + min;
			let displayValue = Charter._getDisplayNumber(value, axisConfig);

			axis.gridlines.push({
				value: value,
				displayValue: displayValue,
				percentage: Charter._mapToRange(value, min, max)
			});
		}

		for (let i = 0; i <= axisConfig.values; i++) {
			let value = ((max-min) * i / axisConfig.values) + min;
			let displayValue = Charter._getDisplayNumber(value, axisConfig);

			axis.values.push({
				value: value,
				displayValue: displayValue,
				percentage: Charter._mapToRange(value, min, max)
			});
		}

		if (axisConfig.valuesAt.length) {
			for (let i = 0; i < axisConfig.valuesAt.length; i++) {
				let value = ((max-min) * (axisConfig.valuesAt[i] / max)) + min;
				let displayValue = Charter._getDisplayNumber(value, axisConfig);

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

		axis.data = {
			min: axis.values[0].value,
			max: axis.values[axis.values.length-1].value,

			percentage: axisConfig.percentage,
			toFixed: axisConfig.toFixed
		}

		return axis;
	},

	_createQualitativeAxis: function (chartData, axisConfig) {
		// Creates axis with qualitative values, typically strings
		// Because the values are qualitative, there can be no interpolation

		axisConfig = Charter._getQualitativeAxisOptions(axisConfig);

		let axis = {
			values: [],
			gridlines: [],
			label: []
		};

		if (axisConfig.label) {
			axis.label.push(axisConfig.label);
		}

		if (axisConfig.gridlinesEvery !== 0) {
			for (let i = axisConfig.gridlinesSkip; i < chartData.labels.length; i += axisConfig.gridlinesEvery) {
				let displayValue = chartData.labels[i];

				axis.gridlines.push({
					displayValue: displayValue,
					percentage: i / (chartData.labels.length-1) * 100
				});
			}
		}

		if (axisConfig.valuesEvery !== 0) {
			for (let i = axisConfig.valuesSkip; i < chartData.labels.length; i += axisConfig.valuesEvery) {
				let displayValue = chartData.labels[i];

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

		let newLabels = [];
		for (let i = 0; i < labels.length; i++) {
			newLabels.push(labels[i]);
		}

		if (axisConfig && typeof axisConfig.valuesEvery !== 'undefined' && axisConfig !== 1) {
			let incr = axisConfig.valuesEvery;

			for (let i = 0; i < newLabels.length+incr; i += incr) {
				for (let j = 1; j < incr && (i+j) < newLabels.length; j++) {
					newLabels[i+j] = '';
				}
			}
		}

		return newLabels;
	},

	_getDisplayValues: function (chartData, axisConfig) {
		for (let i = 0; i < chartData.dataSeries.length; i++) {
			let dataSeries = chartData.dataSeries[i];
			for (let j = 0; j < dataSeries.dataPoints.length; j++) {
				let dataPoint = dataSeries.dataPoints[j];

				// Add commas for display values
				dataPoint.displayValue = Charter._getDisplayNumber(dataPoint.value, axisConfig);
				dataPoint.label = chartData.allLabels[j];
				dataPoint.dataSeries = dataSeries.name;
				dataPoint.hasDataSeries = !!dataPoint.dataSeries;
			}
		}

		return chartData;
	},

	_getValuePercentages: function (chartData, axisConfig) {
		// Calculates the percentage to use for displaying each value

		let min = Math.min.apply(null, chartData.dependentAxis.values.map(function (a) { return a.value; }));
		let max = Math.max.apply(null, chartData.dependentAxis.values.map(function (a) { return a.value; }));

		for (let i = 0; i < chartData.dataSeries.length; i++) {
			let dataSeries = chartData.dataSeries[i];
			for (let j = 0; j < dataSeries.dataPoints.length; j++) {
				let dataPoint = dataSeries.dataPoints[j];
				dataPoint.percentage = (dataPoint.value-min) / (max-min) * 100 || 0;
			}
		}

		return chartData;
	},

	_getIndependentAxisPercentages: function (chartData, axisConfig) {
		// Calculates the percentage to position each piece of data on the independent axis
		// Currently assumes uniform distribution per qualitative axis

		for (let i = 0; i < chartData.dataSeries.length; i++) {
			let dataSeries = chartData.dataSeries[i];
			for (let j = 0; j < dataSeries.dataPoints.length; j++) {
				let dataPoint = dataSeries.dataPoints[j];
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

		for (let i = 0; i < dataSeries.length; i++) {
			let series = dataSeries[i];
			let objArray = [];

			for (let j = 0; j < series.dataPoints.length; j++) {
				let dataPoint = series.dataPoints[j];
				let obj = {};

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

		let newDataSeriesArray = [];

		// Create a copy so its order can be
		// changed without affecting the original
		dataSeries = dataSeries.concat();
		dataSeries.reverse();

		// Create newDataSeriesArray, including vestigial dataSeries
		for (let i = 0; i < dataSeries.length; i++) {
			let series = dataSeries[i];

			newDataSeriesArray.push({
				name: series.name,
				color: series.color,
				dataPoints: []
			});
		}
		let stackedSeries = newDataSeriesArray[0].dataPoints;

		// Create new dataPoints with summed values
		for (let i = 0; i < dataSeries.length; i++) {
			let series = dataSeries[i];

			for (let j = 0; j < series.dataPoints.length; j++) {
				let dataPoint = series.dataPoints[j];

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
		for (let i = 0; i < stackedSeries.length; i++) {
			let dataPoint = stackedSeries[i];

			dataPoint.color = 'linear-gradient(to top, ';
			let value = 0;
			for (let j in dataPoint.valueBreakdown) {
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
		let dataSeriesByLabel = [];

		for (let i in labels) {
			let dataPointsForLabel = [];

			for (let j in dataSeries) {
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


		let reverseColMap = {};
		for (let i in cols) {
			reverseColMap[cols[i]] = i;
		}

		let headers = [];
		for (let i = 0; i < rows.length; i++) {
			if (typeof reverseColMap[i] !== 'undefined') {
				headers.push(reverseColMap[i]);
			}
		}

		let data = {
			headers: headers,
			rows: []
		};
		for (let i = 0; i < rows.length; i++) {
			let row = {
				cells: []
			};

			for (let j in cols) {
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

		chartData.allLabels = chartData.labels;
		chartData.labels = Charter._processQualitativeLabels(chartData.labels, independentAxisConfig);

		chartData.dependentAxis = Charter._createNumericAxis(chartData, dependentAxisConfig);
		chartData = Charter._getValuePercentages(chartData, dependentAxisConfig);
		chartData = Charter._getDisplayValues(chartData, dependentAxisConfig);

		chartData.independentAxis = {
			label: []
		};
		if (independentAxisConfig && independentAxisConfig.label) {
			chartData.independentAxis.label.push(independentAxisConfig.label);
		}

		if (dependentAxisConfig.horizontal) {
			chartData.hasXLabel = !!chartData.dependentAxis.label;
			chartData.hasYLabel = !!chartData.independentAxis.label;
		} else {
			chartData.hasYLabel = !!chartData.dependentAxis.label;
			chartData.hasXLabel = !!chartData.independentAxis.label;
		}

		chartData.dataSeriesByLabel = Charter._getDataSeriesByLabel(chartData.labels, chartData.dataSeries);

		let $chart = templayed(dependentAxisConfig.horizontal ? barChartHTemplate : barChartTemplate)(chartData);

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

		// Apply any necessary smoothing
		if (chartData.smoothing > 1) {
			chartData.labels.splice(0, chartData.smoothing-1);

			for (let i = 0; i < chartData.dataSeries.length; i++) {
				let dataSeries = chartData.dataSeries[i];

				dataSeries.dataPoints = Stats.smooth(dataSeries.dataPoints, chartData.smoothing);
			}
		}

		chartData.allLabels = chartData.labels;
		chartData.labels = Charter._processQualitativeLabels(chartData.labels, independentAxisConfig);

		let dataSeries = Charter._processDataSeries(chartData.dataSeries);

		// Construct independent qualitative axis and dependent numeric axis
		chartData.independentAxis = Charter._createQualitativeAxis(chartData, dependentAxisConfig);
		chartData.dependentAxis = Charter._createNumericAxis(chartData, independentAxisConfig);

		// Calculate percentage values to use for display on each axis
		chartData = Charter._getValuePercentages(chartData, independentAxisConfig);
		chartData = Charter._getIndependentAxisPercentages(chartData, independentAxisConfig);

		// Create display values to show on axes and tooltips
		chartData = Charter._getDisplayValues(chartData, independentAxisConfig);

		chartData.hasXLabel = !!chartData.independentAxis.label;
		chartData.hasYLabel = !!chartData.dependentAxis.label;

		// Render chart with specified template
		let $chart = templayed(template)(chartData);

		return $chart;
	},

	////////////
	// UPDATE //
	////////////
	updateBarChart: function (chart, data, titleText) {
		// Takes a .js-chart DOM element, an array of data values, and titleText
		// Updates it to reflect the new data and titleText

		// Currently assumes the data will match the current number of bars

		let axisPercentage = Charter._getAxisPercentage(chart);
		let axisToFixed = Charter._getAxisToFixed(chart);
		let axisConfig = {
			percentage: axisPercentage,
			toFixed: axisToFixed
		};

		let min = Charter._getAxisMin(chart);
		let max = Charter._getAxisMax(chart);

		let bars = chart.querySelectorAll('.js-chart-bar');

		let chartType = Charter._getChartType(chart);
		let barSizeAttribute = chartType === ChartTypes.BAR_VERTICAL ? 'height' : 'width';

		bars.forEach((bar, i) => {
			let d = data[i];

			bar.style[barSizeAttribute] = Charter._getValueOnScale(d, min, max) * 100 + '%';

			bar.setAttribute('title', Charter._getDisplayNumber(d, axisConfig));
		});


		let tooltips = chart.querySelectorAll('.js-chart-tooltip');

		tooltips.forEach((tooltip, i) => {
			let d = data[i];

			tooltip.textContent = Charter._getDisplayNumber(d, axisConfig);
		});


		if (titleText) {
			let title = chart.querySelectorAll('.js-chart-title');

			title.textContent = titleText;
		}
	},

	_getValueOnScale: function (value, min, max) {
		// Create a linear scale between min and max, and
		// return the position of value as a proportion of the range

		if (max < min) {
			let temp = max;
			max = min;
			min = temp;
		} else if (max === min) {
			console.error(`Cannot create a scale with identical minimum and maximum values.`);
			return null;
		}

		let range = max - min;
		let progression = value - min;

		let progressionPercentage = progression / range;

		return progressionPercentage;
	},


	_getChartType: function (chart) {
		let chartType = chart.getAttribute(dataAttributes.chartType);

		return chartType;
	},

	_getAxisPercentage: function (chart) {
		let axisPercentage = chart.getAttribute(dataAttributes.axisPercentage);
		axisPercentage = axisPercentage === 'true';

		return axisPercentage;
	},
	_getAxisToFixed: function (chart) {
		let axisToFixed = chart.getAttribute(dataAttributes.axisToFixed);
		axisToFixed = parseInt(axisToFixed, 10);

		return axisToFixed;
	},

	_getAxisMin: function (chart) {
		let axisMin = chart.getAttribute(dataAttributes.axisMin);
		axisMin = parseFloat(axisMin);

		return axisMin;
	},
	_getAxisMax: function (chart) {
		let axisMax = chart.getAttribute(dataAttributes.axisMax);
		axisMax = parseFloat(axisMax);

		return axisMax;
	}
};

export default {
	createTable: Charter.createTable,
	createBarChart: Charter.createBarChart,
	createLineGraph: Charter.createLineGraph,
	createScatterPlot: Charter.createScatterPlot,

	updateBarChart: Charter.updateBarChart
};
