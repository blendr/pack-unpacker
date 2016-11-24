var Unpacker = require('./Unpacker');

function PackUnpacker() {
}

PackUnpacker.prototype.unpack = function(packId, files, cache, manifest, loadr) {
	var pack = new Unpacker(files.pack, files.json);

	for(var file in pack.files) {
		var type = manifest.files[file] ? manifest.files[file].type : 'text';
		var url = loadr.serverUrl + file;
		var data;

		switch(type) {
			case 'arraybuffer':
				data = pack.getData(file);
				break;
			case 'json':
				data = JSON.parse(pack.getString(file));
				break;
			case 'image':
				data = pack.getURI(file);
				break;
			case 'text':
			default:
				data = pack.getString(file);
		}

		cache.set(url, data);
	}
};

module.exports = PackUnpacker;
