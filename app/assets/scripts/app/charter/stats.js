import Mappers from './mappers.js';

// Callbacks for reduce
const sum = (s, v, i, arr) => s + v;

const sumDiffSquared = function (diffValue) {
	return (s, v, i, arr) => s + Math.pow(v - diffValue, 2);
};

// Sorting callbacks
const numericalDesc = (a, b) => b-a;

const numericalAsc = (a, b) => a-b;

const Stats = {
	sum: (values) => values.reduce(sum, 0),

	mean: (values) => values.reduce(sum, 0) / values.length,

	median: function (values) {
		// Create a copy and sort it in place
		values = values.concat().sort(numericalAsc);

		if (values.length % 2) {
			// Odd number - return middle value
			return values[((values.length + 1) / 2) - 1];
		} else {
			// Even number - return mean of middle values
			return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2;
		}
	},

	variance: function (values) {
		let mean = Stats.mean(values);

		let variance = values.reduce(sumDiffSquared(mean), 0);
		variance = variance / (values.length - 1);

		return variance;
	},

	sd: (values) => Math.sqrt(Stats.variance(values)),

	max: function (values) {
		let maxValue = parseFloat(values[0]);

		for (let i = 1; i < values.length; i++) {
			let value = parseFloat(values[i]);
			if (value > maxValue || isNaN(maxValue)) {
				maxValue = value;
			}
		}

		return maxValue;
	},

	min: function (values) {
		let minValue = parseFloat(values[0]);

		for (let i = 1; i < values.length; i++) {
			let value = parseFloat(values[i]);
			if (value < minValue || isNaN(minValue)) {
				minValue = value;
			}
		}

		return minValue;
	},

	intRange: function (start, finish) {
		start = Math.round(start);
		finish = Math.round(finish);

		let range = [];

		if (finish > start) {
			for (let i = start; i <= finish; i++) {
				range.push(i);
			}
		} else {
			for (let i = start; i >= finish; i--) {
				range.push(i);
			}
		}

		return range;
	},

	linearLeastSquares: function (y, x) {
		// Takes in an array of values y, and optionally
		// an equal length array of values x (if x is
		// undefined it will be calculated as an even
		// distribution from 0 to 100 of equal length to y)
		// and calculates the corresponding y values for a
		// linear least squares regression fit, returning
		// an array of these values for the corresponding
		// values given in or calculated for x

		if (typeof x === 'undefined') {
			// If x is undefined, assume even distribution
			// from 0 to 100 of same length as y
			x = [];
			for (let i = 0; i < y.length; i++) {
				x.push(i / (y.length-1) * 100);
			}
		}

		let r = Stats.r(y, x);
		let sdY = Stats.sd(y);
		let sdX = Stats.sd(x);
		let yMean = Stats.mean(y);
		let xMean = Stats.mean(x);

		let b = r * sdY / sdX;
		let a = yMean - (b * xMean);

		let fitY = [];
		for (let i = 0; i < x.length; i++) {
			fitY.push(a + b*x[i]);
		}

		return fitY;
	},

	r: function (y, x) {
		// Calculates the Pearson Correlation Coefficient
		// between two equal length arrays of values
		// The order of inputs doesn't matter

		let xSum = x.reduce(sum, 0);
		let ySum = y.reduce(sum, 0);

		let xy = x.map(Mappers.timesArray(y));
		let xySum = xy.reduce(sum, 0);

		let xx = x.map(Mappers.timesArray(x));
		let xxSum = xx.reduce(sum, 0);

		let yy = y.map(Mappers.timesArray(y));
		let yySum = yy.reduce(sum, 0);

		let r = ((x.length * xySum) - (xSum * ySum)) / Math.sqrt(((x.length * xxSum) - Math.pow(xSum, 2)) * ((x.length * yySum) - Math.pow(ySum, 2)));

		return r;
	},


	// Accepts two equal length arrays of values:
	// y: the data points, and rY: the regression points
	// (order technically doesn't matter)

	// Calculates the r^2 of a regression model
	r2: (y, rY) => Math.pow(Stats.r(y, rY), 2),

	smooth: function (y, smoothness) {
		// Takes in an array of values y, and smooths
		// them by calculating a rolling average using
		// a number of data points based on the smoothness
		// value. If smoothness is 1, will return y

		let smoothY = [];
		let average = [];

		for (let i = 0; i < y.length; i++) {
			average.push(y[i]);

			while (average.length > smoothness) {
				average.splice(0, 1);
			}
			if (average.length === smoothness) {
				smoothY.push(Stats.mean(average));
			}
		}

		return smoothY;
	},

	chunk: function (y, chunkSize) {
		// Takes in an array of values y, and combines
		// them into a smaller array where each element
		// is the sum of chunkSize elements from y. Will
		// discard any extra elements of y left over if
		// chunkSize isn't a factor of the length of y

		let chunkY = [];

		for (let i = 0; i < y.length; i += chunkSize) {
			let chunk = 0;
			for (let j = 0; j < chunkSize; j++) {
				chunk += y[i+j];
			}
			chunkY.push(chunk);
		}

		return chunkY;
	}
};

export default {
	sum: Stats.sum,
	mean: Stats.mean,
	median: Stats.median,

	variance: Stats.variance,
	sd: Stats.sd,

	max: Stats.max,
	min: Stats.min,
	intRange: Stats.intRange,

	linearLeastSquares: Stats.linearLeastSquares,
	r: Stats.r,
	r2: Stats.r2,

	smooth: Stats.smooth,
	chunk: Stats.chunk
};
