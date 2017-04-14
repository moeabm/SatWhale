var express = require('express');
var router = express.Router();
var preset_controller = require('../preset-controller')

/* GET all presets listing. */
router.get('/', function(req, res) {
  res.send(req.app.get('presets'));
});
/* GET a preset by id. */
router.get('/:id', function(req, res) {
  res.send(req.app.get('presets')[req.params.id]);
});

/* call a device's preset */
router.put('/:id', function(req, res) {
  var io = req.app.io;
  var device = req.app.get('devices')[req.params.id];
  // var preset = preset_controller(req.app).getPreset(req.body.presetName, req.params.id);
  // console.log(preset);
  device.callPreset(req.body.presetName, function(error, returned_preset){
    if(error) res.status(500).send(error)
    else{
      console.log("device");
      console.log(device);
      io.emit(device.type, device);
      res.send(returned_preset);
      console.log(returned_preset);
    }
  });
});

/* update/create a preset by id. */
router.post('/:id', function(req, res) {
  var io = req.app.io;
  preset_controller(req.app).addPreset(req.body,req.params.id, function(error, returned_preset){
    if(error) res.status(500).send(error)
    else{
        io.emit('preset', returned_preset);
        res.send(returned_preset);
    }
  })
  // res.send(preset_controller);
});

/* create a preset. */
router.delete('/:id', function(req, res) {
  preset_controller(req.app).removePreset(req.body,req.params.id, function(error, removed){
    if(error) res.status(500).send(error)
    else{
        // io.emit('preset', returned_preset);
        res.send(removed);
    }
  })
});


module.exports = router;

