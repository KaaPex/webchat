const express = require('express');
const router = express.Router();
const User = require('../models/user').User;

router.get('/', (req, res) => {
  res.render('login');
});

router.post('/', (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  User.authorize(username, password)
    .then((user) => {
      req.session.user = user._id;
      res.send({});
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
});

module.exports = router;
