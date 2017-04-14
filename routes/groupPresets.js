var express = require('express');
var router = express.Router();
var _ = require('lodash');
var group_preset_controller = require('../group-preset-controller')

/* GET all group presets listing. */
router.get('/', function(req, res) {
  res.send(req.app.get('group-presets'));
});

// /* call a group preset */
router.put('/', function(req, res) {
  var presetGroup = req.app.get('group-presets')[req.body.name]
  if(!presetGroup) return res.status(500).send("Preset '"+req.body.name+"' does not exist");

  var finished = _.after(presetGroup.presets.length, allFinished);
  var errors = {};

  presetGroup.presets.forEach(function(preset) {
    var io = req.app.io;
    var device = req.app.get('devices')[preset.deviceId];
    device.callPreset(preset.presetName, function(error, returned_preset){
      if(error) errors[presetName] = error;
      console.log("device");
      console.log(device);
      io.emit(device.type, device);
      finished();
    });
  });
  function allFinished(){
    if(Object.keys(errors).length === 0){
      res.send({"status": "Preset successful."});
    }
    else res.status(500).send(errors)
      
  }
});

/* update/create a preset */
router.post('/', function(req, res) {
  var io = req.app.io;
  group_preset_controller(req.app).addGroupPreset(req.body.name,req.body.data, function(error, returned_preset){
    if(error) res.status(500).send(error)
    else{
        io.emit('preset', returned_preset);
        res.send(returned_preset);
    }
  })
  // res.send(preset_controller);
});

/* delete a preset group. */
router.delete('/', function(req, res) {
  group_preset_controller(req.app).removeGroupPreset(req.body.name, function(error, removed){
    if(error) res.status(500).send(error)
    else{
        res.send(removed);
    }
  })
});


module.exports = router;

