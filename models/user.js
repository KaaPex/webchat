const crypto = require('crypto');
const HttpError = require('../error').HttpError;
const mongoose = require('../libs/mongoose');
const Schema = mongoose.Schema;

var schema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

schema.methods.encryptPassword = function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

schema.virtual('password')
  .set(function(password) {
    this._plainPassword = password;
    this.salt = Math.random() + '';
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() { return this._plainPassword; });

schema.methods.checkPassword = function(password) {
  return this.encryptPassword(password) === this.hashedPassword;
};

schema.statics.authorize = (username, password, callback) => {
  const User = this.User;

  return new Promise((resolve, reject) => {
    User.findOne({username: username}).exec((err, user) => {
      if (err) {
        reject(err);
        callback && callback(err);
        return;
      }

      if (user) {
        if (user.checkPassword(password)) {
          resolve(user);
          callback && callback(null, user);
        } else {
          reject(new HttpError(403, "Auth Error"));
        }
        return;
      } else {
        user = new User({username: username, password: password});
        user.save( (err) => {
          if (!err) {
            resolve(user);
            callback && callback(null, user);
            return;
          }
          reject(err);
        })
      }
      return;
    });
  });
};

schema.post('save', function(doc, next) {
  console.log('%s has been saved', doc._id);
  next();
});

exports.User = mongoose.model('User', schema);
