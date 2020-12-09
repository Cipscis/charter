import Parser from './parser.js';
import fileIO from './lib/fileio.js';

class AnalyserRows extends Array {
	constructor(sourceArray) {
		// Don't use spread operator as it will cause a
		// stack overflow error with very large arrays
		// super(...sourceArray);
		super(sourceArray.length);
		for (let i = 0; i < sourceArray.length; i++) {
			this[i] = sourceArray[i];
		}
	}


	getCol(colNum) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.getCol.apply(this, args);
	}


	addCol(col) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.addCol.apply(this, args);
	}

	getDerivedCol(processFn, ...cols) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.getDerivedCol.apply(this, args);
	}

	addDerivedCol(callback, ...cols) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.addDerivedCol.apply(this, args);
	}


	createSubTable(cols, arraySeparator) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.createSubTable.apply(this, args);
	}

	createSubTableString(cols) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.createSubTableString.apply(this, args);
	}

	getColSummary(cols, aliasList) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.getColSummary.apply(this, args);
	}

	getColAsDataSeries(col, labels) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.getColAsDataSeries.apply(this, args);
	}

	getComparisonSummary(headerCol, headerAliases, varCol, varAliases) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.getComparisonSummary.apply(this, args);
	}

	getComparisonSummaryString(headerCol, headerAliases, varCol, varAliases) {
		let args = [this].concat(Array.from(arguments));
		return Analyser.getComparisonSummaryString.apply(this, args);
	}
}

