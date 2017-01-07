# watering-system
A watering system that determines how much to water based on the weather.

Works best in Australia where the weather stations are located, but could potentially be modified to switch in a different weather station

Currently running on...
Hardare: Raspberry Pi B (v1)
OS: Raspbian jessie - Linux raspberrypi 4.4.38+ #938 Thu Dec 15 15:17:54 GMT 2016 armv6l GNU/Linux
Node: v6.9.4
gcc: 4.9.2 (for c++ v11 features used by the time package)

To run:

git pull
npm install (maybe also: npm cache clean && npm rebuild)
sudo node program.js &
