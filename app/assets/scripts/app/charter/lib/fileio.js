let $link;

const module = {
	save: {
		data: function (data, filename, type) {
			// Construct a Blob and download it
			let blob = new Blob(
				[data],
				{
					type: type || 'text/plain'
				}
			);

			module.save.blob(blob, filename);
		},

		blob: function (blob, filename) {
			if (navigator.msSaveBlob) {
				navigator.msSaveBlob(blob, filename);
			} else {
				let url = URL.createObjectURL(blob);
				module.save._downloadDataUrl(url, filename);
			}
		},

		_downloadDataUrl: function (dataUrl, filename) {
			$link = $link || document.createElement('a');
			$link.href = dataUrl;
			$link.download = filename;
			$link.click();

			URL.revokeObjectURL(dataUrl);
		},
	}
};

export default {
	save: {
		data: module.save.data,
		blob: module.save.blob,
	}
};
