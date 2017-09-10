define(
	[
		'mappers/mappers'
	],

	function (Mappers) {
		// Callbacks for reduce
		var sum = function (s, v, i, arr) {
			return s + v;
		};

		var sumDiffSquared = function (diffValue) {
			return function (s, v, i, arr) {
				return s + Math.pow(v - diffValue, 2);
			};
		};

		var variance = function (s, v, i, arr) {

		};

		var Stats = {
			mean: function (values) {
				return values.reduce(sum, 0) / values.length;
			},

			median: function (values) {
				// Create a copy and sort it in place
				values = values.concat().sort();

				if (values.length % 2) {
					// Odd number - return middle value
					return values[(values.length + 1) / 2];
				} else {
					// Even number - return mean of middle values
					return (values[values.length / 2] + values[(values.length / 2) + 1]) / 2;
				}
			},

			variance: function (values) {
				var mean,
					variance;

				mean = Stats.mean(values);

				variance = values.reduce(sumDiffSquared(mean), 0);
				variance = variance / (values.length - 1);

				return variance;
			},

			sd: function (values) {
				// Standard Variation
				return Math.sqrt(Stats.variance(values));
			},

			r: function (y, x) {
				// Calculates the Pearson Correlation Coefficient
				// between two equal length arrays of values
				// The order of inputs doesn't matter

				var xSum, ySum,
					xy, xySum,
					xx, xxSum,
					yy, yySum,
					r;

				xSum = x.reduce(sum, 0);
				ySum = y.reduce(sum, 0);

				xy = x.map(Mappers.timesArray(y));
				xySum = xy.reduce(sum, 0);

				xx = x.map(Mappers.timesArray(x));
				xxSum = xx.reduce(sum, 0);

				yy = y.map(Mappers.timesArray(y));
				yySum = yy.reduce(sum, 0);

				r = ((x.length * xySum) - (xSum * ySum)) / Math.sqrt(((x.length * xxSum) - Math.pow(xSum, 2)) * ((x.length * yySum) - Math.pow(ySum, 2)));

				return r;
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

				var i, fitY,

					r,
					sdY, sdX,
					yMean, xMean,
					a, b;

				if (typeof x === 'undefined') {
					// If x is undefined, assume even distribution from 0 to 100
					x = [];
					for (i = 0; i < y.length; i++) {
						x.push(i / (y.length-1) * 100);
					}
				}

				r = Stats.r(y, x);
				sdY = Stats.sd(y);
				sdX = Stats.sd(x);
				yMean = Stats.mean(y);
				xMean = Stats.mean(x);

				b = r * sdY / sdX;
				a = yMean - (b * xMean);

				fitY = [];
				for (i = 0; i < x.length; i++) {
					fitY.push(a + b*x[i]);
				}

				return fitY;
			},

			r2: function (y, rY) {
				// Accepts two equal length arrays of values:
				// y: the data points, and rY: the regression points
				// (order technically doesn't matter)

				// Calculates the r^2 of a regression model

				return Math.pow(Stats.r(y, rY), 2);
			}
		};

		return Stats;
	}
);