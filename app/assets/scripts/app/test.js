import '../lib/jquery-3.1.1.min.js';

import Charter from './charter/charter.js';
import Analyser from './charter/analyser.js';
import Stats from './charter/stats.js';

var config = {
	headerRows: 1,
	cols: {
		DATE: Analyser.getColNumber('A'),

		REMAND_MALE: Analyser.getColNumber('B'),
		REMAND_FEMALE: Analyser.getColNumber('C'),
		REMAND_TOTAL: Analyser.getColNumber('D'),

		SENTENCED_MALE: Analyser.getColNumber('E'),
		SENTENCED_FEMALE: Analyser.getColNumber('F'),
		SENTENCED_TOTAL: Analyser.getColNumber('G'),

		TOTAL_MALE: Analyser.getColNumber('H'),
		TOTAL_FEMALE: Analyser.getColNumber('I'),
		TOTAL_TOTAL: Analyser.getColNumber('J')
	}
};

var fileProcessed = function (config) {
	exploratoryAnalysis(config);
	buildVisualisation(config);
};

Analyser.loadFile('assets/data/Prison Population - raw.csv', config, fileProcessed);

var exploratoryAnalysis = function (config) {
	var rows = config.rows,
		cols = config.cols,

		table = Analyser.createSubTable(rows, cols);

	console.table(table);
};

var buildVisualisation = function (config) {

	var rows = config.rows,
		cols = config.cols;

	var chartData,
		row, i,

		$barChart,
		$horizontalBarChart,
		$lineGraph,
		$scatterPlot,
		$table;

	// Extract data for remand vs. sentenced
	chartData = {
		title: 'Prisoner Population, ' + rows[0][cols.DATE],
		labels: ['Remand (Total)', 'Sentenced (Total)'],
		dataSeries: [
			{
				dataPoints: [rows[0][cols.REMAND_TOTAL], rows[0][cols.SENTENCED_TOTAL]]
			}
		]
	};
	$barChart = Charter.createBarChart(chartData, {
		roundTo: 2000,
		gridlines: 2
	});
	$('.js-bar-chart').html($barChart);

	chartData = {
		title: 'Prisoner Population, ' + rows[0][cols.DATE],
		labels: ['Remand (Total)', 'Sentenced (Total)'],
		dataSeries: [
			{
				dataPoints: [rows[0][cols.REMAND_TOTAL], rows[0][cols.SENTENCED_TOTAL]]
			}
		]
	};
	$horizontalBarChart = Charter.createBarChart(chartData, {
		roundTo: 2000,
		gridlines: 2,
		horizontal: true
	});
	$('.js-horizontal-bar-chart').html($horizontalBarChart);

	// Extract data for total prisoner population
	var totalPop = Analyser.getCol(rows, cols.TOTAL_TOTAL);
	var linearFit = Stats.linearLeastSquares(totalPop);
	chartData = {
		title: 'Prisoner Population',
		showLegend: true,
		labels: Analyser.getCol(rows, cols.DATE),
		dataSeries: [
			{
				name: 'Prisoner population',
				color: '#999',
				dataPoints: totalPop
			},
			{
				name: 'Prisoner population linear fit (r^2=' + Stats.r2(linearFit, totalPop).toFixed(3) + ')',
				color: '#000',
				dataPoints: linearFit
			}
		]
	};

	$lineGraph = Charter.createLineGraph(
		chartData,
		{
			values: 3,
			roundTo: 1000,
			min: null
		},
		{
			valuesEvery: 5
		}
	);
	$('.js-line-graph').html($lineGraph);

	// Extract data for total prisoner population
	chartData = {
		title: 'Prisoner Population',
		labels: Analyser.getCol(rows, cols.DATE),
		dataSeries: [
			{
				dataPoints: totalPop
			}
		]
	};

	$scatterPlot = Charter.createScatterPlot(
		chartData,
		{
			values: 3,
			roundTo: 1000,
			min: null
		},
		{
			valuesEvery: 4
		}
	);
	$('.js-scatter-plot').html($scatterPlot);

	i = 1;
	var interval = window.setInterval(function () {
		Charter.updateBarChart(
			$('.js-bar-chart .js-chart')[cols.DATE],
			[rows[i][cols.REMAND_TOTAL], rows[i][cols.SENTENCED_TOTAL]],
			['Prisoner Population, ' + rows[i][cols.DATE]]
		);

		Charter.updateBarChart(
			$('.js-horizontal-bar-chart .js-chart')[cols.DATE],
			[rows[i][cols.REMAND_TOTAL], rows[i][cols.SENTENCED_TOTAL]],
			['Prisoner Population, ' + rows[i][cols.DATE]]
		);

		i = (i + 1) % rows.length;

		if (i === 0) {
			window.clearInterval(interval);
		}
	}, 1000);
};
