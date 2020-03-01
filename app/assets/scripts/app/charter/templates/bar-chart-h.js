export default `<div class="chart{{#showTooltips}} show-tooltips{{/showTooltips}} js-chart"
	data-charter-type="bar-horizontal"
	data-charter-axis-min="{{dependentAxis.data.min}}"
	data-charter-axis-max="{{dependentAxis.data.max}}"
	data-charter-axis-percentage="{{dependentAxis.data.percentage}}"
	data-charter-axis-to-fixed="{{dependentAxis.data.toFixed}}"
>
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
		<ul class="chart__axis--h">
			{{#dependentAxis.values}}
				<li class="chart__axis-item js-chart-axis-label" style="left: {{percentage}}%;">
					<span class="chart__axis-label">{{displayValue}}</span>
				</li>
			{{/dependentAxis.values}}
		</ul>

		<ul class="chart__gridlines--v">
			{{#dependentAxis.gridlines}}
				<li class="chart__gridlines-item" style="left: {{percentage}}%;"></li>
			{{/dependentAxis.gridlines}}
		</ul>

		<ul class="chart__axis--v">
		</ul>

		<ul class="chart__bar-groups--h{{#histogram}} chart__bar-groups--histogram{{/histogram}}">
			{{#stacked}}
				{{#dataSeriesByLabel}}
					<li class="chart__bar-group">
						<ul class="chart__bar-group-bars chart__bar-group-bars--stacked">
							{{#dataPoints}}
								<li class="chart__bar" style="flex-basis: {{percentage}}%;">
									<div class="chart__bar-area js-chart-bar" style="background: {{color}};" title="{{displayValue}}" tabindex="0" data-label="{{label}}">
										<span class="chart__bar-tooltip js-chart-tooltip"{{#hasColor}} style="border-color: {{color}};"{{/hasColor}}>
											{{#hasDataSeries}}<span class="chart-bar__tooltip-series">{{dataSeries}}</span>{{/hasDataSeries}}
											<span class="chart-bar__tooltip-label">{{label}}:</span>
											<span class="chart-bar__tooltip-value">{{displayValue}}</span>
										</span>
									</div>
								</li>
							{{/dataPoints}}
						</ul>
						<span class="chart__bar-label">{{label}}</span>
					</li>
				{{/dataSeriesByLabel}}
			{{/stacked}}
			{{^stacked}}
				{{#dataSeriesByLabel}}
					<li class="chart__bar-group">
						<ul class="chart__bar-group-bars">
							{{#dataPoints}}
								<li class="chart__bar">
									<div class="chart__bar-area js-chart-bar" style="width: {{percentage}}%; background: {{color}};" title="{{displayValue}}" tabindex="0" data-label="{{label}}">
										<span class="chart__bar-tooltip js-chart-tooltip"{{#hasColor}} style="border-color: {{color}};"{{/hasColor}}>
											{{#hasDataSeries}}<span class="chart-bar__tooltip-series">{{dataSeries}}</span>{{/hasDataSeries}}
											<span class="chart-bar__tooltip-label">{{label}}:</span>
											<span class="chart-bar__tooltip-value">{{displayValue}}</span>
										</span>
									</div>
								</li>
							{{/dataPoints}}
						</ul>
						<span class="chart__bar-label">{{label}}</span>
					</li>
				{{/dataSeriesByLabel}}
			{{/stacked}}
		</ul>
	</div>
</div>`;