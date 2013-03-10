var test   = require('utest');
var assert = require('assert');
var time = require('time')(Date);

test('sunrise', {
	'test sunrise': function() {
		var tz = "Australia/Brisbane"

		var target = require('../sunrise.js');
		var inputLocal = new time.Date(2013,2,2,5,tz);
		console.log(inputLocal.toString());

		var resultLocal = target.getSunrise(inputLocal);
		var expectedLocal = new time.Date(2013,2,3,5,43,6,tz);

		console.log(resultLocal.toString());
		console.log(expectedLocal.toString());
		assert.equal(resultLocal.toString(), expectedLocal.toString(), "failed to calculate sunrise");
	}
});