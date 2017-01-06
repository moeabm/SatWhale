"use strict";
var _ = require('lodash');
var fs = require('fs');
var presets = require('./schedule.json'); // array of jobs to schedule


var preset_scheduler = function(app) {
    var devices = app.get("devices");
    return {
        addJob: function(job){
            jobs_config.push(job);
            scheduledJobs.push(
                schedule.scheduleJob(job.time, function(){
                    devices[job.device].callPreset(job.preset);
                })
            );
            fs.writeFile("schedule.json", jobs_config, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("Job config file saved! - job added");
            });
        },
        removeJob: function(job){
            var index = jobs_config.indexOf(job);
            scheduledJobs[index].cancel();
            if (index > -1) {
                jobs_config.splice(index, 1);
                scheduledJobs.splice(index, 1);
            }
            fs.writeFile("schedule.json", jobs_config, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("Job config file saved! - job removed");
            });
        }
    }
};

module.exports = preset_scheduler;
