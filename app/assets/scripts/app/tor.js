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

		var cols = {
			ID: Analyser.getColNumber('A'),
			MONTH: Analyser.getColNumber('C'),
			YEAR: Analyser.getColNumber('D'),

			DISTRICT: Analyser.getColNumber('F'),
			AGE: Analyser.getColNumber('I'),
			GENDER: Analyser.getColNumber('J'),
			ETHNICITY: Analyser.getColNumber('K'),
			SUBJECT_ARMED: Analyser.getColNumber('L'),
			TACTICS: Analyser.getColNumber('M'),

			TASER_USAGE_COUNT: Analyser.getColNumber('CR'),
			TASER_METHOD_1: Analyser.getColNumber('CU'),
			TASER_METHOD_2: Analyser.getColNumber('DH'),
			TASER_METHOD_3: Analyser.getColNumber('DU'),

			TASER_TYPE_1: Analyser.getColNumber('CT'),
			TASER_TYPE_2: Analyser.getColNumber('DG'),
			TASER_TYPE_3: Analyser.getColNumber('DT'),

			TASER_PCA_1: Analyser.getColNumber('CS'),
			TASER_PCA_2: Analyser.getColNumber('DF'),
			TASER_PCA_3: Analyser.getColNumber('DS'),

			INCIDENT_TYPE: Analyser.getColNumber('FS'),

			INJURIES: Analyser.getColNumber('FT'),
			INJURY_CAUSE_1: Analyser.getColNumber('FU'),
			INJURY_CAUSE_2: Analyser.getColNumber('FZ'),
			INJURY_CAUSE_3: Analyser.getColNumber('GE')
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
				TASER_METHOD: [cols.TASER_METHOD_1, cols.TASER_METHOD_2, cols.TASER_METHOD_3],
				TASER_TYPE: [cols.TASER_TYPE_1, cols.TASER_TYPE_2, cols.TASER_TYPE_3]
			}
		};

		var fileProcessed = function (config) {
			exploratoryAnalysis(config);
			// articleCheck(config);
			buildVisualisation(config);
		};

		Analyser.loadFile('assets/data/Tactical Options 2016 - raw.csv', config, fileProcessed);

		var exploratoryAnalysis = function (config) {
			var rows = config.rows,
				cols = config.cols,
				enums = config.enums,
				aliases = config.aliases,
				filterRows = config.filters.filterRows,
				filterRowsOr = config.filters.filterRowsOr,

				i, row;

			var percent = function (n, d, f) {
				return (n / d * 100).toFixed(f || 1);
			};

			var force = filterRows(rows,
				cols.TACTICS, function (tactics) {
					return (tactics.length > 1) || (tactics.indexOf('Communication') === -1);
				}
			);

			console.log(force.length);

			var injuries = filterRows(force,
				cols.INJURIES, function (injuries) { return injuries > 0; }
			);

			var tasers = filterRows(force,
				cols.TACTICS, 'Taser'
			);

			var taserDischarges1 = filterRows(tasers,
				cols.TASER_METHOD_1, 'Discharge'
			);
			var taserDischarges2 = filterRows(tasers,
				cols.TASER_METHOD_2, 'Discharge'
			);
			var taserDischarges3 = filterRows(tasers,
				cols.TASER_METHOD_3, 'Discharge'
			);

			console.log(Analyser.getColSummary(taserDischarges1, cols.TASER_PCA_1));
			console.log(Analyser.getColSummary(taserDischarges2, cols.TASER_PCA_2));
			console.log(Analyser.getColSummary(taserDischarges3, cols.TASER_PCA_3));

			var taserDischargesPCA1 = filterRowsOr(taserDischarges1,
				cols.TASER_PCA_1, 'Passive Resistant',
				cols.TASER_PCA_1, 'Active Resistant'
			);
			var taserDischargesPCA2 = filterRowsOr(taserDischarges2,
				cols.TASER_PCA_2, 'Passive Resistant',
				cols.TASER_PCA_2, 'Active Resistant'
			);
			var taserDischargesPCA3 = filterRowsOr(taserDischarges3,
				cols.TASER_PCA_3, 'Passive Resistant',
				cols.TASER_PCA_3, 'Active Resistant'
			);

			var taserDischargesPCA = Analyser.combineRows(
				taserDischargesPCA1,
				taserDischargesPCA2,
				taserDischargesPCA3
			);

			console.table(Analyser.createSubTable(taserDischargesPCA, cols));


			var taserDischarges = Analyser.combineRows(
				taserDischarges1,
				taserDischarges2,
				taserDischarges3
			);

			var tasersMentalHealth = filterRowsOr(tasers,
				cols.INCIDENT_TYPE, '1x - attempt suicide',
				cols.INCIDENT_TYPE, '1m ? mental incident'
			);
			console.log('Mental health % of taser use: ', percent(tasersMentalHealth.length, tasers.length));

			var tasersDischargesMentalHealth = filterRowsOr(taserDischarges,
				cols.INCIDENT_TYPE, '1x - attempt suicide',
				cols.INCIDENT_TYPE, '1m ? mental incident'
			);
			console.log('Mental health % of taser discharges: ', percent(tasersDischargesMentalHealth.length, tasers.length));
			console.table(Analyser.createSubTable(tasersDischargesMentalHealth, cols));


		};

		var articleCheck = function (config) {
			var rows = config.rows,
				cols = config.cols,
				enums = config.enums,
				aliases = config.aliases,
				filterRows = config.filters.filterRows,
				filterRowsOr = config.filters.filterRowsOr,

				i, row,
				j;

			var percent = function (n, d, f) {
				return (n / d * 100).toFixed(f || 1);
			};
			var pop = {
				'Pākehā': 2969391,
				'Māori': 598605,
				'Pacific': 295944
			};
			var minYouthAge = 16;

			console.log('The child was one of 29 youths to have police dogs used against them in just six months');
			var youthDogs = filterRows(rows,
				cols.TACTICS, 'Dog',
				cols.AGE, function (age) { return age <= minYouthAge; }
			);
			console.log(youthDogs.length);

			console.log('youths made up 20 percent of incidents where dogs were used');
			var dogs = filterRows(rows,
				cols.TACTICS, 'Dog'
			);
			console.log(percent(youthDogs.length, dogs.length));

			console.log('Of those, more than 60 percent stated their ethnicity as Maori');
			var maoriDogs = filterRows(dogs,
				cols.ETHNICITY, 'Māori'
			);
			var maoriYouthDogs = filterRows(youthDogs,
				cols.ETHNICITY, 'Māori'
			);
			console.log('All: ', percent(maoriDogs.length, dogs.length));
			console.log('Youth: ', percent(maoriYouthDogs.length, youthDogs.length));

			console.log('In general, Maori were 12 times as likely to face a dog than Pakeha');
			var pakehaDogs = filterRows(dogs,
				cols.ETHNICITY, 'Pākehā'
			);
			console.log((maoriDogs.length/pop['Māori']) / (pakehaDogs.length/pop['Pākehā']));

			console.log('Overall, a person who was Maori was seven times more likely to incur the use of force by police');
			var nonCom = filterRows(rows,
				cols.TACTICS, function (tactics) { return (tactics.length > 1) || (tactics.indexOf('Communication') === -1); }
			);
			var maoriNonCom = filterRows(nonCom,
				cols.ETHNICITY, 'Māori'
			);
			var pakehaNonCom = filterRows(nonCom,
				cols.ETHNICITY, 'Pākehā'
			);
			console.log((maoriNonCom.length/pop['Māori']) / (pakehaNonCom.length/pop['Pākehā']));

			console.log('Pacific Islanders were also more likely to encounter force, at a rate of 3-1');
			var pacificNonCom = filterRows(nonCom,
				cols.ETHNICITY, 'Pacific'
			);
			console.log((pacificNonCom.length/pop['Pacific']) / (pakehaNonCom.length/pop['Pākehā']));

			console.log('Of responses that required force, the data shows "empty hand" was the most common option used, with batons being the least common');
			console.log(Analyser.getColSummary(rows, cols.TACTICS));

			console.log('Police used Tasers against people threatening suicide ten times in six months, latest data shows');
			var suicideAttempts = filterRows(rows,
				cols.INCIDENT_TYPE, '1x - attempt suicide'
			);
			var suicideAttemptsTaserDischarge = filterRowsOr(suicideAttempts,
				cols.TASER_METHOD_1, 'Discharge',
				cols.TASER_METHOD_2, 'Discharge',
				cols.TASER_METHOD_3, 'Discharge'
			);
			console.log(suicideAttemptsTaserDischarge.length);
			console.log(Analyser.getColSummary(suicideAttemptsTaserDischarge, cols.ID));

			console.log('Of the approximately 2500 events where force was used in the six months to December 2016, 25 percent of those included the use of a Taser');
			var tasers = filterRows(nonCom,
				cols.TACTICS, 'Taser'
			);
			var taserDischarges = filterRowsOr(tasers,
				cols.TASER_METHOD_1, 'Discharge',
				cols.TASER_METHOD_2, 'Discharge',
				cols.TASER_METHOD_3, 'Discharge'
			);
			console.log(nonCom.length);
			console.log(percent(tasers.length, nonCom.length));

			console.log('Maori were eight times more likely to have a Taser used against them than Pakeha');
			var maoriTaser = filterRows(tasers,
				cols.ETHNICITY, 'Māori'
			);
			var pakehaTaser = filterRows(tasers,
				cols.ETHNICITY, 'Pākehā'
			);
			console.log('Māori taser use rate divided by Pākehā taser use rate: ', (maoriTaser.length/pop['Māori']) / (pakehaTaser.length/pop['Pākehā']));

			console.log('% of forceful TOR events involving taser discharge: ', percent(taserDischarges.length, nonCom.length));

			var maoriTaserDischarge = filterRowsOr(maoriTaser,
				cols.TASER_METHOD_1, 'Discharge',
				cols.TASER_METHOD_2, 'Discharge',
				cols.TASER_METHOD_3, 'Discharge'
			);
			var pakehaTaserDischarge = filterRowsOr(pakehaTaser,
				cols.TASER_METHOD_1, 'Discharge',
				cols.TASER_METHOD_2, 'Discharge',
				cols.TASER_METHOD_3, 'Discharge'
			);
			console.log('Māori taser discharge rate divided by Pākehā taser discharge rate: ', (maoriTaserDischarge.length/pop['Māori']) / (pakehaTaserDischarge.length/pop['Pākehā']));

			console.log('Māori discharge rate: ', percent(maoriTaserDischarge.length, maoriTaser.length));
			console.log('Pākehā discharge rate: ', percent(pakehaTaserDischarge.length, pakehaTaser.length));

			console.log('tasers are used more on people with mental illness or those in crisis than others');
			var mhForce = filterRowsOr(nonCom,
				cols.INCIDENT_TYPE, '1x - attempt suicide',
				cols.INCIDENT_TYPE, '1m ? mental incident'
			);
			var nonMhForce = filterRows(nonCom,
				cols.INCIDENT_TYPE, function (it) { return (it !== '1x - attempt suicide') && (it !== '1m ? mental incident'); }
			);

			var mhForceTaser = filterRows(mhForce,
				cols.TACTICS, 'Taser'
			);
			var nonMhForceTaser = filterRows(nonMhForce,
				cols.TACTICS, 'Taser'
			);

			console.log('% force events at MH incidents involving a taser: ', percent(mhForceTaser.length, mhForce.length));
			console.log('% force events at non MH incidents involving a taser: ', percent(nonMhForceTaser.length, nonMhForce.length));
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

			var notCommunication = filterRows(rows,
				cols.TACTICS, function (tactics) {
					return (tactics.length > 1 || tactics.indexOf('Communication') === -1);
				}
			);
			var pakeha = filterRows(rows,
				cols.ETHNICITY, 'Pākehā'
			);
			var maori = filterRows(rows,
				cols.ETHNICITY, 'Māori'
			);
			var pacific = filterRows(rows,
				cols.ETHNICITY, 'Pacific'
			);

			var pakehaNum = pakeha.length / pop['Pākehā'] * 100000;

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