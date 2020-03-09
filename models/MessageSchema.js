const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({
    room: String,
    message: String,
    username: String,
    timestamp: String
});

module.exports = mongoose.model('MessageSchema', MessageSchema);