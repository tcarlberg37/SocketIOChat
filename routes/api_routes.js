var express = require('express');
router = express.Router();
const Message = require('../models/MessageSchema.js');
const EventLog = require('../models/EventLog.js');

router.get('/history', (req, res, next) => {
    Message.find((err, data) => {
      if (err) {
        return next(err);
      } else {
        res.json(data);
      }
    })
  })

router.post('/roomhistory/:roomname', (req, res) => {
    Message.find({room: req.params.roomname}, function(err, data) { // noSQL syntax to find with a WHERE clause
    if (err) {
        return next(err);
    } else {
        res.json(data);
    }
    })
})

router.get('/eventlog', (req, res) => {
    EventLog.find((err, data) => {
        if (err) {
            return next(err);
        } else {
            res.json(data);
        }
    })
})

module.exports = router;