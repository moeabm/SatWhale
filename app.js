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
    devices[i].type = config.devices[i].type;
    devices[i].name = config.devices[i].name;
    devices[i].id =  config.devices[i].id;
    try{
        setInterval(function(){
          console.log("getting lock for id" + devices[i].id);
            var lockStatus = devices[i].lock;
            devices[i].getLock(function(device){
                if( devices[i].lock != lockStatus){
                    io.emit(config.devices[i].type, devices[i]);
                }
            });
        }, 1000);
    }
    catch(e) { }
});
var i;
// for (i = 0; i < panels.length; i++) {
Object.keys(panels).forEach(function(i) {
    var panel = panels[i];
    // console.log(panel.devices);
    for (j = 0; j < panel.devices.length; j++) {
        var id = panel.devices[j].id
        console.log( "finding id " + id );
        panel.devices[j] = _.filter(devices, x => x.id == id)[0];
        console.log( panel.devices[j] );
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
