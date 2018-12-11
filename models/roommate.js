var mongoose = require('mongoose')

const roommateSchema = new mongoose.Schema({
  roommateName: { type: String },
  roommateId: { type: Number },
  chores: {type: Array},
  roomId: { type: Number }
})

module.exports = mongoose.model('Roommate', roommateSchema);
