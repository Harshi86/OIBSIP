import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { inr } from '../api.js';

const STEPS = [
  { key: 'base', title: 'Pick a base', multi: false },
  { key: 'sauce', title: 'Pick a sauce', multi: false },
  { key: 'cheese', title: 'Pick a cheese', multi: false },
  { key: 'veggie', title: 'Pick your vegetables', multi: true },
];

export default function Builder() {
  const nav = useNavigate();
  const [menu, setMenu] = useState(null);
  const [step, setStep] = useState(0);
  const [pick, setPick] = useState({ base: null, sauce: null, cheese: null, veggie: [] });

  useEffect(() => { api.get('/menu').then((r) => setMenu(r.data.ingredients)); }, []);
  if (!menu) return <main className="page"><p className="muted">Loading ingredients…</p></main>;

  const s = STEPS[step];
  const priceOf = (cat, name) => menu[cat].find((i) => i.name === name)?.price || 0;
  const total = priceOf('base', pick.base) + priceOf('sauce', pick.sauce) + priceOf('cheese', pick.cheese) +
    pick.veggie.reduce((t, v) => t + priceOf('veggie', v), 0);
  const ready = s.multi ? true : !!pick[s.key];

  const choose = (name) =>
    setPick((p) => s.multi
      ? { ...p, veggie: p.veggie.includes(name) ? p.veggie.filter((v) => v !== name) : [...p.veggie, name] }
      : { ...p, [s.key]: name });
  const selected = (name) => (s.multi ? pick.veggie.includes(name) : pick[s.key] === name);

  const finish = () => nav('/summary', { state: { items: [{ name: 'Custom Pizza', base: pick.base, sauce: pick.sauce, cheese: pick.cheese, veggies: pick.veggie, price: total }] } });

  return (
    <main className="page builder">
      <ol className="steps">
        {STEPS.map((x, i) => (
          <li key={x.key} className={i === step ? 'now' : i < step ? 'done' : ''}>
            <button className="link" disabled={i > step} onClick={() => setStep(i)}>{i + 1}. {x.key === 'veggie' ? 'Veggies' : x.key[0].toUpperCase() + x.key.slice(1)}</button>
          </li>
        ))}
      </ol>
      <h1>{s.title}</h1>
      {s.multi && <p className="muted">Choose as many as you like, or none.</p>}
      <div className="options">
        {menu[s.key].map((o) => (
          <button
            key={o.name}
            className={`opt ${selected(o.name) ? 'on' : ''}`}
            disabled={!o.available}
            aria-pressed={selected(o.name)}
            onClick={() => choose(o.name)}
          >
            <span>{o.name}</span>
            <small>{o.available ? `+ ${inr(o.price)}` : 'Out of stock'}</small>
          </button>
        ))}
      </div>
      <div className="bar">
        <span>Your pizza: <strong>{inr(total)}</strong></span>
        <div>
          {step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)}>Back</button>}
          {step < STEPS.length - 1
            ? <button className="btn" disabled={!ready} onClick={() => setStep(step + 1)}>Next</button>
            : <button className="btn" onClick={finish}>Review order</button>}
        </div>
      </div>
    </main>
  );
}
