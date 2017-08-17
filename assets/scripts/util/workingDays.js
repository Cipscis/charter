define(
	[],

	function () {
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
					if (year === 2014) {
						if (month === 1 && dateNum === 6) {
							return false; // Waitangi Day
						}
						if (month === 3 && dateNum === 18) {
							return false; // Good Friday
						}
						if (month === 3 && dateNum === 21) {
							return false; // Easter Monday
						}
						if (month === 3 && dateNum === 25) {
							return false; // ANZAC Day
						}
						if (month === 5 && dateNum === 2) {
							return false; // Queen's Birthday
						}
						if (month === 9 && dateNum === 27) {
							return false; // Labour Day
						}
					}
					if (year === 2015) {
						if (month === 1 && dateNum === 6) {
							return false; // Waitangi Day
						}
						if (month === 3 && dateNum === 3) {
							return false; // Good Friday
						}
						if (month === 3 && dateNum === 6) {
							return false; // Easter Monday
						}
						if (month === 3 && dateNum === 27) {
							return false; // ANZAC Day
						}
						if (month === 5 && dateNum === 1) {
							return false; // Queen's Birthday
						}
						if (month === 9 && dateNum === 26) {
							return false; // Labour Day
						}
					}
					if (year === 2016) {
						if (month === 1 && dateNum === 8) {
							return false; // Waitangi Day
						}
						if (month === 2 && dateNum === 25) {
							return false; // Good Friday
						}
						if (month === 2 && dateNum === 28) {
							return false; // Easter Monday
						}
						if (month === 3 && dateNum === 25) {
							return false; // ANZAC Day
						}
						if (month === 5 && dateNum === 6) {
							return false; // Queen's Birthday
						}
						if (month === 9 && dateNum === 24) {
							return false; // Labour Day
						}
					}
					if (year === 2017) {
						if (month === 1 && dateNum === 6) {
							return false; // Waitangi Day
						}
						if (month === 3 && dateNum === 14) {
							return false; // Good Friday
						}
						if (month === 3 && dateNum === 17) {
							return false; // Easter Monday
						}
						if (month === 3 && dateNum === 25) {
							return false; // ANZAC Day
						}
						if (month === 5 && dateNum === 5) {
							return false; // Queen's Birthday
						}
						if (month === 9 && dateNum === 23) {
							return false; // Labour Day
						}
					}

					return true;
				}
			}
		};

		return workingDays;
	}
);