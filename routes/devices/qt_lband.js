var express = require('express');
var router = express.Router();

/* GET quintec devices. */
router.get('/', function(req, res, next) {
    var all_devices = req.app.get('devices');
    var filtered_devices = {};
    Object.keys(all_devices).map(function(objectKey, index) {
        if(all_devices[objectKey].type == "qt_lband"){
            filtered_devices[objectKey] = all_devices[objectKey]
        }
        var value = all_devices[objectKey];
        // console.log(value);
    });
    res.send(filtered_devices);
});
/* GET a quintec JSON. */
router.get('/:id', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id]
    // console.log(device);
    device.getStatus(
        function(error, returned_device){
            if(error){
                res.status(500).send(error)
            }
            else res.send(device);
        }
    )
});

//post ID 404
router.post('/:id', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id]
    var data = req.body
    var io = req.app.io;

    res.status(404).send('not found');
});

// get output status
router.get('/:id/output/:num', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id];
    var output = req.params.num;
    device.getOutputStatus(output, function(error, input){
        if(error){
            res.status(500).send(error)
        }
        else res.send({"output": output, "input": input });
    });
});

// set crosspoint
router.post('/:id/output/:num', function(req, res, next) {
    var device = req.app.get('devices')[req.params.id];
    var output = req.params.num;
    var input = req.body.input;
    var io = req.app.io;
    device.setCrosspoint(output, input, function(error, varbinds){
        if(error){
            res.status(500).send(error)
        }
        else{
            res.send("crosspoint set");
            io.emit('qt_lband', device);
        }
    });
});

module.exports = router;
