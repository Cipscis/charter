define(
	[],

	function () {

		var IO,
			$link,
			$fileInput,
			fileLoadedCallback;

		IO = {
			saveFile: function (data, filename, filetype) {
				// Construct a Blob and download it
				// Because it triggers a click this must be called in a trusted event triggered by user interaction

				var blob, url;

				$link = $link || document.createElement('a');

				blob = new Blob(
					[data],
					{
						type: filetype || 'text/plain'
					}
				);

				url = URL.createObjectURL(blob);

				$link.href = url;
				$link.download = filename;
				$link.click();

				URL.revokeObjectURL(url);
			},

			saveJson: function (data, filename) {
				data = JSON.stringify(data);
				filename = filename + '.json';
				IO.saveFile(data, filename, 'application/json');
			},

			saveCsv: function (data, filename) {
				// Data expected as an array of arrays

				for (var i = 0; i < data.length; i++) {
					data[i] = data[i].join(',');
				}
				data = data.join('\n');

				filename = filename + '.csv';
				IO.saveFile(data, filename, 'text/csv');
			},

			loadFile: function (callback) {
				// Because it triggers a click this must be called in a trusted event triggered by user interaction

				if (!$fileInput) {
					$fileInput = document.createElement('input');

					$fileInput.type = 'file';
					$fileInput.addEventListener('change', IO._loadFile);
				}

				fileLoadedCallback = callback;
				$fileInput.click();
			},

			_loadFile: function (e) {
				var callback = this,
					file = $fileInput.files[0],
					reader = new FileReader();

				// So if the same file is selected again, it will trigger the "change" event
				$fileInput.value = '';

				reader.onload = IO._fileLoaded;
				reader.readAsText(file);
			},

			_fileLoaded: function (e) {
				var callback = this,
					reader = e.target;

				if (reader.readyState === 2) {
					// DONE
					fileLoadedCallback(reader.result);
					fileLoadedCallback = undefined;
				}
			}
		};

		return IO;

	}
);