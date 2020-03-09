const mongoose = require('mongoose');

const EventLog = mongoose.Schema({
    type: String,
    date: String,
    time: String,
    room: String,
    user: String,
    message: String
});

module.exports = mongoose.model('EventLog', EventLog);