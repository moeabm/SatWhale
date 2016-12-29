"use strict";
var _ = require('lodash');
var snmp = require("snmp-native");
var pad = require("pad-left");
var sync = require('synchronize')
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

var qt_lband = function(options) {
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

    var locked = false;
    var getLock = function(cb){
        sync.fiber(function(){
            console.log("WAITING FOR LOCK");
            while(locked){
                sync.await(setTimeout(sync.defer(), 200))
            }
            locked = true;
            console.log("GOT LOCK");
            cb();
            return;
        });
    }

    var releaseLock = function(){
        locked = false;
        console.log("LOCK RELEASED");
        return;
    }

    return {
        //public variables
        id: options.id,
        type: options.type,
        address: options.address,
        inputs: [],
        outputs: [],

        initialize: function(heartbeatFunction, callback){
            //this device does not have/need a heartbeatFunction. Not Used
            var this_device = this;
            this_device.getStatus(function(){
                this_device.initialized = true;
                if(typeof callback !== "undefined") callback();
            });
        },
        getStatus: function(cb, fcb) {
            var oid = ".1.3.6.1.4.1.901.20398.1.2.1.0";
            var this_device = this;
            session.get({
                oid: oid
            }, function(error, varbinds){
                if (error) {
                    if(typeof fcb !== "undefined") fcb(error);
                } else {
                    if(this_device.inputs.length < 1){
                        this_device.loadIO(cb);
                    }
                    else if(typeof cb !== "undefined") cb(this_device);
                }
            });
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

        setCrosspoint: function(output, input, cb, fcb) {
            var oid = ".1.3.6.1.4.1.901.20398.1.1.11.0";
            var commandStr = "S"+pad(output, 3, '0')+pad(input, 3, '0');
            if (isNaN(output)) return fcb();
            if (isNaN(input)) return fcb();
            sync.fiber(function(){
                sync.await(getLock(sync.defer()));
                session.set({
                    oid: oid,
                    value: commandStr,
                    type: OCTETSTRING
                }, function(error, varbinds) {
                    if (error) {
                        // console.log(oid + ': ' + error);
                        releaseLock();
                        fcb();
                    } else {
                        var getOid = ".1.3.6.1.4.1.901.20398.1.2.11.0";
                        session.get({
                            oid: getOid
                        }, function(error, varbinds){
                            if (error) {
                                // console.log(oid + ': ' + error);
                                releaseLock();
                                fcb(error);
                            } else {
                                releaseLock();
                                cb(null, varbinds);
                            }
                        });
                        // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    }
                });
            })
        },

        getOutputStatus: function(output, cb, fcb) {
            var oid = ".1.3.6.1.4.1.901.20398.1.1.11.0";
            var commandStr = "O"+pad(output, 3, '0');
            if (isNaN(output)) return fcb();
            sync.fiber(function(){
                sync.await(getLock(sync.defer()));
                session.set({
                    oid: oid,
                    value: commandStr,
                    type: OCTETSTRING
                }, function(error, varbinds) {
                    if (error) {
                        // console.log(oid + ': ' + error);
                        releaseLock();
                        fcb();
                    } else {
                        var getOid = ".1.3.6.1.4.1.901.20398.1.2.11.0";
                        session.get({
                            oid: getOid
                        }, function(error, getVarbinds){
                            if (error) {
                                // console.log(oid + ': ' + error);
                                releaseLock();
                                fcb(error);
                            } else {
                                releaseLock();
                                var input = parseInt(getVarbinds[0].value.replace(/\D/, "") )
                                if(isNaN(input) ) return fcb();
                                else cb(null, input.toString() );
                            }
                        });
                        // console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                    }
                });
            });
        },
        getOutputName: function(output, cb, fcb) {
            var oid = ".1.3.6.1.4.1.901.20398.1.1.11.0";
            var commandStr = "NRO"+pad(output, 3, '0');
            if (isNaN(output)) return fcb();
            sync.fiber(function(){
                sync.await(getLock(sync.defer()));
                session.set({
                    oid: oid,
                    value: commandStr,
                    type: OCTETSTRING
                }, function(error, varbinds) {
                    if (error) {
                        // console.log(oid + ': ' + error);
                        releaseLock();
                        fcb();
                    } else {
                        var getOid = ".1.3.6.1.4.1.901.20398.1.2.11.0";
                        session.get({
                            oid: getOid
                        }, function(error, getVarbinds){
                            if (error) {
                                // console.log(oid + ': ' + error);
                                releaseLock();
                                fcb(error);
                            } else {
                                releaseLock();
                                cb(null, getVarbinds[0].value.replace(commandStr, "").replace(/\"/, ""));
                            }
                        });
                    }
                });
            });
        },
        getInputName: function(input, cb, fcb) {
            var oid = ".1.3.6.1.4.1.901.20398.1.1.11.0";
            var commandStr = "NRI"+pad(input, 3, '0');
            if (isNaN(input)) return fcb();
            sync.fiber(function(){
                sync.await(getLock(sync.defer()));
                session.set({
                    oid: oid,
                    value: commandStr,
                    type: OCTETSTRING
                }, function(error, varbinds) {
                    if (error) {
                        // console.log(oid + ': ' + error);
                        releaseLock();
                        fcb();
                    } else {
                        var getOid = ".1.3.6.1.4.1.901.20398.1.2.11.0";
                        session.get({
                            oid: getOid
                        }, function(error, getVarbinds){
                            if (error) {
                                // console.log(oid + ': ' + error);
                                releaseLock();
                                fcb(error);
                            } else {
                                releaseLock();
                                cb(null, getVarbinds[0].value.replace(commandStr, "").replace(/\"/, ""));
                            }
                        });
                    }
                });
            });
        },
        loadIO: function(cb, fcb) {

            var this_device = this;
            //get output size
            function getOutSize(callback){
                var getOid = ".1.3.6.1.4.1.901.20398.1.2.5.0";
                session.get({
                    oid: getOid
                }, function(error, getVarbinds){
                    if (error) {
                        // console.log(oid + ': ' + error);
                        callback(error, "");
                    } else {
                        // console.log(getVarbinds);
                        callback(null, getVarbinds[0].value);
                    }
                });
            };
            //get input size
            function getInSize(callback){
                var getOid = ".1.3.6.1.4.1.901.20398.1.2.6.0";
                session.get({
                    oid: getOid
                }, function(error, getVarbinds){
                    if (error) {
                        // console.log(oid + ': ' + error);
                        callback(error, "");
                    } else {
                        // console.log(getVarbinds);
                        callback(null, getVarbinds[0].value);
                    }
                });
            };
            sync.fiber(function(){
                var outputs = sync.await(getOutSize(sync.defer() ) );
                var inputs = sync.await(getInSize(sync.defer() ) );
                var i;
                for(i = 1; i <= outputs; i++ ){
                    this_device.outputs[i-1] = sync.await(this_device.getOutputName(i, sync.defer() ) );
                }
                for(i = 1; i <= inputs; i++ ){
                    this_device.inputs[i-1] = sync.await(this_device.getInputName(i, sync.defer() ) );
                }
                cb(this_device);
            })

        }
    };
};

module.exports = qt_lband;
