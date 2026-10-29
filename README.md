# Pizza Palace

A full-stack pizza ordering and inventory app built with React, Vite, Node.js, Express, MongoDB, Razorpay Test Mode, Nodemailer, and node-cron.

## Submission summary

- **Objective:** Build a pizza delivery platform with customer accounts, custom pizza ordering, test payments, admin order management, and inventory alerts.
- **Steps performed:** Built the React customer and admin screens, added Express API routes and MongoDB models, connected Razorpay Test Mode, and implemented email verification, password reset, stock alerts, and order status polling.
- **Tools used:** React, Vite, Node.js, Express, MongoDB Atlas, Razorpay, Nodemailer, and node-cron.
- **Outcome:** Customers can register and verify an account, build or select a pizza, complete a test payment, and track order status. Admins can update order status and inventory and run low-stock checks.

## Features

- Customer registration, email verification, login, and password reset
- Pizza menu and step-by-step custom pizza builder
- Server-side pricing and inventory checks
- Razorpay Test Mode checkout with payment signature verification
- Customer order history and live status polling
- Separate admin login, order management, and inventory updates
- Scheduled low-stock email alerts, with a manual stock check in the admin panel

## Requirements

- Node.js 18 or newer
- MongoDB running locally or a MongoDB Atlas connection string
- Razorpay account with Test Mode API keys to test checkout

## Setup

Open two PowerShell terminals in the project folder. Install dependencies and configure the backend first:

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Edit `server/.env` and set `MONGO_URI`, a long random `JWT_SECRET`, Razorpay Test Mode keys, and admin credentials. For local email testing, leave `SMTP_HOST=` blank; verification, reset, and stock-alert email links will be printed in the backend terminal. To send real email, configure SMTP credentials instead.

Seed the sample menu, inventory, and admin account once:

```powershell
npm run seed
```

The seed script resets the sample pizzas and ingredients and creates or updates the configured admin account. Do not rerun it if you need to preserve inventory changes.

Start the backend in the first terminal:

```powershell
npm run dev
```

Wait for `MongoDB connected` and `API running on http://localhost:5000`.

In the second terminal, start the frontend:

```powershell
cd client
npm install
npm run dev
```

Open the `Local` URL Vite prints, usually `http://localhost:5173/`. Keep both terminals open while using the app. If Vite selects another port, set `CLIENT_URL` in `server/.env` to that frontend URL and restart the backend so email links use the right address.

## Try the app

1. Open `/register`, create a customer account, and follow the verification link shown in the backend terminal (when SMTP is disabled).
2. Log in, choose a menu pizza or use **Build your own**, review the order, and click **Pay**.
3. In the Razorpay Test Mode checkout, complete a successful test payment.
4. Sign in at `/admin/login` with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `server/.env`.
5. Change the order status in **Orders** and confirm the customer dashboard updates. Use **Inventory** to edit stock or thresholds and run a stock check.

## Project structure

```text
client/   React and Vite frontend
server/   Express API, MongoDB models, routes, and scheduled stock alerts
```

## Important notes

- The user registration route creates customer accounts only. Admin accounts are created by the seed script.
- Prices are recalculated on the server; stock is checked before checkout and decremented after payment verification.
- Razorpay keys in `.env` must be a matching Test Mode Key ID and Key Secret. Never commit `.env` or share the Key Secret.
- This is a local/demo setup. Before production, use HTTPS, strong secrets, production-grade email delivery, request rate limits, and a Razorpay webhook as a payment verification backup.
