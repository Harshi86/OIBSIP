import { useEffect, useState } from 'react';
import api, { errMsg, inr } from '../api.js';
import { STATUSES, Tracker } from './Dashboard.jsx';

const LABEL = { base: 'Pizza bases', sauce: 'Sauces', cheese: 'Cheeses', veggie: 'Vegetables' };

function Row({ item, onSaved }) {
  const [stock, setStock] = useState(item.stock);
  const [threshold, setThreshold] = useState(item.threshold);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setStock(item.stock); setThreshold(item.threshold); }, [item.stock, item.threshold]);
  const dirty = +stock !== item.stock || +threshold !== item.threshold;
  const save = async () => {
    setSaving(true);
    try { onSaved((await api.patch(`/admin/inventory/${item._id}`, { stock, threshold })).data); } catch (e) { alert(errMsg(e)); }
    setSaving(false);
  };
  const low = item.stock < item.threshold;
  return (
    <tr className={low ? 'low' : ''}>
      <td>{item.name}{low && <span className="pill">Low</span>}</td>
      <td><input aria-label={`${item.name} stock`} type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} /></td>
      <td><input aria-label={`${item.name} alert threshold`} type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></td>
      <td><button className="btn sm" disabled={!dirty || saving} onClick={save}>Save</button></td>
    </tr>
  );
}

function Inventory() {
  const [items, setItems] = useState([]);
  const [info, setInfo] = useState('');
  const load = () => api.get('/admin/inventory').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const replace = (n) => setItems((xs) => xs.map((x) => (x._id === n._id ? n : x)));
  const runCheck = async () => {
    const { data } = await api.post('/admin/run-stock-check');
    setInfo(data.alerted ? `Alert email sent for ${data.alerted} item(s).` : 'No new low-stock items to report.');
    load();
  };
  return (
    <>
      <div className="row">
        <p className="muted">Stock drops automatically with every paid order. An email goes out when an item falls below its threshold.</p>
        <button className="btn ghost" onClick={runCheck}>Run stock check now</button>
      </div>
      {info && <p className="note ok">{info}</p>}
      {Object.keys(LABEL).map((cat) => (
        <section key={cat}>
          <h2 className="sect">{LABEL[cat]}</h2>
          <div className="scroll">
            <table>
              <thead><tr><th>Item</th><th>In stock</th><th>Alert below</th><th /></tr></thead>
              <tbody>{items.filter((i) => i.category === cat).map((i) => <Row key={i._id} item={i} onSaved={replace} />)}</tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    const load = () => api.get('/admin/orders').then((r) => setOrders(r.data)).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);
  const setStatus = async (id, status) => {
    const { data } = await api.patch(`/admin/orders/${id}`, { status });
    setOrders((os) => os.map((o) => (o._id === id ? data : o)));
  };
  if (!orders.length) return <p className="muted">No paid orders yet. New ones appear here automatically.</p>;
  return orders.map((o) => (
    <article className="order" key={o._id}>
      <div className="row">
        <strong>#{o._id.slice(-6).toUpperCase()} · {o.user?.name}</strong>
        <span className="muted">{new Date(o.createdAt).toLocaleString()}</span>
        <strong>{inr(o.total)}</strong>
      </div>
      {o.items.map((i, k) => <p key={k} className="tags"><b>{i.name}:</b> {[i.base, i.sauce, i.cheese, ...i.veggies].join(' · ')}</p>)}
      <Tracker status={o.status} />
      <label className="inline">Update status
        <select value={o.status} onChange={(e) => setStatus(o._id, e.target.value)}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
    </article>
  ));
}

export default function Admin() {
  const [tab, setTab] = useState('orders');
  return (
    <main className="page">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'orders'} onClick={() => setTab('orders')}>Orders</button>
        <button role="tab" aria-selected={tab === 'inventory'} onClick={() => setTab('inventory')}>Inventory</button>
      </div>
      {tab === 'orders' ? <Orders /> : <Inventory />}
    </main>
  );
}
