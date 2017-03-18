require(
	[
		'jquery',
		'd3',
		'templayed',

		'charter/charter',
		'analyser/analyser',
		'stats/stats'
	],
	function ($, d3, templayed, Charter, Analyser, Stats) {

		var headerRows,
			cols = {},
			arrayCols = {},
			enumsMap = {},
			enums = {},
			aliases = {};

		var fileLoaded = function (csv) {
			Charter.parseCsv(csv, fileParsed);
		};

		var fileParsed = function (rows) {
			var i, j, k,
				row;

			//////////////////////////////////////////////////
			// DATA PARAMETERS CUSTOMISATION SECTION BEGINS //
			//////////////////////////////////////////////////
			var setParameters = function () {
				// Inside a function so it can be collapsed in the editor

				// Header rows are removed in processing, as they do not contain data
				headerRows = 1;

				// Specify columns of interest
				// Enums will be gathered for columns specified here
				cols.DATE = Analyser.getColNumber('A');

				cols.REMAND_MALE = Analyser.getColNumber('B');
				cols.REMAND_FEMALE = Analyser.getColNumber('C');
				cols.REMAND_TOTAL = Analyser.getColNumber('D');

				cols.SENTENCED_MALE = Analyser.getColNumber('E');
				cols.SENTENCED_FEMALE = Analyser.getColNumber('F');
				cols.SENTENCED_TOTAL = Analyser.getColNumber('G');

				cols.TOTAL_MALE = Analyser.getColNumber('H');
				cols.TOTAL_FEMALE = Analyser.getColNumber('I');
				cols.TOTAL_TOTAL = Analyser.getColNumber('J');

				// Aliases are used to combine several entries into one filter group

				// Specify columns which need to have their values separated into arrays,
				// and how they should be split - uses '\n' by default if set to null

				// Define maps for enums that need to be accumulated from multiple columns
			};
			setParameters();
			////////////////////////////////////////////////
			// DATA PARAMETERS CUSTOMISATION SECTION ENDS //
			////////////////////////////////////////////////

			////////////////////////////////////
			// DATA PROCESSING SECTION BEGINS //
			////////////////////////////////////
			// This section should remain the same for each file being processed

			// Create filter functions for this set of aliases
			var filters = Analyser.getAliasFilter(aliases);

			var filterRows = filters.filterRows;
			var filterRowsAnd = filters.filterRowsAnd;
			var filterRowsOr = filters.filterRowsOr;

			var processData = function () {
				// Inside a function so it can be collapsed in the editor

				// Remove header rows
				headerRows = rows.splice(0, headerRows);

				// Convert cells that are lists into arrays
				for (i = 0; i < rows.length; i++) {
					row = rows[i];

					for (j in arrayCols) {
						row[j] = row[j].trim().split(arrayCols[j] || '\n');
					}
				}

				// Build enums
				for (i in cols) {

					// Don't collect enums for columns specified in enumsMap
					k = true;
					for (j in enumsMap) {
						if (enumsMap[j].indexOf(cols[i]) !== -1) {
							k = false;
							break;
						}
					}

					if (k) {
						enums[i] = [];
						Analyser.collectEnums(rows, enums[i], cols[i]);
					}
				}
				for (i in enumsMap) {
					enums[i] = [];
					Analyser.collectEnums.apply(this, [rows, enums[i]].concat(enumsMap[i]));
				}
			};
			processData();
			//////////////////////////////////
			// DATA PROCESSING SECTION ENDS //
			//////////////////////////////////

			/////////////////////////////////////////
			// EXPLORATORY ANALYSIS SECTION BEGINS //
			/////////////////////////////////////////
			var exploratoryAnalysis = function () {
				// Inside a function so it can be collapsed in the editor
				var table = Analyser.createSubTable(rows, cols);
				console.table(table);
			};
			exploratoryAnalysis();
			///////////////////////////////////////
			// EXPLORATORY ANALYSIS SECTION ENDS //
			///////////////////////////////////////

			////////////////////////////////////////
			// BUILD VISUALISATION SECTION BEGINS //
			////////////////////////////////////////
			var buildVisualisation = function () {
				// Inside a function so it can be collapsed in the editor

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
							color: '#fff',
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

				// d3 time animation stuff
				chartData = $barChart.data('chartData');
				var x = d3.scaleLinear()
					.domain([0, chartData.dependentAxis.values[chartData.dependentAxis.values.length-1].value])
					.range([0, 100]);

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
			buildVisualisation();
			//////////////////////////////////////
			// BUILD VISUALISATION SECTION ENDS //
			//////////////////////////////////////
		};

		// Load and process CSV
		$.ajax({
			url: 'assets/data/Prison Population - raw.csv',
			success: fileLoaded
		});
	}
);