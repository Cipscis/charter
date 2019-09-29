require.config({
	baseUrl: '/charter/app/assets/scripts/app/',
	paths: {
		'lib': '../lib',
		'util': '../util',
		'templates': '../../templates',

		'templayed': '../lib/templayed',
		'papaparse': '../lib/papaparse.min',
		'd3': '../lib/d3.min',

		'text': '../lib/require/text'
	},
	shim: {
		'templayed': {
			exports: 'templayed'
		},
		'papaparse': {
			exports: 'Papa'
		},
		'd3': {
			exports: 'd3'
		}
	}
});