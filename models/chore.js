var mongoose = require('mongoose')

const choreSchema = new mongoose.Schema({
  choreId: { type: Number },
  choreName: { type: String },
  roommateId: { type: Number},
  deadline: {type: String},
  term : {type: Boolean}
})

module.exports = mongoose.model('Chore', choreSchema);