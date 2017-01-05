"use strict";
var _ = require('lodash');
var snmp = require("snmp-native");
var pad = require("pad-left");
var sync = require('synchronize')
var snmpVars = require('./snmp-vars');
var shared = require('../shared-functions');
var presets = require('../presets.json');

var setCommandOid = ".1.3.6.1.4.1.901.20398.1.1.11.0";
var getCommandOid = ".1.3.6.1.4.1.901.20398.1.2.11.0";

var qt_lband = function(options) {
    if( typeof options.address === "undefined"){
        throw new Error("Addresss missing for qt_lband. Please see configuration");
        return null;
    }
    if( typeof options.id === "undefined"){
        throw new Error("ID missing for qt_lband. Please see configuration");
        return null;
    }
    //variables that are not accessible outside this scope
    var session = new snmp.Session({
        host: options.address,
        community: "private"
    })

    var locked = false;
    var getLock = function(callback){
        sync.fiber(function(){
            // loop until we get lock
            while(locked){
                sync.await(setTimeout(sync.defer(), 200))
            }
            locked = true;
            callback();
            return;
        });
    };

    var setCommand =function(commandStr, callback){
        snmpVars.setOid(session, setCommandOid, commandStr, snmpVars.OCTETSTRING, callback);
        // session.set({
        //     oid: setCommandOid,
        //     value: commandStr,
        //     type: snmpVars.OCTETSTRING
        // }, function(error, varbinds) {
        //     if (error) {
        //         if(callback) callback(error);
        //     } else {
        //         if(callback) callback(null, varbinds);
        //     }
        // });
    };
    var getCommand = function(callback){
        snmpVars.getOid(session, getCommandOid, callback);
    };

    var releaseLock = function(){
        locked = false;
        // console.log("LOCK RELEASED");
        return;
    }

    return {
        //public variables
        id: options.id,
        name: options.name,
        type: options.type,
        address: options.address,
        inputs: [],
        outputs: [],
        presetable_attributes: ["input", "output"],

        initialize: function(heartbeatFunction, callback){
            //this device does not have/need a heartbeatFunction. Not Used
            var this_device = this;
            this_device.initialized = true;
            this_device.getStatus(callback);
        },


        callPreset: function(presetName, callback){
            var preset = shared.findPreset(presets[this.id], presetName);
            var this_device = this;
            var newData = {};
            _.extend(newData, this_device, preset );
            this.setCrosspoint(newData.output, newData.input, function(){
                callback(null, newData);
            },
            function(error){
                callback(error, preset);
                console.log("Failed to set setCrosspoint");
                console.log(error);
            });
        },

        getStatus: function(callback) {
            var oid = ".1.3.6.1.4.1.901.20398.1.2.1.0";
            var this_device = this;
            snmpVars.getOid(session, oid, function(error, varbinds){
                if (error) {
                    if(callback) callback(error);
                } else {
                    if(this_device.inputs.length < 1){
                        this_device.loadIO(callback);
                    }
                    if(callback) callback(null, this_device);
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

        setCrosspoint: function(output, input, callback) {
            var commandStr = "S"+pad(output, 3, '0')+pad(input, 3, '0');
            if (isNaN(output) && callback) return callback({error: "Bad output: " + output});
            if (isNaN(input) && callback) return callback({error: "Bad input: " + input});
            sync.fiber(function(){
                try{
                    sync.await(getLock(sync.defer()));
                    sync.await(setCommand(commandStr, sync.defer() ) );
                    var varbinds = sync.await(getCommand(sync.defer() ) );
                    releaseLock();
                    if(callback) callback(null, varbinds[0]);
                }
                catch (e){
                    releaseLock();
                    if(callback) callback(e);
                }
            })
        },

        getOutputStatus: function(output, callback) {
            var commandStr = "O"+pad(output, 3, '0');
            if (isNaN(output) && callback) return callback({error: "Bad output: " + output});
            sync.fiber(function(){
                try{
                    sync.await(getLock(sync.defer()));
                    sync.await(setCommand(commandStr, sync.defer() ) );
                    var varbinds = sync.await(getCommand(sync.defer() ) );
                    releaseLock();
                    // console.log("Output " + ouput + " is assigned to " + varbinds[0].value.replace(/\D/, ""));
                    if(callback) callback(null, parseInt(varbinds[0].value.replace(/\D/, "")) );
                }
                catch (e){
                    releaseLock();
                    if(callback) callback(e);
                }
            });
        },

        getOutputName: function(output, callback) {
            var commandStr = "NRO"+pad(output, 3, '0');
            if (isNaN(output) && callback) return callback({error: "Bad output: " + output});
            sync.fiber(function(){
                try{
                    sync.await(getLock(sync.defer()));
                    sync.await(setCommand(commandStr, sync.defer() ) );
                    var varbinds = sync.await(getCommand(sync.defer() ) );
                    releaseLock();
                    if(callback) callback(null, varbinds[0].value.replace(commandStr, "").replace(/\"/, ""));
                }
                catch (e){
                    releaseLock();
                    if(callback) callback(e);
                }
            });
        },
        getInputName: function(input, callback) {
            var commandStr = "NRI"+pad(input, 3, '0');
            if (isNaN(input) && callback) return callback({error: "Bad input: " + input});
            sync.fiber(function(){
                try{
                    sync.await(getLock(sync.defer()));
                    sync.await(setCommand(commandStr, sync.defer() ) );
                    var varbinds = sync.await(getCommand(sync.defer() ) );
                    releaseLock();
                    if(callback) callback(null, varbinds[0].value.replace(commandStr, "").replace(/\"/, ""));
                }
                catch (e){
                    releaseLock();
                    if(callback) callback(e);
                }
            });
        },
        loadIO: function(callback) {
            var this_device = this;
            var callback_called = false;
            //get output size
            function getOutSize(cb){
                var oid = ".1.3.6.1.4.1.901.20398.1.2.5.0";
                snmpVars.getOid(session, oid, function(error, varbinds){
                    if (error) {
                        if(cb) cb(error);
                    } else {
                        if(cb) cb(null, varbinds[0].value);
                    }
                });
            };
            //get input size
            function getInSize(cb){
                var oid = ".1.3.6.1.4.1.901.20398.1.2.6.0";
                snmpVars.getOid(session, oid, function(error, varbinds){
                    if (error) {
                        if(cb) cb(error);
                    } else {
                        if(cb) cb(null, varbinds[0].value);
                    }
                });
            };
            sync.fiber(function(){
                try{
                    var outputs = sync.await(getOutSize(sync.defer() ) );
                    var inputs = sync.await(getInSize(sync.defer() ) );
                    var i;
                    for(i = 1; i <= outputs; i++ ){
                        this_device.outputs[i-1] = sync.await(this_device.getOutputName(i, sync.defer() ) );
                    }
                    for(i = 1; i <= inputs; i++ ){
                        this_device.inputs[i-1] = sync.await(this_device.getInputName(i, sync.defer() ) );
                    }
                    callback_called = true;
                    callback(null, this_device);
                }
                catch (e){
                    releaseLock(); // just in case we throw error in lock state
                    console.log(e);
                    if(!callback_called && callback){
                        callback_called = true;
                        callback(e);
                    }
                }
            });

        }
    };
};

module.exports = qt_lband;
