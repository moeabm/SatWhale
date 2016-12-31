"use strict";
var _ = require('lodash');
var snmp = require("snmp-native");
var io
var snmpVars = require('./snmp-vars');
var shared = require('../shared-functions');
var presets = require('../presets.json');

var ASI = 0;
var SAT = 1;
var IP = 3;
var AUTO = 4;


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

    var heartbeat_loop = null;
    var set_service_tries_limit = 10;
    var set_service_tries = 0;

    return {
        //public variables
        id:  options.id,
        name: options.name,
        type: options.type,
        lock: false,
        address: options.address,
        inputLabels: options.inputLabels,
        input: null, //Syntax	 snmpVars.INTEGER32 {asi(0), sat_vsb(1),st_input(2), ip(3),auto(4)}
        port: null,
        freq: null,
        loFreq: null,
        symRate: null,
        modulation: null,
        current_service: null,
        initialized: false,

        initialize: function(heartbeatFunction, callback){
            var this_device = this;
            heartbeat_loop = setInterval(function(){
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

        callPreset: function(presetName, callback){
            var preset = shared.findPreset(presets[this.id], presetName);
            var this_device = this;
            var newData = {};
            _.extend(newData, this, preset );
            this.updateStatus(newData,
                function(data){
                    // console.log(data);
                    console.log("Update status success");
                    setTimeout(function(){
                        this_device.setService(preset.current_service, function(){
                            console.log("Update status and service success");
                            callback(null, this_device);
                        }, function(error){
                            console.log({error: error, message: "Update status failed on preset call 8200"});
                            callback(null, this_device);
                        });
                    }, 2000);
                },
                function(error){
                    console.log(error);
                    console.log("Update status failed on preset call");
                }
            )
        },

        stopHeartbeat: function(){
            if(heartbeat_loop != null)
                clearInterval(heartbeat_loop);
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
            }, failed);
            this.getInput(function(device) {
                if (this_device.input == SAT) {
                    this_device.getPort(function(device) {
                        this_device.getSatFreq(this_device.port, finished, failed);
                        this_device.getLOFreq(this_device.port, finished, failed);
                        this_device.getSymRate(this_device.port, finished, failed);
                        this_device.getModulation(this_device.port, finished, failed);
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
                            this_device.setLOFreq(shared.freqToLo(newData.freq), newData.port, function() {
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
                    this_device.setLOFreq(shared.freqToLo(newData.freq), newData.port, function() {
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
                if(typeof cb !== "undefined") cb(this_device);
            }
        },
        isLocked: function() {
            return lock;
        },
        getLock: function(callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.2.0";
            var this_device = this;
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    if (varbinds[0].type == snmpVars.OCTETSTRING && varbinds[0].value == "LOCKED") {
                        this_device.lock = true;
                    } else {
                        this_device.lock = false;
                    }
                    if(callback) callback(null, this_device.lock);
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
                type: snmpVars.INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    if(typeof fcb !== "undefined") fcb();
                } else {
                    device.input = input;
                    if(typeof cb !== "undefined") cb();
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + snmpVars.valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getInput: function(callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.1.2.0";
            var this_device = this;
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.input = varbinds[0].value;
                    if(callback) callback(null, this_device.input);
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
                    type: snmpVars.INTEGER
                }, function(error, varbinds) {
                    if (error) {
                        // console.log(oid + ': ' + error);
                        if(typeof fcb !== "undefined") fcb();
                    } else {
                        //validation
                        // console.log("set: " + varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + snmpVars.valueTypes[varbinds[0].type] + ')');
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
            var this_device = this;
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.port = varbinds[0].value;
                    if(callback) callback(null, this_device.port);
                }
            });
        },
        // snmpVars.INTEGER: 5150000 lnb lo freq
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
                type: snmpVars.INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    if(typeof fcb !== "undefined") fcb();
                } else {
                    device.loFreq = varbinds[0].value;
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + snmpVars.valueTypes[varbinds[0].type] + ')');
                    if(typeof cb !== "undefined") cb();
                }
            });
        },
        getLOFreq: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.2." + port;
            var this_device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort) && callback) return callback({"error": "Invalid port number: " + port});
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.loFreq = varbinds[0].value;
                    if(callback) callback(null, this_device.loFreq);
                }
            });
        },
        // snmpVars.INTEGER: 4080000 sat freq
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
                type: snmpVars.INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    if(typeof fcb !== "undefined") fcb();
                } else {
                    device.freq = varbinds[0].value;
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + snmpVars.valueTypes[varbinds[0].type] + ')');
                    if(typeof cb !== "undefined") cb();
                }
            });
        },
        getSatFreq: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.3." + port;
            var this_device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort) && callback) return callback({"error": "Invalid port number: " + port});
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.freq = varbinds[0].value;
                    if(callback) callback(null, this_device.freq);
                }
            });
        },
        // snmpVars.INTEGER: 27780000 symbol rate
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
                type: snmpVars.INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    if(typeof fcb !== "undefined") fcb();
                } else {
                    device.symRate = varbinds[0].value;
                    // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + snmpVars.valueTypes[varbinds[0].type] + ')');
                    if(typeof cb !== "undefined") cb();
                }
            });
        },
        getSymRate: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.4." + port;
            var this_device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort) && callback) return callback({"error": "Invalid port number: " + port});
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.symRate = varbinds[0].value;
                    if(callback) callback(null, this_device.symRate);
                }
            });
        },
        // snmpVars.INTEGER: 0 Modulation 0=DVB-S 2=DVB-S2 or 8PSK 1=DVB-S2??
        setModulation: function(mod, port, cb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.5." + port;
            var device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort)) return fcb();
            var iMod = parseInt(mod);
            if (iMod < 0 || iMod > 3 || isNaN(iMod)) return fcb();
            session.set({
                oid: oid,
                value: iMod,
                type: snmpVars.INTEGER
            }, function(error, varbinds) {
                if (error) {
                    // console.log(oid + ': ' + error);
                    if(typeof fcb !== "undefined") fcb();
                } else {

                    device.getModulation(port, function(varbinds) {
                        device.modulation = varbinds[0].value;
                        // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + snmpVars.valueTypes[varbinds[0].type] + ')');
                        if(typeof cb !== "undefined") cb();
                    });
                }
            });
        },
        getModulation: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.2.2.15.1.5." + port;
            var this_device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort) && callback) return callback({"error": "Invalid port number: " + port});
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.modulation = varbinds[0].value;
                    if(callback) callback(null, this_device.modulation);
                }
            });
        },
        // snmpVars.INTEGER: service array
        setService: function(service, callback, fcb) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.2.0";
            var device = this;
            var iService = parseInt(service);
            if(isNaN(iService)) return fcb({error: "bad service id", id: service});
            try {
                session.set({
                    oid: oid,
                    value: iService,
                    type: snmpVars.INTEGER
                }, function(error, varbinds) {
                    if (error) {
                        if(typeof fcb !== "undefined") fcb(error);
                    } else {
                        //validation
                        device.getService( function(retuned_service) {
                            if (retuned_service != varbinds[0].value ){
                                if(set_service_tries++ < set_service_tries_limit)
                                    device.setService(service, callback);
                                else if(typeof fcb !== "undefined") fcb({error: "Max set service tries exceeded."});
                            }
                            else {
                                set_service_tries = 0;
                                if(typeof callback !== "undefined") callback(device);
                            }
                        }, fcb);
                    }
                });
            } catch (e) {
                if(typeof fcb !== "undefined") fcb(error);
                console.error(e);
            }
        },
        // snmpVars.INTEGER: service array
        getService: function(callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.2.0";
            var this_device = this;
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.current_service = varbinds[0].value;
                    if(callback) callback(null, this_device.current_service);
                }
            });
        },
        getServiceArray: function(callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.208.4.1.1.1.2";
            session.getSubtree({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    if(callback) callback(error);
                } else {
                    if(callback) callback(null, varbinds);
                }
            });
        }
    };
};

module.exports = ird8200;
