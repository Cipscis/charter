var workingDays = {
	getWorkingDaysBetween: function (startDate, endDate) {
		// WARNING: While loop will continue infinitely if endDate is invalid

		var stepDate,
			days = 0;

		startDate = new Date(startDate);
		endDate = new Date(endDate);

		if (startDate > endDate) {
			stepDate = startDate;
			startDate = endDate;
			endDate = stepDate;
		}

		startDate.setHours(0);
		startDate.setMinutes(0);
		startDate.setSeconds(0);

		endDate.setHours(0);
		endDate.setMinutes(0);
		endDate.setSeconds(0);

		stepDate = startDate;
		while (!workingDays.matchDate(stepDate, endDate)) {
			stepDate.setDate(stepDate.getDate() + 1);

			if (workingDays.isWorkingDay(stepDate)) {
				days += 1;
			}
		}

		return days;
	},

	addWorkingDays: function (fromDate, numWorkingDays) {
		if (!(fromDate instanceof Date) || isNaN(fromDate.getTime())) {
			console.error(fromDate + ' is not a date');
			return new Date();
		}

		var toDate = new Date(fromDate);

		toDate.setDate(toDate.getDate() + numWorkingDays);

		while (workingDays.getWorkingDaysBetween(fromDate, toDate) < numWorkingDays) {
			toDate.setDate(toDate.getDate() + 1);
		}

		return toDate;
	},

	matchDate: function (date1, date2) {
		return (date1.getFullYear() === date2.getFullYear()) &&
			(date1.getMonth() === date2.getMonth()) &&
			(date1.getDate() === date2.getDate());
	},

	isWorkingDay: function (date) {
		// Some non-working days are hard-coded. Supported years 2014-2017

		var weekDay = date.getDay(),
			year,
			month,
			dateNum;

		/*OIA Definition of "working day":
		working day means any day of the week other than—
			(a)
				Saturday, Sunday, Good Friday, Easter Monday, Anzac Day, Labour Day, the Sovereign’s birthday, and Waitangi Day; and
			(ab)
				if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and
			(b)
				a day in the period commencing with 25 December in any year and ending with 15 January in the following year.*/

		var holidays = {
			2014: {
				1: [6], // Waitangi Day
				3: [18, 21, 25], // Good Friday, Easter Monday, ANZAC Day
				5: [2], // Queen's Birthday
				9: [27] // Labour Day
			},
			2015: {
				1: [6],
				3: [3, 6, 27],
				5: [1],
				9: [26]
			},
			2016: {
				1: [8],
				2: [25, 28],
				3: [25],
				5: [6],
				9: [24]
			},
			2017: {
				1: [6],
				3: [14, 17, 25],
				5: [5],
				9: [23]
			},
			2018: {
				1: [6],
				2: [30],
				3: [2, 25],
				5: [4],
				9: [22]
			},
			2019: {
				1: [6],
				3: [19, 22, 25],
				5: [3],
				9: [28]
			},
			2020: {
				1: [6],
				3: [10, 13, 27],
				5: [1],
				9: [26]
			},
			2021: {
				1: [8],
				3: [2, 5, 26],
				5: [7],
				9: [25]
			},
			2022: {
				1: [7],
				3: [15, 18, 25],
				5: [6],
				9: [24]
			},
			2023: {
				1: [6],
				3: [7, 10, 25],
				5: [5],
				9: [23]
			},
			2024: {
				1: [6],
				2: [29],
				3: [1, 25],
				5: [3],
				9: [28]
			},
			2025: {
				1: [6],
				3: [18, 21, 25],
				5: [2],
				9: [27]
			},
			2026: {
				1: [6],
				3: [3, 6, 27],
				5: [1],
				9: [26]
			},
			2027: {
				1: [8],
				2: [26, 29],
				3: [26],
				5: [7],
				9: [25]
			},
			2028: {
				1: [7],
				3: [14, 17, 25],
				5: [5],
				9: [23]
			},
			2029: {
				1: [6],
				2: [30],
				3: [2, 25],
				5: [4],
				9: [22]
			},
			2030: {
				1: [6],
				3: [19, 22, 25],
				5: [3],
				9: [28]
			}
		};

		if (weekDay === 6 || weekDay === 0) {
			// Saturday, Sunday
			return false;
		} else {
			// Weekday

			month = date.getMonth();
			dateNum = date.getDate();

			// 25 December - 15 January
			if ((month === 0 && dateNum <= 15) || (month === 11 && dateNum >= 25)) {
				return false;
			}

			// Other non-working days hard-coded per year
			year = date.getFullYear();

			if (holidays[year][month] && holidays[year][month].indexOf(dateNum) > -1) {
				return false;
			}

			return true;
		}
	}
};

export default workingDays;
