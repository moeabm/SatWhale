var express = require('express');
var router = express.Router();

/* GET 8200 listing. */
router.get('/', function(req, res, next) {
  res.send(req.app.get('devices'));
});
/* GET a 8200 JSON. */
router.get('/:id', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id]
    // console.log(device);
    device.getStatus(function(error, updated_device){
        if(error) res.status(500).send(error)
        else res.send(updated_device);
    });
});

router.post('/:id', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id]
    var updatedDevice = req.body
    var io = req.app.io;

    device.updateStatus(updatedDevice, function(error, updated){
        if(error) res.status(500).send(error)
        else{
            io.emit('ird8200', updated);
            res.send("updated");
        }
    })
});


router.get('/:id/services', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id];
    device.getServiceArray(function(error, services){
        if(error) res.status(500).send(error)
        else {
            device.getService(function(error, currentService){
                if(error) res.status(500).send(error)
                else res.send({services: services, selected: currentService});
            });
        }
    });
});

router.post('/:id/services', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id];
    var service = req.body.current_service
    var io = req.app.io;
    device.setService(service, function(error, updated_service){
        if(error) res.status(500).send(error)
        else{
            io.emit('ird8200', device);
            res.send("updated");
        }
    });
});


module.exports = router;
