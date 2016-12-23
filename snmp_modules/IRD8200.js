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

function freqToLO(freq){
    if(freq < 18000000 && freq > 12000000) return 10750000;//Hz Ku range
    if(freq < 4200000 && freq > 3625000) return 5150000;//Hz C range
    console.log("Invalid frequency: " + freq + "Hz");
    return -1;

}

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
            host: addr,
            community: "private"
        })

    return {
        //public variables
        name: "New Device",
        type: "ird8200",
        lock: false,
        address: addr,
        input: null, //Syntax	 INTEGER32 {asi(0), sat_vsb(1),st_input(2), ip(3),auto(4)}
        port: null,
        freq: null,
        loFreq: null,
        symRate: null,
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
                console.log("got input: " + this_device.input);
                    this_device.getPort(function(device){
                        this_device.getSatFreq(this_device.port, function(device){
                          finished();
                        });
                        this_device.getLOFreq(this_device.port, function(device){
                          finished();
                        });
                        this_device.getSymRate(this_device.port, function(device){
                          finished();
                        });
                        this_device.getModulation(this_device.port, function(device){
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
                console.log("all done")
              cb(this_device);
            }
        },

        updateStatus: function(newData, cb){
            var finished = _.after(5, doCallback);
            var this_device = this;
            // console.log("==========Update==========");
            // console.log(this_device);
            // console.log("==========New Data========");
            // console.log(newData);

            if(newData.input != this_device.input){
                console.log("==========Input Changed========");
                this.setInput(newData.input, finished);
            }
            else finished(); // input unchanged.. finish

            if(newData.port != this_device.port){
                console.log("==========Port Changed========");
                this.setPort(newData.port, finished);
                if(newData.freq != this_device.freq){
                    console.log("==========Port Changed and freq========");
                    this_device.setLOFreq(freqToLO(newData.freq), newData.port, function(){
                        this_device.setSatFreq(newData.freq, newData.port, finished)
                    })
                }
                else{
                    console.log("==========no freq change========");
                    this_device.getLOFreq(newData.port, function(){
                        this_device.getSatFreq(newData.port, finished)
                    })
                }
                if(newData.symRate != this_device.symRate){
                    console.log("==========Port Changed and symRate========");
                    this_device.setSymRate(newData.symRate, newData.port, finished)
                }
                else{
                    console.log("==========no symrate change========");
                    this_device.getSymRate(newData.port, finished)
                }
                if(newData.modulation != this_device.modulation){
                    console.log("==========Port Changed and Modulation========");
                    this_device.setModulation(newData.modulation, newData.port, finished)
                }
                else{
                    console.log("==========no modulation change========");
                    this_device.getModulation(newData.port, finished)
                }
            }
            else {
                if(newData.freq != this_device.freq){
                    console.log("==========Freq change========");
                    this_device.setLOFreq(freqToLO(newData.freq), newData.port, function(){
                        this_device.setSatFreq(newData.freq, newData.port, finished)
                    });
                }
                else {
                    finished(); // freq unchanged.. finish
                }

                if(newData.symRate != this_device.symRate){
                    console.log("==========Symrate change========");
                    this_device.setSymRate(newData.symRate, newData.port, finished)
                }
                else {
                    finished(); // symrate unchanged.. finish
                }

                if(newData.modulation != this_device.modulation){
                    console.log("==========Modulation change========");
                    this_device.setModulation(newData.modulation, newData.port, finished)
                }
                else {
                    finished(); // modulation unchanged.. finish
                }
                finished(); // port unchanged.. finish
            }
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
        setInput: function (input, cb) {
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
                    cb();
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
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
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // interger: 1-4 input port source
        setPort: function (port, cb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.1.0";
            var device = this;
            session.set({
                oid: oid,
                value: (port - 1),
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.port = varbinds[0].value + 1;
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb();
                }
            });
        },
        getPort: function ( callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.1.0";
            var device = this;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.port = varbinds[0].value + 1;
                    callback(varbinds);
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 5150000 lnb lo freq
        setLOFreq: function (freq, port, cb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.2." + port;
            var device = this;
            session.set({
                oid: oid,
                value: freq,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.loFreq = varbinds[0].value;
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb();
                }
            });
        },
        getLOFreq: function (port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.2." + port;
            var device = this;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.loFreq = varbinds[0].value;
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    callback(varbinds);
                }
            });
        },
        // INTEGER: 4080000 sat freq
        setSatFreq: function (freq, port, cb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.3." + port;
            var device = this;
            console.log(freq);
            session.set({
                oid: oid,
                value: freq,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.freq = varbinds[0].value;
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb();
                }
            });
        },
        getSatFreq: function (port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.3." + port;
            var device = this;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.freq = varbinds[0].value;
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 27780000 symbol rate
        setSymRate: function (rate, port, cb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.4." + port;
            var device = this;
            session.set({
                oid: oid,
                value: rate,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.symRate = varbinds[0].value;
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb();
                }
            });
        },
        getSymRate: function (port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.4." + port;
            var device = this;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.symRate = varbinds[0].value;
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 0 Modulation 0=DVB-S 2=DVB-S2 or 8PSK 1=DVB-S2??
        setModulation: function (mod, port, cb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.5." + port;
            var device = this;
            session.set({
                oid: oid,
                value: mod,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.modulation = varbinds[0].value;
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb();
                }
            });
        },
        getModulation: function (port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.5." + port;
            var device = this;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    device.modulation = varbinds[0].value;
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: service array
        setService: function (service, callback) {
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
                    callback();
                }
            });
        },
        // INTEGER: service array
        getService: function (cb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.2.0";
            session.get({
                oid: oid,
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb(varbinds[0].value);
                }
            });
        },
        getServiceArray: function (callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.1.1.2";
            session.getSubtree({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
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
