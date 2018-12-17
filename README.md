The Charter repository is a set of three tools for analysing and visualising data in JavaScript and HTML:

- [Analyser](#analyser): Processes data from CSV files and allows it to be analysed
- [Charter](#charter): Takes in formatted data and uses it to visualise data in HTML
- [Stats](#stats): A set of utility functions for analysing data

## Analyser

### Use:

The first step to using Analyser is processing a file using the ```loadFile``` method. A ```dataConfig``` object representing the processed data will be made available to a callback function passed in to this method.

Through that object, you will have access to ```rows``` array, where each element is an array representing a row in the CSV, and a ```cols``` object you have defined for accessing specific columns.

You will also have access to a set of filter functions for filtering rows, which can make use of optional sets of aliases if appropriate for your data. See the [dataConfig](#dataConfig) section for more information

The data and examples used in this documentation are part of the code. If you clone the repo, you can run the examples at ```/examples.html```.

The example data, found in the files ```city example.csv``` and ```city example 2.csv```, looks like this:

**city example.csv**

|NAME|COUNTRY|POPULATION|CAPITAL|PUBLIC_TRANSPORT|MAYOR_2012|MAYOR_2018|
|----|-------|----------|-------|----------------|----------|----------|
|Auckland|New Zealand|1614|false|Bus,Train|Len Brown|Phil Goff|
|Tāupo|Aotearoa|32.907|false|Bus,Train|Rick Cooper|David Trewavas|
|Hamburg|Germany|1810|false|Bus,Train,Ferry|Olaf Scholz|Katharina Fegebank,Peter Tschentscher|
|Sydney|Australia|4841|false|Bus,Train,Ferry|Clover Moore|Clover Moore|
|Hamilton|New Zealand|161.2|false|Bus|Julia Hardaker|Andrew King|
|Wellington|New Zealand|381.9|true|Bus,Train,Ferry,Cable Car|Celia Wade-Brown|Justin Lester|
|Christchurch|New Zealand|363.926|false|Bus|Bob Parker|Lianne Dalziel|
|Dunedin|New Zealand|114.347|false|Bus|Dave Cull|Dave Cull|
|Tauranga|New Zealand|110.338|false|Bus|Stuart Crosby|Greg Brownless|

**city example 2.csv**

|Name|Country|Population (thousands)|
|----|-------|----------------------|
|Semarang|Indonesia|"1,556"|
|Islamabad|Pakistan|1015|
|New Taipei City|Taiwan|"3,972"|
|Nagoya|Japan|2296|

### Methods:

- [loadFile](#loadFile)
- [combineData](#combineData)
- [getColNumber](#getColNumber)
- [getCol](#getCol)
- [addCol](#addCol)
- [getDerivedCol](#getDerivedCol)
- [addDerivedCol](#addDerivedCol)
- [createSubTable](#createSubTable)
- [createSubTableString](#createSubTableString)
- [getColSummary](#getColSummary)
- [getColAsDataSeries](#getColAsDataSeries)
- [getComparisonSummary](#getComparisonSummary)
- [getComparisonSummaryString](#getComparisonSummaryString)

#### loadFile

```javascript
loadFile(fileInfo1, fileConfig1, fileInfo2, fileConfig2, fileInfoN, fileConfigN, callback)
```

```loadFile``` takes in one or more pairs of ```fileInfo``` and ```fileConfig``` arguments, followed by a single ```callback```.

For each specified file, ```loadFile``` either requests a file at the specified path via a GET request, or processes a file that has already been loaded, such as via a file input. It parses the CSV using [papaparse](https://www.papaparse.com/), then processes it internally according to the ```fileConfig``` object passed in before passing the processed ```dataConfig``` object to a specified ```callback``` function.

When processing the data, Analyser will try to intelligently determine which cells contain numbers and which contain strings. Cells that seem to contain percentages will be converted to numbers, e.g. "50%" becomes ```0.5```.

When converting numbers, it will assume the ```.``` character is used as a decimal point, and the ```,``` character may be used when representing numbers as a string but will be ignored. Some cultures use these characters differently when representing numbers, for example three hundred thousand and a quarter could be represented as ```300.000,25```. This form of numeric representation is **not supported**, so if it is used in your data be sure to convert it before processing it with Analyser.

```fileInfo``` arguments are either a string representing the URL of a CSV file to load or a ```File``` object.

```fileConfig``` arguments are a JavaScript object containing information on how the data should be processed. See the [fileConfig](#fileConfig) section for more information.

```callback(dataConfig)``` is a function that will receive a ```dataConfig``` object representing the processed data. See the [dataConfig](#dataConfig) section for more information.

*Example:*

```javascript
var fileConfig = {
	headerRows: 1,
	cols: {
		NAME: Analyser.getColNumber('A'),
		COUNTRY: Analyser.getColNumber('B'),
		POPULATION: Analyser.getColNumber('C'),
		CAPITAL: Analyser.getColNumber('D'),
		PUBLIC_TRANSPORT: Analyser.getColNumber('E'),
		MAYOR_2012: Analyser.getColNumber('F'),
		MAYOR_2018: Analyser.getColNumber('G')
	},
	arrayCols: {},
	aliases: {
		COUNTRY: [
			['New Zealand', 'Aotearoa']
		]
	},
	enumsMap: {}
};
fileConfig.arrayCols[fileConfig.cols.PUBLIC_TRANSPORT] = ',';
fileConfig.arrayCols[fileConfig.cols.MAYOR_2018] = ',';

fileConfig.enumsMap.MAYOR = [fileConfig.cols.MAYOR_2012, fileConfig.cols.MAYOR_2018];

var exploreData = function (dataConfig) {
	var rows = dataConfig.rows;
	var cols = dataConfig.cols;

	// Do stuff with the data here

	var table = Analyser.createSubTableString(rows, cols);
	console.log(table);
};

Analyser.loadFile('/assets/data/city example.csv', fileConfig, exploreData);
```

*Output:*

|NAME|COUNTRY|POPULATION|CAPITAL|PUBLIC_TRANSPORT|MAYOR_2012|MAYOR_2018|
|----|-------|----------|-------|----------------|----------|----------|
|Auckland|New Zealand|1614|false|Bus,Train|Len Brown|Phil Goff|
|Tāupo|Aotearoa|32.907|false|Bus,Train|Rick Cooper|David Trewavas|
|Hamburg|Germany|1810|false|Bus,Train,Ferry|Olaf Scholz|Katharina Fegebank,Peter Tschentscher|
|Sydney|Australia|4841|false|Bus,Train,Ferry|Clover Moore|Clover Moore|
|Hamilton|New Zealand|161.2|false|Bus|Julia Hardaker|Andrew King|
|Wellington|New Zealand|381.9|true|Bus,Train,Ferry,Cable Car|Celia Wade-Brown|Justin Lester|
|Christchurch|New Zealand|363.926|false|Bus|Bob Parker|Lianne Dalziel|
|Dunedin|New Zealand|114.347|false|Bus|Dave Cull|Dave Cull|
|Tauranga|New Zealand|110.338|false|Bus|Stuart Crosby|Greg Brownless|

#### combineData

```javascript
combineData(dataConfig1, dataConfig2, dataConfigN)
```

```combineData``` takes in any number of ```dataConfig``` objects, and outputs a single combined ```dataConfig``` object.

All rows and relevant associated objects (e.g. aliases, enums) are combined, with the assumption that there are no rows duplicated between different configs. Only columns shared by each ```dataConfig``` object's set of columns are kept in the combined output, any columns that are not shared by each ```dataConfig``` will be discarded.

*Example:*

```javascript
var fileConfigA = {
	headerRows: 1,
	cols: {
		NAME: Analyser.getColNumber('A'),
		COUNTRY: Analyser.getColNumber('B'),
		POPULATION: Analyser.getColNumber('C'),
		CAPITAL: Analyser.getColNumber('D')
	},
	aliases: {
		COUNTRY: [
			['New Zealand', 'Aotearoa']
		]
	}
};
var filePathA = '/assets/data/city example.csv';

var fileConfigB = {
	headerRows: 1,
	cols: {
		NAME: Analyser.getColNumber('A'),
		COUNTRY: Analyser.getColNumber('B'),
		POPULATION: Analyser.getColNumber('C')
	}
};
var filePathB = '/assets/data/city example 2.csv';

var filesLoaded = function (dataConfigA, dataConfigB) {
	var combinedDataConfig = Analyser.combineData(dataConfigA, dataConfigB);
	analyseCombinedData(combinedDataConfig);
};

var analyseCombinedData = function (dataConfig) {
	var rows = dataConfig.rows;
	var cols = dataConfig.cols;

	// Do stuff with the combined data from both files here

	var table = Analyser.createSubTableString(rows, cols);
	console.log(table);
};

Analyser.loadFile(
	filePathA, fileConfigA,
	filePathB, fileConfigB,
	filesLoaded
);
```

*output:*

|NAME|COUNTRY|POPULATION|
|----|-------|----------|
|Auckland|New Zealand|1614|
|Tāupo|Aotearoa|32.907|
|Hamburg|Germany|1810|
|Sydney|Australia|4841|
|Hamilton|New Zealand|161.2|
|Wellington|New Zealand|381.9|
|Christchurch|New Zealand|363.926|
|Dunedin|New Zealand|114.347|
|Tauranga|New Zealand|110.338|
|Semarang|Indonesia|1556|
|Islamabad|Pakistan|1015|
|New Taipei City|Taiwan|3972|
|Nagoya|Japan|2296|

#### getColNumber

```javascript
getColNumber(colName)
```

Converts the letter-based name of a column, as commonly used in spreadsheet software, into an integer index.

This function is typically only used to create the ```cols``` object for a ```fileConfig```.

```colName``` is a string representing the letter-based name of a column. It is **not** case sensitive.

*Example:*

```javascript
var cols = {
	NAME: Analyser.getColNumber('A'),
	COUNTRY: Analyser.getColNumber('B'),
	POPULATION: Analyser.getColNumber('C'),
	OTHER_COL: Analyser.getColNumber('HV')
};

console.log(cols);
```

*Output:*

```javascript
{
	NAME: 0,
	COUNTRY: 1,
	POPULATION: 2,
	OTHER_COL: 229
}
```

#### getCol

```javascript
getCol(rows, colNum)
```

Returns a single array representing the values of a single column for a set of rows of processed data.

```rows``` is an array of rows from a ```dataConfig``` object.

```colNum``` is the index of a column, typically represented by an element of the ```cols``` object from a ```dataConfig``` object.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var cityNames = Analyser.getCol(rows, cols.NAME);

console.log(cityNames);
```

*Output:*

```javascript
['Auckland', 'Tāupo', 'Hamburg', 'Sydney', 'Hamilton', 'Wellington', 'Christchurch', 'Dunedin', 'Tauranga']
```

#### addCol

```javascript
addCol(rows, col)
```

Adds a new column to the set of rows, and returns the index of the new column so it can be added to the ```cols``` object and used to continue accessing the new column.

```rows``` is an array of rows from a ```dataConfig``` object.

```col``` is an array of the same length as ```rows```.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var previousYearPopulation = Analyser.getCol(rows, cols.POPULATION);

previousYearPopulation.pop();
rows.shift();

cols.POPULATION_PREVIOUS = Analyser.addCol(rows, previousYearPopulation);

var table = Analyser.createSubTableString(rows, cols);
console.log(table);
```

*Output:*

|YEAR|POPULATION|POPULATION_PREVIOUS|
|----|----------|-------------------|
|1992|3552200|3516000|
|1993|3597800|3552200|
|1994|3648300|3597800|
|1995|3706700|3648300|
|1996|3762300|3706700|
|1997|3802700|3762300|
|1998|3829200|3802700|
|1993|3851100|3829200|
|2000|3873100|3851100|
|2001|3916200|3873100|
|2002|3989500|3916200|
|2003|4061600|3989500|
|2004|4114300|4061600|
|2005|4161000|4114300|
|2006|4209100|4161000|
|2007|4245700|4209100|
|2008|4280300|4245700|
|2009|4332100|4280300|
|2010|4373900|4332100|
|2011|4399400|4373900|
|2012|4425900|4399400|
|2013|4475800|4425900|
|2014|4554600|4475800|
|2015|4647300|4554600|
|2016|4747200|4647300|
|2017|4844400|4747200|

#### getDerivedCol

```javascript
getDerivedCol(rows, processFn, optionalCol1, optionalCol2, optionalColN)
```

Creates a column of data that is the result of passing an individual row and any number of optional values from specified columns into a processing function. This does not modify the existing ```rows``` data.

```rows``` is an array of rows from a ```dataConfig``` object.

```processFn``` is a function of the form ```fn(row, optionalValue1, optionalValue2, optionalValueN)```

```optionalCol1, optionalCol2, optionalColN``` are any number of column arrays. These can be created for example by the ```getCol``` or ```getDerivedCol``` methods. Because columns that already exist as part of the ```rows``` object, these parameters are only necessary for previously created derived columns that have not been added to the rows via ```addDerivedCol```.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var getRawPopulation = function (rows) {
	// The population column in the spreadsheet is in thousands
	return rows[cols.POPULATION] * 1000;
};

var rawPopulation = Analyser.getDerivedCol(rows, getRawPopulation);

console.log(rawPopulation);
```

*Output:*

```javascript
[1614000, 32907, 8281000, 1810000, 4841000, 161200, 381900, 363926, 114347, 110338]
```

#### addDerivedCol

```javascript
addDerivedCol(rows, processFn, optionalCol1, optionalCol2, optionalColN)
```

```Creates a new column as per ```getDerivedCol```, then passes it in to ```addCol``` and returns the index of the new column.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var getRawPopulation = function (rows) {
	// Population stored in thousands
	return rows[cols.POPULATION] * 1000;
};

cols.POPULATION_RAW = Analyser.addDerivedCol(rows, getRawPopulation);

var table = Analyser.createSubTableString(rows, cols);
console.log(table);
```

*Output:*

|NAME|COUNTRY|POPULATION|CAPITAL|PUBLIC_TRANSPORT|POPULATION_RAW|
|----|-------|----------|-------|----------------|--------------|
|Auckland|New Zealand|1614|false|Bus,Train|1614000|
|Tāupo|Aotearoa|32.907|false|Bus,Train|32907|
|Hamburg|Germany|1810|false|Bus,Train,Ferry|1810000|
|Sydney|Australia|4841|false|Bus,Train,Ferry|4841000|
|Hamilton|New Zealand|161.2|false|Bus|161200|
|Wellington|New Zealand|381.9|true|Bus,Train,Ferry,Cable Car|381900|
|Christchurch|New Zealand|363.926|false|Bus|363926|
|Dunedin|New Zealand|114.347|false|Bus|114347|
|Tauranga|New Zealand|110.338|false|Bus|110338|

#### createSubTable

```javascript
createSubTable(rows, cols)
```

Creates an object suitable for passing into ```console.table```, using the rows in ```rows``` and the columns defined in ```cols```. Depending on the size of your data, it may be useful to create a smaller ```cols``` object that does not contain every row to pass in here.

```rows``` is an array of rows from a ```dataConfig``` object.

```cols``` is a columns object as created for a ```fileConfig``` object.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var summaryCols = {
	NAME: cols.NAME,
	POPULATION: cols.POPULATION
};

var summaryTable = Analyser.createSubTable(rows, summaryCols);
console.table(summaryTable);
```

*Output:*

|(index)|NAME|POPULATION|
|-------|----|----------|
|0|Auckland|1614|
|1|Tāupo|32.907|
|3|Hamburg|1810|
|4|Sydney|4841|
|5|Hamilton|161.2|
|6|Wellington|381.9|
|7|Christchurch|363.926|
|8|Dunedin|114.347|
|9|Tauranga|110.338|

#### createSubTableString

```javascript
createSubTableString(rows, cols)
```

Calls ```createSubTable``` and converts the result into a string that separates cells by tabs and rows by newlines, so it can be copied and pasted into a spreadsheet.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var summaryCols = {
	NAME: cols.NAME,
	POPULATION: cols.POPULATION
};

var summaryTableString = Analyser.createSubTableString(rows, summaryCols);
console.log(summaryTableString);
```

*Output:*

|NAME|POPULATION|
|----|----------|
|Auckland|1614|
|Tāupo|32.907|
|Hamburg|1810|
|Sydney|4841|
|Hamilton|161.2|
|Wellington|381.9|
|Christchurch|363.926|
|Dunedin|114.347|
|Tauranga|110.338|

#### getColSummary

```javascript
getColSummary(rows, cols, aliasList)
```

Returns an object containing a count of each time a value occurred in one or more columns, optionally counting values as being the same if specified in an optional set of aliases.

```rows``` is an array of rows from a ```dataConfig``` object.

```cols``` is either the index of a single column, or an array of indices of multiple columns. If an array is passed in, the summary object will contain a combined count for all specified columns.

```aliasList``` (optional) is an object specifying aliases as used in a ```fileConfig``` object. If an ```aliasList``` is passed in, the count in the summary object will combine values in a single alias into the same count, and report them using the label of the alias.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;
var aliases = dataConfig.aliases;

var countrySummary = Analyser.getColSummary(rows, cols.COUNTRY);
console.log(countrySummary);

var countrySummaryWithAliases = Analyser.getColSummary(rows, cols.COUNTRY, aliases.COUNTRY);
console.log(countrySummaryWithAliases);
```

*Output:*

```javascript
{
	New Zealand: 6,
	Aotearoa: 1,
	Germany: 1,
	Australia: 1
}
```

```javascript
{
	New Zealand: 7,
	Germany: 1,
	Australia: 1
}
```

#### getColAsDataSeries

```javascript
getColAsDataSeries(rows, col, labels)
```

Returns a ```dataSeries``` array as used by [Charter](#Charter). Each element in the output array will be the count of the number of rows containing a value in the specified column that matches the value in the element of the ```labels``` array at the same index.

```rows``` is an array of rows from a ```dataConfig``` object.

```col``` is the index of a single column.

```labels``` is an array of labels, where each label is a value that appears in some cells in the specified column.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var labels = Analyser.getCol(rows, cols.COUNTRY);

var dataSeries = Analyser.getColAsDataSeries(rows, cols.COUNTRY, labels);
console.log(dataSeries);
```

*Output:*

```javascript
[6, 1, 1, 1, 1, 0, 0, 0, 0, 0]
```

#### getComparisonSummary

```javascript
getComparisonSummary(rows, headerCol, headerAliases, varCol, varAliases)
```

Creates an object that can be used with ```console.table``` with the values of ```headerCol``` used in the header, and the values of ```varCol``` used for each row, with the cells denoting the number of times these values coincided.

```rows``` is an array of rows from a ```dataConfig``` object.

```headerCol``` is the index of the column whose values will be used for each column in the comparison summary table.

```headerAliases``` (optional) is a set of aliases as used for a ```fileConfig``` object, to be applied to the values of ```headerCol```.

```varCol``` is the index of a column whose values will be used for each row in the comparison summary table;

```varAliases``` (optional) is a set of aliases as used for a ```fileConfig``` object, to be applied to the values of ```varCol```.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;
var aliases = dataConfig.aliases;

var capitalTable = Analyser.getComparisonSummary(rows, cols.COUNTRY, aliases.COUNTRY, cols.CAPITAL);

console.table(capitalTable);
```

*Output:*

|(index)|New Zealand|Germany|Australia|
|-------|-----------|-------|---------|
|false|6|1|1|
|true|1|0|0|

#### getComparisonSummaryString

```javascript
getComparisonSummaryString(rows, headerCol, headerAliases, varCol, varAliases)
```

Calls ```getComparisonSummary``` and converts the result into a string that separates cells by tabs and rows by newlines, so it can be copied and pasted into a spreadsheet.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;
var aliases = dataConfig.aliases;

var capitalTableString = Analyser.getComparisonSummaryString(rows, cols.COUNTRY, aliases.COUNTRY, cols.CAPITAL);

console.log(capitalTableString);
```

*Output:*

```
	New Zealand	Germany	Australia
false	6	1	1
true	1	0	0
```

### fileConfig

A ```fileConfig``` object is required by the ```loadFile``` function, and is used to determine how the data in a file is processed. It contains the following properties:

#### headerRows

```headerRows``` (optional) is the number of rows at the top of the CSV file that are not part of the data. These rows will be ignored when Analyser processes the file.

If not included, defaults to 0.

#### cols

```cols``` is an object where each key is the label to use for a column, and the value is the index of the column. ```Analyser.getColNumber``` can be used to convert letter-based spreadsheet column labels to numbers.

You don't need to include every column that is in a spreadsheet in the cols object. Any that you don't include will be ignored when processing the data, and not included in the output.

*Example:*

```javascript
var cols = {
	NAME: Analyser.getColNumber('A'),
	COUNTRY: Analyser.getColNumber('B'),
	POPULATION: Analyser.getColNumber('C'),
	CAPITAL: Analyser.getColNumber('D')
};
```

#### arrayCols

```arrayCols``` is an object where each element's key is the index of a column, and its value is either null or a string.

It represents the columns in a CSV whose cells contain multiple values, separated by some delimiter. The value of an ```arrayCols``` element is the delimiter used to separate values in these cells. If a delimiter is not defined here, a single space character is used by default.

*Example:*

```javascript
// Assuming cells in the PET_NAMES column can have values such as 'Snuffles,Rex,Boss Bird'

var arrayCols = {};
arrayCols[fileConfig.cols.PUBLIC_TRANSPORT] = ',';
```

#### aliases

```aliases``` (optional) is an object where each property, which must share its name with a column as defined in the ```cols``` object, is an array of arrays. Each array represents a set of values that should be considered to belong to the same set.

The first value in an array of aliases should be considered the label of the set of aliases. This label does not need to appear in the data itself.

A value can appear in multiple alias arrays. If it does, it may be counted multiple times as it will be considered a member of all sets simultaneously.

*Example:*

```javascript
var aliases = {
	COUNTRY: [
		['New Zealand', 'Aotearoa']
	]
};
```

#### enumsMap

```enumsMap``` (optional) is an object where each property, which must share its name with a column as defined in the ```cols``` object, is an array of column indices. This map is used when creating the ```enums``` object available when analysing data, and tells the processor that enums from the columns in each array should be combined into the same set.

In this example, with data from ```city examples.csv```, instead of collecting a separate set of enums for both the ```MAYOR_2012``` and ```MAYOR_2018``` columns, Analyser collects a single set of enums labelled ```MAYOR```. This way there is a single list, and values that exist in both ```MAYOR_2012``` and ```MAYOR_2018``` columns, such as "Dave Cull", exist only once in the combined set of enums.

The enums that are collected in data processing this way can be useful in generating labels for graphs, for example.

*Example:*

```javascript
var enumsMap = {
	MAYOR: [cols.MAYOR_2012, cols.MAYOR_2018];
}
```

*Output:*

```javascript
// dataConfig.enums
{
	NAME: [
		'Auckland', 'Tāupo', 'Hamburg', 'Sydney', 'Hamilton', 'Wellington', 'Christchurch', 'Dunedin', 'Tauranga'
	],
	'COUNTRY': [
		'New Zealand', 'Aotearoa', 'Germany', 'Australia'
	],
	'POPULATION': [
		1614, 32.907, 1810, 4841, 161.2, 381.9, 363.926, 114.347, 110.338
	],
	'CAPITAL': [
		'false', 'true'
	],
	'PUBLIC_TRANSPORT': [
		'Bus', 'Train', 'Ferry', 'Cable Car'
	],
	'MAYOR': [
		'Len Brown', 'Phil Goff', 'Rick Cooper', 'David Trewavas', 'Olaf Scholz', 'Katharina Fegebank', 'Peter Tschentscher', 'Clover Moore', 'Julia Hardaker', 'Andrew King', 'Celia Wade-Brown', 'Justin Lester', 'Bob Parker', 'Lianne Dalziel', 'Dave Cull', 'Stuart Crosby', 'Greg Brownless'
	]
}
```

### dataConfig

A ```dataConfig``` object is created by data processing functions, and is used for analysing processed data. It contains the following properties:

#### cols

```cols``` is the cols object from the ```fileConfig``` passed in to ```loadFile```.

#### rows

```rows``` is an array of arrays, where each element in the outer array represents a row in the processed CSV and each element in an inner array represents a cell in the processed CSV. The index of each element in a row is determined by the value associated with its column in the ```cols``` object, and should be accessed using it:

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var firstRowName = rows[0][cols.NAME];

console.log(firstRowName);
```

*Output:*

```
Auckland
```

#### aliases

```aliases``` is the aliases object from the ```fileConfig``` used to process this data. See the section on (filters)[filters] for examples on how aliases can be used once the data has been processed.

#### enums

```enums``` is an object where each element, which shares a name with each element of the ```cols``` object, is an array of all values that can be found in that column. If an ```enumsMap``` is used, enums collected for multiple columns can be combined into one set.

*Example:*

```javascript
// dataConfig.enums
{
	NAME: [
		'Auckland', 'Tāupo', 'Hamburg', 'Sydney', 'Hamilton', 'Wellington', 'Christchurch', 'Dunedin', 'Tauranga'
	],
	'COUNTRY': [
		'New Zealand', 'Aotearoa', 'Germany', 'Australia'
	],
	'POPULATION': [
		1614, 32.907, 1810, 4841, 161.2, 381.9, 363.926, 114.347, 110.338
	],
	'CAPITAL': [
		'false', 'true'
	],
	'PUBLIC_TRANSPORT': [
		'Bus', 'Train', 'Ferry', 'Cable Car'
	],
	'MAYOR': [
		'Len Brown', 'Phil Goff', 'Rick Cooper', 'David Trewavas', 'Olaf Scholz', 'Katharina Fegebank', 'Peter Tschentscher', 'Clover Moore', 'Julia Hardaker', 'Andrew King', 'Celia Wade-Brown', 'Justin Lester', 'Bob Parker', 'Lianne Dalziel', 'Dave Cull', 'Stuart Crosby', 'Greg Brownless'
	]
}
```

#### filters

```filters``` is an object containing a set of filter functions that use the aliases from the ```fileConfig``` object used to process this data. It contains the following filter functions:

##### filterRows

```javascript
filterRows(rows, orToggle, colIndex1, values1, colIndex2, values2, colIndexN, valuesN)
```

Filters a set of rows, using either an OR filter or an AND filter, by looking at the values of one or more specified columns. These column indices and values are passed as one or more pairs.

If a column was specified in the ```arrayCols``` object in the ```fileConfig``` that informed how this data was processed, ```filterRows``` will check all values in each of its cells, and if any of them match then the row will pass the filter.

It returns a new ```rows``` array.

```rows``` is an array of rows from a ```dataConfig``` object.

```orToggle``` (optional) is a boolean value specifying whether or not the filter should be an OR filter. Defaults to false if not passed.

```colIndex1, ..., colIndex2, ..., colIndexN``` are each the index of columns. Any number of them may be passed, but they must each be matched by a values argument.

```values1, ..., values2, ..., valuesN``` are each either a single value to filter by, an array of values to filter by (if the value of a cell matches any value in this array, it will pass the filter), or a function that takes in the value of a cell and returns a boolean value.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;
var filterRows = dataConfig.filters.filterRows;

// Filtering a single column by a single value, using aliases
var newZealandCities = filterRows(rows,
	cols.COUNTRY, 'New Zealand'
);
console.log(Analyser.getCol(newZealandCities, cols.NAME));

// Filtering an array column
var citiesWithTrains = filterRows(rows,
	cols.PUBLIC_TRANSPORT, 'Train'
);
console.log(Analyser.getCol(citiesWithTrains, cols.NAME));

// Filtering a single column by multiple values
var australasiaCities = filterRows(rows,
	cols.COUNTRY, ['New Zealand', 'Australia']
);
console.log(Analyser.getCol(australasiaCities, cols.NAME));

// Filtering with a function
var largerCities = filterRows(rows,
	cols.POPULATION, a => a >= 300
);
console.log(Analyser.getCol(largerCities, cols.NAME));

// Applying multiple filters (AND)
var largeCapitalCities = filterRows(rows,
	cols.POPULATION, a => a >= 1000,
	cols.CAPITAL, a => a === 'true'
);
console.log(Analyser.getCol(largeCapitalCities, cols.NAME));

// Applying multiple filters (OR)
var largeOrCapitalCities = filterRows(rows, true,
	cols.POPULATION, a => a >= 1000,
	cols.CAPITAL, a => a === 'true'
);
console.log(Analyser.getCol(largeOrCapitalCities, cols.NAME));
```

*Output:*

```javascript
['Auckland', 'Tāupo', 'Hamilton', 'Wellington', 'Christchurch', 'Dunedin', 'Tauranga']
['Auckland', 'Tāupo', 'Hamburg', 'Sydney', 'Wellington']
['Auckland', 'Tāupo', 'Sydney', 'Hamilton', 'Wellington', 'Christchurch', 'Dunedin', 'Tauranga']
['Auckland', 'Hamburg', 'Sydney', 'Wellington', 'Christchurch']
[]
['Auckland', 'Hamburg', 'Sydney', 'Wellington']
```

##### filterRowsAnd

```javascript
filterRowsAnd(rows, colIndex1, values1, colIndex2, values2, colIndexN, valuesN)
```

Identical to the ```filterRows``` function, but without the ```andToggle``` argument. Because this parameter of ```filterRows``` defaults to true, ```filterRows``` can be used in exactly the same way as ```filterRowsAnd```.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;
var filterRowsAnd = dataConfig.filters.filterRowsAnd;

var newZealandCapital = filterRowsAnd(rows,
	cols.COUNTRY, 'New Zealand',
	cols.CAPITAL, a => a === 'true'
);
console.log(Analyser.getCol(newZealandCapital, cols.NAME));
```

*Output:*

```javascript
['Wellington']
```

##### filterRowsOr

```javascript
filterRowsOr(rows, colIndex1, values1, colIndex2, values2, colIndexN, valuesN)
```

Identical to the ```filterRows``` function, but without the ```andToggle``` argument and applying an OR filter.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;
var filterRowsOr = dataConfig.filters.filterRowsOr;

var largeOrCapitalCities = filterRowsOr(rows,
	cols.POPULATION, a => a >= 1000,
	cols.CAPITAL, a => a === 'true'
);
console.log(Analyser.getCol(largeOrCapitalCities, cols.NAME));
```

*Output:*

```javascript
['Auckland', 'Hamburg', 'Sydney', 'Wellington']
```

## Charter

### Use

Charter contains methods for generating HTML charts. These charts are intended to be accompanied by the CSS generated for them via ```_chart.scss```.

These methods take in a ```chartData``` object, a ```numericAxisConfig``` for the independent axis, and a ```qualitativeAxisConfig``` for the dependent axis. The ```chartData``` object in turn contains an array of ```dataSeries``` objects.

Some properties of these objects are only used by some types of charts.

#### chartData

```javascript
{
	title: 'Chart title',
	showLegend: true,
	showTooltips: true,
	labels: ['Label 1', 'Label 2'],
	dataSeries: [
		{
			name: 'dataSeriesName',
			color: '#fff',
			dataPoints: [1, 2]
		}
	],
	stacked: true,
	horizontal: true,
	smoothing: 2
}
```

```title``` is a string that will appear above the chart.

```showLegend``` is a boolean value that, if true, will cause a legend to be rendered between the title and the chart.

```showTooltips``` is a boolean value used only for bar charts. If true, the value of each bar will always be display at the end of each bar.

If false, this value will only be shown when a bar is hovered over or is clicked on (the tooltip will remain shown so long as the bar retains keyboard focus).

```labels``` is an array of strings to be used as the labels on the independent axis.

```dataSeries``` is an array of ```dataSeries``` objects.

```stacked``` is a boolean value used only for bar charts. If true, multiple ```dataSeries``` will be displayed as bars stacked on top of one another, instead the default display of having them next to each other within the same label.

```horizontal``` is a boolean value used only for bar charts. If true, the independent axis will be the vertical axis, with bars extending from left to right instead of from top to bottom.

```smoothing``` is an integer used only for line graphs and scatter plots. If set, the data will be smoothed using a rolling average of the specified size.

#### dataSeries

```javascript
{
	name: 'dataSeriesName',
	color: '#fff',
	dataPoints: [1, 2]
}
```

```name``` is a string that will be used in a legend if one is shown.

```color``` is the colour used to denote the data in this ```dataSeries``` on the chart. If unset, it will default to the colour set in the CSS (#999 in this project).

```dataPoints``` is an array of numbers - the data you want to draw on the chart.

#### numericAxisConfig

```javascript
{
	values: 5,
	valuesAt: [],
	gridlines: null,

	showTooltips: false,

	toFixed: 0,
	percentage: false,

	roundTo: null,

	min: 0,
	max: null
}
```

#### qualitativeAxisConfig

```javascript
{
	valuesEvery: 1,
	valuesSkip: 0,

	gridlinesEvery: null,
	gridlinesSkip: null
}
```

### Methods

- [createTable](#createTable)
- [createBarChart](#createBarChart)
- [createLineGraph](#createLineGraph)
- [createScatterPlot](#createScatterPlot)
- [updateBarChart](#updateBarChart)

#### createTable

```javascript
createTable(rows, cols)
```

Creates an HTML string of a table containing the data it received.

```rows``` is an array of rows from a ```dataConfig``` object.

```cols``` is a columns object as created for a ```fileConfig``` object.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var table = Charter.createTable(rows, cols);

document.getElementById('chart-area').innerHTML = table;
```

*Output:*

```
```

#### createBarChart

```javascript
createBarChart(chartData, dependentAxisConfig, independentAxisConfig)
```

Creates a jQuery object of an element containiner a bar chart, which can be inserted into the DOM.

```chartData``` is a ```chartData``` object.

```dependentAxisConfig``` is a ```numericAxisConfig``` object.

```independentAxisConfig``` is a ```qualitativeAxisConfig``` object.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var chartData;

var dependentAxisConfig;
var independentAxisConfig;

var chart;

var cityNames = Analyser.getCol(rows, cols.NAME);

chartData = {
	title: 'City Populations',
	showTooltips: true,
	labels: cityNames,
	dataSeries: [
		{
			dataPoints: Analyser.getCol(rows, cols.POPULATION)
		}
	]
};

dependentAxisConfig = {
	horizontal: true,
	roundTo: 100,
	values: 2
};

chart = Charter.createBarChart(chartData, dependentAxisConfig);

$('#chart-area').append(chart);
```

*Output:*

```
```

#### createLineGraph

```javascript
createLineGraph(chartData, dependentAxisConfig, independentAxisConfig)
```

Creates a jQuery object of an element containiner a line graph, which can be inserted into the DOM.

```chartData``` is a ```chartData``` object.

```dependentAxisConfig``` is a ```numericAxisConfig``` object.

```independentAxisConfig``` is a ```qualitativeAxisConfig``` object.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var chartData;

var dependentAxisConfig;
var independentAxisConfig;

var chart;

var years = Analyser.getCol(rows, cols.YEAR);
var population = Analyser.getCol(rows, cols.POPULATION);

chartData = {
	title: 'Auckland city population over time',
	showLegend: true,
	labels: years,
	dataSeries: [
		{
			name: 'Population',
			color: '#f00',
			dataPoints: population
		},
		{
			name: 'Population linear fit',
			color: 'rgba(255, 255, 255, 0.5)',
			dataPoints: Stats.linearLeastSquares(population)
		}
	]
};

dependentAxisConfig	= {
	values: 5,
	roundTo: 1000000,
	min: null
};

independentAxisConfig = {
	valuesEvery: 2
};

chart = Charter.createLineGraph(
	chartData,
	dependentAxisConfig,
	independentAxisConfig
);

$('#chart-area').append(chart);
```

*Output:*

```
```

#### createScatterPlot

```javascript
createScatterPlot(chartData, dependentAxisConfig, independentAxisConfig)
```

Creates a jQuery object of an element containiner a line graph, which can be inserted into the DOM.

```chartData``` is a ```chartData``` object.

```dependentAxisConfig``` is a ```numericAxisConfig``` object.

```independentAxisConfig``` is a ```qualitativeAxisConfig``` object.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var chartData;

var dependentAxisConfig;
var independentAxisConfig;

var chart;

var years = Analyser.getCol(rows, cols.YEAR);
var population = Analyser.getCol(rows, cols.POPULATION);

chartData = {
	title: 'Auckland city population over time',
	showLegend: true,
	labels: years,
	dataSeries: [
		{
			name: 'Population',
			color: '#f00',
			dataPoints: population
		},
		{
			name: 'Population linear fit',
			color: 'rgba(255, 255, 255, 0.5)',
			dataPoints: Stats.linearLeastSquares(population)
		}
	]
};

dependentAxisConfig	= {
	values: 5,
	roundTo: 10000,
	min: null
};

independentAxisConfig = {
	valuesEvery: 2
};

chart = Charter.createScatterPlot(
	chartData,
	dependentAxisConfig,
	independentAxisConfig
);

$('#chart-area').append(chart);
```

*Output:*

```
```

#### updateBarChart

```javascript
updateBarChart(chart, data, titleText)
```

Updates the values and optionally the title of an existing bar chart, using jQuery and d3.

```chart``` is an ```Element``` object, which will be converted into a jQuery object via ```$(chart)```.

```data``` is an array of numbers, corresponding to the values of each bar in the chart being updated.

```titleText``` is an optional string to replace the current title of the chart.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var chartData;

var dependentAxisConfig;
var independentAxisConfig;

var chart;

var cityNames = Analyser.getCol(rows, cols.NAME);

chartData = {
	title: 'City Populations',
	showTooltips: true,
	labels: cityNames,
	dataSeries: [
		{
			dataPoints: Analyser.getCol(rows, cols.POPULATION)
		}
	]
};

dependentAxisConfig = {
	roundTo: 100,
	values: 2
};

chart = Charter.createBarChart(chartData, dependentAxisConfig);

$('#chart-area').append(chart);

window.setTimeout(function () {
	Charter.updateBarChart(chart[0], [1, 2, 3, 4, 5, 6, 7, 8, 9], 'New title');
}, 1000);
```

*Output:*

```
```

## Stats

### Use

```Stats``` contains a number of utility functions for common tasks when dealing with sets of numbers.

### Methods

- [sum](#sum)
- [mean](#mean)
- [median](#median)
- [variance](#variance)
- [sd](#sd)
- [max](#max)
- [min](#min)
- [intRange](#intRange)
- [linearLeastSquares](#linearLeastSquares)
- [r](#r)
- [r2](#r2)
- [smooth](#smooth)
- [chunk](#chunk)

#### sum

```javascript
sum(values)
```

Returns the sum of the set of numbers in the ```values``` array.

```values``` is an array of numbers.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var populations = Analyser.getCol(rows, cols.POPULATION);
var totalPopulation = Stats.sum(populations);

console.log(populations);
console.log(totalPopulation);
```

*Output:*

```
[1614, 32.907, 1810, 4841, 161.2, 381.9, 363.926, 114.347, 110.338]
9429.617999999999
```

#### mean

```javascript
mean(values)
```

Calculates the mean average of the set of numbers in the ```values``` array.

```values``` is an array of numbers.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var populations = Analyser.getCol(rows, cols.POPULATION);
var meanPopulation = Stats.mean(populations);

console.log(populations);
console.log(meanPopulation);
```

*Output:*

```
[1614, 32.907, 1810, 4841, 161.2, 381.9, 363.926, 114.347, 110.338]
1047.735333333333
```

#### median

```javascript
median(values)
```

Calculates the median average of the set of numbers in the ```values``` array.

```values``` is an array of numbers.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var populations = Analyser.getCol(rows, cols.POPULATION);
var medianPopulation = Stats.median(populations);

console.log(populations);
console.log(medianPopulation);
```

*Output:*

```
[1614, 32.907, 1810, 4841, 161.2, 381.9, 363.926, 114.347, 110.338]
363.926
```

#### variance

```javascript
variance(values)
```

Calculates the variance of the set of numbers in the ```values``` array.

```values``` is an array of numbers.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var populations = Analyser.getCol(rows, cols.POPULATION);
var populationVariance = Stats.variance(populations);

console.log(populations);
console.log(populationVariance);
```

*Output:*

```
[1614, 32.907, 1810, 4841, 161.2, 381.9, 363.926, 114.347, 110.338]
2470905.1007927503
```

#### sd

```javascript
sd(values)
```

Calculates the standard deviation of the set of numbers in the ```values``` array.

```values``` is an array of numbers.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var populations = Analyser.getCol(rows, cols.POPULATION);
var populationSD = Stats.sd(populations);

console.log(populations);
console.log(populationSD);
```

*Output:*

```
[1614, 32.907, 1810, 4841, 161.2, 381.9, 363.926, 114.347, 110.338]
1571.9112890976864
```

#### max

```javascript
max(values)
```

Calculates the maximum of the set of numbers in the ```values``` array.

```values``` is an array of numbers.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var populations = Analyser.getCol(rows, cols.POPULATION);
var populationMax = Stats.max(populations);

console.log(populations);
console.log(populationMax);
```

*Output:*

```
[1614, 32.907, 1810, 4841, 161.2, 381.9, 363.926, 114.347, 110.338]
4841
```

#### min

```javascsript
min(values)
```

Calculates the minimum of the set of numbers in the ```values``` array.

```values``` is an array of numbers.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var populations = Analyser.getCol(rows, cols.POPULATION);
var min = Stats.min(populations);

console.log(populations);
console.log(min);
```

*Output:*

```
[1614, 32.907, 1810, 4841, 161.2, 381.9, 363.926, 114.347, 110.338]
32.907
```

#### intRange

```javascript
intRange(start, finish)
```

Creates an array of integers from a ```start``` value to a ```finish``` value.

```start``` is a number. If it isn't an integer, it will be converted to one first via ```Math.round```.

```finish``` is a number. If it isn't an integer, it will be converted to one first via ```Math.round```.

*Example:*

```javascript
var intRange = Stats.intRange(0, 20);

console.log(intRange);
```

*Output:*

```
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
```

#### linearLeastSquares

```javascript
linearLeastSquare(y, x)
```

Creates a linear regression fit for a set of data using the "least squares" method.

```y``` is an array of values representing the data that will be fit.

```x``` is an optional array of values representing the independent axis value for a given value in the ```y``` array. This is only necessary if the values in the ```y``` array are not evenly distributed across (e.g. one data point per year for a time series).

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var chartData;

var dependentAxisConfig;
var independentAxisConfig;

var chart;

var years = Analyser.getCol(rows, cols.YEAR);
var population = Analyser.getCol(rows, cols.POPULATION);

var linearFit = Stats.linearLeastSquares(population);

chartData = {
	title: 'Auckland city population over time',
	showLegend: true,
	labels: years,
	dataSeries: [
		{
			name: 'Population',
			color: '#f00',
			dataPoints: population
		},
		{
			name: 'Population linear fit',
			color: 'rgba(255, 255, 255, 0.5)',
			dataPoints: linearFit
		}
	]
};

dependentAxisConfig	= {
	values: 5,
	roundTo: 1000000,
	min: null
};

independentAxisConfig = {
	valuesEvery: 2
};

chart = Charter.createLineGraph(
	chartData,
	dependentAxisConfig,
	independentAxisConfig
);

$('#chart-area').append(chart);
```

*Output:*

#### r

```javascript
r(y, x)
```

Calculates the Pearson Correlation Coefficient between two sets of data of equal length.

```y``` is an array of values.

```x``` is an array of values of equal length to ```y```.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var years = Analyser.getCol(rows, cols.YEAR);
var population = Analyser.getCol(rows, cols.POPULATION);

var linearFit = Stats.linearLeastSquares(population);

var r = Stats.r(linearFit, population);

console.log(r);
```

*Output:*

```
0.9946786305281776
```

#### r2

```javascript
r2(y, x)
```

Calculates the r<sup>2</sup> value of a regression model, equivalent to the square of the Pearson Correlation Coefficient calculated by ```r```.

```y``` is an array of values.

```x``` is an array of values of equal length to ```y```.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var years = Analyser.getCol(rows, cols.YEAR);
var population = Analyser.getCol(rows, cols.POPULATION);

var linearFit = Stats.linearLeastSquares(population);

var r2 = Stats.r2(linearFit, population);

console.log(r2);
```

*Output:*

```
0.9893855780294109
```

#### smooth

```javascript
smooth(y, smoothness)
```

Smooths an array of data by converting it into a rolling average using a number of points based on its ```smoothness``` argument. The output array will be shorter than the input ```y``` array by one less than the value of ```smoothness```.

```y``` is an array of values.

```smoothness``` is an integer between ```1``` and the length of ```y``` (using a value of ```1``` will return the input ```y``` array).

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var chartData;

var dependentAxisConfig;
var independentAxisConfig;

var chart;

var years = Analyser.getCol(rows, cols.YEAR);
var population = Analyser.getCol(rows, cols.POPULATION);

var smoothness = 5;
var smoothed = Stats.smooth(population, smoothness);

chartData = {
	title: 'Auckland city population over time',
	showLegend: true,
	labels: years.slice((smoothness-1)),
	dataSeries: [
		{
			name: 'Smoothed population',
			color: 'rgba(255, 255, 255, 0.5)',
			dataPoints: smoothed
		}
	]
};

dependentAxisConfig	= {
	values: 5,
	roundTo: 1000000,
	min: null
};

independentAxisConfig = {
	valuesEvery: 2
};

chart = Charter.createLineGraph(
	chartData,
	dependentAxisConfig,
	independentAxisConfig
);

$('#chart-area').append(chart);
```

*Output:*

```
```

#### chunk

```javascript
chunk(y, chunkSize)
```

Converts an array of data into an array where each element is the sum of ```chunkSize``` elements of the input ```y``` array. This is useful, for example, for combining monthly data into yearly sums.

The input ```y```array should be evenly divisible by ```chunkSize```, and the output array will by ```1/chunkSize``` as long as the input array.

For example if ```chunkSize``` is ```3```, the output array will be one third as long as the input array, as each of its elements is the sum of ```3``` elements of the input array.

```y``` is an array of values.

```chunkSize``` is a positive integer.

*Example:*

```javascript
var rows = dataConfig.rows;
var cols = dataConfig.cols;

var chartData;

var dependentAxisConfig;
var independentAxisConfig;

var chart;

var chunkSize = 5;
// Make sure rows.length will be divisible by chunkSize after removing one
while (((rows.length-1) % chunkSize) !== 0) {
	rows.shift();
}

var lastYearPopulation = Analyser.getCol(rows, cols.POPULATION);

// Remove last "last year population" and first year's row, so the
// arrays line up as expected
lastYearPopulation.pop();
rows.shift();

var years = Analyser.getCol(rows, cols.YEAR);

cols.POPULATION_PREVIOUS = Analyser.addCol(rows, lastYearPopulation);
cols.POPULATION_INCREASE = Analyser.addDerivedCol(rows, (row) => (row[cols.POPULATION] - row[cols.POPULATION_PREVIOUS]));

var populationIncrease = Analyser.getCol(rows, cols.POPULATION_INCREASE);
var chunkedPopulationIncrease = Stats.chunk(populationIncrease, chunkSize);

var yearSets = [];
for (var i = 0; i < years.length; i += chunkSize) {
	yearSets.push(years[i] + '-' + years[i+(chunkSize-1)]);
}

chartData = {
	title: 'Auckland city population increase',
	showLegend: true,
	labels: yearSets,
	dataSeries: [
		{
			name: 'Population increase',
			dataPoints: chunkedPopulationIncrease
		}
	]
};

dependentAxisConfig	= {
	values: 5,
	min: 0
};

independentAxisConfig = {};

chart = Charter.createBarChart(
	chartData,
	dependentAxisConfig,
	independentAxisConfig
);

$('#chart-area').append(chart);
```

*Output:*

```
```



