var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
      title: 'Express',
      devices: res.app.get('devices'),
      panels: res.app.get('panels')  });
});

module.exports = router;
