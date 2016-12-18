var jsonApi = require("jsonapi-server");
var ird8200 = require("./snmp_modules/IRD8200")("localhost");
var ird2 = require("./snmp_modules/IRD8200")("192.168.0.2");
var config = require('./config.json').config;
var devices = {};
jsonApi.setConfig({
    port: 16006,
    graphiql: true
});
var snmpDeviceTypes = [
    "D9854",
    "8200",
    "QTLband",
    "TT1260"
];
var serOverIPDeviceTypes = [
    "APC100",
];
jsonApi.define({
    resource: "snmpdevices",
    handlers: new jsonApi.MemoryHandler(),
    attributes: {
        name: jsonApi.Joi.string(),
        address: jsonApi.Joi.string().hostname(),
        type: jsonApi.Joi.string().hex().length(6),
        color: jsonApi.Joi.string().allow(snmpDeviceTypes)
    }
});
console.log("Starting...");
console.log(config.devices);
var i;
for (i = 0; i < config.devices.length; i++) {
    devices[i] = require("./snmp_modules/" + config.devices[i].type)(config.devices[i].address, config.devices[i].color);
    devices[i].name = config.devices[i].name;
    devices[i].testSnmp();
    console.log(devices[i].name + " address = " + devices[i].getAddress());
}
ird8200.testSnmp();
ird2.testSnmp();
console.log("ird8200 address = " + ird8200.getAddress());
console.log("ird2 address = " + ird2.getAddress());
ird8200.setAddress("hello");
console.log("ird8200 address  = " + ird8200.getAddress());
console.log("ird2 address = " + ird2.getAddress());

ird8200.testSnmp();


jsonApi.start();
