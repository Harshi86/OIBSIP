const nodemailer = require('nodemailer');

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: +process.env.SMTP_PORT || 587,
      secure: +process.env.SMTP_PORT === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

module.exports = async function sendMail(to, subject, html) {
  if (!transport) {
    // Dev fallback: no SMTP configured, so print the email (with its links) to the console.
    console.log(`\n--- EMAIL (SMTP not configured) ---\nTo: ${to}\nSubject: ${subject}\n${html}\n-----------------------------------\n`);
    return;
  }
  await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html });
};
