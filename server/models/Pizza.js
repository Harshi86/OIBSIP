const mongoose = require('mongoose');
module.exports = mongoose.model('Pizza', new mongoose.Schema({
  name: String, description: String, emoji: String,
  base: String, sauce: String, cheese: String, veggies: [String],
}));
