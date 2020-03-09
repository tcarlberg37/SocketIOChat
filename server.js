// COMP3133 Assignment Socket.io Chat Room 
// Thomas Carlberg 101155271
// Afsana Bilkis Ritu 101165654

const express = require('express');
const app = express();
var io = require('socket.io'); // var not const because we change this value further down with io = io.listen(server)
const Message = require('./backend/models/MessageSchema.js'); // Mongoose schemas for Message and EventLog
const EventLog = require('./backend/models/EventLog.js');
var path = require('path');
const bodyParser = require('body-parser'); // needed for POSTing json
const apiRoute = require('./backend/routes/api_routes.js'); // link to all the history api functions
const database = require('./backend/database/db.js'); // database connection string
const moment = require('moment'); // used for getting date and time as strings
const mongoose = require('mongoose'); // database operations

// use mongoose to connect to mongoDB
mongoose.Promise = global.Promise;
mongoose.connect(database.db, { useNewUrlParser: true })
  .then(() => {
    console.log('Connected to database');
  },
  error => {
    console.log('Error: ' + error)
  }
)

app.set('view engine', 'ejs');
app.use('/', express.static(path.join(__dirname, 'public'))); // set default directory to public
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use('/api/', apiRoute); // api routes all start with /api/
// endpoint to call the api functions (MAKE SURE TO CHANGE WHEN UPLOADING TO HEROKU)
const endpoint = 'http://localhost:3000/api';

// page routes
app.get('/', (req, res) => {
    res.render('index')
})
 
app.get('/red', (req, res) => {
    res.render('redroom')
})

app.get('/orange', (req, res) => {
  res.render('orangeroom')
})

app.get('/yellow', (req, res) => {
  res.render('yellowroom')
})

app.get('/green', (req, res) => {
  res.render('greenroom')
})

app.get('/blue', (req, res) => {
  res.render('blueroom')
})

app.get('/indigo', (req, res) => {
  res.render('indigoroom')
})

app.get('/violet', (req, res) => {
  res.render('violetroom')
})

server = app.listen(3000);

var io = io.listen(server);
var timeout; // used for typing message


// need one of these per socket room? 
// There is probably a way to have one .of('/room') and one .on('connection') function for the whole site but I couldn't make it work
var redroom = io.of('/red');
redroom.on('connection', function(socket){
  socket.join('red');
  socket.room = 'red' //socket.id.split('/')[1].split('#')[0]
  socket.username = 'Anonymous'; // default username to anonymous but give user the option to change it
  console.log(socket.room);
  console.log('Connection accepted to ' + socket.room);
  var connectEvent = EventLog({type: 'CONNECT', 
                      date: moment().format('L'), time: moment().format('LTS'),
                      room: socket.room, user: socket.username, message: socket.username + ' has connected to ' + socket.room});
  connectEvent.save((err) => { // save event in db
    if (err){
      console.log(err);
    } else {
      console.log('Event created' + connectEvent);
    }
  });
  socket.emit('user_joined', {username: socket.username});
  
  socket.on('change_room', (room_name) => {
    socket.leave('red');
    // create Event for event log
    var leaveEvent = EventLog({type: 'LEAVE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has left ' + socket.room})
    leaveEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + leaveEvent);
      }
    });
    // join the new room but since we go to a new page this doesn't really work
    socket.join(room_name);
    socket.room = room_name
    console.log(socket.username + " has connected to " + socket.room + " room name: " + room_name);
    var joinEvent = EventLog({type: 'JOIN', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has joined ' + socket.room})
    joinEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + joinEvent);
      }
    })
  })

  socket.on('change_username', (info) => {
      socket.username = info.username;
      var changeUserEvent = EventLog({type: 'CHANGE_USERNAME', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: 'changed username to ' + socket.username})
    changeUserEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + changeUserEvent);
      }
    })
  })

  socket.on('disconnect', () => {
    console.log(socket.username + " has disconnected from " + socket.room);
    socket.emit('user_disconnect', {username: socket.username});
    var disconnectEvent = EventLog({type: 'DISCONNECT', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has disconnected.'})
    disconnectEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + disconnectEvent);
      }
    })
  })

  socket.on('new_message', (info) => {
    socket.emit('new_message', {message: info.message, username: socket.username, room: socket.room});
    console.log(info);
    var message = new Message({room: socket.room, message: info.message, username: socket.username, timestamp: moment().format('lll')})
    message.save((err) => {
      if (err){
        console.log(err);
      } else {
        console.log('message saved ' + message);
      }
    })
    var messageEvent = EventLog({type: 'MESSAGE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: info.message})
    messageEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + messageEvent);
      }
    })
  })

  // Emits the "username is typing..." message for 5 seconds after typing
  socket.on('typing', (info) => {
      socket.emit('typing', {username: socket.username, room: socket.room});
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 5000);
  })

  // needed a second function to wait the 5s until emitting the no_typing event to the socket
  function timeoutFunction() {
      socket.emit('no_typing');
  }
});

