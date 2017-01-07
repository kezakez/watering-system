const schedule = require('node-schedule');
const bomObs = require('./bom-observation-data.js');
var hardware = require('./hardware.js');
const config = require('./config.json');
const readLine = require('readline');

const tz = "Australia/Brisbane";

// schedule the data to update every 6 hours
const dataUpdateJob = scheduleCronJob('update data', '27 */2 * * *', function(){
    updateData();
    logJobDetails(dataUpdateJob);
});
logJobDetails(dataUpdateJob);

// schedule a data update and run on mon wed & fri
const runJob = scheduleCronJob('run job', '0 4 * * 1,3,5', function(){
    runToday();
    logJobDetails(runJob);
});
logJobDetails(runJob);

function logJobDetails(job) {
    console.log(job.name + " next run: " + job.runDate());
}

function scheduleCronJob(name, cronString, callback) {
    const job = new schedule.Job(name, callback);
    job.schedule(cronString);
    job.runDate = job.nextInvocation;
    return job;
}

function scheduleDateJob(name, date, callback) {
    const job = new schedule.Job(name, callback);
    job.runOnDate(date);
    job.runDate = () => date;
    return job;
}

function updateData(callback) {
    const codes = config.bom.weatherStationCodes;
    console.log('updating data');
    bomObs.update(codes, function (err, code) {
        console.log('completed updating data');
        if (callback) callback(code);
    });
}

function runToday() {
    const start = calculateStart();
    const starterJob = scheduleDateJob('start job', start.toDate(), function(){
        updateData(function(code) {
            console.log('reading rainfall data');

            bomObs.getRainWindowTotal(code, 48, function(recentRain) {
                const details = calculateEndDetails(start, recentRain);
                const stop = details.stop;

                if (!stop) {
                    console.log("not running");
                    return;
                }
                hardware.on(1);
                const logStr = "starting water: " + start.toDate().setTimezone(tz).toString() + "\n" +
                            "stopping water: " + stop.toDate().setTimezone(tz).toString() + "\n" +
                            "duration: " + details.duration + "\n" +
                            "recent rain: " + details.recentRain + "\n" +
                            "calculated water: " + details.calculatedWaterAmount + "\n";

                console.log(logStr);
                sendEmail(logStr);

                const stopperJob = scheduleDateJob('stop job', stop.toDate(), function(){
                    hardware.off(1);
                    console.log("stop");
                    sendEmail("stopped water");
                });
                logJobDetails(stopperJob);
            });
        });
    });
    logJobDetails(starterJob);
}

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('SIGINT', function() {
    console.log("Closing!");
    hardware.close();
    process.exit();
});

function calculateStart() {
    const sunrise = require('./sunrise.js');
    const moment = require('moment');
    const time = require('time');
    time(Date);

    const today = new time.Date(Date.now(), tz);
    console.log("today: " + today.toString());

    const sunriseTime = sunrise.getSunrise(today);
    console.log("sunrise: " + sunriseTime.toString());

    const start = moment(sunriseTime).add(2.5, "h");
    const startString = start.toDate().setTimezone(tz).toString();
    console.log("start: " + startString);
    return start;
}

function calculateEndDetails(start, recentRain) {
	const flowRate = 20 * 60; // L/h
	const cropFactor = 1; // -
	const waterArea = 10; // m^2

	const desiredWater = 10; // mm
	const recentEvaporation = 7; // mm (average)
	let calculatedWaterAmount = cropFactor * waterArea * (desiredWater - recentRain + recentEvaporation);

	let duration = 0;
    let stop = null;
	if (calculatedWaterAmount <= 0) {
		calculatedWaterAmount = 0;
	} else {
		duration = calculatedWaterAmount / flowRate;

		stop = start.clone().add(duration, "h");
	}

    let result = {};
    result.recentRain = recentRain;
    result.calculatedWaterAmount = calculatedWaterAmount;
    result.duration = (duration*60);
    result.stop = stop;

    return result;
}

function sendEmail(message) {
    const email = require("emailjs");
    const emailserver  = email.server.connect(config.emailSender);

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