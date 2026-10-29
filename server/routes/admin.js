const r = require('express').Router();
const Ingredient = require('../models/Ingredient');
const Order = require('../models/Order');
const { auth, adminOnly, wrap, bad } = require('../middleware/auth');
const { check } = require('../jobs/stockAlert');

r.use(auth, adminOnly);

r.get('/inventory', wrap(async (req, res) => {
  res.json(await Ingredient.find().sort({ category: 1, name: 1 }));
}));

r.patch('/inventory/:id', wrap(async (req, res) => {
  const patch = {};
  for (const k of ['stock', 'threshold', 'price']) {
    if (req.body[k] !== undefined) {
      const n = Number(req.body[k]);
      if (!Number.isFinite(n) || n < 0) throw bad(`Invalid ${k}`);
      patch[k] = n;
    }
  }
  const item = await Ingredient.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!item) throw bad('Item not found', 404);
  res.json(item);
}));

r.post('/run-stock-check', wrap(async (req, res) => {
  res.json({ alerted: await check() });
}));

r.get('/orders', wrap(async (req, res) => {
  res.json(await Order.find({ paymentStatus: 'paid' }).populate('user', 'name email').sort('-createdAt'));
}));

r.patch('/orders/:id', wrap(async (req, res) => {
  if (!Order.schema.path('status').enumValues.includes(req.body.status)) throw bad('Invalid status');
  const o = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('user', 'name email');
  if (!o) throw bad('Order not found', 404);
  res.json(o);
}));

module.exports = r;
