require(
	[
		'jquery',
		'templayed',

		'charter/charter',
		'analyser/analyser',
		'stats/stats',

		'util/workingDays',

		'text!templates/options.html'
	],
	function ($, templayed, Charter, Analyser, Stats, workingDays, optionsTemplate) {

		const selectors = {
			agencyFilter: '.js-agency-filter',
			chartArea: '.js-chart-area',
			chartBar: '.js-chart-bar',

			showOutstanding: '.js-show-outstanding',
			showAll: '.js-show-all',

			cards: '.js-cards',

			cardsTemplate: '#oia-cards'
		};

		const classes = {
			loading: 'is-loading',
			selected: 'is-selected'
		};

		const allAgenciesString = 'All agencies';

		const fileProcessed = function (config) {
			buildAgencyList(config);

			$(document).on('change', selectors.agencyFilter, buildFilteredVisualisation(config));

			exploratoryAnalysis(config);
			buildVisualisation(config);
		};

		const buildAgencyList = function (config, selectedAgency) {
			let rows = config.rows;
			let cols = config.cols;
			let filterRows = config.filters.filterRows;

			let agencies = [];
			let agencySummary = Analyser.getColSummary(rows, cols.AGENCY);

			for (let i in agencySummary) {
				agencies.push(i);
			}
			agencies.sort();
			agencies.splice(0, 0, allAgenciesString);

			let optionsHtml = templayed(optionsTemplate)({options: agencies});
			let $agencyFilter = $(selectors.agencyFilter);

			$agencyFilter.html(optionsHtml);
			if (typeof selectedAgency !== 'undefined' && selectedAgency !== '') {
				$agencyFilter.val(selectedAgency);
			}
		};

		const buildFilteredVisualisation = function (config) {
			return function (e) {
				let agencyFilter = $(e.target).val();

				let doPushState = true;
				let historyData = {agencyFilter};
				let historyUrl = '?agency=' + encodeURIComponent(agencyFilter);

				if (agencyFilter === allAgenciesString) {
					agencyFilter = '';
					historyUrl = document.location.pathname;
					if (document.location.search === '') {
						doPushState = false;
					}
				}

				if (historyUrl === document.location.search) {
					doPushState = false;
				}


				if (doPushState) {
					history.pushState(historyData, document.title, historyUrl);
				}

				buildVisualisation(config, agencyFilter);
				$(selectors.agencyFilter).focus();
			};
		};
		window.addEventListener('popstate', e => {
			let state = e.state;
			let $agencyFilter = $(selectors.agencyFilter);

			if (state && state.agencyFilter) {
				$agencyFilter.val(state.agencyFilter);
			} else {
				$agencyFilter.val(allAgenciesString);
			}

			$agencyFilter.trigger('change');
		});

		const exploratoryAnalysis = function (config) {};

		const buildVisualisation = function (config, agencyFilter) {
			let rows = config.rows;
			let cols = config.cols;
			let filterRows = config.filters.filterRows;

			const colours = {
				EARLY: '#275eb8',
				DUE: '#de8336',
				LATE: '#a61f1f',

				UNDEFINED: '#000000'
			};

			// If building a filtered visualisation, only consider rows for the specified agency
			if (typeof agencyFilter !== 'undefined' && agencyFilter !== '') {
				rows = filterRows(rows,
					cols.AGENCY, agencyFilter
				);
			}

			// Allowed working days for a request: 20 + length of extension
			cols.DAYS_ALLOWED = Analyser.addDerivedCol(rows, row => 20 + row[cols.EXTENSION]);

			let getDaysTaken = row => {
				let dateSent = new Date(row[cols.DATE_SENT]);
				let dateResponse = new Date(row[cols.DATE_RESPONSE]);

				if (row[cols.DATE_RESPONSE]) {
					return workingDays.getWorkingDaysBetween(dateSent, dateResponse);
				} else {
					// Represent unanswered requests as having taken "undefined" days
					return undefined;
				}
			};
			cols.DAYS_TAKEN = Analyser.addDerivedCol(rows, getDaysTaken);

			let getDaysRemaining = row => {
				let dateSent = new Date(row[cols.DATE_SENT]);
				let dateResponse = new Date(row[cols.DATE_RESPONSE]);

				if (row[cols.DATE_RESPONSE]) {
					return row[cols.DAYS_ALLOWED] - row[cols.DAYS_TAKEN];
				} else {
					// Represent unanswered requests as having had "undefined" days remaining whe completed
					return undefined;
				}
			};
			cols.DAYS_REMAINING = Analyser.addDerivedCol(rows, getDaysRemaining);

			// Determine how late the latest request was, to determine axis labels
			let maxLateness = 0;
			for (let i = 0; i < rows.length; i++) {
				if (typeof rows[i][cols.DAYS_REMAINING] !== 'undefined') {
					maxLateness = Math.min(maxLateness, rows[i][cols.DAYS_REMAINING]);
				}
			}
			// Round up to multiple of five, to use as last axis label
			if (maxLateness % 5 !== 0) {
				maxLateness += Math.abs(maxLateness % 5) - 5;
			}

			// Create labels for the graph
			let workingDayNums = [];
			for (let i = 20; i >= maxLateness; i--) {
				workingDayNums.push(i);
			}

			// Gather number of responses for each day
			let responses = Analyser.getColAsDataSeries(rows, cols.DAYS_REMAINING, workingDayNums);

			// Split responses into early, due, and late series
			let dueIndex = workingDayNums.indexOf(0);

			let earlyResponseData = responses.concat().fill(0, dueIndex);
			let dueResponseData = responses.concat().fill(0, 0);
			let lateResponseData = responses.concat().fill(0, 0, dueIndex+1);

			// Split further on the due date, as status depends on time of day
			let dueResponses = filterRows(rows,
				cols.DAYS_REMAINING, 0
			);

			for (let i = 0; i < dueResponses.length; i++) {
				let row = dueResponses[i];

				let responseDate = new Date(row[cols.DATE_RESPONSE]);
				let hours = responseDate.getHours();

				if (hours < 16) {
					// Before 4pm
					earlyResponseData[dueIndex]++;
				} else if (hours < 17) {
					// Before 5pm
					dueResponseData[dueIndex]++;
				} else {
					lateResponseData[dueIndex]++;
				}
			}

			// Find maximum value for vertical axis
			let maxValue = 1;
			for (let i = 0; i < responses.length; i++) {
				let row = responses[i];
				maxValue = Math.max(maxValue, row);
			}
			// Round up to nearest even number
			maxValue = Math.ceil(maxValue/2)*2;

			// Show all numbers if 5 or under, otherwise show only even numbers
			let valuesToShow = maxValue > 5 ? maxValue/2 : maxValue;

			const barChartData = {
				title: 'Working days remaining when OIA responses sent by <select class="input js-agency-filter"></select>',
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

			const barAxisConfig = {
				min: 0,
				max: maxValue,
				values: valuesToShow
			};

			const labelAxisConfig = {
				valuesEvery: 5
			};

			let $barChart = Charter.createBarChart(barChartData, barAxisConfig, labelAxisConfig);
			$(selectors.chartArea).html('')
				.append($barChart)
				.removeClass(classes.loading);

			buildAgencyList(config, agencyFilter);


			// Create cards for due date
			let createCards = function (daysRemaining) {
				let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

				let cardRows;
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

				let cardData = Analyser.createSubTable(cardRows, cols);

				// Sort by date (ascending)
				cardData.sort((a, b) => {
					let dateA = new Date(a.DATE_RESPONSE);
					let dateB = new Date(b.DATE_RESPONSE);

					dateA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
					dateB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());

					return dateA - dateB;
				});


				let agencyFilter = $(selectors.agencyFilter).val();
				if (agencyFilter === allAgenciesString) {
					agencyFilter = agencyFilter.toLowerCase();
				}

				// Create calculated card data
				for (let i = 0; i < cardData.length; i++) {
					let row = cardData[i];

					let requestDate = new Date(row.DATE_SENT);
					let requestHours = requestDate.getHours();
					let requestMinutes = requestDate.getMinutes();
					let requestAmPm = 'am';

					let responseDate = new Date(row.DATE_RESPONSE);
					let responseHours = responseDate.getHours();
					let responseMinutes = responseDate.getMinutes();
					let responseAmPm = 'am';

					// Create due date data
					let dueDate = workingDays.addWorkingDays(requestDate, 20);
					if (row.EXTENSION) {
						dueDate = workingDays.addWorkingDays(dueDate, row.EXTENSION);
					}

					let dueDateString = dueDate.getDate() + '&nbsp;' + monthNames[dueDate.getMonth()] + '&nbsp;' + dueDate.getFullYear();

					let daysRemainingColour = daysRemaining;
					if (daysRemainingColour === null) {
						daysRemainingColour = row.DAYS_REMAINING;
					}

					// Calculate colour based on due date
					let colour;
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
					let requestTime = requestHours + ':' + requestMinutes + '&nbsp;' + requestAmPm;
					let requestDateString = requestDate.getDate() + '&nbsp;' + monthNames[requestDate.getMonth()] + '&nbsp;' + requestDate.getFullYear();

					let responseTime = responseHours + ':' + responseMinutes + '&nbsp;' + responseAmPm;
					let responseDateString = responseDate.getDate() + '&nbsp;' + monthNames[responseDate.getMonth()] + '&nbsp;' + responseDate.getFullYear();

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


				let title;
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

				let templateData = {
					title: title,
					requests: cardData
				};
				let cardsHtml = templayed($(selectors.cardsTemplate).html())(templateData);

				$(selectors.clickInstructions).hide();
				$(selectors.cards).html(cardsHtml);
			};

			let bindChartEvents = function () {
				$(selectors.chartArea).on('click', selectors.chartBar, function (e) {
					let $chart = $(selectors.chartArea);
					let $bars = $chart.find(selectors.chartBar);
					let $this = $(this);

					$bars.removeClass(classes.selected);
					$this.addClass(classes.selected);

					createCards($this.data('label'));
				});

				$(selectors.showOutstanding).on('click', function () {
					$(selectors.chartBar).removeClass(classes.selected);

					createCards();
				});

				$(selectors.showAll).on('click', function () {
					$(selectors.chartBar).removeClass(classes.selected);

					createCards(null);
				});
			};
			bindChartEvents();

			$(selectors.showAll).trigger('click');

			let selectAgencyFromQueryString = function () {
				let query = document.location.search;
				let $agency = $(selectors.agencyFilter);

				query = query.match(/(\?|&)agency=(.*?)(&|$)/);

				if (query) {
					let agency = decodeURIComponent(query[2]);

					if (agency) {
						$agency.val(agency)
						$agency.trigger('change');
					}
				}
			};
			if (typeof agencyFilter === 'undefined') {
				selectAgencyFromQueryString();
			}
		};


		const config = {
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
		Analyser.loadFile('assets/data/fyi-mark-hanna.csv', config, fileProcessed);
	}
);