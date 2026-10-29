const r = require('express').Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Ingredient = require('../models/Ingredient');
const Order = require('../models/Order');
const { auth, wrap, bad } = require('../middleware/auth');

const rzp = () => new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
const parts = (it) => [['base', it.base], ['sauce', it.sauce], ['cheese', it.cheese], ...it.veggies.map((v) => ['veggie', v])];

// Validates items against real ingredients, computes the price server-side (never trust the client), checks stock.
async function priceItems(items) {
  if (!Array.isArray(items) || !items.length) throw bad('Your order is empty');
  const all = await Ingredient.find();
  const need = new Map();
  let total = 0;
  const clean = items.map((raw) => {
    if (!raw.base || !raw.sauce || !raw.cheese) throw bad('Each pizza needs a base, sauce and cheese');
    const it = { name: raw.name || 'Custom Pizza', base: raw.base, sauce: raw.sauce, cheese: raw.cheese, veggies: [...new Set(raw.veggies || [])], price: 0 };
    for (const [c, n] of parts(it)) {
      const ing = all.find((i) => i.category === c && i.name === n);
      if (!ing) throw bad(`Unknown ${c}: ${n}`);
      it.price += ing.price;
      need.set(ing.id, (need.get(ing.id) || 0) + 1);
    }
    total += it.price;
    return it;
  });
  for (const [id, qty] of need) {
    const ing = all.find((i) => i.id === id);
    if (ing.stock < qty) throw bad(`Sorry, ${ing.name} is out of stock`);
  }
  return { clean, total };
}

// 1) Create a pending order + Razorpay order
r.post('/checkout', auth, wrap(async (req, res) => {
  const { clean, total } = await priceItems(req.body.items);
  const rp = await rzp().orders.create({ amount: total * 100, currency: 'INR', receipt: 'rcpt_' + Date.now() });
  const order = await Order.create({ user: req.user.id, items: clean, total, razorpayOrderId: rp.id });
  res.json({ orderId: order._id, razorpayOrderId: rp.id, amount: rp.amount, currency: rp.currency, keyId: process.env.RAZORPAY_KEY_ID });
}));

// 2) After the Razorpay popup succeeds: verify signature, confirm order, decrement stock
r.post('/verify', auth, wrap(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (expected !== razorpay_signature) throw bad('Payment verification failed');
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, user: req.user.id });
  if (!order) throw bad('Order not found', 404);
  if (order.paymentStatus === 'paid') return res.json(order);

  for (const it of order.items)
    for (const [category, name] of parts(it))
      await Ingredient.updateOne({ category, name, stock: { $gt: 0 } }, { $inc: { stock: -1 } });

  order.paymentStatus = 'paid';
  order.razorpayPaymentId = razorpay_payment_id;
  order.status = 'Order Received';
  await order.save();
  res.json(order);
}));

// Polled by the user dashboard for live status
r.get('/mine', auth, wrap(async (req, res) => {
  res.json(await Order.find({ user: req.user.id, paymentStatus: 'paid' }).sort('-createdAt'));
}));

module.exports = r;
