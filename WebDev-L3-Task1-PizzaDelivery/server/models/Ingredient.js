const mongoose = require('mongoose');
const s = new mongoose.Schema({
  category: { type: String, enum: ['base', 'sauce', 'cheese', 'veggie'], required: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  threshold: { type: Number, default: 20 },
  alerted: { type: Boolean, default: false }, // true once a low-stock email has been sent
});
s.index({ category: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('Ingredient', s);
