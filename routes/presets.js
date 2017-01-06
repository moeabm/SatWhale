var express = require('express');
var router = express.Router();
var preset_controller = require('../preset-controller')

/* GET all presets listing. */
router.get('/', function(req, res) {
  res.send(req.app.get('presets'));
});
/* GET a preset by id. */
router.get('/:id', function(req, res) {
});

/* update a preset by id. */
router.post('/:id', function(req, res) {
});

/* create a preset. */
router.post('/new', function(req, res) {
  var preset_scheduler = require('./preset-scheduler')(req.app);
  var job = req.body;
  console.log(job);
  //preset_scheduler.addJob(job);
});

/* create a preset. */
router.delete('/:id', function(req, res) {

});


module.exports = router;
