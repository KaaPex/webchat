const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/checkAuth');

router.use('/', checkAuth);

router.get('/', function(req, res) {
  res.render('chat');
});

module.exports = router;
