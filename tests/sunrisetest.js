var test   = require('utest');
var assert = require('assert');

test('sunrise', {
	'test sunrise': function() {
		var tz = "Australia/Brisbane"

		var target = require('../sunrise.js');
		var inputLocal = new Date(2013,2,2,5);

		var resultLocal = target.getSunrise(inputLocal);
		var expectedLocal = new Date(2013,2,3,5,43,6);

		assert.equal(resultLocal.toString(), expectedLocal.toString(), "failed to calculate sunrise");
	}
});