
var config = require('./config.json').config;
var devices = {};
var snmpDeviceTypes = [
    "D9854",
    "8200",
    "QTLband",
    "TT1260"
];
var serOverIPDeviceTypes = [
    "APC100",
];

console.log("Starting...");
var i;
for (i = 0; i < config.devices.length; i++) {
    devices[i] = require("./snmp_modules/" + config.devices[i].type)(config.devices[i].address, config.devices[i].color);
    devices[i].name = config.devices[i].name;
    devices[i].testSnmp();
    console.log(devices[i].name + " address = " + devices[i].getAddress());
}
