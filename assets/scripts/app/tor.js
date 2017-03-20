require(
	[
		'jquery',
		'd3',
		'templayed',

		'charter/charter',
		'analyser/analyser'
	],
	function ($, d3, templayed, Charter, Analyser) {

		var cols = {
			AGE: Analyser.getColNumber('I'),
			GENDER: Analyser.getColNumber('J'),
			ETHNICITY: Analyser.getColNumber('K'),
			SUBJECT_ARMED: Analyser.getColNumber('L'),
			TACTICS: Analyser.getColNumber('M'),

			TASER_USAGE_COUNT: Analyser.getColNumber('CR'),
			TASER_METHOD_1: Analyser.getColNumber('CU'),
			TASER_METHOD_2: Analyser.getColNumber('DH'),
			TASER_METHOD_3: Analyser.getColNumber('DU'),

			INCIDENT_TYPE: Analyser.getColNumber('FS'),
			INJURIES: Analyser.getColNumber('FT')
		};
		var arrayCols = {};
		arrayCols[cols.TACTICS] = null;

		var config = {
			headerRows: 2,
			cols: cols,
			aliases: {
				ETHNICITY: [
					[
						'Pacific', // Not represented in data, but used as a label
						'Pacific Island',
						'Pacific Islander',
						'Other - Cook Island/Maori',
						'Other - Fijian/PI',
						'Other - Tongan'
					],
					[
						'African',
						'Native African (or cultural group of African origin)',
						'Other - african'
					],
					[
						'Pākehā', // Not represented in data, but used as a label
						'European',
						'Other - Maori/European',
						'Other - European/Maori'
					],
					[
						'Māori', // Not represented in data, but used as a label
						'Maori',
						'Other - Maori/European',
						'Other - Cook Island/Maori',
						'Other - European/Maori'
					]
				]
			},
			arrayCols: arrayCols,
			enumsMap: {
				TASER_METHOD: [cols.TASER_METHOD_1, cols.TASER_METHOD_2, cols.TASER_METHOD_3]
			}
		};

		var fileProcessed = function (config) {
			exploratoryAnalysis(config);
			buildVisualisation(config);
		};

		Analyser.loadFile('assets/data/Tactical Options 2016 - raw.csv', config, fileProcessed);

		var exploratoryAnalysis = function (config) {
		};

		var buildVisualisation = function (config) {
			var rows = config.rows,
				cols = config.cols,
				enums = config.enums,
				filterRows = config.filters.filterRows;

			// Introduce ethnicity population data
			//////////////////////////////////////

			// Source based on 2013 census:
			// http://www.stats.govt.nz/Census/2013-census/profile-and-summary-reports/quickstats-about-national-highlights/cultural-diversity.aspx
			var pop = {
				'Pākehā': 2969391,
				'Māori': 598605,
				'Pacific': 295944
			};

			// Format data for bar charts
			/////////////////////////////
			// Remove "Sponge round" and "Communication" if present, as they're not present across both years
			i = enums.TACTICS.indexOf('Sponge round');
			if (i !== -1) {
				enums.TACTICS.splice(i, 1);
			}

			i = enums.TACTICS.indexOf('Communication');
			if (i !== -1) {
				enums.TACTICS.splice(i, 1);
			}

			// Move "Other" to the end of the list
			i = enums.TACTICS.indexOf('Other');
			if (i !== -1) {
				enums.TACTICS.push(enums.TACTICS.splice(i, 1)[0]);
			}

			var data2016 = {};
			enums.ETHNICITY = ['Pākehā', 'Māori', 'Pacific'];
			for (i = 0; i < enums.ETHNICITY.length; i++) {
				data2016[enums.ETHNICITY[i]] = {};
				for (j = 0; j < enums.TACTICS.length; j++) {
					data2016[enums.ETHNICITY[i]][enums.TACTICS[j]] = filterRows(rows,
						cols.ETHNICITY, enums.ETHNICITY[i],
						cols.TACTICS, enums.TACTICS[j]
					).length /
					pop[enums.ETHNICITY[i]] * 100000; // Doubled so this 6 month period can be compared with 12 months
				}
			}

			// This data has been entered by hand,
			// and is halved to make it directly comparable to July-December 2016
			// as the 2014 data was collected over a 12 month period
			var data2014 = {
				'Pākehā': {
					'Empty Hand': 27.132 / 2,
					'OC Spray': 13.338 / 2,
					'Handcuffs-Restraints': 24.111 / 2,
					'Taser': 11 / 2,
					'Other': 0.627 / 2,
					'Firearm': 4.56 / 2,
					'Dog': 2.793 / 2,
					'Baton': 0.57 / 2
				},
				'Māori': {
					'Empty Hand': 172.8 / 2,
					'OC Spray': 138.4 / 2,
					'Handcuffs-Restraints': 147.6 / 2,
					'Taser': 87.6 / 2,
					'Other': 3.2 / 2,
					'Firearm': 24 / 2,
					'Dog': 18.8 / 2,
					'Baton': 8.4 / 2
				},
				'Pacific': {
					'Empty Hand': 78.039 / 2,
					'OC Spray': 74.313 / 2,
					'Handcuffs-Restraints': 76.176 / 2,
					'Taser': 47.403 / 2,
					'Other': 1.035 / 2,
					'Firearm': 16.974 / 2,
					'Dog': 9.108 / 2,
					'Baton': 2.691 / 2
				}
			};

			var perPop2016 = {},
				perPakeha2016 = {},

				perPop2014 = {},
				perPakeha2014 = {};

			for (i = 0; i < enums.TACTICS.length; i++) {
				perPop2016[enums.TACTICS[i]] = [];
				perPakeha2016[enums.TACTICS[i]] = [];

				perPop2014[enums.TACTICS[i]] = [];
				perPakeha2014[enums.TACTICS[i]] = [];

				for (j = 0; j < enums.ETHNICITY.length; j++) {
					perPop2016[enums.TACTICS[i]].push(
						data2016[enums.ETHNICITY[j]][enums.TACTICS[i]]
					);

					perPakeha2016[enums.TACTICS[i]].push(
						data2016[enums.ETHNICITY[j]][enums.TACTICS[i]] /
						data2016[enums.ETHNICITY[0]][enums.TACTICS[i]]
					);

					perPop2014[enums.TACTICS[i]].push(
						data2014[enums.ETHNICITY[j]][enums.TACTICS[i]]
					);

					perPakeha2014[enums.TACTICS[i]].push(
						data2014[enums.ETHNICITY[j]][enums.TACTICS[i]] /
						data2014[enums.ETHNICITY[0]][enums.TACTICS[i]]
					);
				}
			}

			// Create TOR type options
			//////////////////////////
			var $torOptions = $('.js-tor-options'),
				$torOptionsTemplate = $('.js-tor-options-template'),
				torOptionsData = {
					options: []
				};

			for (i = 0; i < enums.TACTICS.length; i++) {
				torOptionsData.options.push({
					name: enums.TACTICS[i]
				});
			}

			$torOptions.html(templayed($torOptionsTemplate.html())(torOptionsData));

			// Create per 100,000 population chart
			//////////////////////////////////////
			var chartData = {
				title: 'Tactical options use by NZ Police, per 100,000 population',
				labels: enums.ETHNICITY,
				showTooltips: true,
				dataSeries: [
					{
						dataPoints: [0, 0, 0]
					}
				]
			};

			var axisConfig = {
				max: 90,
				values: 6
			};

			var $barChart = Charter.createBarChart(chartData, axisConfig);
			$('.js-bar-chart').html('').append($barChart);

			// Create standardised chart
			////////////////////////////
			var sChartData = {
				title: 'Tactical options use by NZ Police, standardised by Pākehā rate',
				labels: enums.ETHNICITY,
				showTooltips: true,
				dataSeries: [
					{
						dataPoints: [0, 0, 0]
					}
				]
			};

			sAxisConfig = {
				max: 15,
				values: 3,
				valuesAt: [1],
				toFixed: 2
			};

			$sBarChart = Charter.createBarChart(sChartData, sAxisConfig);
			$('.js-standardised-bar-chart').html('').append($sBarChart);

			// Allow updating of charts
			///////////////////////////
			update = function (year, tor) {
				Charter.updateBarChart(
					$('.js-bar-chart .js-chart')[0],
					(year === '2014' ? perPop2014 : perPop2016)[tor]
				);

				Charter.updateBarChart(
					$('.js-standardised-bar-chart .js-chart')[0],
					(year === '2014' ? perPakeha2014 : perPakeha2016)[tor]
				);
			};

			// Initialise events
			////////////////////
			$(document).on('change', '.js-tor', function (e) {
				var $this = $(e.target),
					year = $('.js-year:checked').val(),
					tor = $this.val(),
					$select = $('.js-tor-select');

				$select.val(tor);

				update(year, tor);
			});

			$(document).on('change', '.js-tor-select', function (e) {
				var $this = $(e.target),
					tor = $this.val(),
					$radio = $('.js-tor[value="' + tor + '"]');

				$radio.prop('checked', 'checked').trigger('change');
			});


			$(document).on('change', '.js-year', function (e) {
				var $this = $(e.target),
					year = $this.val(),
					tor = $('.js-tor:checked').val(),
					$select = $('.js-year-select');

				$select.val(year);

				update(year, tor);
			});

			$(document).on('change', '.js-year-select', function (e) {
				var $this = $(e.target),
					year = $this.val(),
					$radio = $('.js-year[value="' + year + '"]');

				$radio.prop('checked', 'checked').trigger('change');
			});

			// Simulate selecting first option
			//////////////////////////////////
			window.setTimeout(function () {
				$('.js-tor').eq(0).prop('checked', 'checked').trigger('change');
			}, 100);
		};
		//////////////////////////////////////
		// BUILD VISUALISATION SECTION ENDS //
		//////////////////////////////////////
	}
);