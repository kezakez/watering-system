var bomObs = require('./bom-observation-data.js');

var codes = ["IDQ60901.94576"];

// var fs = require('fs');
// bomObs.getLatestData = function(dir, code, callback) {
// 	fs.readFile('./IDQ60901.94576.json', "utf8", function (err, data) {
// 		var response = {};
// 		response.statusCode = 200;
// 		callback(err, response, data);
// 	});
// }

bomObs.update(codes, function(err, res) {
	console.log('done');
	bomObs.read
});