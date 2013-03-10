var moment = require("moment");

exports.getWindowTotal = function(observationData, windowHours) {
	var data = observationData.observations.data;
	var timeTotal = 0;
	var rainTotal = 0;
	for (var i = 0; i < data.length-1; i++) {
		var date = getDate(data[i].local_date_time_full);
		var prevdate = getDate(data[i+1].local_date_time_full);

		var rain = data[i].rain_trace;
		var prevrain = data[i+1].rain_trace;
		
		if (prevdate.hour() === 9) {
			// rain resets to 0 at 9am
			prevrain = 0;
		}

		var timeDiff = date.diff(prevdate, 'hours', true);
		var rainDiff = rain - prevrain;

		timeTotal += timeDiff;
		rainTotal += rainDiff;
		if (timeTotal >= windowHours) return rainTotal;
	};
	return rainTotal;
}

function getDate(dateString) {
	// take the bom date string and converts to js date
	return moment(dateString, "YYYYMMDDHHmmss");
}