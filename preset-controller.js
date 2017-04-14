"use strict";
var _ = require('lodash');
var fs = require('fs');
// var util = require('util');
var presets = require('./presets.json'); // array of presets

var preset_controller = function(app) {
    var devices = app.get("devices");
    return {
        addPreset: function(preset, id, callback){
            if(!presets[id]) preset[id] = {};
            var index = presets[id].map(function(e) { return e.presetName; }).indexOf(preset.presetName);
            if(index < 0 )presets[id].push(preset);
            else presets[id][index] = preset;
            fs.writeFile("./presets.json", JSON.stringify(presets, null, 2), function(err) {
                if(err) {
                    callback(err);
                    return console.log(err);
                }
                callback(null, preset);
                console.log("presets file saved! - preset added");
            });
        },
        removePreset: function(preset, id, callback){
            if(!presets[id]) return callback("Device with ID "+ id + " does not exist. Cannont remove preset.");
            var index = presets[id].map(function(e) { return e.presetName; }).indexOf(preset.presetName);
            if(index < 0 ) return callback("Preset with name "+ preset.presetName + " does not exist. Cannont remove preset.");
            var removed = presets[id].splice(index, 1);
            fs.writeFile("./presets.json", JSON.stringify(presets, null, 2), function(err) {
                if(err) {
                    callback(err);
                    return console.log(err);
                }
                callback(null, removed);
                console.log("presets file saved! - preset added");
            });
        },
        getPreset: function(name, id,callback){
            if(!presets[id]) return ("Device with ID "+ id + " does not exist. Cannont get preset.");
            var index = presets[id].map(function(e) { return e.presetName; }).indexOf(name);
            if(index < 0 ) return ("Preset with name "+ name + " does not exist. Cannont get preset.");
            return presets[id][index];
        }

    }
};

module.exports = preset_controller;
