var test   = require('utest');
var assert = require('assert');
var fs = require('fs');

test('rainfall', {
	'test rainfall sum': function() {
		var data = fs.readFileSync(__dirname+'/IDQ60901.94576.json');
		var weatherData = JSON.parse(data);
		var indata = weatherData.observations.data;

		var target = require('../bom-observation-data.js');
		var total = target.getRainWindowTotal(indata, 24);
		//console.log(total);
		assert.ok(Math.abs(total - 64.8) < 0.01, "failed to get the correct rainfall");
	}
});