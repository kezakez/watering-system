var request = require('request'),
	fs = require('fs'),
	util = require('util');

var dataDir = './data';

exports.update = function(codes, callback) {
	for (var i = 0; i < codes.length; i++) {
		var code = codes[i];
		var parts = code.split('.');
		var dir = parts[0];
		exports.getLatestData(dir, code, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				writeData(response, body, callback);
			} else {
				console.log(error);
				callback(error, response);
			}
		});
	};
}

exports.getLatestData = function(dir, code, callback) {
	request('http://www.bom.gov.au/fwo/'+dir+'/'+code+'.json', function (error, response, body) {
		callback(error, response, body);
	});
};

function writeData(response, body, callback) {
	// parse data and store it in the data directory one file per day
	// newer data trumps older data
	ensureDataDirectory('./data/', function() {
		var bodyObj = JSON.parse(body);
		var dataObs = bodyObj.observations.data;
		for (var i = 0; i < dataObs.length; i++) {
			var item = dataObs[i];
			var code = item.history_product;
			var date = item.local_date_time_full;
			var fileName = code+'-'+date+'.dat';
			fs.writeFile('./data/' + fileName, util.inspect(item));
		};
		callback();
	});
}

function ensureDataDirectory(dir, callback) {
	fs.exists(dir, function(exists) {
		if (!exists) {
			fs.mkdir(dir, callback);
		} else {
			callback();
		}
	});
}