require(
	[
		'jquery',
		'd3',
		'templayed',

		'charter/charter',
		'analyser/analyser',
		'stats/stats',

		'util/workingDays',

		'text!templates/options.html'
	],
	function ($, d3, templayed, Charter, Analyser, Stats, workingDays, optionsTemplate) {

		var allAgenciesString = 'All agencies';

		var config = {
			headerRows: 1,
			cols: Analyser.getColNumbers({
				URL: 'A',
				AGENCY: 'B',
				TITLE: 'C',

				DATE_SENT: 'D',
				DATE_EXTENSION: 'E',
				DATE_DUE: 'F',
				DATE_RESPONSE: 'G',

				EXTENSION: 'H'
			})
		};

		var fileProcessed = function (config) {
			buildAgencyList(config);

			$(document).on('change', '.js-agency-filter', buildFilteredVisualisation(config));

			exploratoryAnalysis(config);
			buildVisualisation(config);
		};

		var buildAgencyList = function (config, selectedAgency) {
			var rows = config.rows,
				cols = config.cols,
				filterRows = config.filters.filterRows;

			var agencies = [];
			var agencySummary = Analyser.getColSummary(rows, cols.AGENCY);

			for (let i in agencySummary) {
				agencies.push(i);
			}
			agencies.sort();
			agencies.splice(0, 0, allAgenciesString);

			$('.js-agency-filter').html(templayed(optionsTemplate)({options: agencies}));
			if (selectedAgency) {
				$('.js-agency-filter').val(selectedAgency);
			}
		};

		var buildFilteredVisualisation = function (config) {
			return function (e) {
				var agencyFilter = $(e.target).val();
				if (agencyFilter === allAgenciesString) {
					agencyFilter = undefined;
				}

				buildVisualisation(config, agencyFilter);
				$('.js-agency-filter').focus();

				// TODO: Implement history to add querystring and support popstate
			};
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

		var buildVisualisation = function (config, agencyFilter) {
			var rows = config.rows,
				cols = config.cols,
				filterRows = config.filters.filterRows;

			var row, i, j;

			var colours = {
				EARLY: '#275eb8',
				DUE: '#de8336',
				LATE: '#a61f1f',

				UNDEFINED: '#000000'
			};

			if (agencyFilter) {
				rows = filterRows(rows,
					cols.AGENCY, agencyFilter
				);
			}

			var getDaysAllowed = function (row) {
				var dateSent = new Date(row[cols.DATE_SENT]);

				return 20 + row[cols.EXTENSION];
			};
			cols.DAYS_ALLOWED = Analyser.addDerivedCol(rows, getDaysAllowed);

			var getDaysTaken = function (row) {
				var dateSent = new Date(row[cols.DATE_SENT]);
				var dateResponse = new Date(row[cols.DATE_RESPONSE]);

				if (row[cols.DATE_RESPONSE]) {
					return workingDays.getWorkingDaysBetween(dateSent, dateResponse);
				} else {
					return undefined;
				}
			};
			cols.DAYS_TAKEN = Analyser.addDerivedCol(rows, getDaysTaken);

			var getDaysRemaining = function (row) {
				var dateSent = new Date(row[cols.DATE_SENT]);
				var dateResponse = new Date(row[cols.DATE_RESPONSE]);

				if (row[cols.DATE_RESPONSE]) {
					return row[cols.DAYS_ALLOWED] - row[cols.DAYS_TAKEN];
				} else {
					return undefined;
				}
			};
			cols.DAYS_REMAINING = Analyser.addDerivedCol(rows, getDaysRemaining);

			var maxLateness = 0;
			for (i = 0; i < rows.length; i++) {
				if (typeof rows[i][cols.DAYS_REMAINING] !== 'undefined') {
					maxLateness = Math.min(maxLateness, rows[i][cols.DAYS_REMAINING]);
				}
			}
			// Round up to multiple of five, to use as last axis label
			if (maxLateness % 5 !== 0) {
				maxLateness -= (5 - Math.abs(maxLateness % 5));
			}

			// To use as labels for the graph
			var workingDayNums = [];
			for (i = 20; i >= maxLateness; i--) {
				workingDayNums.push(i);
			}

			// Gather number of responses for each day
			var responses = Analyser.getColAsDataSeries(rows, cols.DAYS_REMAINING, workingDayNums);

			// Split responses into early, due, and late series
			var dueIndex = workingDayNums.indexOf(0);

			var earlyResponseData = responses.concat().fill(0, dueIndex);
			var dueResponseData = responses.concat().fill(0, 0);
			var lateResponseData = responses.concat().fill(0, 0, dueIndex+1);

			// Split further on the due date, as status depends on time of day
			var dueResponses = filterRows(rows,
				cols.DAYS_REMAINING, 0
			);

			for (i = 0; i < dueResponses.length; i++) {
				row = dueResponses[i];

				var responseDate = new Date(row[cols.DATE_RESPONSE]);
				var hours = responseDate.getHours();

				if (hours < 16) {
					earlyResponseData[dueIndex]++;
				} else if (hours < 17) {
					dueResponseData[dueIndex]++;
				} else {
					lateResponseData[dueIndex]++;
				}
			}

			// Find maximum value for axis
			var maxValue = 1;
			for (i = 0; i < responses.length; i++) {
				row = responses[i];
				maxValue = Math.max(maxValue, row);
			}
			maxValue = Math.ceil(maxValue/2)*2; // Round up to nearest even number
			var valuesToShow = maxValue > 5 ? maxValue/2 : maxValue; // All numbers if 5 or under, otherwise only even numbers

			var barChartData = {
				title: 'Working days remaining when OIA responses sent by <select class="js-agency-filter"></select>',
				labels: workingDayNums,
				dataSeries: [
					{
						name: 'After 5pm on due date',
						color: colours.LATE,
						dataPoints: lateResponseData
					},
					{
						name: '4pm ‑ 5pm on due date',
						color: colours.DUE,
						dataPoints: dueResponseData
					},
					{
						name: 'Before 4pm on due date',
						color: colours.EARLY,
						dataPoints: earlyResponseData
					}
				],
				stacked: true,
				showLegend: true
			};

			var barAxisConfig = {
				min: 0,
				max: maxValue,
				values: valuesToShow
			};

			var $barChart = Charter.createBarChart(barChartData, barAxisConfig);
			$('.js-chart-area').html('')
				.append($barChart)
				.removeClass('is-loading');

			buildAgencyList(config, agencyFilter);


			// Create cards for due date
			var createCards = function (daysRemaining) {
				var title;

				var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

				var cardRows;

				if (daysRemaining === null) {
					// Show all requests
					cardRows = rows;
				} else if (typeof daysRemaining !== 'undefined') {
					// A number of days has been specified
					cardRows = filterRows(rows, cols.DAYS_REMAINING, parseInt(daysRemaining, 10));
				} else {
					// No days remaining specified, so instead show outstanding requests
					cardRows = filterRows(rows, cols.DATE_RESPONSE, '');
				}

				var cardData = Analyser.createSubTable(cardRows, cols);

				// Sort by date (ascending)
				cardData.sort(function (a, b) {
					var dateA = new Date(a.DATE_RESPONSE),
						dateB = new Date(b.DATE_RESPONSE);

					dateA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
					dateB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());

					return dateA - dateB;
				});


				var agencyFilter = $('.js-agency-filter').val();
				if (agencyFilter === allAgenciesString) {
					agencyFilter = agencyFilter.toLowerCase();
				}

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

					var daysRemainingColour = daysRemaining;
					if (daysRemainingColour === null) {
						daysRemainingColour = row.DAYS_REMAINING;
					}

					// Calculate colour based on due date
					if (daysRemainingColour > 0) {
						colour = colours.EARLY;
						row.hasTimeLeft = [{remainingDays: daysRemainingColour}];
					} else if (daysRemainingColour === 0) {
						row.hasTimeLeft = [{remainingDays: daysRemainingColour}];
						if (responseHours >= 17) {
							colour = colours.LATE;
						} else if (responseHours >= 16) {
							colour = colours.DUE;
						} else {
							colour = colours.EARLY;
						}
					} else if (daysRemainingColour < 0) {
						colour = colours.LATE;
						row.isOverdue = [{overdueDays: -daysRemainingColour}];
					} else {
						// daysRemainingColour is undefined, meaning no response has been received
						if (dueDate < (new Date())) {
							colour = colours.LATE;
							row.isOverdue = [{overdueDays: workingDays.getWorkingDaysBetween(dueDate, (new Date()))}];
						} else {
							colour = colours.UNDEFINED;
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
						row.hasResponse = [{
							responseTime: responseTime,
							responseDate: responseDateString
						}];
					}

					row.dueDate = dueDateString;
					if (row.EXTENSION) {
						row.wasExtended = [{
							days: row.EXTENSION
						}];
					}

					row.colour = colour;
				}


				if (daysRemaining === null) {
					title = 'All requests to ' + agencyFilter + ':';
				} else if (cardData.length > 0 && cardData[0].DATE_RESPONSE) {
					if (daysRemaining >= 0) {
						title = 'Responses received from ' + agencyFilter + ' with ' + daysRemaining + ' working day' + (daysRemaining !== 1 ? 's' : '') + ' remaining:';
					} else {
						title = 'Responses received from ' + agencyFilter + ' ' + (-daysRemaining) + ' working day' + (daysRemaining !== -1 ? 's' : '') + ' overdue:';
					}
				} else {
					title = 'Requests to ' + agencyFilter + ' that have not yet received a response:';
				}

				if (!title) {
					title = 'No matching requests to ' + agencyFilter + '.';
				}

				var $cards = templayed($('#oia-cards').html())({
					title: title,
					requests: cardData
				});
				$('.js-click-instructions').hide();
				$('.js-cards').show().html($cards);
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

			$('.js-show-all').on('click', function () {
				$('.js-chart-bar').removeClass('is-selected');

				createCards(null);
			});

			$('.js-click-instructions').show();
			$('.js-cards').hide();


			var selectAgencyFromQueryString = function () {
				var query = document.location.search;
				var agency;
				var $agency = $('.js-agency-filter');

				query = query.match(/(\?|&)agency=(.*?)(&|$)/);

				if (query) {
					agency = decodeURIComponent(query[2]);

					if (agency) {
						$agency.val(agency)
						$agency.trigger('change');
						$('.js-show-all').trigger('click');
					}
				}
			};
			if (!agencyFilter) {
				selectAgencyFromQueryString();
			}
		};

		Analyser.loadFile('assets/data/fyi-mark-hanna.csv', config, fileProcessed);
	}
);