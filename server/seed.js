require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Ingredient = require('./models/Ingredient');
const Pizza = require('./models/Pizza');

const data = {
  base: [['Classic Hand-Tossed', 80], ['Thin Crust', 90], ['Cheese Burst', 120], ['Whole Wheat', 100], ['Multigrain', 110]],
  sauce: [['Tomato Marinara', 20], ['Pesto', 35], ['Spicy Arrabbiata', 30], ['Garlic Cream', 35], ['Barbecue', 30]],
  cheese: [['Mozzarella', 50], ['Cheddar', 45], ['Parmesan', 60], ['Vegan Cheese', 70]],
  veggie: [['Onion', 10], ['Capsicum', 15], ['Mushroom', 20], ['Black Olives', 20], ['Sweet Corn', 15], ['Tomato', 10], ['Jalapeño', 15], ['Paneer', 40]],
};
const pizzas = [
  ['Margherita', '🍅', 'Classic tomato, mozzarella and fresh tomato.', 'Classic Hand-Tossed', 'Tomato Marinara', 'Mozzarella', ['Tomato']],
  ['Farmhouse', '🌽', 'Onion, capsicum, mushroom and corn on a hand-tossed base.', 'Classic Hand-Tossed', 'Tomato Marinara', 'Mozzarella', ['Onion', 'Capsicum', 'Mushroom', 'Sweet Corn']],
  ['Paneer Tikka', '🌶️', 'Spicy arrabbiata, paneer and onion on thin crust.', 'Thin Crust', 'Spicy Arrabbiata', 'Cheddar', ['Paneer', 'Onion', 'Capsicum']],
  ['Pesto Garden', '🌿', 'Basil pesto, olives, mushroom and parmesan.', 'Whole Wheat', 'Pesto', 'Parmesan', ['Mushroom', 'Black Olives', 'Tomato']],
  ['Cheese Burst Supreme', '🧀', 'Molten cheese-filled crust loaded with veggies.', 'Cheese Burst', 'Garlic Cream', 'Mozzarella', ['Capsicum', 'Sweet Corn', 'Jalapeño']],
  ['Smoky BBQ', '🔥', 'Barbecue sauce, paneer, onion and jalapeño.', 'Multigrain', 'Barbecue', 'Cheddar', ['Paneer', 'Onion', 'Jalapeño']],
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Ingredient.deleteMany({}); await Pizza.deleteMany({});
  for (const [category, list] of Object.entries(data))
    for (const [name, price] of list)
      await Ingredient.create({ category, name, price, stock: 100, threshold: category === 'veggie' ? 15 : 20 });
  for (const [name, emoji, description, base, sauce, cheese, veggies] of pizzas)
    await Pizza.create({ name, emoji, description, base, sauce, cheese, veggies });

  const email = (process.env.ADMIN_EMAIL || 'admin@pizza.com').toLowerCase();
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
  await User.findOneAndUpdate({ email }, { name: 'Admin', email, password, role: 'admin', verified: true }, { upsert: true });
  console.log(`Seeded inventory, pizzas and admin (${email}).`);
  process.exit(0);
})();
