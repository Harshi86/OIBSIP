const r = require('express').Router();
const Ingredient = require('../models/Ingredient');
const Pizza = require('../models/Pizza');
const { auth, wrap } = require('../middleware/auth');

r.get('/', auth, wrap(async (req, res) => {
  const all = await Ingredient.find().sort('name');
  const ingredients = { base: [], sauce: [], cheese: [], veggie: [] };
  all.forEach((i) => ingredients[i.category].push({ name: i.name, price: i.price, available: i.stock > 0 }));
  const price = (c, n) => all.find((i) => i.category === c && i.name === n)?.price || 0;
  const pizzas = (await Pizza.find()).map((p) => ({
    ...p.toObject(),
    price: price('base', p.base) + price('sauce', p.sauce) + price('cheese', p.cheese) +
      p.veggies.reduce((s, v) => s + price('veggie', v), 0),
  }));
  res.json({ ingredients, pizzas });
}));

module.exports = r;
