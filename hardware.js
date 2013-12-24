var Gpio = require("onoff").Gpio;

var pins = [14,15,18,23,24,25,8,7];

exports.on = function (relay) {
    var pin = new Gpio(pins[relay - 1], 'out');
    pin.writeSync(1);
};

exports.off = function (relay) {
    var pin = new Gpio(pins[relay - 1], 'out');
    pin.writeSync(0);
};

exports.close = function() {
    for(var i = 0; i<pins.length; i++) {
        var pin = new Gpio(pins[i], 'out');
        pin.unexport();
    }
};