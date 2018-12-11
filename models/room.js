var mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
  roomName: { type: String },
  roomPassword: { type: String},
  roommatesIds: { type: Array},
  manager: {type: Number},
  roommates: { type: Array},
  chores: { type: Array},
  roomId: { type: Number}
})

module.exports = mongoose.model('Room', roomSchema);
