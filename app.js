var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('lodash');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
app.io = io;
io.on('connection', function(){ console.log("new connection") });


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

var index = require('./routes/index');
var users = require('./routes/users');
app.use('/', index);
app.use('/users', users);

var device_drivers = {
    ird8200: require('./snmp_modules/ird8200'),
    qt_lband: require('./snmp_modules/qt_lband')
}

var config = require('./config.json').config;
var devices = {};
var panels = config.panels;


//initialize devices
Object.keys(config.devices).forEach(function(i) {
    devices[i] = device_drivers[config.devices[i].type](config.devices[i]); //require("./snmp_modules/" + config.devices[i].type)(config.devices[i]);
    devices[i].initialize(function(){
        io.emit(config.devices[i].type, devices[i]);
    });
});

//initialize panels
var transferDevicesToPanels = function(pObject){
  Object.keys(pObject).forEach(function(i) {
      var panel = pObject[i];
      if(typeof panel.subpanels === "undefined")
        for (j = 0; j < panel.devices.length; j++) {
            var id = panel.devices[j].id
            panel.devices[j] = _.filter(devices, x => x.id == id)[0];
        }
      else transferDevicesToPanels(panel.subpanels);
  });
}
transferDevicesToPanels(panels);
// globals
app.set('devices', devices);
app.set('panels', panels);

//routes
app.use('/ird8200s', require('./routes/devices/ird8200'));
app.use('/qtlbands', require('./routes/devices/qt_lband'));

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
