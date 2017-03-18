define(
	[
		'mappers/mappers'
	],

	function (Mappers) {
		// Callbacks for reduce
		var sum = function (s, v, i, arr) {
			return s + v;
		};

		var diffSquared = function (diffValue) {
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

			variance: function (values) {
				var mean,
					variance;

				mean = Stats.mean(values);

				variance = values.reduce(diffSquared(mean), 0);
				variance = variance / (values.length - 1);

				return variance;
			},

			sd: function (values) {
				// Standard Variation
				return Math.sqrt(Stats.variance(values));
			},

			pcc: function (y, x) {
				// Pearson Correlation Coefficient
				var xSum, ySum,
					xy, xySum,
					xx, xxSum,
					yy, yySum,
					pcc;

				xSum = x.reduce(sum, 0);
				ySum = y.reduce(sum, 0);

				xy = x.map(Mappers.timesArray(y));
				xySum = xy.reduce(sum, 0);

				xx = x.map(Mappers.timesArray(x));
				xxSum = xx.reduce(sum, 0);

				yy = y.map(Mappers.timesArray(y));
				yySum = yy.reduce(sum, 0);

				pcc = ((x.length * xySum) - (xSum * ySum)) / Math.sqrt(((x.length * xxSum) - Math.pow(xSum, 2)) * ((x.length * yySum) - Math.pow(ySum, 2)));

				return pcc;
			},

			linearLeastSquares: function (y, x) {
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

				r = Stats.pcc(y, x);
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
			}
		};

		return Stats;
	}
);