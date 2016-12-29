"use strict";
var _ = require('lodash');
var snmp = require("snmp-native");
var io
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

function freqToLO(freq) {
    if (freq < 12700000 && freq > 11700000) return 10750000; //Hz Ku range
    if (freq < 4200000 && freq > 3625000) return 5150000; //Hz C range
    console.log("Invalid frequency: " + freq + "Hz");
    return -1;
}

var ird8200 = function(options) {

    if( typeof options.address === "undefined"){
        throw new Error("Addresss missing for ird8200. Please see configuration");
        return null;
    }
    if( typeof options.id === "undefined"){
        throw new Error("ID missing for ird8200. Please see configuration");
        return null;
    }
    //variables that are not accessible outside this scope
    var session = new snmp.Session({
        host: options.address,
        community: "private"
    })


    return {
        //public variables
        id:  options.id,
        type: options.type,
        lock: false,
        address: options.address,
        inputLabels: options.inputLabels,
        input: null, //Syntax	 INTEGER32 {asi(0), sat_vsb(1),st_input(2), ip(3),auto(4)}
        port: null,
        freq: null,
        loFreq: null,
        symRate: null,
        modulation: null,
        current_service: null,
        initialized: false,
        heartbeat_loop: null,

        initialize: function(heartbeatFunction, callback){
            var this_device = this;
            this_device.heartbeat_loop = setInterval(function(){
                var lockStatus = this_device.lock;
                this_device.getLock(function(updated_device){
                    // console.log(lockStatus + " vs " + devices[i].lock)
                    if( updated_device.lock != lockStatus){
                        heartbeatFunction();
                    }
                }, function(){
                    console.log("cannot get lock status for device " + this_device.id)
                });
            }, 1000);
            this_device.initialized = true;
            this_device.getStatus();
            if(typeof callback !== "undefined") callback();
        },

        //public functions
        getAddress: function() {
            return address;
        },
        setAddress: function(addr) {
            address = addr;
            session = new snmp.Session({
                host: address
            });
        },
        getStatus: function(cb, fcb) {
            var finished = _.after(5, doCallback);
            var this_device = this;
            var fail_sent = false;
            var failed = function(){
                if(fail_sent != true) {
                    fail_sent = true;
                    if(typeof fcb !== "undefined") return fcb(this_device);
                    else return function(){};
                }
            }
            this.getLock(function(device) {
                finished();
            }, function() {
                return failed();
            });
            this.getInput(function(device) {
                if (this_device.input == SAT) {
                    this_device.getPort(function(device) {
                        this_device.getSatFreq(this_device.port, finished, finished);
                        this_device.getLOFreq(this_device.port, finished, finished);
                        this_device.getSymRate(this_device.port, finished, finished);
                        this_device.getModulation(this_device.port, finished, finished);
                    }, function() {
                        finished();
                        finished();
                        finished();
                        finished();
                    });
                } else {
                    finished();
                    finished();
                    finished();
                    finished();
                }
            }, failed);

            function doCallback() {
                // console.log("all done")
                if(typeof cb !== "undefined") cb(this_device);
            }
        },

        updateStatus: function(newData, cb, fcb) {
            // finishes 4:
            //  input
            //  frequency
            //  symRate
            //  modulation
            var finished = _.after(5, doCallback);
            var this_device = this;
            var fail_sent = false;
            var failed = function(){
                if(fail_sent != true) {
                    fail_sent = true;
                    return fcb();
                }
            }
            // console.log("==========Update==========");
            // console.log(this_device);
            // console.log("==========New Data========");
            // console.log(newData);

            this.getLock(function(device) {
                finished();
            }, function() {
                return failed();
            });

            if (newData.input != "" && newData.input != this_device.input) {
                console.log("==========Input Changed========");
                this.setInput(newData.input, finished, failed);
            } else finished(); // input unchanged.. finish

            if (newData.port != "" && newData.port != this_device.port) {
                console.log("==========Port Changed========");
                this.setPort(newData.port, function() {
                        if (newData.freq != "" && newData.freq != this_device.freq) {
                            console.log("==========Port Changed and freq========");
                            this_device.setLOFreq(freqToLO(newData.freq), newData.port, function() {
                                this_device.setSatFreq(newData.freq, newData.port, finished, failed)
                            })
                        } else {
                            // console.log("==========no freq change========");
                            this_device.getLOFreq(newData.port, function() {
                                this_device.getSatFreq(newData.port, finished, failed)
                            })
                        }
                        if (newData.symRate != "" && newData.symRate != this_device.symRate) {
                            console.log("==========Port Changed and symRate========");
                            this_device.setSymRate(newData.symRate, newData.port, finished, failed)
                        } else {
                            // console.log("==========no symrate change========");
                            this_device.getSymRate(newData.port, finished, failed)
                        }
                        if (newData.modulation != "" && newData.modulation != this_device.modulation) {
                            console.log("==========Port Changed and Modulation========");
                            this_device.setModulation(newData.modulation, newData.port, finished, failed)
                        } else {
                            // console.log("==========no modulation change========");
                            this_device.getModulation(newData.port, finished, failed)
                        }
                    },
                    function(data) {
                        finished();
                        finished();
                        finished();
                    });
            } else {
                if (newData.freq != "" && newData.freq != this_device.freq) {
                    console.log("==========Freq change========");
                    this_device.setLOFreq(freqToLO(newData.freq), newData.port, function() {
                        this_device.setSatFreq(newData.freq, newData.port, finished, fcb)
                    });
                } else {
                    finished(); // freq unchanged.. finish
                }

                if (newData.symRate != "" && newData.symRate != this_device.symRate) {
                    // console.log("==========Symrate change========");
                    this_device.setSymRate(newData.symRate, newData.port, finished, fcb)
                } else {
                    finished(); // symrate unchanged.. finish
                }

                if (newData.modulation != "" && newData.modulation != this_device.modulation) {
                    console.log("==========Modulation change========");
                    this_device.setModulation(newData.modulation, newData.port, finished, fcb)
                } else {
                    finished(); // modulation unchanged.. finish
                }
            }

            function doCallback() {
                cb(this_device);
            }
        },
        isLocked: function() {
            return lock;
        },
        getLock: function(callback, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.2.0";
            var device = this;
            session.get({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    // // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    if (varbinds[0].type == OCTETSTRING && varbinds[0].value == "LOCKED") {
                        device.lock = true;
                    } else {
                        device.lock = false;
                    }
                    callback(device);
                }
            });
        },
        // interger: 1-4 input port source
        setInput: function(input, cb, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.1.2.0";
            var device = this;
            var iInput = parseInt(input);
            if (isNaN(iInput)) return fcb();
            session.set({
                oid: oid,
                value: iInput,
                type: INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.input = input;
                    cb();
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getInput: function(callback, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.1.2.0";
            var device = this;
            session.get({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.input = varbinds[0].value;
                    callback(varbinds);
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // interger: 1-4 input port source
        setPort: function(port, cb, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.1.0";
            var device = this;
            var iPort = parseInt(port) - 1;
            if (iPort < 0 || iPort > 3 || isNaN(iPort)) return fcb(device);
            try {
                session.set({
                    oid: oid,
                    value: iPort,
                    type: INTEGER
                }, function(error, varbinds) {
                    if (error) {
                        // console.log(oid + ': ' + error);
                        fcb();
                    } else {
                        //validation
                        console.log("set: " + varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                        device.getPort(function(returned_varbinds) { // this will set the local variable with the returned value
                            if (returned_varbinds[0].value != varbinds[0].value) {
                                fcb(device);
                            } else cb(device);
                        });
                    }
                });
            } catch (e) {
                console.error(e);
            }
        },
        getPort: function(callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.1.0";
            var device = this;
            session.get({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.port = varbinds[0].value + 1;
                    callback(varbinds);
                    console.log("get: " + varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 5150000 lnb lo freq
        setLOFreq: function(freq, port, cb, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.2." + port;
            var device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort)) return fcb();
            var iFreq = parseInt(freq);
            if(isNaN(iFreq)) return fcb();
            session.set({
                oid: oid,
                value: iFreq,
                type: INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.loFreq = varbinds[0].value;
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb();
                }
            });
        },
        getLOFreq: function(port, callback, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.2." + port;
            var iPort = parseInt(port);
            if(isNaN(iPort)) return fcb();
            var device = this;
            session.get({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.loFreq = varbinds[0].value;
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    callback(varbinds);
                }
            });
        },
        // INTEGER: 4080000 sat freq
        setSatFreq: function(freq, port, cb, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.3." + port;
            var device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort)) return fcb();
            var iFreq = parseInt(freq);
            if(isNaN(iFreq)) return fcb();
            session.set({
                oid: oid,
                value: iFreq,
                type: INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.freq = varbinds[0].value;
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb();
                }
            });
        },
        getSatFreq: function(port, callback,fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.3." + port;
            var device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort)) return fcb();
            session.get({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.freq = varbinds[0].value;
                    callback(varbinds);
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 27780000 symbol rate
        setSymRate: function(rate, port, cb, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.4." + port;
            var device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort)) return fcb();
            var iRate = parseInt(rate);
            if(isNaN(iRate)) return fcb();
            session.set({
                oid: oid,
                value: iRate,
                type: INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.symRate = varbinds[0].value;
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb();
                }
            });
        },
        getSymRate: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.4." + port;
            var device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort)) return fcb();
            session.get({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.symRate = varbinds[0].value;
                    callback(varbinds);
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 0 Modulation 0=DVB-S 2=DVB-S2 or 8PSK 1=DVB-S2??
        setModulation: function(mod, port, cb, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.5." + port;
            var device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort)) return fcb();
            var iMod = parseInt(mod);
            if (iMod < 0 || iMod > 3 || isNaN(iMod)) return fcb();
            session.set({
                oid: oid,
                value: iMod,
                type: INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {

                    device.getModulation(port, function(varbinds) {
                        device.modulation = varbinds[0].value;
                        // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                        cb();
                    });
                }
            });
        },
        getModulation: function(port, callback, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.5." + port;
            var device = this;
            session.get({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.modulation = varbinds[0].value;
                    callback(varbinds);
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: service array
        setService: function(service, callback, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.2.0";
            var device = this;
            var iService = parseInt(service);
            if(isNaN(iService)) return fcb();
            try {
                session.set({
                    oid: oid,
                    value: iService,
                    type: INTEGER
                }, function(error, varbinds) {
                    if (error) {
                        // console.log(oid + ': ' + error);
                        fcb();
                    } else {
                        console.log("set:" + varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                        // callback(device);
                        //validation
                        device.getService(function(retuned_service) {
                            if (retuned_service != varbinds[0].value) {
                                //try again
                                device.setService(service, callback);
                            } else callback(device);
                        });
                    }
                });
            } catch (e) {
                console.error(e);
            }
        },
        // INTEGER: service array
        getService: function(cb,fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.2.0";
            var device = this;
            session.get({
                oid: oid,
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    device.current_service = varbinds[0].value;
                    // console.log(varbinds);
                    console.log("get:" + varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    cb(varbinds[0].value);
                }
            });
        },
        getServiceArray: function(callback,fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.1.1.2";
            session.getSubtree({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    fcb();
                } else {
                    callback(varbinds);
                    // // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        }
    };
};

module.exports = ird8200;
