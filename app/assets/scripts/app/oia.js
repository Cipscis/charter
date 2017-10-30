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
				var title;

				var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

				var cardRows;
				if (typeof daysRemaining !== 'undefined') {
					cardRows = filterRows(rows, 'daysRemaining', parseInt(daysRemaining, 10));
				} else {
					// No days remaining specified, so instead show outstanding requests
					cardRows = filterRows(rows, cols.DATE_RESPONSE, '');
				}

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
				for (var i = 0; i < cardData.length; i++) {
					var row = cardData[i];

					var requestDate = new Date(row.DATE_SENT);
					var requestHours = requestDate.getHours();
					var requestMinutes = requestDate.getMinutes();
					var requestAmPm = 'am';

					var responseDate = new Date(row.DATE_RESPONSE);
					var responseHours = responseDate.getHours();
					var responseMinutes = responseDate.getMinutes();
					var responseAmPm = 'am';

					var colour;

					// Create due date data
					var dueDate = workingDays.addWorkingDays(requestDate, 20);
					if (row.EXTENSION) {
						dueDate = workingDays.addWorkingDays(dueDate, row.EXTENSION);
					}

					var dueDateString = dueDate.getDate() + '&nbsp;' + monthNames[dueDate.getMonth()] + '&nbsp;' + dueDate.getFullYear();

					// Caldulate colour based on due date
					if (daysRemaining > 0) {
						colour = colours.EARLY;
						row.hasTimeLeft = [{remainingDays: daysRemaining}];
					} else if (daysRemaining === 0) {
						row.hasTimeLeft = [{remainingDays: daysRemaining}];
						if (responseHours >= 17) {
							colour = colours.LATE;
						} else if (responseHours >= 16) {
							colour = colours.DUE;
						} else {
							colour = colours.EARLY;
						}
					} else if (daysRemaining < 0) {
						colour = colours.LATE;
						row.isOverdue = [{overdueDays: -daysRemaining}];
					} else {
						// daysRemaining is undefined, meaning no response has been received
						if (dueDate < (new Date())) {
							colour = colours.LATE;
							row.isOverdue = [{overdueDays: workingDays.getWorkingDaysBetween(dueDate, (new Date()))}];
						} else {
							colour = undefined;
							row.hasTimeLeft = [{remainingDays: workingDays.getWorkingDaysBetween((new Date()), dueDate)}];
						}
					}

					// Convert to AM / PM
					if (requestHours === 12) {
						requestAmPm = 'pm';
					} else if (requestHours > 12) {
						requestAmPm = 'pm';
						requestHours = requestHours - 12;
					} else if (requestHours === 0) {
						requestHours = 12;
					}

					if (responseHours === 12) {
						responseAmPm = 'pm';
					} else if (responseHours > 12) {
						responseAmPm = 'pm';
						responseHours = responseHours - 12;
					} else if (responseHours === 0) {
						responseHours = 12;
					}

					// Add leading 0
					if (requestHours < 10) {
						requestHours = '0' + requestHours;
					}
					if (requestMinutes < 10) {
						requestMinutes = '0' + requestMinutes;
					}

					if (responseHours < 10) {
						responseHours = '0' + responseHours;
					}
					if (responseMinutes < 10) {
						responseMinutes = '0' + responseMinutes;
					}

					// Create display strings
					var requestTime = requestHours + ':' + requestMinutes + '&nbsp;' + requestAmPm;
					var requestDateString = requestDate.getDate() + '&nbsp;' + monthNames[requestDate.getMonth()] + '&nbsp;' + requestDate.getFullYear();

					var responseTime = responseHours + ':' + responseMinutes + '&nbsp;' + responseAmPm;
					var responseDateString = responseDate.getDate() + '&nbsp;' + monthNames[responseDate.getMonth()] + '&nbsp;' + responseDate.getFullYear();

					// Store data
					row.requestTime = requestTime;
					row.requestDate = requestDateString;

					if (row.DATE_RESPONSE) {
						if (daysRemaining >= 0) {
							title = 'Responses received with ' + daysRemaining + ' working day' + (daysRemaining !== 1 ? 's' : '') + ' remaining:';
						} else {
							title = 'Responses received ' + (-daysRemaining) + ' working day' + (daysRemaining !== -1 ? 's' : '') + ' overdue:';
						}

						row.hasResponse = [{
							responseTime: responseTime,
							responseDate: responseDateString
						}];
					} else {
						title = 'Requests that have not yet received a response:';
					}

					row.dueDate = dueDateString;
					if (row.EXTENSION) {
						row.wasExtended = [{
							days: row.EXTENSION
						}];
					}

					row.colour = colour;
				}

				var $cards = templayed($('#oia-cards').html())({
					title: title,
					requests: cardData
				});
				$('.js-click-instructions').html($cards);
			};

			$('.js-chart-area').on('click', '.js-chart-bar', function (e) {
				var $chart = $('.js-chart-area');
				var $bars = $chart.find('.js-chart-bar');
				var $this = $(this);

				$bars.removeClass('is-selected');
				$this.addClass('is-selected');

				createCards($this.data('label'));
			});

			$('.js-show-outstanding').on('click', function () {
				$('.js-chart-bar').removeClass('is-selected');

				createCards();
			});
		};

		var dateCalc = {
			init: function () {
				dateCalc._selectCurrentDay();
				dateCalc._getMonthDays();
				dateCalc._calculateDueDate();

				dateCalc._initEvents();
			},

			_initEvents: function () {
				$(document)
					.on('change', '.js-sent-month', dateCalc._getMonthDays)
					.on('change', '.js-sent-day, .js-sent-month, .js-sent-year, .js-extension-length', dateCalc._calculateDueDate);
			},

			_selectCurrentDay: function () {
				var today = new Date(),
					day = today.getDate(),
					month = today.getMonth() + 1,
					year = today.getFullYear();

				$('.js-sent-day').val(day);
				$('.js-sent-month').val(month);
				$('.js-sent-year').val(year);
			},

			_getMonthDays: function () {
				var month = $('.js-sent-month').val(),
					year = $('.js-sent-year').val(),

					days = [],
					date, i,

					$days = $('.js-sent-day option');

				for (i = 1; i < 32; i++) {
					date = new Date(year + ' ' + month + ' ' + i);
					if (date.getDate() !== i) {
						break;
					}
					days.push(i);
				}

				$days.show().removeAttr('disabled');
				$days.filter(function () {
					var inDays = days.indexOf(+$(this).val()) === -1;
					return inDays;
				}).hide().attr('disabled', 'disabled');

				// if ($days.filter(':selected').is('[disabled]')) {
				// 	$('.js-sent-day').val(1);
				// }
			},

			_calculateDueDate: function () {
				var $sentDay = $('.js-sent-day'),
					$sentMonth = $('.js-sent-month'),
					$sentYear = $('.js-sent-year'),
					$extension = $('.js-extension-length'),
					$dueDate = $('.js-due-date'),

					sent = new Date($sentYear.val() + '/' + $sentMonth.val() + '/' + $sentDay.val()),
					extension = parseInt($extension.val(), 10) || 0,

					dueDay,
					dueMonth,
					dueYear,
					dueDate;

				dueDate = workingDays.addWorkingDays(sent, 20 + extension);

				dueDay = dueDate.getDate();
				dueMonth = dueDate.getMonth() + 1;
				dueYear = dueDate.getFullYear();

				if (dueDay < 10) {
					dueDay = '0' + dueDay;
				}
				if (dueMonth < 10) {
					dueMonth = '0' + dueMonth;
				}

				dueDate = dueYear + '/' + dueMonth + '/' + dueDay;

				$dueDate.text(dueDate);
			}
		};

		dateCalc.init();

		Analyser.loadFile('assets/data/fyi-mark-hanna.csv', config, fileProcessed);
	}
);