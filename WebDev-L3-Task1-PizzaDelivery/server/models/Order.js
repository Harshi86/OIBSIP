const mongoose = require('mongoose');
module.exports = mongoose.model('Order', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ name: String, base: String, sauce: String, cheese: String, veggies: [String], price: Number }],
  total: Number,
  status: { type: String, enum: ['Order Received', 'In Kitchen', 'Sent to Delivery'], default: 'Order Received' },
  paymentStatus: { type: String, enum: ['created', 'paid'], default: 'created' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
}, { timestamps: true }));
