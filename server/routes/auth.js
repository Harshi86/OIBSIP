const r = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mail = require('../utils/mailer');
const { wrap, bad } = require('../middleware/auth');

const CLIENT = () => process.env.CLIENT_URL || 'http://localhost:5173';
const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// Registration only ever creates role "user" - admins are created by the seed script.
r.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) throw bad('Name, email and a password of 6+ characters are required');
  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    // Let users recover when account creation succeeded but the verification email failed.
    if (existing.role === 'user' && !existing.verified) {
      existing.verifyToken = crypto.randomBytes(24).toString('hex');
      await existing.save();
      const link = `${CLIENT()}/verify/${existing.verifyToken}`;
      await mail(existing.email, 'Verify your Pizza Palace account',
        `<p>Hi ${existing.name},</p><p>Confirm your email to start ordering: <a href="${link}">${link}</a></p>`);
      return res.json({ message: 'Your account is waiting for email verification. A fresh verification link has been sent.' });
    }
    throw bad('This email is already registered');
  }
  const verifyToken = crypto.randomBytes(24).toString('hex');
  await User.create({ name, email: normalizedEmail, password: await bcrypt.hash(password, 10), verifyToken });
  const link = `${CLIENT()}/verify/${verifyToken}`;
  await mail(email, 'Verify your Pizza Palace account',
    `<p>Hi ${name},</p><p>Confirm your email to start ordering: <a href="${link}">${link}</a></p>`);
  res.status(201).json({ message: 'Account created. Check your email for the verification link.' });
}));

r.get('/verify/:token', wrap(async (req, res) => {
  const u = await User.findOne({ verifyToken: req.params.token });
  if (!u) throw bad('This verification link is invalid or already used');
  u.verified = true; u.verifyToken = undefined; await u.save();
  res.json({ message: 'Email verified. You can log in now.' });
}));

const login = (role) => wrap(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const u = await User.findOne({ email: email.toLowerCase() });
  if (!u || u.role !== role || !(await bcrypt.compare(password, u.password))) throw bad('Wrong email or password', 401);
  if (!u.verified) throw bad('Verify your email before logging in', 403);
  res.json({ token: sign(u), user: pub(u) });
});
r.post('/login', login('user'));
r.post('/admin/login', login('admin')); // separate endpoint + separate UI route

r.post('/forgot', wrap(async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase(), role: 'user' });
  const localDev = !process.env.SMTP_HOST && process.env.NODE_ENV !== 'production';
  let message = 'If that email is registered, a reset link is on its way.';
  if (u) {
    u.resetToken = crypto.randomBytes(24).toString('hex');
    u.resetExpires = Date.now() + 30 * 60 * 1000;
    await u.save();
    const link = `${CLIENT()}/reset/${u.resetToken}`;
    await mail(u.email, 'Reset your password', `<p>Reset your password (valid 30 minutes): <a href="${link}">${link}</a></p>`);
    if (localDev) message = `Local reset link (valid 30 minutes): ${link}`;
  } else if (localDev) {
    message = 'No customer account was found for this email. Check the address, or use the admin login if this is your admin account.';
  }
  res.json({ message }); // production reply stays the same either way
}));

r.post('/reset/:token', wrap(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) throw bad('Password must be 6+ characters');
  const u = await User.findOne({ resetToken: req.params.token, resetExpires: { $gt: Date.now() } });
  if (!u) throw bad('This reset link has expired');
  u.password = await bcrypt.hash(password, 10);
  u.resetToken = undefined; u.resetExpires = undefined; await u.save();
  res.json({ message: 'Password updated. You can log in now.' });
}));

module.exports = r;
