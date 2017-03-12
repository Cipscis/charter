require(
	[
		'jquery',
		'd3',

		'charter/charter'
	],
	function ($, d3, Charter) {
		var fileLoaded = function (csv) {
			Charter.parseCsv(csv, fileParsed);
		};

		var fileParsed = function (rows) {
			// Create chart data

			var chartData,
				row, i,

				$barChart,
				$lineGraph,
				$table;

			// Extract data for remand vs. sentenced
			chartData = {
				title: 'Prisoner Population, ' + rows[1][0],
				data: [
					{
						label: rows[0][3],
						value: rows[1][3]
					},
					{
						label: rows[0][6],
						value: rows[1][6]
					}
				]
			};

			$barChart = Charter.createBarChart(chartData, {
				roundTo: 2000,
				gridlines: 2
			});
			$('.js-bar-chart').html($barChart);

			// Extract data for total prisoner population
			chartData = {
				title: 'Prisoner Population',
				data: [
				]
			};

			for (i = 1; i < 30; i++) {
				chartData.data.push({
					label: rows[i][0],
					value: rows[i][9]
				});
			}

			$lineGraph = Charter.createLineGraph(
				chartData,
				{
					values: 3,
					roundTo: 1000,
					min: null
				},
				{
					valuesEvery: 4
				}
			);
			$('.js-line-graph').html($lineGraph);

			$table = $(Charter.createTable(rows));
			$('.js-data-table').html($table);

			// d3 time animation stuff
			chartData = $barChart.data('chartData');
			var x = d3.scaleLinear()
				.domain([0, chartData.dependentAxis.values[chartData.dependentAxis.values.length-1].value])
				.range([0, 100]);

			var update = function (data, titleText) {
				var chart = d3.select('.js-bar-chart');
				var bar = chart.selectAll('.js-chart-bar')
					.data(data);

				var title = chart.selectAll('.js-chart-title')
					.data([titleText]);

				bar
					.style('height', function (d) { return x(d) + '%'; })
					.attr('title', function (d) { return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); });

				title
					.text(function (d) { return 'Prisoner Population, ' + d; });
			};

			i = 1;
			var interval = window.setInterval(function () {
				update([rows[i][3], rows[i][6]], [rows[i][0]]);
				i = (i + 1) % 30;

				if (i === 0) {
					window.clearInterval(interval);
				}
			}, 1000);
		};

		// Load and process CSV
		$.ajax({
			url: '/assets/data/Prison Population - raw.csv',
			success: fileLoaded
		});
	}
);