const Analyser = {
	/////////////////////
	// FILE PROCESSING //
	/////////////////////
	_loadFile: function (fileInfo, fileConfig, callback) {
		if (fileInfo instanceof File) {
			Analyser._fileToString(fileInfo, fileConfig, callback);
		}

		let xhr = new XMLHttpRequest();
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
		const filesToLoad = (arguments.length - 1) / 2;
		let filesLoaded = 0;

		if (arguments.length < 3) {
			console.error('Insufficient arguments provided to loadFile:', arguments);
		} else if ((arguments.length % 2) === 0) {
			console.error('Incorrect number of arguments provided to loadFile:', arguments);
		}

		let callback = arguments[arguments.length-1];

		let dataConfigArray = [];
		const onFileLoad = function (i) {
			return function (dataConfig) {
				dataConfigArray[i] = dataConfig;

				filesLoaded += 1;
				if (filesLoaded >= filesToLoad) {
					callback.apply(undefined, dataConfigArray);
				}
			};
		};

		let fileInfo;
		let fileConfig;
		for (let i = 0; i < filesToLoad; i++) {
			fileInfo = arguments[i*2];
			fileConfig = arguments[i*2+1];

			Analyser._loadFile(fileInfo, fileConfig, onFileLoad(i));
		}
	},

	_fileToString: function (file, fileConfig, callback) {
		// Takes in a File object and converts it to a string,
		// then passes it to _fileLoaded

		let reader = new FileReader();
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

		// defaultColValues = {};
		// defaultColValues[cols.VALUE] = '-';

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

		fileConfig.headerRows = fileConfig.headerRows || 0;
		fileConfig.footerRows = fileConfig.footerRows || 0;
		fileConfig.cols = fileConfig.cols || {};
		fileConfig.aliases = fileConfig.aliases || {};
		fileConfig.arrayCols = fileConfig.arrayCols || {};
		fileConfig.enumsMap = fileConfig.enumsMap || {};
		fileConfig.uniqueCols = fileConfig.uniqueCols || [];

		let dataConfig = {};
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
		dataConfig.rows = new AnalyserRows(rows);
		for (let i = 0; i < dataConfig.rows.length; i++) {
			let row = dataConfig.rows[i];

			for (let j in fileConfig.arrayCols) {
				row[j] = (row[j] + '').trim().split(fileConfig.arrayCols[j] || ' ');
			}

			// Remove default values from specified columns
			for (let j in fileConfig.defaultColValues) {
				if (j in fileConfig.arrayCols) {
					continue;
				}
				if ((row[j] + '') === (fileConfig.defaultColValues[j] + '')) {
					row[j] = '';
				}
			}

			// Add default values to empty cells in default cols
			for (let j in fileConfig.defaultCols) {
				if (j in fileConfig.arrayCols) {
					continue;
				}
				if ((row[j] + '').trim() === '') {
					row[j] = fileConfig.defaultCols[j];
				}
			}
		}

		// Set filters on rows object
		Analyser._createRowFilterFunctions(dataConfig.rows, dataConfig.filters);

		// Build enums
		dataConfig.enums = Analyser._buildEnums(rows, fileConfig);

		return dataConfig;
	},

	_buildEnums: function (rows, config) {
		let enums = {};

		for (let col in config.cols) {

			// Don't collect enums for columns specified in uniqueCols or enumsMap
			let collect = true;
			if (config.uniqueCols.includes(config.cols[col])) {
				collect = false;
			}
			for (let enumCol in config.enumsMap) {
				if (config.enumsMap[enumCol].includes(config.cols[col])) {
					collect = false;
					break;
				}
			}

			if (collect) {
				enums[col] = [];
				Analyser._collectEnums(rows, enums[col], config.cols[col]);
			}
		}
		for (let enumCol in config.enumsMap) {
			enums[enumCol] = [];
			Analyser._collectEnums.apply(this, [rows, enums[enumCol]].concat(config.enumsMap[enumCol]));
		}

		return enums;
	},

	_collectEnums: function (rows, enumsArr, ...cols) {
		// Go through all cells in a given set of columns
		// and add all unique entries found to enumsArr

		enumsArr = enumsArr || [];

		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			for (let j = 0; j < cols.length; j++) {
				let col = cols[j];

				if (row[col] instanceof Array) {
					for (let k = 0; k < row[col].length; k++) {
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

	combineData: function (...dataConfigs) {
		// Takes in any number of dataConfig objects from _processData
		// Combines the rows and relevant dataConfig objects (e.g. aliases, enums)
		// Keeps only columns shared by all dataConfig objects

		// Assumes there is no data shared between different sets,
		// so duplicates will *not* be detected or removed

		// The output is in the same format as for _processData

		let combinedDataConfig = {
			cols: {},
			rows: new AnalyserRows([]),
			aliases: {}
		};

		if (!dataConfigs || dataConfigs.length < 2) {
			console.error('Invalid inputs passed to combineData', arguments);
		}

		// Combine cols first //

		// Build base set from first cols object
		for (let j in dataConfigs[0].cols) {
			combinedDataConfig.cols[j] = true;
		}

		// Remove any cols not shared by every other cols object
		for (let i = 1; i < dataConfigs.length; i++) {
			let dataConfig = dataConfigs[i];

			for (let j in combinedDataConfig.cols) {
				if (!(j in dataConfig.cols)) {
					delete combinedDataConfig.cols[j];
				}
			}
		}

		let colIndex = 0;
		for (let j in combinedDataConfig.cols) {
			combinedDataConfig.cols[j] = colIndex;
			colIndex++;
		}

		// Now that we have the combined cols object, combine rows and aliases
		for (let i = 0; i < dataConfigs.length; i++) {
			let dataConfig = dataConfigs[i];
			// Combine rows //

			for (let j = 0; j < dataConfig.rows.length; j++) {
				let row = [];
				for (let k in combinedDataConfig.cols) {
					row[combinedDataConfig.cols[k]] = dataConfig.rows[j][dataConfig.cols[k]];
				}

				combinedDataConfig.rows.push(row);
			}


			// Combine aliases //

			// Loop through each row's aliases to combine
			for (let j in dataConfig.aliases) {

				// If we don't have an alias for this column, make an empty placeholder
				if (!(j in combinedDataConfig.aliases)) {
					combinedDataConfig.aliases[j] = [];
				}

				// Loop through each aliasSet for this column
				for (let k = 0; k < dataConfig.aliases[j].length; k++) {
					let aliasSet = dataConfig.aliases[j][k];

					// Combine aliasSets based off their first element, which is used as a label
					let combinedAliasSet = [];
					let l;
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
		combinedDataConfig.filters = Analyser._getAliasFilters(combinedDataConfig.aliases);
		Analyser._createRowFilterFunctions(combinedDataConfig.rows, combinedDataConfig.filters);

		// Combine uniqueCols
		combinedDataConfig.uniqueCols = [];
		for (let i = 0; i < dataConfigs.length; i++) {
			let dataConfig = dataConfigs[i];

			for (let j in dataConfig.uniqueCols) {
				let originalCol = dataConfig.uniqueCols[j];
				let originalColName = undefined;
				for (let k in dataConfig.cols) {
					if (dataConfig.cols[l] === originalCol) {
						originalColName = l;
						break;
					}
				}

				if (originalColName) {
					let originalColIndex = combinedDataConfig.cols[originalColName];

					if (combinedDataConfig.uniqueCols.indexOf(originalColIndex) === -1) {
						combinedDataConfig.uniqueCols.push(combinedDataConfig.cols[originalColName]);
					}
				}
			}
		}

		// Combine the enumsMaps, then build combined enums
		combinedDataConfig.enumsMap = {};
		for (let i = 0; i < dataConfigs.length; i++) {
			let dataConfig = dataConfigs[i];

			for (let j in dataConfig.enumsMap) {
				let originalEnumsMap = dataConfig.enumsMap[j];

				if (!originalEnumsMap) {
					// Mark this enumsMap as null to denote that it doesn't
					// exist across all dataConfigs we are combining
					combinedDataConfig.enumsMap[j] = null;
				} else {
					if (combinedDataConfig.enumsMap[j] !== null) {
						combinedDataConfig.enumsMap[j] = combinedDataConfig.enumsMap[j] || [];

						for (let k = 0; k < originalEnumsMap.length; k++) {
							let originalCol = originalEnumsMap[k];
							let originalColName = undefined;
							for (let l in dataConfig.cols) {
								if (dataConfig.cols[l] === originalCol) {
									originalColName = l;
									break;
								}
							}

							if (originalColName) {
								let originalColIndex = combinedDataConfig.cols[originalColName];

								if (combinedDataConfig.enumsMap[j].indexOf(originalColIndex) === -1) {
									combinedDataConfig.enumsMap[j].push(combinedDataConfig.cols[originalColName]);
								}
							}
						}
					}
				}
			}

			for (let j in combinedDataConfig.enumsMap) {
				if (combinedDataConfig.enumsMap[j] === null) {
					delete combinedDataConfig[enumsMap[j]];
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
		// Convert strings to numbers where appropriate,
		// then pass the data to a callback function

		let data = Parser.parse(csv);

		Analyser._extractCellValues(data);

		if (callback && typeof callback === 'function') {
			callback(data);
		}
	},

	_extractCellValues: function (csv) {
		// Use _extractValue on each cell

		for (let i = 0; i < csv.length; i++) {
			for (let j = 0; j < csv[i].length; j++) {
				csv[i][j] = Analyser._extractValue(csv[i][j]);
			}
		}
	},

	_extractValue: function (string) {
		// Convert strings to booleans or numbers where possible

		if (string === 'true') {
			return true;
		} else if (string === 'false') {
			return false;
		} else {
			return Analyser._extractNumber(string);
		}
	},

	_extractNumber: function (string) {
		// Convert strings to numbers where possible

		let val = string.replace(/,|%$/g, '');

		if (parseFloat(val) === +val) {
			if (string.match(/%$/)) {
				// If the value is a percentage, divide by 100

				// Convert to string to see how many places after the point, to round after dividing
				// Otherwise you'll get numbers like 0.10800000000000001
				let length = (val + '');
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
		const filterRows = function (rows, orToggle, colIndex1, values1, colIndex2, values2, colIndexN, valuesN) {
			// Takes in a rows object (imported from csv),
			// a boolean specifying whether it's an "and" or an "or" filter,
			// and any number of pairs (at least one) of
			// the index of the column to consider, and an array of values

			// Returns an array of rows where the cell in the column
			// specified contains a value in the array of values given
			// for all column and value pairs

			let and = !orToggle;
			let startAt = 2;

			let filteredRows = [];

			if ((arguments.length < 4) || (((arguments.length-2) % 2) !== 0)) {
				// Assume "andToggle" has not been passed
				and = true;
				startAt = 1;
				if ((arguments.length < 3) || (((arguments.length-1) % 2) !== 0)) {
					console.error('An invalid set of arguments was passed to filterRows');
					return [];
				}
			}

			let filters = [];
			for (let i = startAt; i < arguments.length-1; i += 2) {
				let filter = {
					colIndex: arguments[i],
					values: arguments[i+1]
				};

				if (!(Array.isArray(filter.values) || filter.values instanceof Function)) {
					filter.values = [filter.values];
				}

				filters.push(filter);
			}

			for (let i = 0; i < rows.length; i++) {
				let row = rows[i];

				let isMatch = !!and;

				for (let j = 0; j < filters.length; j++) {
					let filter = filters[j];

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

			filteredRows = new AnalyserRows(filteredRows);
			filteredRows.filter = rows.filter;
			filteredRows.filterAnd = rows.filterAnd;
			filteredRows.filterOr = rows.filterOr;

			return filteredRows;
		};

		const filterRowsAnd = function (rows, colIndex1, values1, colIndex2, values2, colIndexN, valuesN) {
			let args = Array.prototype.slice.apply(arguments);

			args = args.slice(1);
			args.splice(0, 0, false);
			args.splice(0, 0, rows);

			return filterRows.apply(this, args);
		};

		const filterRowsOr = function (rows, colIndex1, values1, colIndex2, values2, colIndexN, valuesN) {
			let args = Array.prototype.slice.apply(arguments);

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

	_createRowFilterFunctions: function (rows, filters) {
		rows.filter = function () {
			var args = [this].concat(Array.from(arguments));

			return filters.filterRows.apply(this, args);
		};

		rows.filterOr = function () {
			var args = [this].concat(Array.from(arguments));

			return filters.filterRowsOr.apply(this, args);
		};

		rows.filterAnd = function () {
			var args = [this].concat(Array.from(arguments));

			return filters.filterRowsAnd.apply(this, args);
		};
	},

	_applyFilter: function (row, colIndex, values, aliases) {
		// Allow functions to be passed as filter tests
		if (values instanceof Function) {
			return values(row[colIndex]);
		}

		// If one or more values is passed, test it against aliases
		if (!(values instanceof Array)) {
			values = [values];
		}

		let cell = row[colIndex];
		let cellValues;

		if (cell instanceof Array) {
			cellValues = cell;
		} else {
			cellValues = [cell];
		}

		for (let i = 0; i < cellValues.length; i++) {
			let cellValue = cellValues[i];

			for (let k = 0; k < values.length; k++) {
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

		if (cell === value) {
			return true;
		}

		// Could be array or object
		for (let i in aliasSuperset) {
			let aliasSet = aliasSuperset[i];
			for (let j = 0; j < aliasSet.length; j++) {
				let aliasList = aliasSet[j];

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

		if (!(typeof colName === 'string' || colName instanceof String)) {
			// Not a string
			return null;
		}

		let alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
		let rowNumber = -1; // Adjust for 0-based counting

		for (let i = 0; i < colName.length; i++) {
			let char = colName.toUpperCase()[i];
			let charIndex = alphabet.indexOf(char);

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
		let newCols = {};

		for (let key in cols) {
			let val = cols[key];

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
		let col = [];
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			col.push(row[colNum]);
		}

		return col;
	},

	//////////////////////////////
	// TRANSFORMING INFORMATION //
	//////////////////////////////
	addCol: function (rows, col) {
		// Edits the passed rows array to add an extra column
		// to it, then returns the index of that new column

		if (rows.length !== col.length) {
			console.error('Cannot add col to rows unless their length matches');
		}

		let colIndex = rows[0].length;

		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			row.push(col[i]);
		}

		return colIndex;
	},

	getDerivedCol: function (rows, processFn, ...cols) {
		// Creates an array analogous to a column as returns
		// by the getCol function, where its output is the
		// result of applying the processFn function to the row
		// any number of values from optional column arguments

		let derivedCol = [];
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let derivedValues = [row];

			for (let j = 0; j < cols.length; j++) {
				let col = cols[j];
				derivedValues.push(col[i]);
			}

			derivedCol.push(processFn.apply(this, derivedValues));
		}

		return derivedCol;
	},

	addDerivedCol: function (rows, callback, ...cols) {
		// Works like getDerivedCol, but instead of returning
		// the derived column directly it uses addCol to add
		// it to rows and returns the new column index.

		let derivedCol = Analyser.getDerivedCol.apply(this, arguments);

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

		arraySeparator = arraySeparator || ', ';

		let table = [];
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let newRow = {};

			for (let colName in cols) {
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
		let table = Analyser.createSubTable(rows, cols, ',');
		let tableString = Analyser._convertTableToString(table);

		return tableString;
	},

	_convertTableToString: function (table, useKeys, cellSeparatorOption, rowSeparatorOption) {
		const cellSeparator = cellSeparatorOption || '\t';
		const rowSeparator = rowSeparatorOption || '\n';

		let tableString = '';

		let addCell = (cellString) => {
			if (typeof cellString !== 'string') {
				cellString = '' + cellString;
			}

			if (cellString.indexOf(cellSeparator) !== -1) {
				// If the cell string contains the separator sequence,
				// wrap it in " and escape any existing " as ""
				cellString = '"' + cellString.replace(/"/g, '""') + '"';
			}

			tableString += cellString + cellSeparator;
		};
		let endLine = () => {
			// Trim off last cell separator, replace with newline
			tableString = tableString.substr(0, tableString.length - cellSeparator.length) + rowSeparator;
		};

		// Render headers and create array of labels
		if (useKeys) {
			tableString += cellSeparator;
		}

		let firstRowComplete = false;
		for (let rowName in table) {
			if (firstRowComplete === true) {
				break;
			}
			firstRowComplete = true;

			let row = table[rowName];
			for (let colName in row) {
				addCell(colName);
			}
		}
		endLine();

		for (let rowName in table) {
			let isFirstRow = false;
			let row = table[rowName];
			for (let colName in row) {
				let cell = row[colName];
				if (useKeys) {
					if (isFirstRow === false) {
						addCell(rowName);
					}
					isFirstRow = true;
				}

				addCell(cell);
			}
			endLine();
		}

		return tableString;
	},

	getColSummary: function (rows, cols, aliasList) {
		// Takes in a set of rows and one or more column numbers, and optionally
		// a list of aliases - an array of arrays of strings to be grouped together

		// Outputs an object summarising the number of times each value
		// appeared in the given column of the given rows


		// Allow the passing of a single number or an array of column indices
		if (!(cols instanceof Array)) {
			cols = [cols];
		}

		let summary = {};
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];

			for (let j = 0; j < cols.length; j++) {
				let col = cols[j];
				let values = row[col];

				if (typeof values !== 'undefined' && values !== '') {
					if (!(values instanceof Array)) {
						values = [values];
					}

					for (let k = 0; k < values.length; k++) {
						let value = values[k];

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

		let colSummary = Analyser.getColSummary(rows, col);

		let dataSeries = [];

		for (let i = 0; i < labels.length; i++) {
			dataSeries[i] = 0;
		}

		for (let i in colSummary) {
			let value = colSummary[i];
			let index = labels.indexOf(i);
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

		let newSummary = {};
		for (let i in summary) {
			let inAlias = false;
			for (let j = 0; j < aliasList.length; j++) {
				let aliases = aliasList[j];

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

		let headerSummary = Analyser.getColSummary(rows, headerCol, headerAliases);
		let varSummary = Analyser.getColSummary(rows, varCol, varAliases);

		let aliases = {};
		if (headerAliases) {
			aliases.HEADERS = headerAliases;
		}
		if (varAliases) {
			aliases.VARS = varAliases;
		}
		let filters = Analyser._getAliasFilters(aliases);

		let comparisonSummary = {};
		for (let i in varSummary) {
			comparisonSummary[i] = {};
			for (let j in headerSummary) {
				comparisonSummary[i][j] = filters.filterRows(rows,
					varCol, Analyser._extractValue(i),
					headerCol, Analyser._extractValue(j)
				).length;
			}
		}

		return comparisonSummary;
	},

	getComparisonSummaryString: function (rows, headerCol, headerAliases, varCol, varAliases) {
		// Calls getComparisonSummary with all arguments passed,
		// then returns a string of the data that can be copy/pasted
		// into a spreadsheet

		let comparisonSummary = Analyser.getComparisonSummary.apply(this, arguments);
		let comparisonSummaryString = Analyser._convertTableToString(comparisonSummary, true);

		return comparisonSummaryString;
	},

	saveComparisonSummaryCsv: function (filename, rows, headerCol, headerAliases, varCol, varAliases) {
		// Calls getComparisonSummary with all arguments passed,
		// then returns a string of the data that can be copy/pasted
		// into a spreadsheet
		let args = Array.prototype.slice.call(arguments, 1);

		let comparisonSummary = Analyser.getComparisonSummary.apply(this, args);
		let comparisonSummaryCsv = Analyser._convertTableToString(comparisonSummary, true, ',', '\n');

		fileIO.save.data(comparisonSummaryCsv, filename, 'text/csv');
	}
};

export default {
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
	getComparisonSummaryString: Analyser.getComparisonSummaryString,
	saveComparisonSummaryCsv: Analyser.saveComparisonSummaryCsv
};
