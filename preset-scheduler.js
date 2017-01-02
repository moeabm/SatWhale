"use strict";
var _ = require('lodash');
var fs = require('fs');
var schedule = require('node-schedule');
var jobs_config = require('./schedule.json'); // array of jobs to schedule


var preset_scheduler = function(app) {
    var devices = app.get("devices");
    var scheduledJobs = [];
    console.log(jobs_config);

    var restartAllJobs = function(){
        // stop all existing jobs
        var i = 0;
        for(i = 0 ; i < scheduledJobs.length; i++){
            scheduledJobs[i].cancel();
        }
        //clear jobs array
        scheduledJobs = [];

        //start all jobs in config
        var i = 0;
        for(i = 0 ; i < jobs_config.length; i++){
            var job_config = jobs_config[i];
            scheduledJobs.push(
                schedule.scheduleJob(
                    job_config.time,
                    function(job_config){
                        console.log("shots fired " + job_config.device);
                        console.log(job_config.preset);
                        devices[job_config.device].callPreset(job_config.preset, function(error, device_data){
                          if(error){
                            console.log(devices[job_config.device].name + " call preset error: " + JSON.stringify(error))
                          }else{
                            app.io.emit(device_data.type, device_data);
                          }
                        });
                    }.bind(null, job_config)
                )
            );
        }
    };
    restartAllJobs();


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
