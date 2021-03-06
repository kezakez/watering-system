var suncalc = require('suncalc');
var moment = require('moment');
require('time')(Date);

exports.getSunrise = function(localDate) {
	var tz = "Australia/Brisbane";
	
	// check it is ok
	var today = moment(localDate);
	if (!today.isValid()) {
        throw "invalid date provided";
    }

	var tomorrow = today.toDate();
	tomorrow.setTimezone(tz);

	// get the sunrise time
	var latitude = -27.481015;
	var longitude = 153.038698;
	var times = suncalc.getTimes(tomorrow, latitude, longitude);
	var sr = times.sunrise;
	sr.setTimezone(tz);
	return sr;
};