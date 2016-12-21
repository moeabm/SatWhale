var express = require('express');
var router = express.Router();

/* GET ird8200s listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
/* GET a 8200 JSON. */
router.get('/:id', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id]
    var io = req.app.io;
    device.getStatus(
        function(device){
            res.send(device);
            io.emit('device', device);
        }
    )
});

router.post('/:id', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id]
    var updatedDevice = req.body
    device.updateStatus(updatedDevice,
        function(updated){
            res.send(updated);
        }
    )
});


router.get('/:id/services', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id];
    device.getServiceArray(function(services){
        device.getService(function(currentService){
            res.send({services: services, selected: currentService});
        });
    });
});


module.exports = router;