const orangeroom = io.of('/orange');
orangeroom.on('connection', (socket) => {
  socket.join('orange');
  socket.room = 'orange' //socket.id.split('/')[1].split('#')[0]
  socket.username = 'Anonymous'; // default username to anonymous but give user the option to change it
  console.log(socket.room);
  console.log('Connection accepted to ' + socket.room);
  var connectEvent = EventLog({type: 'CONNECT', 
                      date: moment().format('L'), time: moment().format('LTS'),
                      room: socket.room, user: socket.username, message: socket.username + ' has connected to ' + socket.room});
  connectEvent.save((err) => { // save event in db
    if (err){
      console.log(err);
    } else {
      console.log('Event created' + connectEvent);
    }
  });
  socket.emit('user_joined', {username: socket.username}); // creates the "Anonymous has joined the chat" message
  
  socket.on('change_room', (room_name) => {
    socket.leave('orange');
    // create Event for event log
    var leaveEvent = EventLog({type: 'LEAVE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has left ' + socket.room})
    leaveEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + leaveEvent);
      }
    });
    // join the new room but since we go to a new page this doesn't really work
    socket.join(room_name);
    socket.room = room_name
    console.log(socket.username + " has connected to " + socket.room + " room name: " + room_name);
    var joinEvent = EventLog({type: 'JOIN', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has joined ' + socket.room})
    joinEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + joinEvent);
      }
    })
  })

  socket.on('change_username', (info) => {
      socket.username = info.username;
      var changeUserEvent = EventLog({type: 'CHANGE_USERNAME', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: 'changed username to ' + socket.username})
    changeUserEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + changeUserEvent);
      }
    })
  })

  socket.on('disconnect', () => {
    console.log(socket.username + " has disconnected from " + socket.room);
    socket.emit('user_disconnect', {username: socket.username});
    var disconnectEvent = EventLog({type: 'DISCONNECT', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has disconnected.'})
    disconnectEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + disconnectEvent);
      }
    })
  })

  socket.on('new_message', (info) => {
    socket.emit('new_message', {message: info.message, username: socket.username, room: socket.room});
    console.log(info);
    var message = new Message({room: socket.room, message: info.message, username: socket.username, timestamp: moment().format('lll')})
    message.save((err) => {
      if (err){
        console.log(err);
      } else {
        console.log('message saved ' + message);
      }
    })
    var messageEvent = EventLog({type: 'MESSAGE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: info.message})
    messageEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + messageEvent);
      }
    })
  })

  // Emits the "username is typing..." message for 5 seconds after typing
  socket.on('typing', (info) => {
      socket.emit('typing', {username: socket.username, room: socket.room});
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 5000);
  })

  // needed a second function to wait the 5s until emitting the no_typing event to the socket
  function timeoutFunction() {
      socket.emit('no_typing');
  }
})


