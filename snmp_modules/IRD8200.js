"use strict";
var _ = require('lodash');
var snmp = require("snmp-native");
var valueTypes = {
    3: "BITSTRING",
    65: "COUNTER32",
    70: "COUNTER64",
    130: "END_OF_MIB_VIEW",
    2: "INTEGER",
    64: "IPADDRESS",
    129: "NO_SUCH_INSTANCE",
    128: "NO_SUCH_OBJECT",
    5: "NULL",
    4: "OCTETSTRING",
    6: "OID",
    68: "OPAQUE",
    320: "PDU",
    67: "TIMETICKS",
    66: "UNSIGNED32",
    48: "VARBIND"
};

var INTEGER = 2;
var BITSTRING = 3;
var BITS = 4;
var OCTETSTRING = 4;
var NULL = 5;
var OID = 6;
var SEQUENCE = 48;
var SEQUENCEOF = 48;
var VARBIND = 48;
var IPADDRESS = 64;
var COUNTER32 = 65;
var GAUGE32 = 66;
var UNSIGNED32 = 66;
var TIMETICKS = 67;
var OPAQUE = 68;
var COUNTER64 = 70;
var NO_SUCH_OBJECT = 128;
var NO_SUCH_INSTANCE = 129;
var END_OF_MIB_VIEW = 130;
var PDU = 320;

var ASI = 0;
var SAT = 1;
var IP = 3;
var AUTO = 4;

// String oidGetLocked = ".1.3.6.1.4.1.1773.1.3.208.2.2.2.0";         //  1 get LOCKED
// String oidGetPower = ".1.3.6.1.4.1.1773.1.3.208.2.2.3.0";         //  2 get POWER
//
// String oidSetInput = ".1.3.6.1.4.1.1773.1.3.208.2.1.4.0";    //   interger: 1-4 input port source
// String oidSetLowFreq = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.2." + port;  //   5 INTEGER: 27780000 lnb lo freq symbol rate
// String oidSetSatFreq = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.3." + port;  //   4 INTEGER: 4080000 sat freq
// String oidSetSymRate = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.4." + port;  //   3 INTEGER: 5150000 symbol rate
// String oidSetModulat = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.5." + port;  //   6 INTEGER: 0 Modulation 0=DVB-S 2=DVB-S2 or 8PSK 1=DVB-S2??
//
// String oidSetService = ".1.3.6.1.4.1.1773.1.3.208.4.1.2.0";        //   7 INTEGER: service array
// String oidGetService = ".1.3.6.1.4.1.1773.1.3.208.4.1.1.1.2";      //  8 STRING: gets service array
// String oidSetAudioSer;
// String oidGetAudioSer;

var ird8200 = function (addr, clr) {
    //variables that are not accessible outside this scope
    var session = new snmp.Session({
            host: addr
        })

    return {
        //public variables
        name: "New Device",
        color: clr,
        type: "ird8200",
        lock: false,
        address: addr,
        input: null, //Syntax	 INTEGER32 {asi(0), sat_vsb(1),st_input(2), ip(3),auto(4)}
        port: null,
        freq: null,
        loFreq: null,
        smyRate: null,
        modulation: null,

        //public functions
        getAddress: function () {
            return address;
        },
        setAddress: function (addr) {
            address = addr;
            session = new snmp.Session({
                host: address
            });
        },
        getStatus: function(cb){
            var finished = _.after(5, doCallback);
            var this_device = this;

            this.getLock(function(device){
              finished();
            });
            this.getInput(function(device){
                if(this_device.input == SAT){
                    this.getPort(function(device){
                        this_device.getSatFreq(device.port, function(device){
                          finished();
                        });
                        this_device.getLOFreq(device.port, function(device){
                          finished();
                        });
                        this_device.getSymRate(device.port, function(device){
                          finished();
                        });
                        this_device.getModulation(device.port, function(device){
                          finished();
                        });
                    });
                }
                else{
                    finished();
                    finished();
                    finished();
                    finished();
                }
            });
            function doCallback(){
              cb(this_device);
            }
        },
        isLocked: function () {
            return lock;
        },
        getLock: function (callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.2.0";
            var device = this;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                    callback();
                } else {
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    if(varbinds[0].type == OCTETSTRING && varbinds[0].value == "LOCKED" ){
                        device.lock = true;
                    }
                    else{
                        device.lock = false;
                    }
                    callback(device);
                }
            });
        },
        // interger: 1-4 input port source
        setInput: function (input) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.1.2.0";
            var device = this;
            session.set({
                oid: oid,
                value: input,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.input = input;
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getInput: function (callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.1.2.0";
            var device = this;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.input = varbinds[0].value;
                    callback(varbinds);
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // interger: 1-4 input port source
        setPort: function (port) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.1.4.0";
            var device = this;
            session.set({
                oid: oid,
                value: port,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getPort: function ( callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.1.4.0";
            var device = this;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.port = varbinds[0].value;
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 5150000 lnb lo freq
        setLOFreq: function (freq, port) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.2." + port;
            session.set({
                oid: oid,
                value: freq,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getLOFreq: function (port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.2." + port;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    callback(varbinds);
                }
            });
        },
        // INTEGER: 4080000 sat freq
        setSatFreq: function (freq, port) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.3." + port;
            session.set({
                oid: oid,
                value: freq,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getSatFreq: function (port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.3." + port;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 27780000 symbol rate
        setSymRate: function (rate, port) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.4." + port;
            session.set({
                oid: oid,
                value: rate,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getSymRate: function (port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.4." + port;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 0 Modulation 0=DVB-S 2=DVB-S2 or 8PSK 1=DVB-S2??
        setModulation: function (mod, port) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.5." + port;
            session.set({
                oid: oid,
                value: mod,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getModulation: function (port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.5." + port;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: service array
        setService: function (service) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.2.0";
            session.set({
                oid: oid,
                value: service,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getServiceArray: function (callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.1.1.2";
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },

        testSnmp: function () {
            var oid = ".1.3.6.1.2.1.25.1.1.0";
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        goodbye: function () {
            return 'goodbye!';
        }
    };
};

module.exports = ird8200;
