define([], function () {

	return {
		timesArray: function (array) {
			return function (val, index) {
				return val * array[index];
			};
		},
		overArray: function (array) {
			return function (val, index) {
				return val / array[index];
			};
		},
		times: function (number) {
			return function (val) {
				return val * number;
			};
		},
		over: function (number) {
			return function (val) {
				return val / number;
			};
		}
	};

});