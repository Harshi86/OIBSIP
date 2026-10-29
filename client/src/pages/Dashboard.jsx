import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { inr } from '../api.js';

export const STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery'];

export function Tracker({ status }) {
  const at = STATUSES.indexOf(status);
  return (
    <ol className="tracker" aria-label={`Order status: ${status}`}>
      {STATUSES.map((s, i) => (
        <li key={s} className={i < at ? 'done' : i === at ? 'now' : ''}>{s}</li>
      ))}
    </ol>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const placed = useLocation().state?.placed;
  const [pizzas, setPizzas] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => { api.get('/menu').then((r) => setPizzas(r.data.pizzas)); }, []);
  // Live status: poll every 5 seconds
  useEffect(() => {
    const load = () => api.get('/orders/mine').then((r) => setOrders(r.data)).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const order = (p) => nav('/summary', { state: { items: [{ name: p.name, base: p.base, sauce: p.sauce, cheese: p.cheese, veggies: p.veggies, price: p.price }] } });

  return (
    <main className="page">
      {placed && <p className="note ok">Payment received. Your pizza is in the queue.</p>}
      <div className="head">
        <h1>Today's pizzas</h1>
        <Link className="btn ghost" to="/build">Build your own</Link>
      </div>
      <div className="grid">
        {pizzas.map((p) => (
          <article className="card" key={p._id}>
            <div className="emoji" aria-hidden="true">{p.emoji}</div>
            <h2>{p.name}</h2>
            <p className="muted">{p.description}</p>
            <p className="tags">{[p.base, p.sauce, p.cheese, ...p.veggies].join(' · ')}</p>
            <div className="row">
              <strong>{inr(p.price)}</strong>
              <button className="btn sm" onClick={() => order(p)}>Order</button>
            </div>
          </article>
        ))}
      </div>

      <h2 className="sect">Your orders</h2>
      {!orders.length && <p className="muted">No orders yet. Pick a pizza above or build your own.</p>}
      {orders.map((o) => (
        <article className="order" key={o._id}>
          <div className="row">
            <strong>#{o._id.slice(-6).toUpperCase()}</strong>
            <span className="muted">{new Date(o.createdAt).toLocaleString()}</span>
            <strong>{inr(o.total)}</strong>
          </div>
          <p>{o.items.map((i) => i.name).join(', ')}</p>
          <Tracker status={o.status} />
        </article>
      ))}
    </main>
  );
}