const yellowroom = io.of('/yellow');
yellowroom.on('connection', (socket) => {
  socket.join('yellow');
  socket.room = 'yellow'
  socket.username = 'Anonymous'; // default username to anonymous but give user the option to change it
  console.log(socket.room);
  console.log('Connection accepted to ' + socket.room);
  var connectEvent = EventLog({type: 'CONNECT', 
                      date: moment().format('L'), time: moment().format('LTS'),
                      room: socket.room, user: socket.username, message: socket.username + ' has connected to ' + socket.room});
  connectEvent.save((err) => { // save event in db
    if (err){
      console.log(err);
    } else {
      console.log('Event created' + connectEvent);
    }
  });
  socket.emit('user_joined', {username: socket.username}); // creates the "Anonymous has joined the chat" message
  
  socket.on('change_room', (room_name) => {
    socket.leave('yellow');
    // create Event for event log
    var leaveEvent = EventLog({type: 'LEAVE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has left ' + socket.room})
    leaveEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + leaveEvent);
      }
    });
    socket.join(room_name);
    socket.room = room_name
    console.log(socket.username + " has connected to " + socket.room + " room name: " + room_name);
    var joinEvent = EventLog({type: 'JOIN', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has joined ' + socket.room})
    joinEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + joinEvent);
      }
    })
  })

  socket.on('change_username', (info) => {
      socket.username = info.username;
      var changeUserEvent = EventLog({type: 'CHANGE_USERNAME', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: 'changed username to ' + socket.username})
    changeUserEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + changeUserEvent);
      }
    })
  })

  socket.on('disconnect', () => {
    console.log(socket.username + " has disconnected from " + socket.room);
    socket.emit('user_disconnect', {username: socket.username});
    var disconnectEvent = EventLog({type: 'DISCONNECT', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has disconnected.'})
    disconnectEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + disconnectEvent);
      }
    })
  })

  socket.on('new_message', (info) => {
    socket.emit('new_message', {message: info.message, username: socket.username, room: socket.room});
    console.log(info);
    var message = new Message({room: socket.room, message: info.message, username: socket.username, timestamp: moment().format('lll')})
    message.save((err) => {
      if (err){
        console.log(err);
      } else {
        console.log('message saved ' + message);
      }
    })
    var messageEvent = EventLog({type: 'MESSAGE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: info.message})
    messageEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + messageEvent);
      }
    })
  })

  // Emits the "username is typing..." message for 5 seconds after typing
  socket.on('typing', (info) => {
      socket.emit('typing', {username: socket.username, room: socket.room});
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 5000);
  })

  // needed a second function to wait the 5s until emitting the no_typing event to the socket
  function timeoutFunction() {
      socket.emit('no_typing');
  }
})


const greenroom = io.of('/green');
greenroom.on('connection', (socket) => {
  socket.join('green');
  socket.room = 'green'
  socket.username = 'Anonymous'; // default username to anonymous but give user the option to change it
  console.log(socket.room);
  console.log('Connection accepted to ' + socket.room);
  var connectEvent = EventLog({type: 'CONNECT', 
                      date: moment().format('L'), time: moment().format('LTS'),
                      room: socket.room, user: socket.username, message: socket.username + ' has connected to ' + socket.room});
  connectEvent.save((err) => { // save event in db
    if (err){
      console.log(err);
    } else {
      console.log('Event created' + connectEvent);
    }
  });
  socket.emit('user_joined', {username: socket.username}); // creates the "Anonymous has joined the chat" message
  
  socket.on('change_room', (room_name) => {
    socket.leave('green');
    // create Event for event log
    var leaveEvent = EventLog({type: 'LEAVE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has left ' + socket.room})
    leaveEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + leaveEvent);
      }
    });
    socket.join(room_name);
    socket.room = room_name
    console.log(socket.username + " has connected to " + socket.room + " room name: " + room_name);
    var joinEvent = EventLog({type: 'JOIN', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has joined ' + socket.room})
    joinEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + joinEvent);
      }
    })
  })

  socket.on('change_username', (info) => {
      socket.username = info.username;
      var changeUserEvent = EventLog({type: 'CHANGE_USERNAME', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: 'changed username to ' + socket.username})
    changeUserEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + changeUserEvent);
      }
    })
  })

  socket.on('disconnect', () => {
    console.log(socket.username + " has disconnected from " + socket.room);
    socket.emit('user_disconnect', {username: socket.username});
    var disconnectEvent = EventLog({type: 'DISCONNECT', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has disconnected.'})
    disconnectEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + disconnectEvent);
      }
    })
  })

  socket.on('new_message', (info) => {
    socket.emit('new_message', {message: info.message, username: socket.username, room: socket.room});
    console.log(info);
    var message = new Message({room: socket.room, message: info.message, username: socket.username, timestamp: moment().format('lll')})
    message.save((err) => {
      if (err){
        console.log(err);
      } else {
        console.log('message saved ' + message);
      }
    })
    var messageEvent = EventLog({type: 'MESSAGE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: info.message})
    messageEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + messageEvent);
      }
    })
  })

  // Emits the "username is typing..." message for 5 seconds after typing
  socket.on('typing', (info) => {
      socket.emit('typing', {username: socket.username, room: socket.room});
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 5000);
  })

  // needed a second function to wait the 5s until emitting the no_typing event to the socket
  function timeoutFunction() {
      socket.emit('no_typing');
  }
})


