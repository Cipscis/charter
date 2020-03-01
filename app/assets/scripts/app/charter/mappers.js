// Used as callbacks for Array.prototype.map

const mappers = {
	timesArray: function (array) {
		return (val, index) => val * array[index];
	},
	overArray: function (array) {
		return (val, index) => val / array[index];
	},
	times: function (number) {
		return (val) => val * number;
	},
	over: function (number) {
		return (val) => val / number;
	}
};

export default mappers;
