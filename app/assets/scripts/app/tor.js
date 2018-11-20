require(
	[
		'jquery',
		'templayed',

		'charter/charter',
		'analyser/analyser',
		'stats/stats'
	],
	function ($, templayed, Charter, Analyser, Stats) {
		var cols2016;
		var arrayCols2016;
		var config2016;

		var cols2017a;
		var arrayCols2017a;
		var config2017a;

		// July-December 2016 //
		var init2016 = function () {
			cols2016 = {
				ID: Analyser.getColNumber('A'),
				MONTH: Analyser.getColNumber('C'),
				YEAR: Analyser.getColNumber('D'),

				DISTRICT: Analyser.getColNumber('F'),
				AGE: Analyser.getColNumber('I'),
				GENDER: Analyser.getColNumber('J'),
				ETHNICITY: Analyser.getColNumber('K'),
				SUBJECT_ARMED: Analyser.getColNumber('L'),
				TACTICS: Analyser.getColNumber('M'),

				INCIDENT_TYPE: Analyser.getColNumber('FS'),

				// INJURY
				INJURIES: Analyser.getColNumber('FT'),
				INJURY_CAUSE_1: Analyser.getColNumber('FU'),
				INJURY_CAUSE_2: Analyser.getColNumber('FZ'),
				INJURY_CAUSE_3: Analyser.getColNumber('GE'),

				INJURY_TREATMENT_REQUIRED_1: Analyser.getColNumber('FX'),
				INJURY_TREATMENT_RECEIVED_1: Analyser.getColNumber('FY'),
				INJURY_TREATMENT_REQUIRED_2: Analyser.getColNumber('GC'),
				INJURY_TREATMENT_RECEIVED_2: Analyser.getColNumber('GD'),
				INJURY_TREATMENT_REQUIRED_3: Analyser.getColNumber('GH'),
				INJURY_TREATMENT_RECEIVED_3: Analyser.getColNumber('GI'),

				// DOG
				DOG_PCA_1: Analyser.getColNumber('CH'),
				DOG_PCA_2: Analyser.getColNumber('CM'),

				DOG_BITTEN_1: Analyser.getColNumber('CI'),
				DOG_BITTEN_2: Analyser.getColNumber('CH'),

				DOG_LOCATION_TYPE_1: Analyser.getColNumber('CJ'),
				DOG_LOCATION_TYPE_2: Analyser.getColNumber('CO'),

				DOG_LOCATION_DESCRIPTION_1: Analyser.getColNumber('CK'),
				DOG_LOCATION_DESCRIPTION_2: Analyser.getColNumber('CP'),

				DOG_EFFECT_1: Analyser.getColNumber('CL'),
				DOG_EFFECT_2: Analyser.getColNumber('CQ'),

				// TASER
				TASER_METHOD_1: Analyser.getColNumber('CU'),
				TASER_METHOD_2: Analyser.getColNumber('DH'),
				TASER_METHOD_3: Analyser.getColNumber('DU'),

				TASER_PCA_1: Analyser.getColNumber('CS'),
				TASER_PCA_2: Analyser.getColNumber('DF'),
				TASER_PCA_3: Analyser.getColNumber('DS')
			};

			arrayCols2016 = {};
			arrayCols2016[cols2016.TACTICS] = '\n';

			config2016 = {
				headerRows: 2,
				cols: cols2016,
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
				arrayCols: arrayCols2016,
				enumsMap: {
					TASER_METHOD: [cols2016.TASER_METHOD_1, cols2016.TASER_METHOD_2, cols2016.TASER_METHOD_3]
				}
			};
		};

		// January-June 2017 //
		var init2017a = function () {
			cols2017a = {
				ID: Analyser.getColNumber('A'),
				MONTH: Analyser.getColNumber('C'),
				YEAR: Analyser.getColNumber('D'),

				DISTRICT: Analyser.getColNumber('F'),
				AGE: Analyser.getColNumber('I'),
				GENDER: Analyser.getColNumber('J'),
				ETHNICITY: Analyser.getColNumber('K'),
				SUBJECT_ARMED: Analyser.getColNumber('W'),
				TACTICS: Analyser.getColNumber('Y'),

				SPECIAL_POLICE_GROUPS: Analyser.getColNumber('G'),
				INCIDENT_TYPE: Analyser.getColNumber('GM'),

				// INJURY
				INJURIES: Analyser.getColNumber('GO'),
				INJURY_CAUSE_1: Analyser.getColNumber('GP'),
				INJURY_CAUSE_2: Analyser.getColNumber('GU'),
				INJURY_CAUSE_3: Analyser.getColNumber('GZ'),

				INJURY_TREATMENT_REQUIRED_1: Analyser.getColNumber('GS'),
				INJURY_TREATMENT_RECEIVED_1: Analyser.getColNumber('GT'),
				INJURY_TREATMENT_REQUIRED_2: Analyser.getColNumber('GX'),
				INJURY_TREATMENT_RECEIVED_2: Analyser.getColNumber('GY'),
				INJURY_TREATMENT_REQUIRED_3: Analyser.getColNumber('HC'),
				INJURY_TREATMENT_RECEIVED_3: Analyser.getColNumber('HD'),

				// DOG
				DOG_PCA_1: Analyser.getColNumber('CU'),
				DOG_PCA_2: Analyser.getColNumber('CZ'),

				DOG_BITTEN_1: Analyser.getColNumber('CV'),
				DOG_BITTEN_2: Analyser.getColNumber('DA'),

				DOG_LOCATION_TYPE_1: Analyser.getColNumber('CW'),
				DOG_LOCATION_TYPE_2: Analyser.getColNumber('DB'),

				DOG_LOCATION_DESCRIPTION_1: Analyser.getColNumber('CX'),
				DOG_LOCATION_DESCRIPTION_2: Analyser.getColNumber('DC'),

				DOG_EFFECT_1: Analyser.getColNumber('CY'),
				DOG_EFFECT_2: Analyser.getColNumber('DD'),

				// TASER
				TASER_METHOD_1: Analyser.getColNumber('DI'),
				TASER_METHOD_2: Analyser.getColNumber('DW'),
				TASER_METHOD_3: Analyser.getColNumber('EK'),

				TASER_PCA_1: Analyser.getColNumber('DF'),
				TASER_PCA_2: Analyser.getColNumber('DT'),
				TASER_PCA_3: Analyser.getColNumber('EH')
			};

			arrayCols2017a = {};
			arrayCols2017a[cols2017a.TACTICS] = '\n';
			arrayCols2017a[cols2017a.SPECIAL_POLICE_GROUPS] = ', ';

			config2017a = {
				headerRows: 2,
				cols: cols2017a,
				aliases: {
					ETHNICITY: [
						[
							'Pacific', // Not represented in data, but used as a label
							'Pacific Island',
							'Pacific Islander',
							'Other - COOK ISLAND MAORI',
							'Other - maori-cook islander',
							'Other - Tongan',
							'Other - EUROPEAN/SAMOAN'
						],
						[
							'African',
							'Native African (or cultural group of African origin)',
							'Other - SUDANESE',
							'Other - Sudanese'
						],
						[
							'Pākehā', // Not represented in data, but used as a label
							'European',
							'Other - EUROPEAN/SAMOAN'
						],
						[
							'Māori', // Not represented in data, but used as a label
							'Maori',
							'Other - Maori/Chillean',
							'Other - COOK ISLAND MAORI',
							'Other - maori-cook islander'
						]
						// Should 'Middle Eastern' and 'Other - ARAB' be combined?
					]
				},
				arrayCols: arrayCols2017a,
				enumsMap: {
					TASER_METHOD: [cols2017a.TASER_METHOD_1, cols2017a.TASER_METHOD_2, cols2017a.TASER_METHOD_3]
				}
			};
		};

		var initConfigs = function () {
			init2016();
			init2017a();
		};
		initConfigs();

		var numFilesProcessed = 0;
		var numFilesToProcess = 2;

		var finalConfig = {};

		var fileProcessed = function (id) {
			return function (config) {
				numFilesProcessed++;
				finalConfig[id] = config;
				if (numFilesProcessed >= numFilesToProcess) {
					filesProcessed(finalConfig);
				}
			};
		};

		var filesProcessed = function (separateConfig) {
			var combinedConfig = Analyser.combineData(separateConfig['2016'], separateConfig['2017a']);

			exploratoryAnalysis(combinedConfig, separateConfig['2016'], separateConfig['2017a']);
			// articleCheck(separateConfig['2017a']);
			buildVisualisation(combinedConfig, separateConfig['2016'], separateConfig['2017a']);
		};

		var exploratoryAnalysis = function (combinedConfig, config2016, config2017a) {
			var config = config2017a;

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

			var getTacticInjuries = function (rows, tactic) {
				var injuries = filterRowsOr(rows,
					cols.INJURY_CAUSE_1, tactic,
					cols.INJURY_CAUSE_2, tactic,
					cols.INJURY_CAUSE_3, tactic
				);

				return injuries;
			};

			// Sort by ascending age
			rows = rows.sort(function (a, b) {
				return a[cols.AGE] - b[cols.AGE];
			});

			// TASER PCA
			var taser1 = filterRows(rows,
				cols.TASER_METHOD_1, 'Discharge'
			);
			var taser2 = filterRows(rows,
				cols.TASER_METHOD_2, 'Discharge'
			);
			var taser3 = filterRows(rows,
				cols.TASER_METHOD_3, 'Discharge'
			);

			// console.log(Analyser.getColSummary(taser1, cols.TASER_PCA_1));
			// console.log(Analyser.getColSummary(taser2, cols.TASER_PCA_2));
			// console.log(Analyser.getColSummary(taser3, cols.TASER_PCA_3));

			// INJURY RATES
			// var tactics = Analyser.getColSummary(rows, cols.TACTICS);

			// // Report on each type of tactic
			// for (var tactic in tactics) {
			// 	var tacticEvents = filterRows(rows, cols.TACTICS, tactic);
			// 	var injuries = getTacticInjuries(tacticEvents, tactic);

			// 	console.log(tactic);
			// 	console.log('==========');
			// 	console.log('Events:', tacticEvents.length);
			// 	console.log('Injury rate:', percent(injuries.length, tacticEvents.length) + '%', injuries.length);
			// 	if (injuries.length) {
			// 		console.log('Youngest subject:', tacticEvents[0][cols.AGE]);
			// 		console.log('Youngest subject injured:', injuries[0][cols.AGE]);

			// 		console.log('Oldest subject:', tacticEvents[tacticEvents.length-1][cols.AGE]);
			// 		console.log('Oldest subject injured:', injuries[injuries.length-1][cols.AGE]);
			// 	}
			// 	console.log(' ');
			// }

			// // Dog-specific
			// var dogs = filterRows(rows,
			// 	cols.TACTICS, 'Dog'
			// );

			// var dogInjuries = getTacticInjuries(rows, 'Dog');
			// console.log('Dog injuries:');
			// console.table(Analyser.createSubTable(dogInjuries, cols));

			// console.log('Dog bitten summary', Analyser.getColSummary(rows, cols.DOG_BITTEN));

			// console.log('Dog PCA summary', Analyser.getColSummary(rows, cols.DOG_PCA));

			// console.log('Dog special police groups summary', Analyser.getColSummary(dogs, cols.SPECIAL_POLICE_GROUPS));
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

		var buildVisualisation = function (combinedConfig, config2016, config2017a) {
			var rows2016 = config2016.rows,
				cols2016 = config2016.cols,
				filterRows2016 = config2016.filters.filterRows,

				rows2017a = config2017a.rows,
				cols2017a = config2017a.cols,
				filterRows2017a = config2017a.filters.filterRows,

				enums = config2017a.enums,
				// enums = combinedConfig.enums,

				i, j, k;

			// Introduce ethnicity population data
			//////////////////////////////////////

			// Source based on 2013 census:
			// http://www.stats.govt.nz/Census/2013-census/profile-and-summary-reports/quickstats-about-national-highlights/cultural-diversity.aspx
			var pop = {
				'Pākehā': 2969391,
				'Māori': 598605,
				'Pacific': 295944
			};

			// Process enums
			////////////////
			// Remove "Sponge round" and "Communication" if present, as they're not present across both years
			i = enums.TACTICS.indexOf('Sponge round');
			if (i !== -1) {
				enums.TACTICS.splice(i, 1);
			}

			i = enums.TACTICS.indexOf('Communication');
			if (i !== -1) {
				enums.TACTICS.splice(i, 1);
			}

			// Sort tactics alphabetically
			enums.TACTICS = enums.TACTICS.sort();

			// Move "Other" to the end of the list
			i = enums.TACTICS.indexOf('Other');
			if (i !== -1) {
				enums.TACTICS.push(enums.TACTICS.splice(i, 1)[0]);
			}

			// Insert "Any" at the end of the list
			enums.TACTICS.push('Any');

			enums.ETHNICITY = ['Pākehā', 'Māori', 'Pacific'];
			var formatDataForChart = function (dataConfig) {
				var rows = dataConfig.rows;
				var cols = dataConfig.cols;
				var filterRows = dataConfig.filters.filterRows;

				var data = {};
				var ethnicity;
				var tactic;

				var i, j;

				for (i = 0; i < enums.ETHNICITY.length; i++) {
					ethnicity = enums.ETHNICITY[i];

					data[ethnicity] = {};
					for (j = 0; j < enums.TACTICS.length; j++) {
						tactic = enums.TACTICS[j];

						if (tactic === 'Any') {
							data[ethnicity][tactic] = filterRows(rows,
								cols.ETHNICITY, ethnicity
							).length / pop[ethnicity] * 100000;
						} else {
							data[ethnicity][tactic] = filterRows(rows,
								cols.ETHNICITY, ethnicity,
								cols.TACTICS, tactic
							).length / pop[ethnicity] * 100000;
						}
					}
				}

				return data;
			};

			var data2016 = formatDataForChart(config2016);
			var data2017a = formatDataForChart(config2017a);

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
					'Baton': 0.57 / 2,
					'Any': 57 / 2
				},
				'Māori': {
					'Empty Hand': 172.8 / 2,
					'OC Spray': 138.4 / 2,
					'Handcuffs-Restraints': 147.6 / 2,
					'Taser': 87.6 / 2,
					'Other': 3.2 / 2,
					'Firearm': 24 / 2,
					'Dog': 18.8 / 2,
					'Baton': 8.4 / 2,
					'Any': 400 / 2
				},
				'Pacific': {
					'Empty Hand': 78.039 / 2,
					'OC Spray': 74.313 / 2,
					'Handcuffs-Restraints': 76.176 / 2,
					'Taser': 47.403 / 2,
					'Other': 1.035 / 2,
					'Firearm': 16.974 / 2,
					'Dog': 9.108 / 2,
					'Baton': 2.691 / 2,
					'Any': 207 / 2
				}
			};

			// Build perPop and perPakeha objects for updating bar charts
			var perPop = {
				'2014': {},
				'2016': {},
				'2017a': {}
			};

			var perPakeha = {
				'2014': {},
				'2016': {},
				'2017a': {}
			};

			var years = ['2014', '2016', '2017a'];
			var data = {
				'2014': data2014,
				'2016': data2016,
				'2017a': data2017a
			};

			for (i = 0; i < enums.TACTICS.length; i++) {
				for (j = 0; j < years.length; j++) {
					perPop[years[j]][enums.TACTICS[i]] = [];
					perPakeha[years[j]][enums.TACTICS[i]] = [];

					for (k = 0; k < enums.ETHNICITY.length; k++) {
						perPop[years[j]][enums.TACTICS[i]].push(
							data[years[j]][enums.ETHNICITY[k]][enums.TACTICS[i]]
						);

						perPakeha[years[j]][enums.TACTICS[i]].push(
							data[years[j]][enums.ETHNICITY[k]][enums.TACTICS[i]] /
							data[years[j]][enums.ETHNICITY[0]][enums.TACTICS[i]] || 0
						);
					}
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
				var tacticName = enums.TACTICS[i];
				var tacticDisplayName = tacticName;

				if (tacticDisplayName === 'Handcuffs-Restraints') {
					tacticDisplayName = 'Handcuffs';
				}

				torOptionsData.options.push({
					name: tacticName,
					displayName: tacticDisplayName
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
					$('.js-bar-chart .js-chart')[0], perPop[year][tor]
				);

				Charter.updateBarChart(
					$('.js-standardised-bar-chart .js-chart')[0], perPakeha[year][tor]
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

		Analyser.loadFile('assets/data/Tactical Options 2016 - raw.csv', config2016, fileProcessed('2016'));
		Analyser.loadFile('assets/data/Tactical Options 2017-01 - 2017-06 raw.csv', config2017a, fileProcessed('2017a'));
	}
);