require(
	[
		'jquery',

		'charter/charter',
		'analyser/analyser',
		'stats/stats'
	],
	function ($, Charter, Analyser, Stats) {
		var baseUrl = '/charter/app/'; // For Github pages
		// var baseUrl = '/'; // For local development

		var tests = {
			analyser: {
				loadFile: function () {
					var fileConfig = {
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
					fileConfig.arrayCols[fileConfig.cols.PUBLIC_TRANSPORT] = ',';
					fileConfig.arrayCols[fileConfig.cols.MAYOR_2018] = ',';

					fileConfig.enumsMap.MAYOR = [fileConfig.cols.MAYOR_2012, fileConfig.cols.MAYOR_2018];

					var exploreData = function (dataConfig) {
						var rows = dataConfig.rows;
						var cols = dataConfig.cols;

						// Do stuff with the data here

						var table = Analyser.createSubTableString(rows, cols);
						console.log(table);
					};

					Analyser.loadFile(baseUrl + 'examples/data/city example.csv', fileConfig, exploreData);
				},
				combineData: function () {
					var fileConfigA = {
						headerRows: 1,
						cols: {
							NAME: Analyser.getColNumber('A'),
							COUNTRY: Analyser.getColNumber('B'),
							POPULATION: Analyser.getColNumber('C'),
							CAPITAL: Analyser.getColNumber('D')
						},
						aliases: {
							COUNTRY: [
								['New Zealand', 'Aotearoa']
							]
						}
					};
					var filePathA = baseUrl + 'examples/data/city example.csv';

					var fileConfigB = {
						headerRows: 1,
						cols: {
							NAME: Analyser.getColNumber('A'),
							COUNTRY: Analyser.getColNumber('B'),
							POPULATION: Analyser.getColNumber('C')
						}
					};
					var filePathB = baseUrl + 'examples/data/city example 2.csv';

					var filesLoaded = function (dataConfigA, dataConfigB) {
						var combinedDataConfig = Analyser.combineData(dataConfigA, dataConfigB);
						analyseCombinedData(combinedDataConfig);
					};

					var analyseCombinedData = function (dataConfig) {
						var rows = dataConfig.rows;
						var cols = dataConfig.cols;

						// Do stuff with the combined data from both files here

						var table = Analyser.createSubTableString(rows, cols);
						console.log(table);
					};

					Analyser.loadFile(
						filePathA, fileConfigA,
						filePathB, fileConfigB,
						filesLoaded
					);
				},
				getColNumber: function () {
					var cols = {
						NAME: Analyser.getColNumber('A'),
						COUNTRY: Analyser.getColNumber('B'),
						POPULATION: Analyser.getColNumber('C'),
						OTHER_COL: Analyser.getColNumber('HV')
					};

					console.log(cols);
				},

				getCol: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var cityNames = Analyser.getCol(rows, cols.NAME);

					console.log(cityNames);
				},
				addCol: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var previousYearPopulation = Analyser.getCol(rows, cols.POPULATION);

					previousYearPopulation.pop();
					rows.shift();

					cols.POPULATION_PREVIOUS = Analyser.addCol(rows, previousYearPopulation);

					var table = Analyser.createSubTableString(rows, cols);
					console.log(table);
				},
				getDerivedCol: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var getRawPopulation = function (rows) {
						// Population stored in thousands
						return rows[cols.POPULATION] * 1000;
					};

					var rawPopulation = Analyser.getDerivedCol(rows, getRawPopulation);

					console.log(rawPopulation);
				},
				addDerivedCol: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var getRawPopulation = function (rows) {
						// Population stored in thousands
						return rows[cols.POPULATION] * 1000;
					};

					cols.POPULATION_RAW = Analyser.addDerivedCol(rows, getRawPopulation);

					var table = Analyser.createSubTableString(rows, cols);
					console.log(table);
				},
				createSubTable: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var summaryCols = {
						NAME: cols.NAME,
						POPULATION: cols.POPULATION
					};

					var summaryTable = Analyser.createSubTable(rows, summaryCols);
					console.table(summaryTable);
				},
				createSubTableString: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var summaryCols = {
						NAME: cols.NAME,
						POPULATION: cols.POPULATION
					};

					var summaryTableString = Analyser.createSubTableString(rows, summaryCols);
					console.log(summaryTableString);
				},
				getColSummary: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;
					var aliases = dataConfig.aliases;

					var countrySummary = Analyser.getColSummary(rows, cols.COUNTRY);
					console.log(countrySummary);

					var countrySummaryWithAliases = Analyser.getColSummary(rows, cols.COUNTRY, aliases.COUNTRY);
					console.log(countrySummaryWithAliases);
				},
				getColAsDataSeries: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var labels = Analyser.getCol(rows, cols.COUNTRY);

					var dataSeries = Analyser.getColAsDataSeries(rows, cols.COUNTRY, labels);
					console.log(dataSeries);
				},
				getComparisonSummary: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;
					var aliases = dataConfig.aliases;

					var capitalTable = Analyser.getComparisonSummary(rows, cols.COUNTRY, aliases.COUNTRY, cols.CAPITAL);

					console.table(capitalTable);
				},
				getComparisonSummaryString: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;
					var aliases = dataConfig.aliases;

					var capitalTableString = Analyser.getComparisonSummaryString(rows, cols.COUNTRY, aliases.COUNTRY, cols.CAPITAL);

					console.log(capitalTableString);
				},

				rows: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var firstRowName = rows[0][cols.NAME];

					console.log(firstRowName);
				},
				enums: function (dataConfig) {
					var enums = dataConfig.enums;

					console.log(enums);
				},

				filterRows: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;
					var filterRows = dataConfig.filters.filterRows;

					// Filtering a single column by a single value, using aliases
					var newZealandCities = filterRows(rows,
						cols.COUNTRY, 'New Zealand'
					);
					console.log(Analyser.getCol(newZealandCities, cols.NAME));

					// Filtering an array column
					var citiesWithTrains = filterRows(rows,
						cols.PUBLIC_TRANSPORT, 'Train'
					);
					console.log(Analyser.getCol(citiesWithTrains, cols.NAME));

					// Filtering a single column by multiple values
					var australasiaCities = filterRows(rows,
						cols.COUNTRY, ['New Zealand', 'Australia']
					);
					console.log(Analyser.getCol(australasiaCities, cols.NAME));

					// Filtering with a function
					var largerCities = filterRows(rows,
						cols.POPULATION, a => a >= 300
					);
					console.log(Analyser.getCol(largerCities, cols.NAME));

					// Applying multiple filters (AND)
					var largeCapitalCities = filterRows(rows,
						cols.POPULATION, a => a >= 1000,
						cols.CAPITAL, a => a === 'true'
					);
					console.log(Analyser.getCol(largeCapitalCities, cols.NAME));

					// Applying multiple filters (OR)
					var largeOrCapitalCities = filterRows(rows, true,
						cols.POPULATION, a => a >= 1000,
						cols.CAPITAL, a => a === 'true'
					);
					console.log(Analyser.getCol(largeOrCapitalCities, cols.NAME));
				},
				filterRowsAnd: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;
					var filterRowsAnd = dataConfig.filters.filterRowsAnd;

					var newZealandCapital = filterRowsAnd(rows,
						cols.COUNTRY, 'New Zealand',
						cols.CAPITAL, a => a === 'true'
					);
					console.log(Analyser.getCol(newZealandCapital, cols.NAME));
				},
				filterRowsOr: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;
					var filterRowsOr = dataConfig.filters.filterRowsOr;

					var largeOrCapitalCities = filterRowsOr(rows,
						cols.POPULATION, a => a >= 1000,
						cols.CAPITAL, a => a === 'true'
					);
					console.log(Analyser.getCol(largeOrCapitalCities, cols.NAME));
				}
			},
			charter: {
				createTable: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var table = Charter.createTable(rows, cols);

					document.getElementById('chart-area').innerHTML = table;
				},
				createBarChart: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var chartData;

					var dependentAxisConfig;
					var independentAxisConfig;

					var chart;

					var cityNames = Analyser.getCol(rows, cols.NAME);

					chartData = {
						title: 'City Populations',
						showTooltips: true,
						labels: cityNames,
						dataSeries: [
							{
								dataPoints: Analyser.getCol(rows, cols.POPULATION)
							}
						]
					};

					dependentAxisConfig = {
						horizontal: true,
						roundTo: 100,
						values: 2
					};

					chart = Charter.createBarChart(chartData, dependentAxisConfig);

					$('#chart-area').append(chart);
				},
				createLineGraph: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var chartData;

					var dependentAxisConfig;
					var independentAxisConfig;

					var chart;

					var years = Analyser.getCol(rows, cols.YEAR);
					var population = Analyser.getCol(rows, cols.POPULATION);

					chartData = {
						title: 'Auckland city population over time',
						showLegend: true,
						labels: years,
						dataSeries: [
							{
								name: 'Population',
								color: '#f00',
								dataPoints: population
							},
							{
								name: 'Population linear fit',
								color: 'rgba(255, 255, 255, 0.5)',
								dataPoints: Stats.linearLeastSquares(population)
							}
						]
					};

					dependentAxisConfig = {
						values: 5,
						roundTo: 1000000,
						min: null
					};

					independentAxisConfig = {
						valuesEvery: 2
					};

					chart = Charter.createLineGraph(
						chartData,
						dependentAxisConfig,
						independentAxisConfig
					);

					$('#chart-area').append(chart);
				},
				createScatterPlot: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var chartData;

					var dependentAxisConfig;
					var independentAxisConfig;

					var chart;

					var years = Analyser.getCol(rows, cols.YEAR);
					var population = Analyser.getCol(rows, cols.POPULATION);

					chartData = {
						title: 'Auckland city population over time',
						showLegend: true,
						labels: years,
						dataSeries: [
							{
								name: 'Population',
								color: '#f00',
								dataPoints: population
							},
							{
								name: 'Population linear fit',
								color: 'rgba(255, 255, 255, 0.5)',
								dataPoints: Stats.linearLeastSquares(population)
							}
						]
					};

					dependentAxisConfig = {
						values: 5,
						roundTo: 10000,
						min: null
					};

					independentAxisConfig = {
						valuesEvery: 2
					};

					chart = Charter.createScatterPlot(
						chartData,
						dependentAxisConfig,
						independentAxisConfig
					);

					$('#chart-area').append(chart);
				},
				updateBarChart: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var chartData;

					var dependentAxisConfig;
					var independentAxisConfig;

					var chart;

					var cityNames = Analyser.getCol(rows, cols.NAME);

					chartData = {
						title: 'City Populations',
						showTooltips: true,
						labels: cityNames,
						dataSeries: [
							{
								dataPoints: Analyser.getCol(rows, cols.POPULATION)
							}
						]
					};

					dependentAxisConfig = {
						roundTo: 100,
						values: 2
					};

					chart = Charter.createBarChart(chartData, dependentAxisConfig);

					$('#chart-area').append(chart);

					window.setTimeout(function () {
						Charter.updateBarChart(chart[0], [1, 2, 3, 4, 5, 6, 7, 8, 9], 'New title');
					}, 1000);
				}
			},
			stats: {
				sum: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var populations = Analyser.getCol(rows, cols.POPULATION);
					var totalPopulation = Stats.sum(populations);

					console.log(populations);
					console.log(totalPopulation);
				},
				mean: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var populations = Analyser.getCol(rows, cols.POPULATION);
					var meanPopulation = Stats.mean(populations);

					console.log(populations);
					console.log(meanPopulation);
				},
				median: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var populations = Analyser.getCol(rows, cols.POPULATION);
					var medianPopulation = Stats.median(populations);

					console.log(populations);
					console.log(medianPopulation);
				},

				variance: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var populations = Analyser.getCol(rows, cols.POPULATION);
					var populationVariance = Stats.variance(populations);

					console.log(populations);
					console.log(populationVariance);
				},
				sd: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var populations = Analyser.getCol(rows, cols.POPULATION);
					var populationSD = Stats.sd(populations);

					console.log(populations);
					console.log(populationSD);
				},

				max: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var populations = Analyser.getCol(rows, cols.POPULATION);
					var populationMax = Stats.max(populations);

					console.log(populations);
					console.log(populationMax);
				},
				min: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var populations = Analyser.getCol(rows, cols.POPULATION);
					var min = Stats.min(populations);

					console.log(populations);
					console.log(min);
				},
				intRange: function () {
					var intRange = Stats.intRange(0, 20);

					console.log(intRange);
				},

				linearLeastSquares: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var chartData;

					var dependentAxisConfig;
					var independentAxisConfig;

					var chart;

					var years = Analyser.getCol(rows, cols.YEAR);
					var population = Analyser.getCol(rows, cols.POPULATION);

					var linearFit = Stats.linearLeastSquares(population);

					chartData = {
						title: 'Auckland city population over time',
						showLegend: true,
						labels: years,
						dataSeries: [
							{
								name: 'Population',
								color: '#f00',
								dataPoints: population
							},
							{
								name: 'Population linear fit',
								color: 'rgba(255, 255, 255, 0.5)',
								dataPoints: linearFit
							}
						]
					};

					dependentAxisConfig = {
						values: 5,
						roundTo: 1000000,
						min: null
					};

					independentAxisConfig = {
						valuesEvery: 2
					};

					chart = Charter.createLineGraph(
						chartData,
						dependentAxisConfig,
						independentAxisConfig
					);

					$('#chart-area').append(chart);
				},
				r: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var years = Analyser.getCol(rows, cols.YEAR);
					var population = Analyser.getCol(rows, cols.POPULATION);

					var linearFit = Stats.linearLeastSquares(population);

					var r = Stats.r(linearFit, population);

					console.log(r);
				},
				r2: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var years = Analyser.getCol(rows, cols.YEAR);
					var population = Analyser.getCol(rows, cols.POPULATION);

					var linearFit = Stats.linearLeastSquares(population);

					var r2 = Stats.r2(linearFit, population);

					console.log(r2);
				},

				smooth: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var chartData;

					var dependentAxisConfig;
					var independentAxisConfig;

					var chart;

					var years = Analyser.getCol(rows, cols.YEAR);
					var population = Analyser.getCol(rows, cols.POPULATION);

					var smoothness = 5;
					var smoothed = Stats.smooth(population, smoothness);

					chartData = {
						title: 'Auckland city population over time',
						showLegend: true,
						labels: years.slice((smoothness-1)),
						dataSeries: [
							{
								name: 'Smoothed population',
								color: 'rgba(255, 255, 255, 0.5)',
								dataPoints: smoothed
							}
						]
					};

					dependentAxisConfig = {
						values: 5,
						roundTo: 1000000,
						min: null
					};

					independentAxisConfig = {
						valuesEvery: 2
					};

					chart = Charter.createLineGraph(
						chartData,
						dependentAxisConfig,
						independentAxisConfig
					);

					$('#chart-area').append(chart);
				},
				chunk: function (dataConfig) {
					var rows = dataConfig.rows;
					var cols = dataConfig.cols;

					var chartData;

					var dependentAxisConfig;
					var independentAxisConfig;

					var chart;

					var chunkSize = 5;
					// Make sure rows.length will be divisible by chunkSize after removing one
					while (((rows.length-1) % chunkSize) !== 0) {
						rows.shift();
					}

					var lastYearPopulation = Analyser.getCol(rows, cols.POPULATION);

					// Remove last "last year population" and first year's row, so the
					// arrays line up as expected
					lastYearPopulation.pop();
					rows.shift();

					var years = Analyser.getCol(rows, cols.YEAR);

					cols.POPULATION_PREVIOUS = Analyser.addCol(rows, lastYearPopulation);
					cols.POPULATION_INCREASE = Analyser.addDerivedCol(rows, (row) => (row[cols.POPULATION] - row[cols.POPULATION_PREVIOUS]));

					var populationIncrease = Analyser.getCol(rows, cols.POPULATION_INCREASE);
					var chunkedPopulationIncrease = Stats.chunk(populationIncrease, chunkSize);

					var yearSets = [];
					for (var i = 0; i < years.length; i += chunkSize) {
						yearSets.push(years[i] + '-' + years[i+(chunkSize-1)]);
					}

					chartData = {
						title: 'Auckland city population increase',
						showLegend: true,
						labels: yearSets,
						dataSeries: [
							{
								name: 'Population increase',
								dataPoints: chunkedPopulationIncrease
							}
						]
					};

					dependentAxisConfig = {
						values: 5,
						min: 0
					};

					independentAxisConfig = {};

					chart = Charter.createBarChart(
						chartData,
						dependentAxisConfig,
						independentAxisConfig
					);

					$('#chart-area').append(chart);
				}
			}
		};

		var filesLoaded = false;
		var dataConfigA;
		var dataConfigB;

		var loadFiles = function (testName) {
			var fileConfigA = {
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

			fileConfigA.enumsMap.MAYOR = [fileConfigA.cols.MAYOR_2012, fileConfigA.cols.MAYOR_2018];

			var fileConfigB = {
				headerRows: 1,
				cols: {
					YEAR: Analyser.getColNumber('A'),
					POPULATION: Analyser.getColNumber('B')
				}
			};

			var onFilesLoaded = function (a, b) {
				filesLoaded = true;
				dataConfigA = a;
				dataConfigB = b;
				runTest(testName);
			};

			Analyser.loadFile(
				baseUrl + 'examples/data/city example.csv', fileConfigA,
				baseUrl + 'examples/data/city example 3.csv', fileConfigB,
				onFilesLoaded
			);
		};

		var runTest = function (testName) {
			var testName = testName || document.location.hash.replace(/#/, '');
			var testFn;
			var indentLevels;

			if (!filesLoaded) {
				loadFiles(testName);
				return;
			}

			if (testName) {
				console.log('');
				console.log('Running test:', testName);

				// Clear output
				$('#chart-area').html('');
				$('#test-source').html('');

				switch (testName) {
					// Analyser
					case 'loadFile':
						var testFn = tests.analyser.loadFile;
						testFn();
						break;
					case 'combineData':
						var testFn = tests.analyser.combineData;
						testFn();
						break;
					case 'getColNumber':
						var testFn = tests.analyser.getColNumber;
						testFn();
						break;
					case 'getCol':
						var testFn = tests.analyser.getCol;
						testFn(dataConfigA);
						break;
					case 'addCol':
						var testFn = tests.analyser.addCol;
						testFn(dataConfigB);
						break;
					case 'getDerivedCol':
						var testFn = tests.analyser.getDerivedCol;
						testFn(dataConfigA);
						break;
					case 'addDerivedCol':
						var testFn = tests.analyser.addDerivedCol;
						testFn(dataConfigA);
						break;
					case 'createSubTable':
						var testFn = tests.analyser.createSubTable;
						testFn(dataConfigA);
						break;
					case 'createSubTableString':
						var testFn = tests.analyser.createSubTableString;
						testFn(dataConfigA);
						break;
					case 'getColSummary':
						var testFn = tests.analyser.getColSummary;
						testFn(dataConfigA);
						break;
					case 'getColAsDataSeries':
						var testFn = tests.analyser.getColAsDataSeries;
						testFn(dataConfigA);
						break;
					case 'getComparisonSummary':
						var testFn = tests.analyser.getComparisonSummary;
						testFn(dataConfigA);
						break;
					case 'getComparisonSummaryString':
						var testFn = tests.analyser.getComparisonSummaryString;
						testFn(dataConfigA);
						break;
					case 'rows':
						var testFn = tests.analyser.rows;
						testFn(dataConfigA);
						break;
					case 'enums':
						var testFn = tests.analyser.enums;
						testFn(dataConfigA);
						break;
					case 'filterRows':
						var testFn = tests.analyser.filterRows;
						testFn(dataConfigA);
						break;
					case 'filterRowsAnd':
						var testFn = tests.analyser.filterRowsAnd;
						testFn(dataConfigA);
						break;
					case 'filterRowsOr':
						var testFn = tests.analyser.filterRowsOr;
						testFn(dataConfigA);
						break;

					// Charter
					case 'createTable':
						var testFn = tests.charter.createTable;
						testFn(dataConfigB);
						break;
					case 'createBarChart':
						var testFn = tests.charter.createBarChart;
						testFn(dataConfigA);
						break;
					case 'createLineGraph':
						var testFn = tests.charter.createLineGraph;
						testFn(dataConfigB);
						break;
					case 'createScatterPlot':
						var testFn = tests.charter.createScatterPlot;
						testFn(dataConfigB);
						break;
					case 'updateBarChart':
						var testFn = tests.charter.updateBarChart;
						testFn(dataConfigA);
						break;

					// Stats
					case 'sum':
						var testFn = tests.stats.sum;
						testFn(dataConfigA);
						break;
					case 'mean':
						var testFn = tests.stats.mean;
						testFn(dataConfigA);
						break;
					case 'median':
						var testFn = tests.stats.median;
						testFn(dataConfigA);
						break;
					case 'variance':
						var testFn = tests.stats.variance;
						testFn(dataConfigA);
						break;
					case 'sd':
						var testFn = tests.stats.sd;
						testFn(dataConfigA);
						break;
					case 'max':
						var testFn = tests.stats.max;
						testFn(dataConfigA);
						break;
					case 'min':
						var testFn = tests.stats.min;
						testFn(dataConfigA);
						break;
					case 'intRange':
						var testFn = tests.stats.intRange;
						testFn();
						break;
					case 'linearLeastSquares':
						var testFn = tests.stats.linearLeastSquares;
						testFn(dataConfigB);
						break;
					case 'r':
						var testFn = tests.stats.r;
						testFn(dataConfigB);
						break;
					case 'r2':
						var testFn = tests.stats.r2;
						testFn(dataConfigB);
						break;
					case 'smooth':
						var testFn = tests.stats.smooth;
						testFn(dataConfigB);
						break;
					case 'chunk':
						var testFn = tests.stats.chunk;
						testFn(dataConfigB);
						break;

					default:
						console.error('Test not recognised');
						break;
				}

				if (testFn) {
					testFn = testFn.toString();
					indentLevels = testFn.match(/\t+/)[0].length-1;
					$('#test-source').html(testFn.replace(new RegExp('^\t{' + indentLevels + '}', 'mg'), ''));
				}
			}
		};

		var runTestEvent = function (e) {
			var $link = $(e.target);
			var testName = $link.attr('href').replace(/#/, '');

			runTest(testName);
		};
		var runTestHistoryEvent = function () {
			runTest();
		}

		$('.js-test-link').on('click', runTestEvent);
		window.onpopstate = runTestHistoryEvent;

		runTest();
	}
);