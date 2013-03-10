var test   = require('utest');
var assert = require('assert');
var fs = require('fs');

test('rainfall', {
	'test rainfall sum': function() {
		fs.readFile('./IDQ60901.94576.json', function (err, data) {
			if (err) throw err;
			var weatherData = JSON.parse(data);
			var target = require('../rainfall.js');			
			assert.ok(target.getWindowTotal(weatherData, 24) - 64.8 < 0.01, "failed to get the correct rainfall");
		});
	}
});