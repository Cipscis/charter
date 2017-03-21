define(
	[
		'jquery',
		'papaparse'
	],

	function ($, Papa) {
		var Analyser = {
			/////////////////////
			// FILE PROCESSING //
			/////////////////////
			loadFile: function (filePath, config, callback) {
				$.ajax({
					url: filePath,
					success: Analyser._fileLoaded(config, callback)
				});
			},

			_fileLoaded: function (config, callback) {
				return function (csv) {
					Analyser.parseCsv(csv, Analyser._fileParsed(config, callback));
				};
			},

			_fileParsed: function (config, callback) {
				return function (rows) {
					callback(Analyser._processData(rows, config));
				};
			},

			_processData: function (rows, config) {
				// Takes in config with the following properties:
				// The number of header rows to remove from rows
				// A config object for column names
				// An optional set of aliases
				// An optional set of columns whose values should be treated as arrays
				// An optional map of columns that should be combined when collecting enums

				// The output contains the following properties:
				// The header rows that were removed
				// The config object for column names
				// A set of filters respecting the given aliases
				// Enums collected according to the specified column names and optional enumsMap

				// Example data:
				// headerRows = 2;

				// cols = {
				// 	ETHNICITY: Analyser.getColNumber('K'),
				// 	TACTICS: Analyser.getColNumber('M')
				// };

				// arrayCols = {};
				// arrayCols[cols.TACTICS] = null;

				// aliases = {
				// 	ETHNICITY: [
				// 		[
				// 			'Pacific', //Not represented in data, but used as a label
				// 			'Pacific Island',
				// 			'Pacific Islander'
				// 		]
				// 	]
				// };

				// enumsMap = {
				// 	TASER_METHOD: [cols.TASER_METHOD_1, cols.TASER_METHOD_2, cols.TASER_METHOD_3]
				// };

				var output = {},
					i, row,
					j;

				config.headerRows = config.headerRows || 0;
				config.cols = config.cols || {};
				config.aliases = config.aliases || {};
				config.arrayCols = config.arrayCols || {};
				config.enumsMap = config.enumsMap || {};

				output.cols = config.cols;
				output.filters = Analyser.getAliasFilters(config.aliases);

				// Remove header rows
				output.headerRows = rows.splice(0, config.headerRows);

				// Convert cells that are lists into arrays
				output.rows = rows.concat();
				for (i = 0; i < output.rows.length; i++) {
					row = output.rows[i];

					for (j in config.arrayCols) {
						row[j] = row[j].trim().split(config.arrayCols[j] || '\n');
					}
				}

				// Build enums
				output.enums = {};
				for (i in config.cols) {

					// Don't collect enums for columns specified in enumsMap
					k = true;
					for (j in config.enumsMap) {
						if (config.enumsMap[j].indexOf(config.cols[i]) !== -1) {
							k = false;
							break;
						}
					}

					if (k) {
						output.enums[i] = [];
						Analyser._collectEnums(rows, output.enums[i], config.cols[i]);
					}
				}
				for (i in config.enumsMap) {
					output.enums[i] = [];
					Analyser._collectEnums.apply(this, [rows, output.enums[i]].concat(config.enumsMap[i]));
				}

				return output;
			},

			_collectEnums: function (rows, enumsArr, col1, col2, colN) {
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

			/////////////////
			// CSV PARSING //
			/////////////////
			parseCsv: function (csv, callback) {
				// Parse a CSV file then process the data

				Papa.parse(csv, {
					complete: Analyser._csvParsed(callback)
				});
			},

			_csvParsed: function (callback) {
				// Convert strings to numbers where appropriate,
				// then pass the data to a callback function

				return function (csv) {
					Analyser._extractCellNumbers(csv.data);

					if (callback && typeof callback === 'function') {
						callback(csv.data);
					}
				};
			},

			_extractCellNumbers: function (csv) {
				// Use _extractNumber on each cell

				var i, j;

				for (i = 0; i < csv.length; i++) {
					for (j = 0; j < csv[i].length; j++) {
						csv[i][j] = Analyser._extractNumber(csv[i][j]);
					}
				}
			},

			_extractNumber: function (string) {
				// Convert strings to numbers where possible

				var val = string.replace(/,|%$/g, ''),
					length;

				if (parseFloat(val) === +val) {
					if (string.match(/%$/)) {
						// If the value is a percentage, divide by 100

						// Convert to string to see how many places after the point, to round after dividing
						// Otherwise you'll get numbers like 0.10800000000000001
						length = (val + '');
						length.replace(/^[^.]+/, '');
						length = length.length;

						val = val / 100;
						val = val.toFixed(length+2);
					}
					return +val;
				} else {
					return string;
				}
			},

			///////////////
			// FILTERING //
			///////////////
			getAliasFilters: function (aliases) {
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
								isMatch = isMatch && Analyser._applyFilter(row, filter.colIndex, filter.values, aliases);
							} else {
								isMatch = isMatch || Analyser._applyFilter(row, filter.colIndex, filter.values, aliases);
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

			_applyFilter: function (row, colIndex, values, aliases) {
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
						if (Analyser._matchAlias(values[k], cellValue, aliases)) {
							return true;
						}
					}
				}

				return false;
			},

			_matchAlias: function (cell, value, aliasSuperset) {
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

			//////////////////////
			// HELPER FUNCTIONS //
			//////////////////////
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

			getCol: function (rows, colNum) {
				var i, row,
					col;

				col = [];
				for (i = 0; i < rows.length; i++) {
					row = rows[i];
					col.push(row[colNum]);
				}

				return col;
			},

			///////////////////
			// SUMMARY TOOLS //
			///////////////////
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

			getColSummary: function (rows, col) {
				// Takes in a set of rows and a column number

				// Outputs an object summarising the number of times each value
				// appeared in the given column of the given rows

				var i, row,
					summary,
					value;

				summary = {};
				for (i = 0; i < rows.length; i++) {
					row = rows[i];
					value = row[col];

					if (value) {
						if (value in summary) {
							summary[value]++;
						} else {
							summary[value] = 1;
						}
					}
				}

				return summary;
			}
		};

		return Analyser;
	}
);