var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('lodash');

var index = require('./routes/index');
var users = require('./routes/users');
var ird8200 = require('./routes/devices/ird8200');
var qt_lband = require('./routes/devices/qt_lband');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
app.io = io;
io.on('connection', function(){ console.log("new connection") });

var config = require('./config.json').config;
var devices = {};
var panels = config.panels;
var snmpDeviceTypes = [
    "D9854",
    "ird8200",
    "QTLband",
    "TT1260"
];
var serOverIPDeviceTypes = [
    "APC100",
];
Object.keys(config.devices).forEach(function(i) {
    devices[i] = require("./snmp_modules/" + config.devices[i].type)(config.devices[i].address);
    devices[i].inputLabels = config.devices[i].inputLabels;
    devices[i].type = config.devices[i].type;
    // devices[i].name = config.devices[i].name;
    devices[i].id =  config.devices[i].id;
    try{
      devices[i].getStatus(function(){ }, function(){ });
    }
    catch(e) { }
    setInterval(function(){
      // console.log("getting lock for id" + devices[i].id);
      try{
        var lockStatus = devices[i].lock;
        if(typeof devices[i].lock == "undefined") throw new Error('device has no lock status field.');
        devices[i].getLock(function(device){
            // console.log(lockStatus + " vs " + devices[i].lock)
            if( devices[i].lock != lockStatus){
                io.emit(config.devices[i].type, devices[i]);
            }
        }, function(){
            console.log("cannot get lock status for device " + devices[i].id)
        });
      }
      catch(e) {
        // console.log(e)
      }
    }, 1000);
});
var i;
// for (i = 0; i < panels.length; i++) {
Object.keys(panels).forEach(function(i) {
    var panel = panels[i];
    for (j = 0; j < panel.devices.length; j++) {
        var id = panel.devices[j].id
        panel.devices[j] = _.filter(devices, x => x.id == id)[0];
    }
});
app.set('devices', devices);
app.set('panels', panels);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/ird8200s', ird8200);
app.use('/qtlbands', qt_lband);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
