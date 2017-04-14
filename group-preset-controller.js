"use strict";
var _ = require('lodash');
var fs = require('fs');
// var util = require('util');
var group_presets = require('./groupPresets.json'); // array of presets

var group_preset_controller = function(app) {
    var devices = app.get("devices");
    var presets = app.get("presets");
    return {
        addGroupPreset: function(name, presetData, callback){
            var fail = false;
            presetData.presets.some(function(preset) {
                var foundIndex = Object.keys(devices).map(function(device){return device; }).indexOf(preset.deviceId)
                // does device in new preset exist?
                if(foundIndex < 0){
                    callback("Device " + preset.deviceId + " does not exist")
                    return fail = true;
                }
                var i = 0;
                var deviceIndex = presets[preset.deviceId].map(function(e){ return e.presetName}).indexOf(preset.presetName)
                // does device presets have the preset we are trying to add?
                console.log(preset.presetName);
                if(deviceIndex < 0){
                    callback("Preset " + preset.presetName + " does not exist for device " + preset.deviceId)
                    return fail = true;
                }
                return false;
            });
            if(fail) return false;
            group_presets[name] = presetData;
            fs.writeFile("./groupPresets.json", JSON.stringify(group_presets, null, 2), function(err) {
                if(err) {
                    callback(err);
                    return console.log(err);
                }
                callback(null, presetData);
                console.log("Group presets file saved! - preset added");
            });
        },
        removeGroupPreset: function(name, callback){
            if(!group_presets[name]) return callback("Preset with name "+ name + " does not exist. Cannont remove.");
            delete group_presets[name]
            fs.writeFile("./groupPresets.json", JSON.stringify(group_presets, null, 2), function(err) {
                if(err) {
                    callback(err);
                    return console.log(err);
                }
                callback(null, "removed");
                console.log("Group presets file saved! - preset removed");
            });
        }

    }
};

module.exports = group_preset_controller;
