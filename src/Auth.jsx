import { useState } from 'react';
import { api } from './api.js';

export default function Auth({ onLogin, admin }) {
  const [role, setRole] = useState('mentee');
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const r = admin ? 'admin' : role;
  const reg = register && r === 'mentee';
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      onLogin(await api('POST', reg ? '/auth/register' : '/auth/login', { ...form, role: r }));
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{admin ? 'Admin login' : reg ? 'Register as mentee' : `Login as ${r}`}</h2>
      {!admin && (
        <div className="tabs" role="tablist" aria-label="Login as">
          {['mentee', 'mentor'].map((x) => (
            <button
              key={x}
              type="button"
              role="tab"
              aria-selected={role === x}
              className={role === x ? 'on' : ''}
              onClick={() => { setRole(x); setRegister(false); setError(''); }}
            >
              {x === 'mentee' ? 'Mentee' : 'Mentor'}
            </button>
          ))}
        </div>
      )}
      {reg && (
        <label>
          Name
          <input value={form.name} onChange={set('name')} autoComplete="name" required />
        </label>
      )}
      <label>
        Email
        <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
      </label>
      <label>
        Password
        <input type="password" value={form.password} onChange={set('password')} minLength={reg ? 8 : undefined} autoComplete={reg ? 'new-password' : 'current-password'} required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="primary" disabled={busy}>{reg ? 'Register' : 'Login'}</button>
      {r === 'mentee' && (
        <button type="button" className="link" onClick={() => { setRegister(!register); setError(''); }}>
          {register ? 'Have an account? Login' : 'No account? Register'}
        </button>
      )}
    </form>
  );
}
