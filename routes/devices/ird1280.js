var express = require('express');
var router = express.Router();

/* GET ird8200s listing. */
router.get('/', function(req, res, next) {
  res.send(req.app.get('devices'));
});
/* GET a 8200 JSON. */
router.get('/:id', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id]
    // console.log(device);
    device.getStatus(
        function(updated_device){
    console.log(updated_device);

            res.send(updated_device);
        },
        function(){
            res.status(500).send("get Status failed.")
        }
    )
});

router.post('/:id', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id]
    var updatedDevice = req.body
    var io = req.app.io;

    device.updateStatus(updatedDevice,
        function(updated){
            io.emit('ird1280', updated);
            // console.log("update pushed");
            // console.log("updatedDevice");
            // console.log(updated);
            //res.send(updated);
            res.send("updated");
        },
        function(){
            res.status(500).send("set Status failed.")
        }
    )
});


router.get('/:id/services', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id];
    device.getServiceArray(function(services){
        device.getService(function(currentService){
            res.send({services: services, selected: currentService});
        },
        function(){
            res.status(500).send("get service failed.")
        });
    },
    function(){
        res.status(500).send("get service array failed.")
    });
});

router.post('/:id/services', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id];
    var service = req.body.current_service
    console.log("setting service to " + service)
    var io = req.app.io;
    device.setService(service, function(udpated_device){
        io.emit('ird1280', udpated_device);
        res.send("updated");
    },
    function(err){
        console.log(err)
        res.status(500).send("set service failed.")
    });
});


module.exports = router;
