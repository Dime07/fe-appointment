import { useEffect, useRef, useState } from 'react';
import { api, fmt, getSession, photo } from './api.js';
import Sessions from './Sessions.jsx';

const WIB = 7 * 3600e3;
const dayKey = (iso) => new Date(new Date(iso).getTime() + WIB).toISOString().slice(0, 10);
const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function BookDialog({ mentor, me, onClose, onBook }) {
  const ref = useRef();
  const byDay = {};
  mentor.slots.forEach((s) => (byDay[dayKey(s.starts_at)] ||= []).push(s));
  const days = Object.keys(byDay).sort();
  const [month, setMonth] = useState(days[0].slice(0, 7)); // YYYY-MM
  const [day, setDay] = useState(days[0]);
  const [slot, setSlot] = useState(null);
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { ref.current.showModal(); }, []);

  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const shift = (n) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    setMonth(d.toISOString().slice(0, 7));
  };
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    await onBook(slot, topic);
    setBusy(false);
  }

  return (
    <dialog ref={ref} className="modal" onClose={onClose} onClick={(e) => e.target === ref.current && ref.current.close()}>
      <form onSubmit={submit}>
        <div className="modal-head">
          <h3>Book {mentor.name}</h3>
          <button type="button" aria-label="Close" onClick={() => ref.current.close()}>&times;</button>
        </div>
        <div className="cal">
          <div className="cal-nav">
            <button type="button" aria-label="Previous month" onClick={() => shift(-1)}>&lsaquo;</button>
            <strong>{label}</strong>
            <button type="button" aria-label="Next month" onClick={() => shift(1)}>&rsaquo;</button>
          </div>
          <div className="cal-grid">
            {DOW.map((d) => <span key={d} className="dow">{d}</span>)}
            {Array.from({ length: first }, (_, i) => <span key={`b${i}`} />)}
            {Array.from({ length: count }, (_, i) => {
              const k = `${month}-${String(i + 1).padStart(2, '0')}`;
              const has = !!byDay[k];
              return (
                <button key={k} type="button" disabled={!has} aria-pressed={day === k} className={`day${day === k ? ' on' : ''}${has ? ' has' : ''}`}
                  onClick={() => { setDay(k); setSlot(null); }}>{i + 1}</button>
              );
            })}
          </div>
        </div>
        <p className="muted">Available times on {day} (WIB)</p>
        <div className="times" role="group" aria-label="Available times">
          {(byDay[day] || []).map((s) => (
            <button key={s.id} type="button" aria-pressed={slot?.id === s.id} className={slot?.id === s.id ? 'on' : ''} onClick={() => setSlot(s)}>
              {timeOf(s.starts_at)} - {timeOf(s.ends_at)}
            </button>
          ))}
        </div>
        <div className="row">
          <label>Name<input value={me.name} readOnly /></label>
          <label>Email<input value={me.email} readOnly /></label>
        </div>
        <label>
          Topic
          <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} required />
        </label>
        <div className="row">
          <button type="submit" className="primary" disabled={!slot || busy}>{slot ? `Confirm ${timeOf(slot.starts_at)}` : 'Pick a time'}</button>
          <button type="button" onClick={() => ref.current.close()}>Cancel</button>
        </div>
      </form>
    </dialog>
  );
}

export default function Mentee() {
  const me = getSession().user;
  const [tab, setTab] = useState('book');
  const [mentors, setMentors] = useState([]);
  const [expertise, setExpertise] = useState([]);
  const [filter, setFilter] = useState('');
  const [sessions, setSessions] = useState([]);
  const [pick, setPick] = useState(null); // mentor being booked
  const [msg, setMsg] = useState(null);

  const loadMentors = () =>
    api('GET', '/mentors' + (filter ? `?expertise=${filter}` : '')).then(setMentors, (e) => setMsg({ error: e.message }));
  const loadSessions = () => api('GET', '/my-sessions').then(setSessions, (e) => setMsg({ error: e.message }));
  useEffect(() => { api('GET', '/expertise').then(setExpertise, () => {}); loadSessions(); }, []);
  useEffect(() => { loadMentors(); }, [filter]);

  async function book(slot, topic) {
    setMsg(null);
    try {
      const r = await api('POST', '/bookings', { slot_id: slot.id, topic });
      setMsg({ ok: `Booked ${pick.name}, ${fmt(slot.starts_at)}.${r.invite_sent ? ' Invitation emailed.' : ''}` });
    } catch (err) {
      setMsg({ error: `${err.message}. Slot list refreshed.` });
    }
    setPick(null);
    loadMentors();
    loadSessions();
  }

  return (
    <>
      <nav>
        <button className={tab === 'book' ? 'on' : ''} onClick={() => setTab('book')}>Book a session</button>
        <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>My sessions</button>
      </nav>
      {msg && <p className={msg.error ? 'error' : 'ok'} role="status">{msg.error || msg.ok}</p>}
      {tab === 'mine' ? (
        <Sessions sessions={sessions} who="mentee" />
      ) : (
        <>
          <label className="filter">
            Expertise
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All</option>
              {expertise.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          {pick && <BookDialog mentor={pick} me={me} onClose={() => setPick(null)} onBook={book} />}
          {mentors.length === 0 ? (
            <p className="muted">No mentors found.</p>
          ) : (
            <div className="mentor-grid">
              {mentors.map((m) => (
                <section key={m.id} className="mentor">
                  <div className="cover" />
                  <img src={photo(m)} alt="" width="80" height="80" />
                  <div className="body">
                    <h3>{m.name}</h3>
                    <p className="tags">{m.expertise.map((x) => <span key={x.id}>{x.name}</span>)}</p>
                    {m.bio && <p className="bio">{m.bio}</p>}
                    <p className="next">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      {m.slots.length === 0 ? 'No available slots' : `Next: ${fmt(m.slots[0].starts_at)}`}
                    </p>
                    <button className="primary" disabled={m.slots.length === 0} onClick={() => { setPick(m); setMsg(null); }}>
                      {m.slots.length === 0 ? 'Unavailable' : `Book a session (${m.slots.length} ${m.slots.length === 1 ? 'slot' : 'slots'})`}
                    </button>
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
