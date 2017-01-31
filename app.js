const express = require('express');
const path = require('path');

const config = require('./config');
const session = require('express-session');
const sessionStore = require('./libs/sessionStore');

const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler')

const index = require('./routes/index');
const users = require('./routes/users');
const login = require('./routes/login');
const logout = require('./routes/logout');
const chat = require('./routes/chat');

const HttpError = require('./error').HttpError;

const app = express();

// view engine setup
app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'template'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: config.get('session:secret'), // ABCDE242342342314123421.SHA256
  resave: false,
  saveUninitialized: true,
  key: config.get('session:key'),
  cookie: config.get('session:cookie'),
  store: sessionStore
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(require('./middleware/sendHttpError'));
app.use(require('./middleware/loadUser'));

app.use('/', index);
app.use('/users', users);
app.use('/login', login);
app.use('/logout', logout);
app.use('/chat', chat);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  if (typeof err == 'number') {
    err = new HttpError(err);
  }

  if (err instanceof HttpError) {
    res.sendHttpError(err);
  } else {
    if (app.get('env') == 'development') {
      errorhandler()(err, req, res, next);
    } else {

      err = new HttpError(500);
      res.sendHttpError(err);
    }
  }
});

module.exports = app;
