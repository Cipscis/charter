define(
	[
		'papaparse'
	],

	function (Papa) {
		var Analyser = {
			/////////////////////
			// FILE PROCESSING //
			/////////////////////
			_loadFile: function (fileInfo, fileConfig, callback) {
				if (fileInfo instanceof File) {
					Analyser._fileToString(fileInfo, fileConfig, callback);
				}

				var xhr = new XMLHttpRequest();
				xhr.open('GET', fileInfo);
				xhr.onload = function () {
					if (xhr.status === 200) {
						Analyser._fileLoaded(xhr.responseText, fileConfig, callback);
					}
				};
				xhr.send();
			},

			loadFile: function (fileInfo1, fileConfig1, fileInfo2, fileConfig2, fileInfoN, fileConfigN, callbackArg) {
				// options should be an array containing objects which each have
				// a fileInfo, and fileConfig. These will be passed into loadFile
				// for each item in the array
				var fileInfo;
				var fileConfig;
				var callback;
				var i;

				var dataConfigArray = [];

				var filesToLoad;
				var filesLoaded = 0;

				if (arguments.length < 3) {
					console.error('Insufficient arguments provided to loadFile:', arguments);
				} else if ((arguments.length % 2) === 0) {
					console.error('Incorrect number of arguments provided to loadFile:', arguments);
				}

				filesToLoad = (arguments.length - 1) / 2;
				callback = arguments[arguments.length-1];

				var onFileLoad = function (i) {
					return function (dataConfig) {
						dataConfigArray[i] = dataConfig;

						filesLoaded += 1;
						if (filesLoaded >= filesToLoad) {
							callback.apply(undefined, dataConfigArray);
						}
					};
				};

				for (i = 0; i < filesToLoad; i++) {
					fileInfo = arguments[i*2];
					fileConfig = arguments[i*2+1];

					Analyser._loadFile(fileInfo, fileConfig, onFileLoad(i));
				}
			},

			_fileToString: function (file, fileConfig, callback) {
				// Takes in a File object and converts it to a string,
				// then passes it to _fileLoaded

				var reader = new FileReader();
				reader.onload = function (evt) {
					if (reader.readyState === 2) { // DONE
						Analyser._fileLoaded(reader.result, fileConfig, callback);
					}
				};

				reader.readAsText(file);
			},

			_fileLoaded: function (csv, fileConfig, callback) {
				// Clear any empty lines at the end
				csv = csv.replace(/(\n\s*)+$/, '');

				Analyser._parseCsv(csv, Analyser._fileParsed(fileConfig, callback));
			},

			_fileParsed: function (fileConfig, callback) {
				return function (rows) {
					callback(Analyser._processData(rows, fileConfig));
				};
			},

			_processData: function (rows, fileConfig) {
				// Takes in fileConfig with the following properties:
				// The number of header rows to remove from rows
				// A fileConfig object for column names
				// An optional set of aliases
				// An optional set of columns whose values should be treated as arrays
				// An optional set of columns with default values
				// An optional map of columns that should be combined when collecting enums

				// The output contains the following properties:
				// The header rows that were removed
				// The fileConfig object for column names
				// A set of filters respecting the given aliases
				// Enums collected according to the specified column names and optional enumsMap

				// Example data:
				// headerRows = 2;
				// footerRows = 1;

				// cols = Analyser.getColNumbers({
				// 	ETHNICITY: 'K',
				// 	TACTICS: 'M'
				// });

				// arrayCols = {};
				// arrayCols[cols.TACTICS] = ' ';

				// defaultCols = {};
				// defaultCols[cols.VALUE] = 0;

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

				var dataConfig = {},
					i, row,
					j;

				fileConfig.headerRows = fileConfig.headerRows || 0;
				fileConfig.footerRows = fileConfig.footerRows || 0;
				fileConfig.cols = fileConfig.cols || {};
				fileConfig.aliases = fileConfig.aliases || {};
				fileConfig.arrayCols = fileConfig.arrayCols || {};
				fileConfig.enumsMap = fileConfig.enumsMap || {};

				dataConfig.cols = fileConfig.cols;
				dataConfig.aliases = fileConfig.aliases;
				dataConfig.filters = Analyser._getAliasFilters(fileConfig.aliases);
				dataConfig.enumsMap = fileConfig.enumsMap; // Keep this for combining data

				if (fileConfig.headerRows !== 0) {
					// Remove header rows
					rows.splice(0, fileConfig.headerRows);
				}

				if (fileConfig.footerRows !== 0) {
					// Remove footer rows
					rows.splice(-fileConfig.footerRows);
				}

				// Convert cells that are lists into arrays
				dataConfig.rows = rows.concat();
				for (i = 0; i < dataConfig.rows.length; i++) {
					row = dataConfig.rows[i];

					for (j in fileConfig.arrayCols) {
						row[j] = (row[j] + '').trim().split(fileConfig.arrayCols[j] || ' ');
					}
					for (j in fileConfig.defaultCols) {
						if (j in fileConfig.arrayCols) {
							continue;
						}
						if ((row[j] + '').trim() === '') {
							row[j] = fileConfig.defaultCols[j];
						}
					}
				}

				// Build enums
				dataConfig.enums = Analyser._buildEnums(rows, fileConfig);

				return dataConfig;
			},

			_buildEnums: function (rows, config) {
				var enums = {},
					i, j, k;

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
						enums[i] = [];
						Analyser._collectEnums(rows, enums[i], config.cols[i]);
					}
				}
				for (i in config.enumsMap) {
					enums[i] = [];
					Analyser._collectEnums.apply(this, [rows, enums[i]].concat(config.enumsMap[i]));
				}

				return enums;
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

			combineData: function (dataConfig1, dataConfig2, dataConfigN) {
				// Takes in any number of dataConfig objects from _processData
				// Combines the rows and relevant dataConfig objects (e.g. aliases, enums)
				// Keeps only columns shared by all dataConfig objects

				// Assumes there is no data shared between different sets,
				// so duplicates will *not* be detected or removed

				// The output is in the same format as for _processData

				var dataConfigs = Array.prototype.slice.call(arguments, 0);
				var combinedDataConfig = {
					cols: {},
					rows: [],
					aliases: {}
				};

				var dataConfig;
				var row;
				var aliasSet;
				var combinedAliasSet;

				var i;
				var j;
				var k;
				var l;

				if (!dataConfigs || dataConfigs.length < 2) {
					console.error('Invalid inputs passed to combineData', arguments);
				}

				// Combine cols first //

				// Build base set from first cols object
				for (j in dataConfigs[0].cols) {
					combinedDataConfig.cols[j] = true;
				}

				// Remove any cols not shared by every other cols object
				for (i = 1; i < dataConfigs.length; i++) {
					dataConfig = dataConfigs[i];

					for (j in combinedDataConfig.cols) {
						if (!(j in dataConfig.cols)) {
							delete combinedDataConfig.cols[j];
						}
					}
				}

				i = 0;
				for (j in combinedDataConfig.cols) {
					combinedDataConfig.cols[j] = i;
					i++;
				}

				// Now that we have the combined cols object, combine rows and aliases
				for (i = 0; i < dataConfigs.length; i++) {
					dataConfig = dataConfigs[i];
					// Combine rows //

					for (j = 0; j < dataConfig.rows.length; j++) {
						row = [];
						for (k in combinedDataConfig.cols) {
							row[combinedDataConfig.cols[k]] = dataConfig.rows[j][dataConfig.cols[k]];
						}

						combinedDataConfig.rows.push(row);
					}


					// Combine aliases //
					// Loop through each row's aliases to combine
					for (j in dataConfig.aliases) {

						// If we don't have an alias for this column, make an empty placeholder
						if (!(j in combinedDataConfig.aliases)) {
							combinedDataConfig.aliases[j] = [];
						}

						// Loop through each aliasSet for this column
						for (k = 0; k < dataConfig.aliases[j].length; k++) {
							aliasSet = dataConfig.aliases[j][k];

							// Combine aliasSets based off their first element, which is used as a label
							combinedAliasSet = [];
							for (l = 0; l < combinedDataConfig.aliases[j].length; l++) {
								if (combinedDataConfig.aliases[j][l][0] === aliasSet[0]) {
									combinedAliasSet = combinedDataConfig.aliases[j][l];
									break;
								}
							}

							combinedAliasSet = combinedAliasSet.concat(aliasSet);

							// Remove duplicates
							combinedAliasSet = combinedAliasSet.filter(function (alias, index, array) {
								return array.indexOf(alias) === index;
							});

							// Append or replace aliasSet in combinedDataConfig
							if (l < combinedDataConfig.aliases[j].length) {
								combinedDataConfig.aliases[j][l] = combinedAliasSet;
							} else {
								combinedDataConfig.aliases[j].push(combinedAliasSet);
							}
						}
					}
				}

				// Create new filters using combined aliases
				combinedDataConfig.filters = Analyser._getAliasFilters(dataConfig.aliases);

				// Combine the enumsMaps, then build combined enums
				combinedDataConfig.enumsMap = {};
				for (i = 0; i < dataConfigs.length; i++) {
					dataConfig = dataConfigs[i];

					for (j in dataConfig.enumsMap) {
						if (j in combinedDataConfig.enumsMap) {
							combinedDataConfig.enumsMap[j] = combinedDataConfig.enumsMap[j].concat(dataConfig.enumsMap[j]);

							// Remove duplicates
							combinedDataConfig.enumsMap[j] = combinedDataConfig.enumsMap[j].filter(function (alias, index, array) {
								return array.indexOf(alias) === index;
							});
						} else {
							combinedDataConfig.enumsMap[j] = dataConfig.enumsMap[j].concat();
						}
					}
				}
				combinedDataConfig.enums = Analyser._buildEnums(combinedDataConfig.rows, combinedDataConfig);

				return combinedDataConfig;
			},

			/////////////////
			// CSV PARSING //
			/////////////////
			_parseCsv: function (csv, callback) {
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
			_getAliasFilters: function (aliases) {
				var filterRows,
					filterRowsAnd,
					filterRowsOr;

				filterRows = function (rows, orToggle, colIndex1, values1, colIndex2, values2, colIndexN, valuesN) {
					// Takes in a rows object (imported from csv),
					// a boolean specifying whether it's an "and" or an "or" filter,
					// and any number of pairs (at least one) of
					// the index of the column to consider, and an array of values

					// Returns an array of rows where the cell in the column
					// specified contains a value in the array of values given
					// for all column and value pairs

					var and = !orToggle,
						startAt = 2,

						filteredRows = [],
						filter, filters, isMatch,
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
						filter = {
							colIndex: arguments[i],
							values: arguments[i+1]
						};

						if (!(Array.isArray(filter.values) || filter.values instanceof Function)) {
							filter.values = [filter.values];
						}

						filters.push(filter);
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

				filterRowsAnd = function (rows, colIndex1, values1, colIndex2, values2, colIndexN, valuesN) {
					var args = Array.prototype.slice.apply(arguments);

					args = args.slice(1);
					args.splice(0, 0, false);
					args.splice(0, 0, rows);

					return filterRows.apply(this, args);
				};

				filterRowsOr = function (rows, colIndex1, values1, colIndex2, values2, colIndexN, valuesN) {
					var args = Array.prototype.slice.apply(arguments);

					args = args.slice(1);
					args.splice(0, 0, true);
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
			getColNumber: function (colName) {
				// Takes in a string like "CE" and converts it to a row number like 82

				var alphabet,
					i, char,
					charIndex,
					rowNumber;

				if (!(typeof colName === 'string' || colName instanceof String)) {
					// Not a string
					return null;
				}

				alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
				rowNumber = -1; // Adjust for 0-based counting

				for (i = 0; i < colName.length; i++) {
					char = colName.toUpperCase()[i];
					charIndex = alphabet.indexOf(char);

					if (charIndex === -1) {
						// String contains invalid character
						return null;
					}

					rowNumber += (charIndex + 1) * Math.pow(alphabet.length, colName.length - (i+1));
				}

				return rowNumber;
			},

			getColNumbers: function (cols) {
				// Takes in a flat object and runs each property through getColNumber
				var key;
				var val;
				var newCols = {};

				for (key in cols) {
					val = cols[key];

					if (typeof val === 'string' || val instanceof String) {
						val = Analyser.getColNumber(cols[key]);
					}

					if (Number.isInteger(val) && val >= 0) {
						newCols[key] = val;
					}
				}

				return newCols;
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

			//////////////////////////////
			// TRANSFORMING INFORMATION //
			//////////////////////////////
			getDerivedCol: function (rows, processFn, optionalCol1, optionalCol2, optionalColN) {
				// Creates an array analogous to a column as returns
				// by the getCol function, where its output is the
				// result of applying the processFn function to the row
				// any number of values from optional column arguments

				var i, row,
					derivedCol = [],

					cols = [],
					j, col,
					derivedValues;

				for (i = 2; i < arguments.length; i++) {
					cols.push(arguments[i]);
				}

				for (i = 0; i < rows.length; i++) {
					row = rows[i];
					derivedValues = [row];

					for (j = 0; j < cols.length; j++) {
						col = cols[j];
						derivedValues.push(col[i]);
					}

					derivedCol.push(processFn.apply(this, derivedValues));
				}

				return derivedCol;
			},

			addCol: function (rows, col) {
				// Edits the passed rows array to add an extra column
				// to it, then returns the index of that new column

				if (rows.length !== col.length) {
					console.error('Cannot add col to rows unless their length matches');
				}

				var i, row,
					colIndex = rows[0].length;

				for (i = 0; i < rows.length; i++) {
					row = rows[i];
					row.push(col[i]);
				}

				return colIndex;
			},

			addDerivedCol: function (rows, callback, optionalCol1, optionalCol2, optionalColN) {
				// Works like getDerivedCol, but instead of returning
				// the derived column directly it uses addCol to add
				// it to rows and returns the new column index.

				var derivedCol = Analyser.getDerivedCol.apply(this, arguments);

				return Analyser.addCol(rows, derivedCol);
			},

			///////////////////
			// SUMMARY TOOLS //
			///////////////////
			createSubTable: function (rows, cols, arraySeparator) {
				// Takes in a set of rows and a cols object formatted like this:
				// {
				// 	ETHNICITY: 3,
				// 	AGE: 6
				// }

				// Outputs an array of objects,
				// each of which has the same indices as cols and represents a row
				// The output can be used with console.table

				var colName,
					table,
					i, row, newRow;

				arraySeparator = arraySeparator || ', ';

				table = [];
				for (i = 0; i < rows.length; i++) {
					row = rows[i];
					newRow = {};

					for (colName in cols) {
						// Join arrays so they display in console.table
						if (row[cols[colName]] instanceof Array) {
							newRow[colName] = row[cols[colName]].join(arraySeparator);
						} else {
							newRow[colName] = row[cols[colName]];
						}
					}
					table.push(newRow);
				}

				return table;
			},

			createSubTableString: function (rows, cols) {
				var table = Analyser.createSubTable(rows, cols, ',');
				var tableString = Analyser._convertTableToString(table);

				return tableString;
			},

			_convertTableToString: function (table, useKeys) {
				var cellSeparator = '\t',
					rowSeparator = '\n',
					i, j, k;

				var tableString = '';

				// Render headers and create array of labels
				if (useKeys) {
					tableString += cellSeparator;
				}
				k = false;
				for (i in table) {
					if (k === true) {
						break;
					}
					k = true;

					for (j in table[i]) {
						tableString += j + cellSeparator;
					}
				}
				// Trim off last character, replace with newline
				tableString = tableString.substr(0, tableString.length-1) + rowSeparator;

				for (i in table) {
					k = false;
					for (j in table[i]) {
						if (useKeys) {
							if (k === false) {
								tableString += i + cellSeparator;
							}
							k = true;
						}

						tableString += table[i][j] + cellSeparator;
					}
					// Trim off last character, replace with newline
					tableString = tableString.substr(0, tableString.length-1) + rowSeparator;
				}

				return tableString;
			},

			getColSummary: function (rows, cols, aliasList) {
				// Takes in a set of rows and one or more column numbers, and optionally
				// a list of aliases - an array of arrays of strings to be grouped together

				// Outputs an object summarising the number of times each value
				// appeared in the given column of the given rows

				var i, row,
					j, col,
					values,
					k, value,
					summary;

				// Allow the passing of a single number or an array of column indices
				if (!(cols instanceof Array)) {
					cols = [cols];
				}

				summary = {};
				for (i = 0; i < rows.length; i++) {
					row = rows[i];

					for (j = 0; j < cols.length; j++) {
						col = cols[j];
						values = row[col];

						if (typeof values !== 'undefined' && values !== '') {
							if (!(values instanceof Array)) {
								values = [values];
							}

							for (k = 0; k < values.length; k++) {
								value = values[k];

								if (value in summary) {
									summary[value]++;
								} else {
									summary[value] = 1;
								}
							}
						}
					}
				}

				if (typeof aliasList !== 'undefined') {
					summary = Analyser._groupColSummaryByAliases(summary, aliasList);
				}

				return summary;
			},

			getColAsDataSeries: function (rows, col, labels) {
				// Takes in a set of rows and a column number,
				// and an array of labels. Outputs an array where
				// each element is the count of the values matching
				// the element of labels at the same index

				var colSummary = Analyser.getColSummary(rows, col),
					i, value, index,
					dataSeries = [];

				for (i = 0; i < labels.length; i++) {
					dataSeries[i] = 0;
				}

				for (i in colSummary) {
					value = colSummary[i];
					index = labels.indexOf(i);
					if (index === -1) {
						// Couldn't find index, try forcing it to be a number
						index = labels.indexOf(parseInt(i, 10));
					}

					if (index !== -1) {
						dataSeries[index] = value;
					}
				}

				return dataSeries;
			},

			_groupColSummaryByAliases: function (summary, aliasList) {
				// Takes a summary object like the output from getColSummary, and
				// a list of aliases - an array of arrays of strings to be grouped together

				// Outputs a summary object where values within the same set of aliases are grouped

				var newSummary,
					i,
					j, aliases,
					inAlias;

				newSummary = {};
				for (i in summary) {
					inAlias = false;
					for (j = 0; j < aliasList.length; j++) {
						aliases = aliasList[j];

						if (aliases.indexOf(i) !== -1) {
							inAlias = true;
							if (aliases[0] in newSummary) {
								newSummary[aliases[0]] += summary[i];
							} else {
								newSummary[aliases[0]] = summary[i];
							}
						}
					}

					if (inAlias === false) {
						newSummary[i] = summary[i];
					}
				}

				return newSummary;
			},

			getComparisonSummary: function (rows, headerCol, headerAliases, varCol, varAliases) {
				// Takes in a set of rows and two column numbers
				// Creates an object that can be used with console.table
				// with the values of headerCol used in the header, and
				// the values of varCol used for each row, with the cells
				// denoting the number of times these values coincided
				// using filterRows with the passed sets of aliases

				// Also optionally takes a set of aliases for one or both columns

				var varSummary,
					headerSummary,
					comparisonSummary,

					aliases,
					filters,

					i, j;

				if (arguments.length === 3) {
					// No aliases specified
					varCol = headerAliases;
					headerAliases = undefined;
				} else if (arguments.length === 4) {
					// One alias specified
					if (!(headerAliases instanceof Array)) {
						// headerAliases was not passed
						varAliases = varCol;
						varCol = headerAliases;
						headerAliases = undefined;
					}
				}

				headerSummary = Analyser.getColSummary(rows, headerCol, headerAliases);
				varSummary = Analyser.getColSummary(rows, varCol, varAliases);

				aliases = {};
				if (headerAliases) {
					aliases.HEADERS = headerAliases;
				}
				if (varAliases) {
					aliases.VARS = varAliases;
				}
				filters = Analyser._getAliasFilters(aliases);

				comparisonSummary = {};
				for (i in varSummary) {
					comparisonSummary[i] = {};
					for (j in headerSummary) {
						comparisonSummary[i][j] = filters.filterRows(rows,
							varCol, Analyser._extractNumber(i),
							headerCol, Analyser._extractNumber(j)
						).length;
					}
				}

				return comparisonSummary;
			},

			getComparisonSummaryString: function (rows, headerCol, headerAliases, varCol, varAliases) {
				// Calls getComparisonSummary with all arguments passed,
				// then returns a string of the data that can be copy/pasted
				// into a spreadsheet

				var comparisonSummary,
					comparisonSummaryString;

				comparisonSummary = Analyser.getComparisonSummary.apply(this, arguments);
				comparisonSummaryString = Analyser._convertTableToString(comparisonSummary, true);

				return comparisonSummaryString;
			}
		};

		return {
			loadFile: Analyser.loadFile,
			combineData: Analyser.combineData,

			getColNumber: Analyser.getColNumber,
			getColNumbers: Analyser.getColNumbers,
			getCol: Analyser.getCol,

			addCol: Analyser.addCol,
			getDerivedCol: Analyser.getDerivedCol,
			addDerivedCol: Analyser.addDerivedCol,

			createSubTable: Analyser.createSubTable,
			createSubTableString: Analyser.createSubTableString,
			getColSummary: Analyser.getColSummary,
			getColAsDataSeries: Analyser.getColAsDataSeries,
			getComparisonSummary: Analyser.getComparisonSummary,
			getComparisonSummaryString: Analyser.getComparisonSummaryString
		};
	}
);