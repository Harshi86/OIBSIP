import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { errMsg, inr } from '../api.js';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function Summary() {
  const nav = useNavigate();
  const { state } = useLocation();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const items = state?.items;

  if (!items?.length)
    return <main className="page"><p className="muted">Nothing to review yet.</p><Link className="btn" to="/dashboard">Back to menu</Link></main>;

  const total = items.reduce((t, i) => t + i.price, 0);

  const pay = async () => {
    setBusy(true); setErr('');
    try {
      if (!(await loadRazorpay())) throw new Error('Could not load Razorpay. Check your connection.');
      const { data } = await api.post('/orders/checkout', { items });
      const user = JSON.parse(localStorage.getItem('user'));
      new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'Pizza Palace',
        description: `${items.length} pizza order`,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#17402f' },
        handler: async (resp) => {
          try {
            await api.post('/orders/verify', resp);
            nav('/dashboard', { state: { placed: true } });
          } catch (e) { setErr(errMsg(e)); setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };

  return (
    <main className="page narrow">
      <h1>Review your order</h1>
      {items.map((it, i) => (
        <article className="card flat" key={i}>
          <div className="row"><h2>{it.name}</h2><strong>{inr(it.price)}</strong></div>
          <p className="tags">{[it.base, it.sauce, it.cheese, ...it.veggies].join(' · ')}</p>
        </article>
      ))}
      <div className="row total"><span>Total</span><strong>{inr(total)}</strong></div>
      {err && <p className="note err" role="alert">{err}</p>}
      <div className="row">
        <Link className="btn ghost" to="/dashboard">Cancel</Link>
        <button className="btn" onClick={pay} disabled={busy}>{busy ? 'Opening payment…' : `Pay ${inr(total)}`}</button>
      </div>
      <p className="muted small">Test mode: choose "Success" in the Razorpay popup to confirm the order.</p>
    </main>
  );
}
