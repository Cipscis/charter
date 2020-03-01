export default `<table>
	<thead>
		<tr>
			{{#headers}}
				<th>{{.}}</th>
			{{/headers}}
		</tr>
	</thead>
	<tbody>
		{{#rows}}
			<tr>
				{{#cells}}
					<td>{{.}}</td>
				{{/cells}}
			</tr>
		{{/rows}}
	</tbody>
</table>`;