"use strict";
var _ = require('lodash');
var snmp = require("snmp-native");
var io
var snmpVars = require('./snmp-vars');
var shared = require('../shared-functions');
var presets = require('../presets.json');

shared.freqToLO = function(freq) {
    if (freq < 12700000 && freq > 11700000) return 10750000; //Hz Ku range
    if (freq < 4200000 && freq > 3625000) return 5150000; //Hz C range
    console.log("Invalid frequency: " + freq + "Hz");
    return -1;
}


var ird1280 = function(options) {

    if( typeof options.address === "undefined"){
        throw new Error("Addresss missing for ird1280. Please see configuration");
        return null;
    }
    if( typeof options.id === "undefined"){
        throw new Error("ID missing for ird1280. Please see configuration");
        return null;
    }
    //variables that are not accessible outside this scope
    var session = new snmp.Session({
        host: options.address,
        community: "private",
        version: 0
    })

    var heartbeat_loop = null;

    return {
        //public variables
        id:  options.id,
        name: options.name,
        type: options.type,
        lock: false,
        address: options.address,
        inputLabels: options.inputLabels,
        port: null,
        freq: null,
        loFreq: null,
        symRate: null,
        modulation: null,
        current_service: null,
        initialized: false,
        presetable_attributes: ["port", "freq", "loFreq", "symRate", "modulation", "current_service"],

        initialize: function(heartbeatFunction, callback){
            var this_device = this;
            heartbeat_loop = setInterval(function(){
                var lockStatus = this_device.lock;
                this_device.getLock(function(error, returned_status){
                    if(error){
                      console.log(this_device.name + ": cannot get lock status for device -- " + error );
                    }
                    else if( returned_status != lockStatus){
                        heartbeatFunction();
                    }
                });
            }, 1000);
            this_device.initialized = true;
            this_device.getStatus(callback);
        },

        callPreset: function(presetName, callback){
            var preset = shared.findPreset(presets[this.id], presetName);
            var this_device = this;
            var newData = {};
            _.extend(newData, this, preset );
            this.updateStatus(newData,
                function(error, data){
                    if(error && callback) callback(error);
                    else setTimeout(function(){
                        this_device.setService(preset.current_service, function(){
                            callback(null, this_device);
                        }, function(error){
                            console.log({error: error, message: "Update service failed on preset call 1280"});
                            // console.log(error);
                            callback(null, this_device);
                        });
                    }, 2000);
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
        getStatus: function(error, callback) {
            var finished = _.after(5, doCallback);
            var tick_finished = function(error, data){
                if(error) failed(error);
                else finished();
            };
            var this_device = this;
            var fail_sent = false;
            var failed = function( error ){
                //only send once
                if(fail_sent != true) {
                    fail_sent = true;
                    error.msg = "get status failed";
                    if(callback) return callback(error);
                }
            };
            this_device.getLock( function(error, device) {
                if(error) failed(error);
                else finished();
            });

            this_device.getPort(function(error, port) {
                if(error){
                    if(error) failed(error);
                }
                else{
                    this_device.getSatFreq(this_device.port, tick_finished);
                    this_device.getLOFreq(this_device.port, tick_finished);
                    this_device.getSymRate(this_device.port, tick_finished);
                    this_device.getModulation(this_device.port, tick_finished);
                }
            });

            function doCallback() {
                if(callback) callback(null, this_device);
            }
        },

        updateStatus: function(newData, callback) {

            var finished = _.after(4, doCallback);
            var tick_finished = function(error, data){
                if(error) failed(error);
                else finished();
            };
            var this_device = this;
            var fail_sent = false;
            var failed = function( error ){
                //only send once
                if(fail_sent != true) {
                    fail_sent = true;
                    error.msg = "get status failed";
                    if(callback) return callback(error);
                }
            }

            this.getLock( function(error, device) {
                if(error) failed(error);
                else tick_finished();
            });

            this.setPort(newData.port, function(error, port) {
                if(error){
                    tick_finished();
                    tick_finished();
                    tick_finished();
                }
                else{
                    if (newData.freq && newData.freq != this_device.freq) {
                        console.log("==========Port Changed and freq========");
                        this_device.setLOFreq(shared.freqToLO(newData.freq), newData.port, function() {
                            this_device.setSatFreq(newData.freq, newData.port, tick_finished)
                        })
                    } else {
                        // console.log("==========no freq change========");
                        this_device.getLOFreq(newData.port, function() {
                            this_device.getSatFreq(newData.port, tick_finished)
                        })
                    }
                    if (newData.symRate && newData.symRate != this_device.symRate) {
                        console.log("==========symRate========");
                        this_device.setSymRate(newData.symRate, newData.port, tick_finished)
                    } else {
                        // console.log("==========no symrate change========");
                        this_device.getSymRate(newData.port, tick_finished)
                    }
                    if (newData.modulation && newData.modulation != this_device.modulation) {
                        console.log("==========Modulation changed========");
                        this_device.setModulation(newData.modulation, newData.port, tick_finished)
                    } else {
                        this_device.getModulation(newData.port, tick_finished)
                    }
                }
            });
            function doCallback() {
                if(callback) callback(null, this_device);
            }
        },
        isLocked: function() {
            return lock;
        },
        getLock: function(callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.1.1.0";
            var this_device = this;
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    if (varbinds[0].type == snmpVars.INTEGER && varbinds[0].value == 2) {
                        this_device.lock = true;
                    } else {
                        this_device.lock = false;
                    }
                    if(callback) callback(null, this_device.lock);
                }
            });
        },
        // interger: 2-5 input port source
        setPort: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.1.0";
            var this_device = this;
            var iPort = parseInt(port) - 1;
            if ( (iPort < 2 || iPort > 5 || isNaN(iPort)) && callback) return callback({"error": "Invalid port number: " + port});
            snmpVars.setOid(session, oid, iPort, snmpVars.INTEGER, function(error, varbinds) {
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.getPort(callback);
                }
            });
        },
        getPort: function(callback) {
            var this_device = this;
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.1.0";
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.port = varbinds[0].value - 1;  //1280 has port values 2-5
                    if(callback) callback(null, this_device.port);
                }
            })
        },
        // snmpVars.INTEGER: 5150000 lnb lo freq
        setLOFreq: function(freq, port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.2.1.6." + port;
            var this_device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort) && callback) return callback({"error": "Invalid port number: " + port});
            var iFreq = parseInt(freq);
            if(isNaN(iFreq) && callback) return callback({"error": "Invalid frequency: " + freq});
            snmpVars.setOid(session, oid, freq, snmpVars.INTEGER, function(error, varbinds) {
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.getLOFreq(port, callback)
                }
            });
        },
        getLOFreq: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.2.1.6." + port;
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
        setSatFreq: function(freq, port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.2.1.5." + port;
            var this_device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort) && callback) return callback({"error": "Invalid port number: " + port});
            var iFreq = parseInt(freq);
            if(isNaN(iFreq) && callback) return callback({"error": "Invalid frequency: " + freq});
            snmpVars.setOid(session,  oid, freq, snmpVars.INTEGER, function(error, varbinds) {
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.getSatFreq(port, callback)
                }
            });
        },
        getSatFreq: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.2.1.5." + port;
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
        setSymRate: function(rate, port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.2.1.2." + port;
            var this_device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort) && callback) return callback({"error": "Invalid port number: " + port});
            var iRate = parseInt(rate);
            if(isNaN(iRate) && callback) return callback({"error": "Invalid symbol rate: " + rate});
            snmpVars.setOid(session, oid, rate, snmpVars.INTEGER, function(error, varbinds) {
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.getSymRate(port, callback)
                }
            });
        },
        getSymRate: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.2.1.2." + port;
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
        setModulation: function(mod, port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.2.1.9." + port;
            var this_device = this;
            var iPort = parseInt(port);
            if(isNaN(iPort) && callback) return callback({"error": "Invalid port number: " + port});
            var iMod = parseInt(mod);
            if( (iMod < 0 || iMod > 4 || isNaN(iMod)) && callback) return callback({"error": "Invalid modulation: " + mod});
            snmpVars.setOid(session, oid, mod, snmpVars.INTEGER, function(error, varbinds) {
                if (error) {
                    if(callback) callback(error);
                } else {
                    this_device.getModulation(port, callback)
                }
            });
        },
        getModulation: function(port, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.4.3.3.2.2.1.9." + port;
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
        setService: function(service, callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.2.4.2.0";
            var device = this;
            var iService = parseInt(service);
            if(isNaN(iService)) return fcb({error: "bad service id " + service});
            snmpVars.setOid(session, oid, iService, snmpVars.INTEGER, function(error, varbinds) {
                if (error) {
                    if(callback) callback (error);
                } else {
                    device.getService(function(retuned_service) {
                        if (retuned_service != varbinds[0].value) {
                            //try again
                            device.setService(service, callback);
                        } else if(callback) callback(null, device);
                    });
                }
            });
        },
        // snmpVars.INTEGER: service array
        getService: function(callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.2.4.2.0";
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
        //TODO: get id array to so you can referece the ID of the service (needed for set service).... 8200s provide the ID with the service name string
        getServiceArray: function(callback) {
            var oid = ".1.3.6.1.4.1.1773.1.3.200.2.3.1.3";
            session.getSubtree({
                oid: oid
            }, function(error, varbinds) {
                if (error) {
                    if(callback)callback(error);
                } else {
                    if(callback)callback(null, varbinds);
                }
            });
        }
    };
};

module.exports = ird1280;
