const config = require('../config');
const HttpError = require('../error').HttpError;
const sessionStore  = require('../libs/sessionStore');
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const User = require('../models/user').User;
const debug = require('debug')('webchat:socketio');

const loadUser = (session) => {
  return new Promise((resolve, reject) => {
    if (!session.user) {
      debug("Session %s is anonymous", session.id);
      reject();
    }

    debug("retrieving user ", session.user);

    User.findById(session.user).exec((err, user) => {
      if (err) return reject(err);
      if (!user) reject();

      debug("user findbyId result: " + user);
      resolve(user);
    });
  });
};

const checkAuth = (handshake, callback) => {
  handshake.cookies = cookie.parse(handshake.headers.cookie || '');
  const sidCookie = handshake.cookies[config.get('session:key')];
  const sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
  debug(sid);

  sessionStore.get(sid, (err, session) => {
    debug(session);

    if(!session) {
      callback(new HttpError(401, "No session"));
    }

    handshake.session = session;
    handshake.session.sid = sid;

    loadUser(session)
    .then((user) => {
      handshake.user = user;
      callback(null, true);
    })
    .catch((err) => {
      if(err) {
        callback(err);
        return;
      }
      callback(new HttpError(403, "Anonymous session may not connect"));
    });
  });
};

const socket = (server) => {
  const io = require('socket.io')(server, {
    'origins': '127.0.0.1:*'
  });

  io.use((socket, next) => {
    checkAuth(socket.handshake, (err, success) => {
      if (success) return next();
      next(new HttpError(403, "Anonymous session may not connect"));
    });
  });

  io.on('session:reload', (sid) => {
    console.log('session:reload :' + sid);
  });

  io.on('sessreload', (sid) => {
    console.log('sessreload: ' + sid);
    //console.log(io.sockets);
    io.sockets.clients((err, clients) => {
      if (err) throw err;

      clients.forEach(function(clientId) {
        const client = io.sockets.sockets[clientId];

        if (client.handshake.session.sid != sid) return;

        sessionStore.get(sid, (err, session) => {
          if (err) {
            client.emit("error", "server error");
            client.disconnect();
            return;
          }

          if (!session) {
            client.emit("logout");
            client.disconnect();
            return;
          }

          client.handshake.session = session;
        });
      });
    });
  });

  io.on('connection', (socket) => {
    const username = socket.handshake.user.get('username');

    socket.broadcast.emit('join', username);

    socket.on('message', (text, callback) => {
      socket.broadcast.emit('message', username, text);
      callback && callback(text);
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('leave', username);
    });
  });

  return io;
};

module.exports = socket;