const blueroom = io.of('/blue');
blueroom.on('connection', (socket) => {
  socket.join('blue');
  socket.room = 'blue'
  socket.username = 'Anonymous'; 
  console.log(socket.room);
  console.log('Connection accepted to ' + socket.room);
  var connectEvent = EventLog({type: 'CONNECT', 
                      date: moment().format('L'), time: moment().format('LTS'),
                      room: socket.room, user: socket.username, message: socket.username + ' has connected to ' + socket.room});
  connectEvent.save((err) => { // save event in db
    if (err){
      console.log(err);
    } else {
      console.log('Event created' + connectEvent);
    }
  });
  socket.emit('user_joined', {username: socket.username}); // creates the "Anonymous has joined the chat" message
  
  socket.on('change_room', (room_name) => {
    socket.leave('blue');
    // create Event for event log
    var leaveEvent = EventLog({type: 'LEAVE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has left ' + socket.room})
    leaveEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + leaveEvent);
      }
    });
    socket.join(room_name);
    socket.room = room_name
    console.log(socket.username + " has connected to " + socket.room + " room name: " + room_name);
    var joinEvent = EventLog({type: 'JOIN', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has joined ' + socket.room})
    joinEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + joinEvent);
      }
    })
  })

  socket.on('change_username', (info) => {
      socket.username = info.username;
      var changeUserEvent = EventLog({type: 'CHANGE_USERNAME', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: 'changed username to ' + socket.username})
    changeUserEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + changeUserEvent);
      }
    })
  })

  socket.on('disconnect', () => {
    console.log(socket.username + " has disconnected from " + socket.room);
    socket.emit('user_disconnect', {username: socket.username});
    var disconnectEvent = EventLog({type: 'DISCONNECT', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has disconnected.'})
    disconnectEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + disconnectEvent);
      }
    })
  })

  socket.on('new_message', (info) => {
    socket.emit('new_message', {message: info.message, username: socket.username, room: socket.room});
    console.log(info);
    var message = new Message({room: socket.room, message: info.message, username: socket.username, timestamp: moment().format('lll')})
    message.save((err) => {
      if (err){
        console.log(err);
      } else {
        console.log('message saved ' + message);
      }
    })
    var messageEvent = EventLog({type: 'MESSAGE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: info.message})
    messageEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + messageEvent);
      }
    })
  })

  // Emits the "username is typing..." message for 5 seconds after typing
  socket.on('typing', (info) => {
      socket.emit('typing', {username: socket.username, room: socket.room});
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 5000);
  })

  // needed a second function to wait the 5s until emitting the no_typing event to the socket
  function timeoutFunction() {
      socket.emit('no_typing');
  }
})


