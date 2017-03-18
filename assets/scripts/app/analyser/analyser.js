define(
	[],

	function () {
		var Analyser = {
			getColNumber: function (rowName) {
				// Takes in a string like "CE" and converts it to a row number like 82

				var alphabet,
					i, char,
					rowNumber;

				alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
				rowNumber = 0;

				for (i = 0; i < rowName.length; i++) {
					char = rowName.toUpperCase()[i];

					rowNumber += (alphabet.indexOf(char) + 1) * Math.pow(alphabet.length, rowName.length - (i+1));
				}

				rowNumber -= 1; // Adjust for 0-based counting

				return rowNumber;
			},

			collectEnums: function (rows, enumsArr, col1, col2, colN) {
				// Go through all cells in a given set of columns
				// and add all unique entries found to enumsArr

				enumsArr = enumsArr || [];

				var i, row,
					j, col,
					k, value,
					cols = Array.prototype.slice.call(arguments, 2);

				for (i = 0; i < rows.length; i++) {
					row = rows[i];
					for (j = 0; j < cols.length; j++) {
						col = cols[j];

						if (row[col] instanceof Array) {
							for (k = 0; k < row[col].length; k++) {
								if ((row[col][k] !== '') && (enumsArr.indexOf(row[col][k]) === -1)) {
									enumsArr.push(row[col][k]);
								}
							}
						} else {
							if ((row[col] !== '') && (enumsArr.indexOf(row[col]) === -1)) {
								enumsArr.push(row[col]);
							}
						}
					}
				}

				return enumsArr;
			},

			createSubTable: function (rows, colsObject) {
				// Takes in a set of rows and a colsObject formatted like this:
				// {
				// 	ETHNICITY: 3,
				// 	AGE: 6
				// }

				// Outputs an array of objects,
				// each of which has the same indices as colsObject and represents a row
				// The output can be used with console.table

				var colName,
					table,
					i, row, newRow;

				table = [];
				for (i = 0; i < rows.length; i++) {
					row = rows[i];
					newRow = {};

					for (colName in colsObject) {
						// Join arrays so they display in console.table
						if (row[colsObject[colName]] instanceof Array) {
							newRow[colName] = row[colsObject[colName]].join(', ');
						} else {
							newRow[colName] = row[colsObject[colName]];
						}
					}
					table.push(newRow);
				}

				return table;
			},

			matchAlias: function (cell, value, aliasSuperset) {
				// Checks if the value of a cell matches the value passed,
				// optionally taking one or more sets of aliases to match

				// The aliasSuperset is used because the default set of all
				// aliases will be used if no aliasSet is specified

				var aliasSet,
					i,
					j, aliasList;

				if (cell === value) {
					return true;
				}

				// Could be array or object
				for (i in aliasSuperset) {
					aliasSet = aliasSuperset[i];
					for (j = 0; j < aliasSet.length; j++) {
						aliasList = aliasSet[j];

						if (
							(aliasList.indexOf(cell) !== -1) &&
							(aliasList.indexOf(value) !== -1)
						) {
							return true;
						}
					}
				}

				return false;
			},

			getAliasFilter: function (aliases) {
				var filterRows,
					filterRowsAnd,
					filterRowsOr;

				filterRows = function (rows, andToggle, colIndex, values) {
					// Takes in a rows object (imported from csv),
					// a boolean specifying whether it's an "and" or an "or" filter,
					// and any number of pairs (at least one) of
					// the index of the column to consider, and an array of values

					// Returns an array of rows where the cell in the column
					// specified contains a value in the array of values given
					// for all column and value pairs

					var and = andToggle,
						startAt = 2,

						filteredRows = [],
						filters, isMatch,
						i, row,
						j, filter;

					if ((arguments.length < 4) || (((arguments.length-2) % 2) !== 0)) {
						// Assume "andToggle" has not been passed
						and = true;
						startAt = 1;
						if ((arguments.length < 3) || (((arguments.length-1) % 2) !== 0)) {
							console.error('An invalid set of arguments was passed to filterRows');
							return [];
						}
					}

					filters = [];
					for (i = startAt; i < arguments.length-1; i += 2) {
						filters.push({
							colIndex: arguments[i],
							values: arguments[i+1]
						});
					}

					if (!(values instanceof Array)) {
						values = [values];
					}

					for (i = 0; i < rows.length; i++) {
						row = rows[i];

						isMatch = !!and;

						for (j = 0; j < filters.length; j++) {
							filter = filters[j];

							if (and) {
								isMatch = isMatch && Analyser.applyFilter(row, filter.colIndex, filter.values, aliases);
							} else {
								isMatch = isMatch || Analyser.applyFilter(row, filter.colIndex, filter.values, aliases);
							}
						}

						if (isMatch) {
							filteredRows.push(row);
						}
					}

					return filteredRows;
				};

				filterRowsAnd = function (rows, colIndex, values) {
					var args = Array.prototype.slice.apply(arguments);

					args = args.slice(1);
					args.splice(0, 0, true);
					args.splice(0, 0, rows);

					return filterRows.apply(this, args);
				};

				filterRowsOr = function (rows, colIndex, values) {
					var args = Array.prototype.slice.apply(arguments);

					args = args.slice(1);
					args.splice(0, 0, false);
					args.splice(0, 0, rows);

					return filterRows.apply(this, args);
				};

				return {
					filterRows: filterRows,
					filterRowsAnd: filterRowsAnd,
					filterRowsOr: filterRowsOr
				};
			},

			applyFilter: function (row, colIndex, values, aliases) {
				var cell,
					i, cellValues, cellValue,
					k, value;

				// Allow functions to be passed as filter tests
				if (values instanceof Function) {
					return values(row[colIndex]);
				}

				// If one or more values is passed, test it against aliases
				if (!(values instanceof Array)) {
					values = [values];
				}

				cell = row[colIndex];

				if (cell instanceof Array) {
					cellValues = cell;
				} else {
					cellValues = [cell];
				}

				for (i = 0; i < cellValues.length; i++) {
					cellValue = cellValues[i];

					for (k = 0; k < values.length; k++) {
						if (Analyser.matchAlias(values[k], cellValue, aliases)) {
							return true;
						}
					}
				}

				return false;
			}
		};

		return Analyser;
	}
);