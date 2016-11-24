function Unpacker(pack, config) {
	this.progress = 0;
	if (pack) {
		this.init(pack, config);
	}
}

var URLProxy = window.URL || window.webkitURL || window.mozURL || window.msURL;
Unpacker.isIE = Boolean(document.all);
var hasBlob = false;
try {
	hasBlob = Boolean(Blob);
}
catch (e) {
	throw new Error('Unpacker needs blob support to work.')
}

// IE support
var isIE = Boolean(document.all);
if (!hasBlob) {
	var s = document.createElement('script');
	s.type = 'text/vbscript';
	s.text = '' +
		'Function IEBinaryToArray_ByteStr(Binary)\n' +
		'	IEBinaryToArray_ByteStr = CStr(Binary)\n' +
		'End Function\n' +
		'Function IEBinaryToArray_ByteStr_Last(Binary)\n' +
		'	Dim lastIndex\n' +
		'	lastIndex = LenB(Binary)\n' +
		'	if lastIndex mod 2 Then\n' +
		'		IEBinaryToArray_ByteStr_Last = Chr( AscB( MidB( Binary, lastIndex, 1 ) ) )\n' +
		'	Else\n' +
		'		IEBinaryToArray_ByteStr_Last = ""\n' +
		'	End If\n' +
		'End Function';
	document.childNodes[document.childNodes.length - 1].appendChild(s);

	function GetIEByteArray_ByteStr(IEByteArray) {
		var ByteMapping = {};
		for (var i = 0; i < 256; i++) {
			for (var j = 0; j < 256; j++) {
				ByteMapping[String.fromCharCode(i + j * 256)] =
					String.fromCharCode(i) + String.fromCharCode(j);
			}
		}
		var rawBytes = IEBinaryToArray_ByteStr(IEByteArray);
		var lastChr = IEBinaryToArray_ByteStr_Last(IEByteArray);
		return rawBytes.replace(/[\s\S]/g,
				function (match) {
					return ByteMapping[match];
				}) + lastChr;
	}
}

function b64encodeString(value) {
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split("");
	var l = value.length;
	var i = cb = b = bl = v = 0;
	var b0, b1, b2;
	var c0, c1, c2, c3;
	var ret = '';
	while (i < l) {
		b0 = value.charCodeAt(i + 0) & 0xFF;
		b1 = value.charCodeAt(i + 1) & 0xFF;
		b2 = value.charCodeAt(i + 2) & 0xFF;
		c0 = b0 >> 2 & 0x3F;
		c1 = (b0 << 4 | b1 >> 4) & 0x3F;
		c2 = (b1 << 2 | b2 >> 6) & 0x3F;
		c3 = b2 & 0x3F;

		ret += chars[c0] + chars[c1] + chars[c2] + chars[c3];
		i += 3;
	}

	i = l % 3;
	l = ret.length;
	if (i == 1) {
		ret = ret.substr(0, l - 2) + "==";
	} else if (i == 2) {
		ret = ret.substr(0, l - 1) + "=";
	}
	return ret;
}

Unpacker.hasBlob = hasBlob;

Unpacker.prototype._getRangeData = function (pack, i, e, type) {
	if (pack.slice) {
		return pack.slice(i, e, type);
	} else if (pack.webkitSlice) {
		return pack.webkitSlice(i, e, type);
	} else if (pack.mozSlice) {
		return pack.mozSlice(i, e, type);
	}

	return null;
};

Unpacker.prototype.init = function (pack, config) {
	//if (pack != null) {
	//	if(!hasBlob) {
	//		this.ieBlob = GetIEByteArray_ByteStr(pack);
	//	}
	//}

	this.files = {};
	for (var i = config.length - 1; i >= 0; i--) {
		var file = config[i];

		var name = file[0];
		var start = parseInt(file[1]);
		var end = parseInt(file[2]);
		var type = file[3];

		this.files[name] = {
			start: start,
			end: end,
			type: type,
			data: this._getRangeData(pack, start, end, type)
		};
	}
};

Unpacker.prototype._getFile = function (filename) {
	if (!filename) throw new Error('Missing filename parameter');
	if (!this.files) throw new Error('No config file loaded.');

	var file = this.files[filename];
	if (!file) throw new Error('File not found: ' + filename);

	return file;
};

Unpacker.prototype.getData = function (filename) {
	return this._getFile(filename).data;
};

Unpacker.prototype.getString = function (filename) {
	var file = this._getFile(filename);

	return String.fromCharCode.apply(null, new Uint8Array(file.data));
};

Unpacker.prototype.getURI = function (filename) {
	var file = this._getFile(filename);

	if (hasBlob) {
		var blob = new Blob([file.data]);
		return URLProxy.createObjectURL(blob);
	} else {
		if (isIE) {
			//return 'data:' + type + ';base64,' + b64encodeString(this.ieBlob.substr(i, e - i));
			return 'data:' + file.type + ';base64,' + b64encodeString(GetIEByteArray_ByteStr(file.data));
		}
	}
};

Unpacker.init = function (pack, config) {
	if (this.inited) throw new Error('Unpacker static instance already initialized.');
	this._instance = new Unpacker(pack, config);
	if (pack) {
		this._instance.init(pack, config);
	}
	this.inited = true;
};

/* global define:true module:true window:true */
/*
if (typeof define === 'function' && define.amd) {

	define(function () {
		return Unpacker;
	});

} else if (typeof module !== 'undefined' && module.exports) {

	module.exports = Unpacker;

} else if (typeof this !== 'undefined') {

	global.Unpacker = Unpacker;

}
*/
module.exports = Unpacker;