const indigoroom = io.of('/indigo');
indigoroom.on('connection', (socket) => {
  socket.join('indigo');
  socket.room = 'indigo'
  socket.username = 'Anonymous'; 
  console.log(socket.room);
  console.log('Connection accepted to ' + socket.room);
  var connectEvent = EventLog({type: 'CONNECT', 
                      date: moment().format('L'), time: moment().format('LTS'),
                      room: socket.room, user: socket.username, message: socket.username + ' has connected to ' + socket.room});
  connectEvent.save((err) => { // save event in db
    if (err){
      console.log(err);
    } else {
      console.log('Event created' + connectEvent);
    }
  });
  socket.emit('user_joined', {username: socket.username}); // creates the "Anonymous has joined the chat" message
  
  socket.on('change_room', (room_name) => {
    socket.leave('indigo');
    // create Event for event log
    var leaveEvent = EventLog({type: 'LEAVE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has left ' + socket.room})
    leaveEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + leaveEvent);
      }
    });
    socket.join(room_name);
    socket.room = room_name
    console.log(socket.username + " has connected to " + socket.room + " room name: " + room_name);
    var joinEvent = EventLog({type: 'JOIN', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has joined ' + socket.room})
    joinEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + joinEvent);
      }
    })
  })

  socket.on('change_username', (info) => {
      socket.username = info.username;
      var changeUserEvent = EventLog({type: 'CHANGE_USERNAME', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: 'changed username to ' + socket.username})
    changeUserEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + changeUserEvent);
      }
    })
  })

  socket.on('disconnect', () => {
    console.log(socket.username + " has disconnected from " + socket.room);
    socket.emit('user_disconnect', {username: socket.username});
    var disconnectEvent = EventLog({type: 'DISCONNECT', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has disconnected.'})
    disconnectEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + disconnectEvent);
      }
    })
  })

  socket.on('new_message', (info) => {
    socket.emit('new_message', {message: info.message, username: socket.username, room: socket.room});
    console.log(info);
    var message = new Message({room: socket.room, message: info.message, username: socket.username, timestamp: moment().format('lll')})
    message.save((err) => {
      if (err){
        console.log(err);
      } else {
        console.log('message saved ' + message);
      }
    })
    var messageEvent = EventLog({type: 'MESSAGE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: info.message})
    messageEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + messageEvent);
      }
    })
  })

  // Emits the "username is typing..." message for 5 seconds after typing
  socket.on('typing', (info) => {
      socket.emit('typing', {username: socket.username, room: socket.room});
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 5000);
  })

  // needed a second function to wait the 5s until emitting the no_typing event to the socket
  function timeoutFunction() {
      socket.emit('no_typing');
  }
})


const violetroom = io.of('/violet');
violetroom.on('connection', (socket) => {
  socket.join('violet');
  socket.room = 'violet'
  socket.username = 'Anonymous'; 
  console.log(socket.room);
  console.log('Connection accepted to ' + socket.room);
  var connectEvent = EventLog({type: 'CONNECT', 
                      date: moment().format('L'), time: moment().format('LTS'),
                      room: socket.room, user: socket.username, message: socket.username + ' has connected to ' + socket.room});
  connectEvent.save((err) => { // save event in db
    if (err){
      console.log(err);
    } else {
      console.log('Event created' + connectEvent);
    }
  });
  socket.emit('user_joined', {username: socket.username}); // creates the "Anonymous has joined the chat" message
  
  socket.on('change_room', (room_name) => {
    socket.leave('violet');
    // create Event for event log
    var leaveEvent = EventLog({type: 'LEAVE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has left ' + socket.room})
    leaveEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + leaveEvent);
      }
    });
    socket.join(room_name);
    socket.room = room_name
    console.log(socket.username + " has connected to " + socket.room + " room name: " + room_name);
    var joinEvent = EventLog({type: 'JOIN', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has joined ' + socket.room})
    joinEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + joinEvent);
      }
    })
  })

  socket.on('change_username', (info) => {
      socket.username = info.username;
      var changeUserEvent = EventLog({type: 'CHANGE_USERNAME', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: 'changed username to ' + socket.username})
    changeUserEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + changeUserEvent);
      }
    })
  })

  socket.on('disconnect', () => {
    console.log(socket.username + " has disconnected from " + socket.room);
    socket.emit('user_disconnect', {username: socket.username});
    var disconnectEvent = EventLog({type: 'DISCONNECT', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: socket.username + ' has disconnected.'})
    disconnectEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + disconnectEvent);
      }
    })
  })

  socket.on('new_message', (info) => {
    socket.emit('new_message', {message: info.message, username: socket.username, room: socket.room});
    console.log(info);
    var message = new Message({room: socket.room, message: info.message, username: socket.username, timestamp: moment().format('lll')})
    message.save((err) => {
      if (err){
        console.log(err);
      } else {
        console.log('message saved ' + message);
      }
    })
    var messageEvent = EventLog({type: 'MESSAGE', 
                    date: moment().format('L'), time: moment().format('LTS'),
                    room: socket.room, user: socket.username, message: info.message})
    messageEvent.save((err) => { // save event in db
      if (err){
        console.log(err);
      } else {
        console.log('Event created' + messageEvent);
      }
    })
  })

  // Emits the "username is typing..." message for 5 seconds after typing
  socket.on('typing', (info) => {
      socket.emit('typing', {username: socket.username, room: socket.room});
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 5000);
  })

  // needed a second function to wait the 5s until emitting the no_typing event to the socket
  function timeoutFunction() {
      socket.emit('no_typing');
  }
})