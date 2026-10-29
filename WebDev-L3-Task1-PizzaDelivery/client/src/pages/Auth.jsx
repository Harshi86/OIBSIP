import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../auth.jsx';

function Shell({ title, hint, children, foot }) {
  return (
    <main className="auth">
      <div className="auth-art" aria-hidden="true">
        <span>🍕</span>
        <p>Stone-baked, built your way.</p>
      </div>
      <section className="auth-card">
        <h1>{title}</h1>
        {hint && <p className="muted">{hint}</p>}
        {children}
        {foot && <p className="foot">{foot}</p>}
      </section>
    </main>
  );
}

function useForm(action) {
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try { setMsg({ ok: true, text: await action(Object.fromEntries(new FormData(e.target))) }); }
    catch (err) { setMsg({ ok: false, text: errMsg(err) }); }
    setBusy(false);
  };
  return { msg, busy, submit };
}
const Note = ({ msg }) => msg && <p className={msg.ok ? 'note ok' : 'note err'} role="status">{msg.text}</p>;

export function Login({ admin }) {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const { msg, busy, submit } = useForm(async (f) => {
    const { data } = await api.post(admin ? '/auth/admin/login' : '/auth/login', f);
    signIn(data);
    nav(admin ? '/admin' : '/dashboard');
    return 'Welcome back';
  });
  return (
    <Shell
      title={admin ? 'Kitchen console login' : 'Log in'}
      hint={admin ? 'Staff only.' : 'Pick up where you left off.'}
      foot={!admin && <>New here? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={submit}>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
        <Note msg={msg} />
        <button className="btn" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      {!admin && <p className="foot"><Link to="/forgot">Forgot your password?</Link></p>}
    </Shell>
  );
}

export function Register() {
  const { msg, busy, submit } = useForm(async (f) => (await api.post('/auth/register', f)).data.message);
  return (
    <Shell title="Create your account" hint="We'll email a link to confirm it's you." foot={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <form onSubmit={submit}>
        <label>Name<input name="name" required autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" minLength={6} required autoComplete="new-password" /></label>
        <Note msg={msg} />
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
    </Shell>
  );
}

export function Verify() {
  const { token } = useParams();
  const [msg, setMsg] = useState({ ok: true, text: 'Verifying your email…' });
  useEffect(() => {
    api.get(`/auth/verify/${token}`)
      .then((r) => setMsg({ ok: true, text: r.data.message }))
      .catch((e) => setMsg({ ok: false, text: errMsg(e) }));
  }, [token]);
  return (
    <Shell title="Email verification">
      <Note msg={msg} />
      <Link className="btn" to="/login">Go to log in</Link>
    </Shell>
  );
}

export function Forgot() {
  const { msg, busy, submit } = useForm(async (f) => (await api.post('/auth/forgot', f)).data.message);
  return (
    <Shell title="Reset your password" hint="Enter your email and we'll send a reset link." foot={<Link to="/login">Back to log in</Link>}>
      <form onSubmit={submit}>
        <label>Email<input name="email" type="email" required /></label>
        <Note msg={msg} />
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>
    </Shell>
  );
}

export function Reset() {
  const { token } = useParams();
  const { msg, busy, submit } = useForm(async (f) => (await api.post(`/auth/reset/${token}`, f)).data.message);
  return (
    <Shell title="Choose a new password" foot={<Link to="/login">Back to log in</Link>}>
      <form onSubmit={submit}>
        <label>New password<input name="password" type="password" minLength={6} required autoComplete="new-password" /></label>
        <Note msg={msg} />
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </Shell>
  );
}
