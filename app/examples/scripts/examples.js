require(
	[
		'jquery',

		'charter/charter',
		'analyser/analyser',
		'stats/stats'
	],
	function ($, Charter, Analyser, Stats) {
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

					Analyser.loadFile('/examples/data/city example.csv', fileConfig, exploreData);
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
					var filePathA = '/examples/data/city example.csv';

					var fileConfigB = {
						headerRows: 1,
						cols: {
							NAME: Analyser.getColNumber('A'),
							COUNTRY: Analyser.getColNumber('B'),
							POPULATION: Analyser.getColNumber('C')
						}
					};
					var filePathB = '/examples/data/city example 2.csv';

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

					dependentAxisConfig	= {
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

					dependentAxisConfig	= {
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

					dependentAxisConfig	= {
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

					dependentAxisConfig	= {
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

					dependentAxisConfig	= {
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

		// tests.analyser.loadFile();
		// tests.analyser.combineData();
		// tests.analyser.getColNumber();

		var runTest = function (dataConfigA, dataConfigB) {
			// ANALYSER
			// tests.analyser.getCol(dataConfigA);
			// tests.analyser.addCol(dataConfigB);
			// tests.analyser.getDerivedCol(dataConfigA);
			// tests.analyser.addDerivedCol(dataConfigA);
			// tests.analyser.createSubTable(dataConfigA);
			// tests.analyser.createSubTableString(dataConfigA);
			// tests.analyser.getColSummary(dataConfigA);
			// tests.analyser.getColAsDataSeries(dataConfigA);
			// tests.analyser.getComparisonSummary(dataConfigA);
			// tests.analyser.getComparisonSummaryString(dataConfigA);

			// tests.analyser.rows(dataConfigA);
			// tests.analyser.enums(dataConfigA);

			// tests.analyser.filterRows(dataConfigA);
			// tests.analyser.filterRowsAnd(dataConfigA);
			// tests.analyser.filterRowsOr(dataConfigA);


			// CHARTER
			// tests.charter.createTable(dataConfigB);
			// tests.charter.createBarChart(dataConfigA);
			// tests.charter.createLineGraph(dataConfigB);
			// tests.charter.createScatterPlot(dataConfigB);

			tests.charter.updateBarChart(dataConfigA);

			// STATS
			// tests.stats.sum(dataConfigA);
			// tests.stats.mean(dataConfigA);
			// tests.stats.median(dataConfigA);

			// tests.stats.variance(dataConfigA);
			// tests.stats.sd(dataConfigA);

			// tests.stats.max(dataConfigA);
			// tests.stats.min(dataConfigA);
			// tests.stats.intRange();

			// tests.stats.linearLeastSquares(dataConfigB);
			// tests.stats.r(dataConfigB);
			// tests.stats.r2(dataConfigB);

			// tests.stats.smooth(dataConfigB);
			// tests.stats.chunk(dataConfigB);
		};

		var loadFiles = function () {
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

			var filesLoaded = function (dataConfigA, dataConfigB) {
				runTest(dataConfigA, dataConfigB);
			};

			Analyser.loadFile(
				'/examples/data/city example.csv', fileConfigA,
				'/examples/data/city example 3.csv', fileConfigB,
				filesLoaded
			);
		};
		loadFiles();
	}
);