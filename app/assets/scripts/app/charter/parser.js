const Parser = {
	parse: function (csvString) {
		let data = Parser._tokenise(csvString);

		Parser._validate(data);

		return data;
	},

	_tokenise: function (csvString) {
		let tokens = [];

		// Remove carriage returns
		csvString = csvString.replace(/\r/g, '');

		let inQuote = false;
		let wasQuote = false;

		let tokenStart = 0;
		let row = [];
		for (let i = 0; i < csvString.length; i++) {
			let char = csvString[i];

			let comma = char === ',';
			let quote = char === '"';
			let newline = char === '\n';
			let eof = i === csvString.length -1; // eof - End Of File


			if (inQuote) {
				// Characters may be delimited
				if (quote) {
					// Check if the next character is another double quote, i.e. if it is escaped
					let nextChar = csvString[i+1];

					if (nextChar === '"') {
						// This and the next character combined make an escaped double quote,
						// so the quote has not ended and we should skip over the next character
						i++;
						continue;
					} else {
						// The quote has ended
						inQuote = false;
						wasQuote = true;

						continue;
					}
				} else if (eof) {
					console.error(`Reached end of file before ending quote. At index ${i}`);

					// Report error, but create last value as though the quote had ended
					inQuote = false;
					wasQuote = true;
				}
			}

			if (inQuote === false) {
				if (comma || newline || eof) {
					// These are the characters that denote the end of a token
					let token = csvString.substring(tokenStart, i+1);

					if (comma || newline) {
						// Don't keep the separator
						token = token.substring(0, token.length - 1);
					}

					if (wasQuote) {
						wasQuote = false;

						// Remove start and end quotes
						token = token.substring(1, token.length - 1);

						// Replace escaped quotes
						token = token.replace(/""/g, '"');
					}
					row.push(token);

					if (comma && eof) {
						// It's the end of the last token, and the last cell is empty
						row.push('');
					}

					if (newline || eof) {
						tokens.push(row);
						if (newline) {
							row = [];
						}
					}

					tokenStart = i+1;
				} else if (wasQuote) {
					console.error(`A value must be complete immediately after closing a quote. At index ${i}`);

					// wasQuote is only used for checking for this error, so no use still checking it
					wasQuote = false;
				} else if (quote) {
					inQuote = true;
				}
			}
		}

		return tokens;
	},

	_validate: function (data) {
		// Each row of a CSV should have the same length;

		if (data && data.length > 1) {
			let rowLength = data[0].length;
			for (let i = 1; i < data.length; i++) {
				let row = data[i];

				if (row.length !== rowLength) {
					console.error(`Row ${i} does not have the same length as the first row (${rowLength})`);
				}
			}
		} else {
			console.error('No token data passed to validate method.');

			return false;
		}
	}
};

export default {
	parse: Parser.parse
};