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

		<ul class="chart__points">
			{{#dataSeries}}
				{{#dataPoints}}
					<li class="chart__point" style="bottom: {{percentage}}%; left: {{index}}%; border-color: {{color}}" title="{{displayValue}}"></li>
				{{/dataPoints}}
			{{/dataSeries}}
		</ul>
	</div>
</div>`;