export default `<div class="chart {{#hasXLabel}}chart--has-x-label {{/hasXLabel}}{{#hasYLabel}}chart--has-y-label {{/hasYLabel}}js-chart">
	<span class="chart__title js-chart-title">{{{title}}}</span>
	{{#showLegend}}
		<dl class="chart__legend">
			{{#dataSeries}}
				<dd class="chart__legend-indicator" style="background-color: {{color}};"></dd>
				<dt class="chart__legend-name">{{name}}</dt>
			{{/dataSeries}}
		</dl>
	{{/showLegend}}

	<div class="chart__area">
		{{#dependentAxis.label}}
			<span class="chart__axis--v-label">{{.}}</span>
		{{/dependentAxis.label}}
		<ul class="chart__axis--v">
			{{#dependentAxis.values}}
				<li class="chart__axis-item js-chart-axis-label" style="bottom: {{percentage}}%;">
					<span class="chart__axis-label">{{displayValue}}</span>
				</li>
			{{/dependentAxis.values}}
		</ul>

		<ul class="chart__gridlines--h">
			{{#dependentAxis.gridlines}}
				<li class="chart__gridlines-item" style="bottom: {{percentage}}%;"></li>
			{{/dependentAxis.gridlines}}
		</ul>

		{{#independentAxis.label}}
			<span class="chart__axis--h-label">{{.}}</span>
		{{/independentAxis.label}}
		<ul class="chart__axis--h">
			{{#independentAxis.values}}
				<li class="chart__axis-item js-chart-axis-label" style="left: {{percentage}}%;">
					<span class="chart__axis-label">{{displayValue}}</span>
				</li>
			{{/independentAxis.values}}
		</ul>

		<ul class="chart__gridlines--v">
			{{#independentAxis.gridlines}}
				<li class="chart__gridlines-item" style="left: {{percentage}}%;"></li>
			{{/independentAxis.gridlines}}
		</ul>

		<div class="chart__lines-wrapper">
			<svg class="chart__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
				<g transform="translate(0, 100) scale(1, -1)">
					{{#dataSeries}}
						<polyline class="chart__line" points="{{#dataPoints}}{{index}},{{percentage}} {{/dataPoints}}" style="stroke: {{color}};"></polyline>
					{{/dataSeries}}
				</g>
			</svg>

			{{#dataSeries}}
			<ul class="chart__point-tooltips">
				{{#dataPoints}}
					<li class="chart__point-tooltip" style="left: {{index}}%; bottom: {{percentage}}%; background-color: {{color}};" tabindex="0">
						<span class="chart__point-tooltip-body"{{#hasColor}} style="border-color: {{color}};"{{/hasColor}}>
							{{#hasDataSeries}}<span class="chart-point__tooltip-series">{{dataSeries}}</span>{{/hasDataSeries}}
							<span class="chart-point__tooltip-label">{{label}}:</span>
							<span class="chart-point__tooltip-value">{{displayValue}}</span>
						</span>
					</li>
				{{/dataPoints}}
			</ul>
			{{/dataSeries}}
		</div>
	</div>
</div>`;