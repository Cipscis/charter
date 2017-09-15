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

		var config = {
			headerRows: 1,
			cols: {
				CALENDAR_YEAR: 0,
				ETHNICITY: 1,
				MAIN_OFFENCE: 2,
				SENTENCE: 3,
				VALUE: 4,
				FLAGS: 5,
			}
		};

		var fileProcessed = function (config) {
			// exploratoryAnalysis(config);
			buildVisualisation(config);
		};

		var exploratoryAnalysis = function (config) {
			var rows = config.rows,
				cols = config.cols,
				filterRows = config.filters.filterRows,
				filterRowsAnd = config.filters.filterRowsAnd;

			var limitedCols = {
				ETHNICITY: cols.ETHNICITY,
				MAIN_OFFENCE: cols.MAIN_OFFENCE,
				SENTENCE: cols.SENTENCE,
				VALUE: cols.VALUE
			};

			var years = Analyser.getColSummary(rows, cols.CALENDAR_YEAR);
			// var years = {2016: 0};
			for (var year in years) {
				var yearRow = filterRowsAnd(rows,
					cols.CALENDAR_YEAR, +year
				);

				// var offences = Analyser.getColSummary(yearRow, cols.MAIN_OFFENCE);
				var offences = {Assault: 0};
				for (var offence in offences) {
					var offenceRow = filterRows(yearRow, cols.MAIN_OFFENCE, offence);

					var sentences = filterRows(offenceRow, cols.SENTENCE, 'Total sentences');
					var imprisonment = filterRows(offenceRow, cols.SENTENCE, 'Imprisonment');

					// var ethnicities = Analyser.getColSummary(offenceRow, cols.ETHNICITY);
					var ethnicities = {European: 0, Maori: 0};
					for (var ethnicity in ethnicities) {
						var sentenceRow = filterRows(sentences, cols.ETHNICITY, ethnicity);
						var imprisonmentRow = filterRows(imprisonment, cols.ETHNICITY, ethnicity);

						var totalSentences;
						var totalImprisonment = 0;
						var percentImprisoned;

						if (sentenceRow.length && imprisonmentRow.length) {
							totalSentences = sentenceRow[0][cols.VALUE];
							totalImprisonment = imprisonmentRow[0][cols.VALUE];
						} else if (sentenceRow.length) {
							totalSentences = sentenceRow[0][cols.VALUE];
						} else {
							totalSentences = 0;
						}

						percentImprisoned = totalImprisonment / totalSentences * 100 || 0;

						console.log(offence, ethnicity, percentImprisoned.toFixed(2) + '% imprisoned', totalImprisonment + ' / ' + totalSentences);
					}
				}
			}
		};

		var buildVisualisation = function (config) {
			var rows = config.rows,
				cols = config.cols,
				filterRows = config.filters.filterRows,
				filterRowsAnd = config.filters.filterRowsAnd;

			var getChartData = function (offence) {
				var years, year, yearData,
					ethnicities, ethnicity, ethnicityData,
					offenceData,

					sentencedData, sentencedNum,
					imprisonedData, imprisonedNum, imprisonedPercent,

					chartData, colours,
					chart,

					i;

				years = Analyser.getColSummary(rows, cols.CALENDAR_YEAR);
				// offences = Analyser.getColSummary(rows, cols.MAIN_OFFENCE);
				ethnicities = Analyser.getColSummary(rows, cols.ETHNICITY);

				chartData = {
					title: '',
					showLegend: true,
					legendLeft: true,
					labels: [],
					dataSeries: []
				};

				colours = {
					European: '#fff',
					Maori: '#f33',
					'Pacific Peoples': '#953',
					Other: '#ccf',
					'Unknown/Corporation': '#fc0'
				};

				for (i = 1980; i <= 2016; i++) {
					chartData.labels.push(i);
				}

				offenceData = filterRows(rows, cols.MAIN_OFFENCE, offence);
				for (ethnicity in ethnicities) {
					ethnicityData = filterRows(offenceData, cols.ETHNICITY, ethnicity);

					chartData.dataSeries.push({
						name: ethnicity,
						color: colours[ethnicity],
						dataPoints: []
					});

					for (year in years) {
						yearData = filterRows(ethnicityData, cols.CALENDAR_YEAR, +year);

						sentencedData = filterRows(yearData, cols.SENTENCE, 'Total sentences');
						imprisonedData = filterRows(yearData, cols.SENTENCE, 'Imprisonment');

						sentencedNum = sentencedData.length ? sentencedData[0][cols.VALUE] : 0;
						imprisonedNum = imprisonedData.length ? imprisonedData[0][cols.VALUE] : 0;

						imprisonedPercent = ((imprisonedNum / sentencedNum) || 0);

						chartData.dataSeries[chartData.dataSeries.length-1].dataPoints.push(imprisonedPercent);
					}
				}

				return chartData;
			};

			var createChart = function (offence) {
				var chartData = getChartData(offence),
					chart = Charter.createLineGraph(
						chartData,
						{
							values: 3,
							min: 0,
							percentage: true
						},
						{
							valuesEvery: 4
						}
					),

					$chart = $(chart),
					chartSelectorHtml,
					thisOffence, isCurrentOffence;

				chartSelectorHtml = '<select class="js-offence-selector" style="max-width: 200px;">';
				for (thisOffence in Analyser.getColSummary(rows, cols.MAIN_OFFENCE)) {
					isCurrentOffence = thisOffence === offence;

					chartSelectorHtml += '<option' + (isCurrentOffence ? ' selected' : '') + '>' + thisOffence + '</option>';
				}
				chartSelectorHtml += '</select>';

				$chart.find('.js-offence-selector-wrap').html(chartSelectorHtml);

				$('.js-chart').html(chart);
			};

			$(document).on('change', '.js-offence-selector', function () {
				createChart($(this).val());
			});

			createChart('Total Offences');
		};

		Analyser.loadFile('assets/data/sentences.csv', config, fileProcessed);
	}
);