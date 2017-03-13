require(
	[
		'jquery',
		'd3',
		'templayed',

		'charter/charter'
	],
	function ($, d3, templayed, Charter) {
		// Mapper functions
		var timesArray = function (array) {
			return function (val, index) {
				return val * array[index];
			};
		};

		var overArray = function (array) {
			return function (val, index) {
				return val / array[index];
			};
		};

		var times = function (number) {
			return function (val) {
				return val * number;
			};
		};

		var over = function (number) {
			return function (val) {
				return val / number;
			};
		};

		var fileLoaded = function (csv) {
			Charter.parseCsv(csv, fileParsed);
		};

		var fileParsed = function (rows) {
			var chartData,
				axisConfig,
				$barChart,

				sChartData,
				sAxisConfig,
				$sBarChart,

				$table,

				i,

				x, sx,
				update;

			// Data manipulation steps
			var totalTORs,
				perPopAll,
				population,
				TORTypes,
				perTOR,
				total,
				perPop,
				perPakeha;

			// STEP 1: MANIPULATE DATA
			//////////////////////////
			totalTORs = rows[10].slice(1, 4); // Total TOR events for each ethnicity
			perPopAll = rows[11].slice(1, 4); // Per 100,000 population
			population = [];

			// Total events / events per 100,000 population * 100,000
			// = population
			population = totalTORs.map(overArray(perPopAll)).map(times(100000));

			TORTypes = [];
			perTOR = {};
			for (i = 1; i < 10; i++) {
				// Collect names of each type of Tactical Option
				TORTypes.push(rows[i][0]);

				// Percentage of times this option was used per TOR event for each ethnicity
				perTOR[rows[i][0]] = rows[i].slice(1, 4);
			}

			total = {};
			for (i in perTOR) {
				// Rate per this type of TOR used * number of TOR events
				// = number of this type of TOR used
				total[i] = perTOR[i].map(timesArray(totalTORs));
			}

			perPop = {};
			for (i in total) {
				// Number of times this type of TOR used / population * 100,000
				// = number of times this type of TOR used per 100,000 population
				perPop[i] = total[i].map(overArray(population)).map(times(100000));
			}

			perPakeha = {};
			for (i in perPop) {
				// Number of times this type of TOR used per 100,000 population /
				// Number of times this type of TOR used per 100,000 population for Pākehā
				// = Number of times this type of TOR used relative to Pākehā rate (1.00)
				perPakeha[i] = perPop[i].map(over(perPop[i][0]));
			}

			$table = Charter.createTable(rows);
			$('.js-data-table').html($table);

			var TOR = TORTypes[0],
				titleSeed = ' use by NZ Police, per 100,000 population (2014)';

			// STEP 2: Create TOR type options
			//////////////////////////////////
			var $torOptions = $('.js-tor-options'),
				$torOptionsTemplate = $('.js-tor-options-template'),
				torOptionsData = {
					options: []
				};

			for (i = 0; i < TORTypes.length; i++) {
				torOptionsData.options.push({
					name: TORTypes[i]
				});
			}

			$torOptions.html(templayed($torOptionsTemplate.html())(torOptionsData));

			// STEP 3: Create per population chart
			//////////////////////////////////////
			chartData = {
				// title: TOR + titleSeed,
				title: 'Tactical options' + titleSeed,
				data: [
					{
						label: 'Pākehā',
						value: perPop[TOR][0]
					},
					{
						label: 'Māori',
						value: perPop[TOR][1]
					},
					{
						label: 'Pacific',
						value: perPop[TOR][2]
					}
				]
			};

			axisConfig = {
				max: 180,
				values: 6
			};

			$barChart = Charter.createBarChart(chartData, axisConfig);
			$('.js-bar-chart').html('').append($barChart);

			// STEP 4: Create standardised chart
			////////////////////////////////////
			var sTitleSeed = ' use by NZ Police, per population, standardised by Pākehā rate (2014)';

			sChartData = {
				// title: TOR + sTitleSeed,
				title: 'Tactical options' + sTitleSeed,
				data: [
					{
						label: 'Pākehā',
						value: perPakeha[TOR][0]
					},
					{
						label: 'Māori',
						value: perPakeha[TOR][1]
					},
					{
						label: 'Pacific',
						value: perPakeha[TOR][2]
					}
				]
			};

			sAxisConfig = {
				max: 15,
				values: 3,
				toFixed: 2
			};

			$sBarChart = Charter.createBarChart(sChartData, sAxisConfig);
			$('.js-standardised-bar-chart').html('').append($sBarChart);

			// STEP 5: Allow updating of charts
			///////////////////////////////////////////
			update = function (TOR) {
				Charter.updateBarChart(
					$('.js-bar-chart .js-chart')[0],
					perPop[TOR],
					TOR + titleSeed
				);

				Charter.updateBarChart(
					$('.js-standardised-bar-chart .js-chart')[0],
					perPakeha[TOR],
					TOR + sTitleSeed
				);
			};

			// STEP 6: Initialise events
			////////////////////////////
			$(document).on('change', '.js-tor', function (e) {
				var $this = $(e.target),
					value = $this.val(),
					$select = $('.js-tor-select');

				$select.val(value);

				update(value);
			});

			$(document).on('change', '.js-tor-select', function (e) {
				var $this = $(e.target),
					value = $this.val(),
					$radio = $('.js-tor[value="' + value + '"]');

				$radio.prop('checked', 'checked').trigger('change');
			});

			// STEP 7: Simulate selecting first option
			//////////////////////////////////////////
			$('.js-tor').eq(0).prop('checked', 'checked').trigger('change');
		};

		// Load and process CSV
		$.ajax({
			url: 'assets/data/Tactical Options 2014 - raw.csv',
			success: fileLoaded
		});
	}
);