const cron = require('node-cron');
const Ingredient = require('../models/Ingredient');
const mail = require('../utils/mailer');

// Emails the admin once per low-stock episode. `alerted` resets when stock recovers.
async function check() {
  await Ingredient.updateMany({ $expr: { $gte: ['$stock', '$threshold'] }, alerted: true }, { alerted: false });
  const low = await Ingredient.find({ $expr: { $lt: ['$stock', '$threshold'] }, alerted: false });
  if (!low.length) return 0;
  const rows = low.map((i) =>
    `<tr><td>${i.category}</td><td>${i.name}</td><td><b>${i.stock}</b></td><td>${i.threshold}</td></tr>`).join('');
  await mail(process.env.ADMIN_EMAIL, `Low stock: ${low.length} item(s) need restocking`,
    `<p>These items fell below their threshold:</p>
     <table border="1" cellpadding="6" style="border-collapse:collapse">
     <tr><th>Type</th><th>Item</th><th>In stock</th><th>Threshold</th></tr>${rows}</table>`);
  await Ingredient.updateMany({ _id: { $in: low.map((i) => i._id) } }, { alerted: true });
  return low.length;
}

function start() {
  const schedule = process.env.STOCK_CRON || '*/5 * * * *';
  cron.schedule(schedule, () => check().catch((e) => console.error('Stock check failed:', e.message)));
  console.log(`Stock alert job scheduled (${schedule})`);
}

module.exports = { start, check };
