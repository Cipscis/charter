require(
	[
		'jquery',

		'charter/charter',
		'analyser/analyser',
		'stats/stats'
	],
	function ($, Charter, Analyser, Stats) {
		var dataConfig;

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

		var tests = {
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

				Analyser.loadFile('/assets/data/city example.csv', fileConfig, exploreData);
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
				var filePathA = '/assets/data/city example.csv';

				var fileConfigB = {
					headerRows: 1,
					cols: {
						NAME: Analyser.getColNumber('A'),
						COUNTRY: Analyser.getColNumber('B'),
						POPULATION: Analyser.getColNumber('C')
					}
				};
				var filePathB = '/assets/data/city example 2.csv';

				var filesLoaded = 0;

				var dataConfigA;
				var dataConfigB;

				var fileALoaded = function (dataConfig) {
					dataConfigA = dataConfig;
					filesLoaded += 1;
					if (filesLoaded === 2) {
						bothFilesLoaded();
					}
				};

				var fileBLoaded = function (dataConfig) {
					dataConfigB = dataConfig;
					filesLoaded += 1;
					if (filesLoaded === 2) {
						bothFilesLoaded();
					}
				};

				var bothFilesLoaded = function () {
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

				Analyser.loadFile(filePathA, fileConfigA, fileALoaded);
				Analyser.loadFile(filePathB, fileConfigB, fileBLoaded);
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
		};

		// tests.loadFile();
		// tests.combineData();
		// tests.getColNumber();

		var runTest = function (dataConfig) {
			// tests.getCol(dataConfig);
			// tests.getDerivedCol(dataConfig);
			// tests.addDerivedCol(dataConfig);
			// tests.createSubTable(dataConfig);
			// tests.createSubTableString(dataConfig);
			// tests.getColSummary(dataConfig);
			// tests.getColAsDataSeries(dataConfig);
			// tests.getComparisonSummary(dataConfig);
			// tests.getComparisonSummaryString(dataConfig);

			// tests.rows(dataConfig);
			// tests.enums(dataConfig);

			// tests.filterRows(dataConfig);
			// tests.filterRowsAnd(dataConfig);
			tests.filterRowsOr(dataConfig);
		};

		Analyser.loadFile('/assets/data/city example.csv', fileConfig, runTest);
	}
);