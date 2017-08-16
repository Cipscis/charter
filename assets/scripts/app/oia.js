require(
	[
		'jquery',
		'd3',
		'templayed',

		'charter/charter',
		'analyser/analyser',
		'stats/stats',

		'util/workingDays'
	],
	function ($, d3, templayed, Charter, Analyser, Stats, workingDays) {

		window.wd = workingDays;

		var config = {
			headerRows: 1,
			cols: {
				URL: Analyser.getColNumber('A'),
				AGENCY: Analyser.getColNumber('B'),
				TITLE: Analyser.getColNumber('C'),

				DATE_SENT: Analyser.getColNumber('D'),
				DATE_EXTENSION: Analyser.getColNumber('E'),
				DATE_DUE: Analyser.getColNumber('F'),
				DATE_RESPONSE: Analyser.getColNumber('G'),

				EXTENSION: Analyser.getColNumber('H')
			}
		};

		var fileProcessed = function (config) {
			exploratoryAnalysis(config);
			buildVisualisation(config);
		};

		Analyser.loadFile('assets/data/fyi-mark-hanna.csv', config, fileProcessed);

		var exploratoryAnalysis = function (config) {
			var rows = config.rows,
				cols = config.cols;

			var table = Analyser.createSubTable(rows, cols);

			// for (var i = 0; i < rows.length; i++) {
			// 	var row = rows[i];

			// 	var dateSent = new Date(row[cols.DATE_SENT]);
			// 	var dateResponse = new Date(row[cols.DATE_RESPONSE]);

			// 	if (dateResponse) {
			// 		var daysTaken = workingDays.getWorkingDaysBetween(dateSent, dateResponse);
			// 		var daysAllowed = 20 + row[cols.EXTENSION];
			// 		console.log(daysTaken - daysAllowed);
			// 	}
			// }

			// console.table(table);

			// console.log(Analyser.getColSummary(rows, cols.WORKING_DAYS_REMAINING));
		};

		var buildVisualisation = function (config) {

			var rows = config.rows,
				cols = config.cols,
				filterRows = config.filters.filterRows;

			var row, i, j;

			var colours = {
				EARLY: '#275eb8',
				DUE: '#cb4f1e',
				LATE: '#a61f1f'
			};

			for (i = 0; i < rows.length; i++) {
				row = rows[i];

				var dateSent = new Date(row[cols.DATE_SENT]);
				var dateResponse = new Date(row[cols.DATE_RESPONSE]);

				row.daysAllowed = 20 + row[cols.EXTENSION];
				if (row[cols.DATE_RESPONSE]) {
					row.daysTaken = workingDays.getWorkingDaysBetween(dateSent, dateResponse);
					row.daysRemaining = row.daysAllowed - row.daysTaken;
				}
			}

			// Create object storing the different states of requests returned on the due date
			var dueRequests = filterRows(rows, 'daysRemaining', 0);
			var numDueRequests = {
				early: 0,
				due: 0,
				late: 0,
				total: dueRequests.length
			};
			for (i = 0; i < dueRequests.length; i++) {
				row = dueRequests[i];

				var responseDate = new Date(row[cols.DATE_RESPONSE]),
					responseHour = responseDate.getHours();

				if (responseHour < 16) {
					numDueRequests.early++;
				} else if (responseHour < 17) {
					numDueRequests.due++;
				} else {
					numDueRequests.late++;
				}
			}

			var dueGradient = 'linear-gradient(to top, ' +
				colours.EARLY + ' 0%, ' +
				colours.EARLY + ' ' + (numDueRequests.early / numDueRequests.total * 100) + '%, ' +

				colours.DUE + ' ' + (numDueRequests.early / numDueRequests.total * 100) + '%, ' +
				colours.DUE + ' ' + ((numDueRequests.early + numDueRequests.due) / numDueRequests.total * 100) + '%, ' +

				colours.LATE + ' ' + ((numDueRequests.early + numDueRequests.due) / numDueRequests.total * 100) + '%, ' +
				colours.LATE + ' 100%)';


			// To use as labels for the graph
			var workingDayNums = [];
			for (i = 20; i >= -10; i--) {
				workingDayNums.push(i);
			}

			var dataPoints = [];
			var dataPoint;
			for (i = 0; i < workingDayNums.length; i++) {
				dataPoint = {
					value: 0
				};

				for (j = 0; j < rows.length; j++) {
					row = rows[j];

					if (row.daysRemaining === workingDayNums[i]) {
						dataPoint.value++;
					}
				}

				if (workingDayNums[i] > 0) {
					dataPoint.color = colours.EARLY;
				} else if (workingDayNums[i] === 0) {
					dataPoint.color = dueGradient;
				} else if (workingDayNums[i] < 0) {
					dataPoint.color = colours.LATE;
				}

				dataPoints.push(dataPoint);
			}

			var barChartData = {
				title: 'Working days remaining when OIA responses sent',
				labels: workingDayNums,
				dataSeries: [
					{
						name: 'Before 4pm on due date',
						color: colours.EARLY,
						dataPoints: dataPoints
					},

					// These dataSeries are just for the legend
					{
						name: '4pm - 5pm on due date',
						color: colours.DUE,
						dataPoints: []
					},
					{
						name: 'After 5pm on due date',
						color: colours.LATE,
						dataPoints: []
					}
				],
				showLegend: true,
				legendLeft: true
			};

			var barAxisConfig = {
				min: 0,
				max: 10,
				values: 5
			};

			var $barChart = Charter.createBarChart(barChartData, barAxisConfig);
			$('.js-chart-area').html('')
				.append($barChart)
				.removeClass('is-loading');


			// Create cards for due date
			var createCards = function (daysRemaining) {
				// Ensure it's a number
				daysRemaining = +daysRemaining;

				var cardRows = filterRows(rows, 'daysRemaining', daysRemaining);
				var cardData = Analyser.createSubTable(cardRows, cols);

				// Sort by time of day (ascending)
				cardData.sort(function (a, b) {
					var dateA = new Date(a.DATE_RESPONSE),
						timeA = dateA.getHours() + (dateA.getMinutes() / 60),

						dateB = new Date(b.DATE_RESPONSE),
						timeB = dateB.getHours() + (dateB.getMinutes() / 60);

					return timeA - timeB;
				});


				// Create calculated card data
				for (i = 0; i < cardData.length; i++) {
					row = cardData[i];

					var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

					var date = new Date(row.DATE_RESPONSE);
					var hours = date.getHours();
					var minutes = date.getMinutes();
					var ampm = 'am';

					var colour;

					if (daysRemaining > 0) {
						colour = colours.EARLY;
					} else if (daysRemaining === 0) {
						if (hours >= 17) {
							colour = colours.LATE;
						} else if (hours >= 16) {
							colour = colours.DUE;
						} else {
							colour = colours.EARLY;
						}
					} else if (daysRemaining < 0) {
						colour = colours.LATE;
					}

					if (hours === 12) {
						ampm = 'pm';
					} else if (hours > 12) {
						ampm = 'pm';
						hours = hours - 12;
					}

					if (hours < 10) {
						hours = '0' + hours;
					}
					if (minutes < 10) {
						minutes = '0' + minutes;
					}

					var time = hours + ':' + minutes + ' ' + ampm;

					var dateString = date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();

					row.time = time;
					row.date = dateString;
					row.colour = colour;
				}

				var $cards = templayed($('#oia-cards').html())({requests: cardData});
				$('.js-due-date').html($cards);
			};

			$('.js-chart-area').on('click', '.js-chart-bar', function (e) {
				var $chart = $('.js-chart-area');
				var $bars = $chart.find('.js-chart-bar');
				var $this = $(this);

				$bars.removeClass('is-selected');
				$this.addClass('is-selected');

				createCards($this.data('label'));
			});
		};
	}
);