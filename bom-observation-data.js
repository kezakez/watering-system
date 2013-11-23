var fs = require('fs');

var dataDir = __dirname+'/data/';

exports.getRainWindowTotal = function (data, windowHours) {
    var timeTotal = 0;
    var rainTotal = 0;
    for (var i = 0; i < data.length - 1; i++) {
        var date = getDate(data[i].local_date_time_full);
        var prevdate = getDate(data[i + 1].local_date_time_full);

        var rain = data[i].rain_trace;
        var prevrain = data[i + 1].rain_trace;

        if (prevdate.hour() === 9) {
            // rain resets to 0 at 9am
            prevrain = 0;
        }

        var timeDiff = date.diff(prevdate, 'hours', true);
        var rainDiff = rain - prevrain;

        timeTotal += timeDiff;
        rainTotal += rainDiff;
        if (timeTotal >= windowHours) return rainTotal;
    }
    return rainTotal;
};

function getDate(dateString) {
	var moment = require('moment');
	// take the bom date string and converts to js date
	return moment(dateString, "YYYYMMDDHHmmss");
}

exports.update = function(codes, callback) {
	for (var i = 0; i < codes.length; i++) {
		var code = codes[i];
		var parts = code.split('.');
		var dir = parts[0];
		exports.getLatestData(dir, code, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				writeData(body, function() {
					callback(error, code, response);
				});
			} else {
				console.log(error);
				callback(error, code, response);
			}
		});
	}
};

exports.read = function(code, timeSteps, callback) {
	fs.readdir(dataDir, function(err, files) {
		files.sort().reverse();
		var count = 0;
		var data = [];
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			if (file.indexOf(code) === 0) {
                var contents = fs.readFileSync(dataDir+file).toString();
                if (contents) {
                    count += 1;
                    data.push(JSON.parse(contents));
                    if (count >= timeSteps) break;
                }
			}
		}
		callback(err, data);
	});
};

exports.getLatestData = function(dir, code, callback) {
	var request = require('request');
	request('http://www.bom.gov.au/fwo/'+dir+'/'+code+'.json', function (error, response, body) {
		callback(error, response, body);
	});
};

function writeData(body, callback) {
    // parse data and store it in the data directory one file per day
	// newer data trumps older data
	ensureDataDirectory(dataDir, function() {
		var bodyObj = JSON.parse(body);
		var dataObs = bodyObj.observations.data;
		for (var i = 0; i < dataObs.length; i++) {
			var item = dataObs[i];
			var code = item.history_product+"."+item.wmo;
			var date = item.local_date_time_full;
			var fileName = code+'-'+date+'.dat';
            var contents = JSON.stringify(item);
            if (contents) {
			    fs.writeFile(dataDir + fileName, contents);
            } else {
                console.log("no content in " + fileName);
            }
		}
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