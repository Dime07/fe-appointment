import { useEffect, useState } from 'react';
import { api, fmt, getSession, photo, toIso, toLocalInput } from './api.js';
import Sessions from './Sessions.jsx';
import { Confirm, Empty, Icon, Modal, PageHead, initials, useToast } from './ui.jsx';

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function Slots({ mentor, notify }) {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ starts_at: '', ends_at: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = () => api('GET', `/admin/mentors/${mentor.id}/slots`).then(setSlots, (e) => setError(e.message));
  useEffect(() => { load(); }, [mentor.id]);
  const reset = () => { setForm({ starts_at: '', ends_at: '' }); setEditing(null); };

  async function save(e) {
    e.preventDefault();
    setError('');
    const body = { starts_at: toIso(form.starts_at), ends_at: toIso(form.ends_at) };
    try {
      editing ? await api('PUT', `/admin/slots/${editing}`, body) : await api('POST', `/admin/mentors/${mentor.id}/slots`, body);
      notify(editing ? 'Slot updated' : 'Slot added');
      reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const upcoming = slots.filter((s) => new Date(s.ends_at) > new Date());
  return (
    <>
      <form className="slot-form" onSubmit={save}>
        <label>Start (WIB)<input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required /></label>
        <label>End (WIB)<input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} required /></label>
        <button type="submit" className="primary">{editing ? 'Update' : 'Add slot'}</button>
        {editing && <button type="button" onClick={reset}>Cancel</button>}
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {upcoming.length === 0 ? (
        <Empty icon="clock" title="No upcoming slots">Add a slot above so mentees can book.</Empty>
      ) : (
        <ul className="slot-list">
          {upcoming.map((s) => (
            <li key={s.id} className={editing === s.id ? 'editing' : ''}>
              <Icon name="clock" size={16} />
              <span className="when">{fmt(s.starts_at)} <span className="muted">to {fmt(s.ends_at).split(', ')[1]}</span></span>
              {s.booked ? (
                <span className="badge upcoming">Booked</span>
              ) : (
                <span className="row-actions">
                  <button type="button" className="icon-btn" aria-label="Edit slot" onClick={() => { setEditing(s.id); setForm({ starts_at: toLocalInput(s.starts_at), ends_at: toLocalInput(s.ends_at) }); }}><Icon name="edit" size={16} /></button>
                  <button type="button" className="icon-btn danger-ghost" aria-label="Delete slot" onClick={() => setConfirm({
                    title: 'Delete slot?', body: `${fmt(s.starts_at)} will no longer be bookable.`, label: 'Delete slot',
                    run: async () => { await api('DELETE', `/admin/slots/${s.id}`); notify('Slot deleted'); load(); },
                  })}><Icon name="trash" size={16} /></button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <Confirm state={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

const EMPTY = { name: '', email: '', phone: '', bio: '', photo: '', password: '', expertise_ids: [] };

function MentorForm({ initial, expertise, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (id) =>
    setForm({ ...form, expertise_ids: form.expertise_ids.includes(id) ? form.expertise_ids.filter((x) => x !== id) : [...form.expertise_ids, id] });

  async function save(e) {
    e.preventDefault();
    if (!form.expertise_ids.length) return setError('Pick at least one expertise');
    setError('');
    setBusy(true);
    try {
      initial ? await api('PUT', `/admin/mentors/${initial.id}`, form) : await api('POST', '/admin/mentors', form);
      onSaved(initial ? 'Mentor updated' : 'Mentor added');
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <form className="form-grid" onSubmit={save}>
      <label>Name<input value={form.name} onChange={set('name')} required autoFocus /></label>
      <label>Email (login)<input type="email" value={form.email} onChange={set('email')} required /></label>
      <label>WhatsApp<input type="tel" value={form.phone} onChange={set('phone')} placeholder="0812 3456 7890" required /></label>
      {initial ? (
        <label>Photo URL<input value={form.photo} onChange={set('photo')} placeholder="/avatars/rina.svg" /></label>
      ) : (
        <label>Password<input type="password" value={form.password} onChange={set('password')} minLength={8} autoComplete="new-password" required /><small className="muted">Min 8 characters. Share it with the mentor.</small></label>
      )}
      {!initial && <label className="wide">Photo URL<input value={form.photo} onChange={set('photo')} placeholder="/avatars/rina.svg" /></label>}
      <label className="wide">Bio<textarea value={form.bio} onChange={set('bio')} rows={3} /></label>
      <fieldset className="wide chips">
        <legend>Expertise</legend>
        {expertise.length === 0 && <span className="muted">Add expertise first.</span>}
        {expertise.map((x) => (
          <label key={x.id} className="chip">
            <input type="checkbox" checked={form.expertise_ids.includes(x.id)} onChange={() => toggle(x.id)} />
            {x.name}
          </label>
        ))}
      </fieldset>
      {error && <p className="error wide" role="alert">{error}</p>}
      <div className="modal-actions wide">
        <button type="submit" className="primary" disabled={busy}>{initial ? 'Save changes' : 'Add mentor'}</button>
      </div>
    </form>
  );
}

function PasswordForm({ mentor, onSaved }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  async function save(e) {
    e.preventDefault();
    try {
      await api('PUT', `/admin/mentors/${mentor.id}/password`, { password: pw });
      onSaved(`Password updated for ${mentor.name}`);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="stack" onSubmit={save}>
      <label>New password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} autoComplete="new-password" required autoFocus /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="submit" className="primary">Update password</button></div>
    </form>
  );
}

function Mentors({ notify }) {
  const [mentors, setMentors] = useState(null);
  const [expertise, setExpertise] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // { kind: 'form'|'slots'|'password', mentor? }
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');

  const load = () => api('GET', '/admin/mentors').then(setMentors, (e) => setError(e.message));
  useEffect(() => { load(); api('GET', '/expertise').then(setExpertise, (e) => setError(e.message)); }, []);
  const saved = (msg) => { setModal(null); notify(msg); load(); };

  const term = q.trim().toLowerCase();
  const shown = (mentors || []).filter((m) => !term || `${m.name} ${m.email} ${m.expertise.map((x) => x.name).join(' ')}`.toLowerCase().includes(term));
  const m = modal?.mentor;

  return (
    <>
      <PageHead title="Mentors" desc="Profiles, logins and bookable time slots.">
        <button className="primary" onClick={() => setModal({ kind: 'form' })}><Icon name="plus" size={16} />Add mentor</button>
      </PageHead>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="panel">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Search name, email or expertise" aria-label="Search mentors" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <span className="muted">{mentors ? plural(shown.length, 'mentor') : ''}</span>
        </div>
        {mentors === null ? <p className="muted pad">Loading...</p> : shown.length === 0 ? (
          <Empty icon="mentors" title={term ? 'No matching mentors' : 'No mentors yet'}>{term ? 'Try another search.' : 'Add your first mentor to open bookings.'}</Empty>
        ) : (
          <div className="scroll">
            <table className="data">
              <thead><tr><th>Mentor</th><th>WhatsApp</th><th>Expertise</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {shown.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <div className="person">
                        <img className="avatar" src={photo(x)} alt="" width="36" height="36" />
                        <div><strong>{x.name}</strong><span className="muted">{x.email}</span></div>
                        {!x.has_login && <span className="badge past">No login</span>}
                      </div>
                    </td>
                    <td className="nowrap">{x.phone || <span className="muted">-</span>}</td>
                    <td><span className="tags">{x.expertise.map((e) => <span key={e.id}>{e.name}</span>)}</span></td>
                    <td>
                      <span className="row-actions">
                        <button onClick={() => setModal({ kind: 'slots', mentor: x })}><Icon name="clock" size={16} />Slots</button>
                        <button className="icon-btn" aria-label={`Edit ${x.name}`} title="Edit" onClick={() => setModal({ kind: 'form', mentor: x })}><Icon name="edit" size={16} /></button>
                        {x.has_login && <button className="icon-btn" aria-label={`Reset password for ${x.name}`} title="Reset password" onClick={() => setModal({ kind: 'password', mentor: x })}><Icon name="key" size={16} /></button>}
                        <button className="icon-btn danger-ghost" aria-label={`Delete ${x.name}`} title="Delete" onClick={() => setConfirm({
                          title: `Delete ${x.name}?`, body: 'Their login and all unbooked slots are removed. Mentors with booked sessions cannot be deleted.', label: 'Delete mentor',
                          run: async () => { await api('DELETE', `/admin/mentors/${x.id}`); notify('Mentor deleted'); load(); },
                        })}><Icon name="trash" size={16} /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal?.kind === 'form'} wide title={m ? `Edit ${m.name}` : 'Add mentor'} onClose={() => setModal(null)}>
        <MentorForm
          key={m?.id || 'new'}
          expertise={expertise}
          onSaved={saved}
          initial={m && { id: m.id, name: m.name, email: m.email, phone: m.phone || '', bio: m.bio || '', photo: m.photo || '', expertise_ids: m.expertise.map((e) => e.id) }}
        />
      </Modal>
      <Modal open={modal?.kind === 'slots'} wide title={m ? `Slots: ${m.name}` : ''} onClose={() => setModal(null)}>
        {m && <Slots mentor={m} notify={notify} />}
      </Modal>
      <Modal open={modal?.kind === 'password'} title={m ? `Reset password: ${m.name}` : ''} onClose={() => setModal(null)}>
        {m && <PasswordForm mentor={m} onSaved={saved} />}
      </Modal>
      <Confirm state={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

function Expertise({ notify }) {
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const load = () => api('GET', '/expertise').then(setItems, (e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const run = async (fn, msg) => {
    setError('');
    try {
      await fn();
      notify(msg);
      load();
      return true;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHead title="Expertise" desc="Categories mentees use to find the right mentor." />
      <div className="panel">
        <form className="toolbar" onSubmit={async (e) => { e.preventDefault(); (await run(() => api('POST', '/admin/expertise', { name }), 'Expertise added')) && setName(''); }}>
          <input className="grow" placeholder="New expertise, e.g. UI/UX" aria-label="New expertise name" value={name} onChange={(e) => setName(e.target.value)} required />
          <button type="submit" className="primary"><Icon name="plus" size={16} />Add</button>
        </form>
        {error && <p className="error pad" role="alert">{error}</p>}
        {items === null ? <p className="muted pad">Loading...</p> : items.length === 0 ? (
          <Empty icon="expertise" title="No expertise yet">Add one above, then assign it to mentors.</Empty>
        ) : (
          <ul className="list">
            {items.map((x) => (
              <li key={x.id}>
                {editing?.id === x.id ? (
                  <form className="inline-edit" onSubmit={async (e) => { e.preventDefault(); (await run(() => api('PUT', `/admin/expertise/${x.id}`, { name: editing.name }), 'Expertise renamed')) && setEditing(null); }}>
                    <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} aria-label="Expertise name" required autoFocus onKeyDown={(e) => e.key === 'Escape' && setEditing(null)} />
                    <button type="submit" className="primary">Save</button>
                    <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <strong>{x.name}</strong>
                    <span className="muted">{plural(x.mentors, 'mentor')}</span>
                    <span className="row-actions">
                      <button className="icon-btn" aria-label={`Rename ${x.name}`} title="Rename" onClick={() => setEditing({ id: x.id, name: x.name })}><Icon name="edit" size={16} /></button>
                      <button className="icon-btn danger-ghost" aria-label={`Delete ${x.name}`} title={x.mentors ? 'In use by mentors' : 'Delete'} disabled={x.mentors > 0} onClick={() => setConfirm({
                        title: `Delete ${x.name}?`, body: 'This expertise will be removed from the list.', label: 'Delete',
                        run: async () => { await api('DELETE', `/admin/expertise/${x.id}`); notify('Expertise deleted'); load(); },
                      })}><Icon name="trash" size={16} /></button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Confirm state={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

function AdminForm({ onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    try {
      await api('POST', '/admin/admins', form);
      onSaved('Admin added');
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="stack" onSubmit={save}>
      <label>Name<input value={form.name} onChange={set('name')} required autoFocus /></label>
      <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
      <label>Password<input type="password" value={form.password} onChange={set('password')} minLength={8} autoComplete="new-password" required /><small className="muted">Min 8 characters.</small></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="submit" className="primary">Add admin</button></div>
    </form>
  );
}

function Admins({ notify }) {
  const me = getSession().user;
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('GET', '/admin/admins').then(setItems, (e) => setError(e.message));
  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHead title="Admins" desc="People who can access this panel.">
        <button className="primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} />Add admin</button>
      </PageHead>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="panel">
        {items === null ? <p className="muted pad">Loading...</p> : (
          <ul className="list">
            {items.map((a) => (
              <li key={a.id}>
                <span className="initials" aria-hidden="true">{initials(a.name)}</span>
                <div className="person-text"><strong>{a.name}</strong><span className="muted">{a.email}</span></div>
                {a.id === me.id ? <span className="badge upcoming">You</span> : (
                  <span className="row-actions">
                    <button className="icon-btn danger-ghost" aria-label={`Remove ${a.name}`} title="Remove" onClick={() => setConfirm({
                      title: `Remove ${a.name}?`, body: 'They will lose access to the admin panel immediately.', label: 'Remove admin',
                      run: async () => { await api('DELETE', `/admin/admins/${a.id}`); notify('Admin removed'); load(); },
                    })}><Icon name="trash" size={16} /></button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Modal open={adding} title="Add admin" onClose={() => setAdding(false)}>
        <AdminForm onSaved={(msg) => { setAdding(false); notify(msg); load(); }} />
      </Modal>
      <Confirm state={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

const STATS = [
  ['total', 'Total sessions', 'sessions'],
  ['upcoming', 'Upcoming', 'clock'],
  ['ongoing', 'Ongoing', 'play'],
  ['past', 'Past', 'archive'],
];

function Dashboard({ go }) {
  const [s, setS] = useState(null);
  const [next, setNext] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api('GET', '/admin/stats').then(setS, (e) => setError(e.message));
    api('GET', '/admin/sessions').then((all) => setNext(all.filter((x) => x.status !== 'past').slice(0, 5)), () => {});
  }, []);
  if (error) return <p className="error" role="alert">{error}</p>;
  if (!s) return <p className="muted">Loading...</p>;
  const max = Math.max(1, ...s.per_mentor.map((m) => m.sessions));
  return (
    <>
      <PageHead title="Dashboard" desc="Mentoring activity at a glance." />
      <div className="stats">
        {STATS.map(([k, label, icon]) => (
          <div key={k} className={`stat ${k}`}>
            <span className="stat-icon"><Icon name={icon} size={18} /></span>
            <span className="stat-label">{label}</span>
            <strong>{s[k]}</strong>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <h3>Mentor workload</h3>
            <span className="muted">{plural(s.total, 'session')} · {plural(s.per_mentor.length, 'mentor')}</span>
          </div>
          {s.per_mentor.length === 0 ? <Empty icon="mentors" title="No mentors yet" /> : (
            <ol className="rank">
              {s.per_mentor.map((m, i) => (
                <li key={m.id}>
                  <span className="pos">{i + 1}</span>
                  <img className="avatar" src={photo(m)} alt="" width="36" height="36" />
                  <div className="info">
                    <div className="line">
                      <strong>{m.name}</strong>
                      <span className="muted">{plural(m.sessions, 'session')}{s.total ? ` · ${Math.round((m.sessions / s.total) * 100)}%` : ''}</span>
                    </div>
                    <span className="bar"><span style={{ width: `${(m.sessions / max) * 100}%` }} /></span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Coming up</h3>
            <button className="link" onClick={() => go('sessions')}>View all</button>
          </div>
          {next.length === 0 ? <Empty icon="sessions" title="Nothing scheduled">New bookings show up here.</Empty> : (
            <ul className="agenda">
              {next.map((x) => (
                <li key={x.id}>
                  <span className={`dot ${x.status}`} aria-hidden="true" />
                  <div>
                    <strong>{x.topic || 'Session'}</strong>
                    <span className="muted">{x.mentee_name} with {x.mentor_name}</span>
                  </div>
                  <span className="when muted">{x.status === 'ongoing' ? <span className="badge ongoing">Now</span> : fmt(x.starts_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function AllSessions() {
  const [sessions, setSessions] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { api('GET', '/admin/sessions').then(setSessions, (e) => setError(e.message)); }, []);
  const term = q.trim().toLowerCase();
  const shown = sessions.filter((s) => !term || `${s.mentee_name} ${s.mentee_email} ${s.mentor_name} ${s.topic}`.toLowerCase().includes(term));
  return (
    <>
      <PageHead title="Sessions" desc="Every booking across all mentors.">
        <label className="search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Search mentee, mentor or topic" aria-label="Search sessions" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </PageHead>
      {error && <p className="error" role="alert">{error}</p>}
      <Sessions sessions={shown} who="admin" />
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
  const [notify, toast] = useToast();
  const Tab = TABS.find((t) => t[0] === tab)[2];
  return (
    <div className="admin-layout">
      <aside>
        <p className="aside-label">Workspace</p>
        <nav aria-label="Admin">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
              <Icon name={id} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="admin-content"><Tab notify={notify} go={setTab} /></div>
      {toast}
    </div>
  );
}
