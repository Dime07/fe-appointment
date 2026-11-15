import { useEffect, useState } from 'react';
import { api, fmt, getSession, photo, toIso, toLocalInput } from './api.js';
import Sessions from './Sessions.jsx';

function Slots({ mentor, onError }) {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ starts_at: '', ends_at: '' });
  const [editing, setEditing] = useState(null);

  const load = () => api('GET', `/admin/mentors/${mentor.id}/slots`).then(setSlots, (e) => onError(e.message));
  useEffect(() => { load(); }, [mentor.id]);

  async function save(e) {
    e.preventDefault();
    onError('');
    const body = { starts_at: toIso(form.starts_at), ends_at: toIso(form.ends_at) };
    try {
      editing
        ? await api('PUT', `/admin/slots/${editing}`, body)
        : await api('POST', `/admin/mentors/${mentor.id}/slots`, body);
      setForm({ starts_at: '', ends_at: '' });
      setEditing(null);
    } catch (err) {
      onError(err.message);
    }
    load();
  }

  async function remove(id) {
    onError('');
    try {
      await api('DELETE', `/admin/slots/${id}`);
    } catch (err) {
      onError(err.message);
    }
    load();
  }

  return (
    <div className="card">
      <h4>Slots for {mentor.name} (WIB)</h4>
      <form className="row" onSubmit={save}>
        <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required aria-label="Start" />
        <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} required aria-label="End" />
        <button type="submit">{editing ? 'Update slot' : 'Add slot'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ starts_at: '', ends_at: '' }); }}>Cancel</button>}
      </form>
      {slots.length === 0 ? (
        <p className="muted">No slots.</p>
      ) : (
        <ul className="slots">
          {slots.map((s) => (
            <li key={s.id}>
              {fmt(s.starts_at)} - {fmt(s.ends_at)} {s.booked && <em>(booked)</em>}
              {!s.booked && (
                <>
                  <button onClick={() => { setEditing(s.id); setForm({ starts_at: toLocalInput(s.starts_at), ends_at: toLocalInput(s.ends_at) }); }}>Edit</button>
                  <button onClick={() => remove(s.id)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const EMPTY = { name: '', email: '', phone: '', bio: '', photo: '', password: '', expertise_ids: [] };

function Mentors() {
  const [mentors, setMentors] = useState([]);
  const [expertise, setExpertise] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api('GET', '/admin/mentors').then(setMentors, (e) => setError(e.message));
  useEffect(() => { load(); api('GET', '/expertise').then(setExpertise, (e) => setError(e.message)); }, []);

  const toggle = (id) =>
    setForm({ ...form, expertise_ids: form.expertise_ids.includes(id) ? form.expertise_ids.filter((x) => x !== id) : [...form.expertise_ids, id] });
  const reset = () => { setForm(EMPTY); setEditing(null); };

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!form.expertise_ids.length) return setError('Pick at least one expertise');
    try {
      editing ? await api('PUT', `/admin/mentors/${editing}`, form) : await api('POST', '/admin/mentors', form);
      reset();
    } catch (err) {
      setError(err.message);
    }
    load();
  }

  async function resetPassword(m) {
    const pw = prompt(`New password for ${m.name} (min 8 chars)`);
    if (!pw) return;
    setError('');
    try {
      await api('PUT', `/admin/mentors/${m.id}/password`, { password: pw });
      alert('Password updated');
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(m) {
    if (!confirm(`Delete mentor ${m.name}, their login and all their slots?`)) return;
    setError('');
    try {
      await api('DELETE', `/admin/mentors/${m.id}`);
      if (selected?.id === m.id) setSelected(null);
    } catch (err) {
      setError(err.message);
    }
    load();
  }

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="card grid" onSubmit={save}>
        <h3>{editing ? 'Edit mentor' : 'Add mentor'}</h3>
        <label>Name<input value={form.name} onChange={set('name')} required /></label>
        <label>Email (login)<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>WhatsApp<input type="tel" value={form.phone} onChange={set('phone')} placeholder="0812..." required /></label>
        {!editing && <label>Password<input type="password" value={form.password} onChange={set('password')} minLength={8} autoComplete="new-password" required /></label>}
        <label>Photo URL<input value={form.photo} onChange={set('photo')} placeholder="/avatars/rina.svg" /></label>
        <label className="wide">Bio<textarea value={form.bio} onChange={set('bio')} rows={2} /></label>
        <fieldset className="wide">
          <legend>Expertise</legend>
          {expertise.length === 0 && <span className="muted">Add expertise first.</span>}
          {expertise.map((x) => (
            <label key={x.id} className="check">
              <input type="checkbox" checked={form.expertise_ids.includes(x.id)} onChange={() => toggle(x.id)} /> {x.name}
            </label>
          ))}
        </fieldset>
        <div className="row wide">
          <button type="submit" className="primary">{editing ? 'Update mentor' : 'Add mentor'}</button>
          {editing && <button type="button" onClick={reset}>Cancel</button>}
        </div>
      </form>
      {mentors.length === 0 ? (
        <p className="muted">No mentors yet.</p>
      ) : (
        <div className="scroll">
          <table>
            <thead><tr><th></th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Expertise</th><th></th></tr></thead>
            <tbody>
              {mentors.map((m) => (
                <tr key={m.id}>
                  <td><img className="avatar" src={photo(m)} alt="" width="32" height="32" /></td>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone || '-'}</td>
                  <td>{m.expertise.map((x) => x.name).join(', ') || '-'}</td>
                  <td className="actions">
                    <button onClick={() => setSelected(m)}>Slots</button>
                    <button onClick={() => {
                      setEditing(m.id);
                      setForm({ ...EMPTY, name: m.name, email: m.email, phone: m.phone || '', bio: m.bio || '', photo: m.photo || '', expertise_ids: m.expertise.map((x) => x.id) });
                    }}>Edit</button>
                    {m.has_login && <button onClick={() => resetPassword(m)}>Reset password</button>}
                    <button onClick={() => remove(m)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <Slots mentor={selected} onError={setError} />}
    </>
  );
}

function Expertise() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const load = () => api('GET', '/expertise').then(setItems, (e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const run = async (fn) => {
    setError('');
    try { await fn(); } catch (err) { setError(err.message); }
    load();
  };

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="row card" onSubmit={(e) => { e.preventDefault(); run(() => api('POST', '/admin/expertise', { name })).then(() => setName('')); }}>
        <input placeholder="Expertise name" aria-label="Expertise name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button type="submit" className="primary">Add expertise</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Mentors</th><th></th></tr></thead>
        <tbody>
          {items.map((x) => (
            <tr key={x.id}>
              <td>{x.name}</td>
              <td>{x.mentors}</td>
              <td className="actions">
                <button onClick={() => { const n = prompt('Rename expertise', x.name); n && run(() => api('PUT', `/admin/expertise/${x.id}`, { name: n })); }}>Rename</button>
                <button onClick={() => confirm(`Delete ${x.name}?`) && run(() => api('DELETE', `/admin/expertise/${x.id}`))}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Admins() {
  const me = getSession().user;
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const load = () => api('GET', '/admin/admins').then(setItems, (e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api('POST', '/admin/admins', form);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      setError(err.message);
    }
    load();
  }

  async function remove(a) {
    if (!confirm(`Remove admin ${a.name}?`)) return;
    setError('');
    try { await api('DELETE', `/admin/admins/${a.id}`); } catch (err) { setError(err.message); }
    load();
  }

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="row card" onSubmit={add}>
        <input placeholder="Name" aria-label="Name" value={form.name} onChange={set('name')} required />
        <input type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder="Password (min 8)" aria-label="Password" value={form.password} onChange={set('password')} minLength={8} autoComplete="new-password" required />
        <button type="submit" className="primary">Add admin</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th></th></tr></thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.email}</td>
              <td>{a.id === me.id ? <span className="muted">You</span> : <button onClick={() => remove(a)}>Remove</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('GET', '/admin/stats').then(setS, (e) => setError(e.message)); }, []);
  if (error) return <p className="error" role="alert">{error}</p>;
  if (!s) return <p className="muted">Loading...</p>;
  const max = Math.max(1, ...s.per_mentor.map((m) => m.sessions));
  return (
    <>
      <div className="stats">
        {['total', 'upcoming', 'ongoing', 'past'].map((k) => (
          <div key={k} className="card stat">
            <span className="muted">{k[0].toUpperCase() + k.slice(1)}</span>
            <strong>{s[k]}</strong>
          </div>
        ))}
      </div>
      <section className="card">
        <h3>Sessions per mentor</h3>
        {s.per_mentor.length === 0 ? <p className="muted">No mentors yet.</p> : (
          <ul className="bars">
            {s.per_mentor.map((m) => (
              <li key={m.id}>
                <span>{m.name}</span>
                <span className="bar"><span style={{ width: `${(m.sessions / max) * 100}%` }} /></span>
                <strong>{m.sessions}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function AllSessions() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api('GET', '/admin/sessions').then(setSessions, (e) => setError(e.message)); }, []);
  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      <Sessions sessions={sessions} who="admin" />
    </>
  );
}

const TABS = [
  ['dashboard', 'Dashboard', Dashboard],
  ['sessions', 'Sessions', AllSessions],
  ['mentors', 'Mentors & slots', Mentors],
  ['expertise', 'Expertise', Expertise],
  ['admins', 'Admins', Admins],
];

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const Tab = TABS.find((t) => t[0] === tab)[2];
  return (
    <>
      <nav>
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      <Tab />
    </>
  );
}
