var schedule = require('node-schedule');
var bomObs = require('./bom-observation-data.js');
var hardware = require('./hardware.js');
var config = require('./config.json');

// schedule the data to update every 6 hours
var dataUpdateJob = new schedule.Job("Data Update Job", function(){
    updateData();
    log(dataUpdateJob);
});
dataUpdateJob.schedule('27 */2 * * *');
log(dataUpdateJob);

// schedule a data update and run on mon wed & fri
var runJob = new schedule.Job("Day Runner Job", function(){
    runToday();
    log(runJob);
});
runJob.schedule('0 4 ? * 1,3,5');
log(runJob);

function log(job) {
    console.log(job.name + " next run: " + job.nextInvocation().toString());
}

function updateData(callback) {
    var codes = config.bom.weatherStationCodes;
    console.log('updating data');
    bomObs.update(codes, function (err, code) {
        console.log('done');
        if (callback) callback(code);
    });
}

function runToday() {
    var start = calculateStart();
    var starterJob = new schedule.Job("Starter Job", function(){
        updateData(function(code) {
            console.log('reading rainfall data');

            bomObs.getRainWindowTotal(code, 48, function(recentRain) {
                var details = calculateEndDetails(start, recentRain);
                var stop = details.stop;

                if (!stop) {
                    console.log("not running");
                    return;
                }
                hardware.on(1);
                var logStr = "starting water: " + start.toDate().setTimezone(tz).toString() + "\n" +
                            "stopping water: " + stop.toDate().setTimezone(tz).toString() + "\n" +
                            "duration: " + details.duration + "\n" +
                            "recent rain: " + details.recentRain + "\n" +
                            "calculated water: " + details.calculatedWaterAmount + "\n";

                console.log(logStr);
                sendEmail(logStr);

                var stopperJob = new schedule.Job("Stopper Job", function(){
                    hardware.off(1);
                    console.log("stop");
                    sendEmail("stopped water");
                });
                stopperJob.schedule(stop.toDate());
                log(stopperJob);
            });
        });
    });
    starterJob.schedule(start.toDate());
    log(starterJob);
}

var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('SIGINT', function() {
    console.log("Closing!");
    hardware.close();
    process.exit();
});

var tz = "Australia/Brisbane";

function calculateStart() {
    var sunrise = require('./sunrise.js');
    var moment = require('moment');
    var time = require('time');
    time(Date);

    var today = new time.Date(Date.now(), tz);
    console.log("today: " + today.toString());

    var sunriseTime = sunrise.getSunrise(today);
    console.log("sunrise: " + sunriseTime.toString());

    var start = moment(sunriseTime).add(2.5, "h");
    var startString = start.toDate().setTimezone(tz).toString();
    console.log("start: " + startString);
    return start;
}

function calculateEndDetails(start, recentRain) {
	var flowRate = 20 * 60; // L/h
	var cropFactor = 1; // -
	var waterArea = 10; // m^2

	var desiredWater = 10; // mm
	var recentEvaporation = 7; // mm (average)
	var calculatedWaterAmount = cropFactor * waterArea * (desiredWater - recentRain + recentEvaporation);

	var duration = 0;
    var stop = null;
	if (calculatedWaterAmount <= 0) {
		calculatedWaterAmount = 0;
	} else {
		duration = calculatedWaterAmount / flowRate;

		stop = start.clone().add(duration, "h");
	}

    var result = {};
    result.recentRain = recentRain;
    result.calculatedWaterAmount = calculatedWaterAmount;
    result.duration = (duration*60);
    result.stop = stop;

    return result;
}

function sendEmail(message) {
    var email = require("emailjs");
    var emailserver  = email.server.connect(config.emailSender);

    // send the message and get a callback with an error or details of the message that was se
    emailserver.send({
        from: config.email.from,
        to: config.email.to,
        subject: "watering system",
        text:    message
    }, function(err, message) {
        console.log(err || message);
    });
}