const mongoose = require('./libs/mongoose');

const conn = mongoose.connection;

console.log(conn.readyState);

conn.dropDatabase()
.then( err => {
  if(err) throw err;

  var User = require('./models/user').User;

  var users = [
    {username: 'Вася', password: 'supervasya'},
    {username: 'Петя', password: '123'},
    {username: 'admin', password: 'thetruehero'}
  ];

  User.ensureIndexes()
  .then(() => {
    User.create(...users, (error, ...users) => {
      if (error) throw error;
      console.log(users);
    })
    .then( () => mongoose.disconnect() );
  });
});


