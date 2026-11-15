import { useEffect, useState } from 'react';
import { api, fmt, getSession, photo } from './api.js';
import Sessions from './Sessions.jsx';

export default function Mentee() {
  const me = getSession().user;
  const [tab, setTab] = useState('book');
  const [mentors, setMentors] = useState([]);
  const [expertise, setExpertise] = useState([]);
  const [filter, setFilter] = useState('');
  const [sessions, setSessions] = useState([]);
  const [pick, setPick] = useState(null); // { slot, mentor }
  const [topic, setTopic] = useState('');
  const [msg, setMsg] = useState(null);

  const loadMentors = () =>
    api('GET', '/mentors' + (filter ? `?expertise=${filter}` : '')).then(setMentors, (e) => setMsg({ error: e.message }));
  const loadSessions = () => api('GET', '/my-sessions').then(setSessions, (e) => setMsg({ error: e.message }));
  useEffect(() => { api('GET', '/expertise').then(setExpertise, () => {}); loadSessions(); }, []);
  useEffect(() => { loadMentors(); }, [filter]);

  async function book(e) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await api('POST', '/bookings', { slot_id: pick.slot.id, topic });
      setMsg({ ok: `Booked ${pick.mentor.name}, ${fmt(pick.slot.starts_at)}.${r.invite_sent ? ' Invitation emailed.' : ''}` });
      setPick(null);
      setTopic('');
    } catch (err) {
      setMsg({ error: `${err.message}. Slot list refreshed.` });
      setPick(null);
    }
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
          {pick && (
            <form className="card book" onSubmit={book}>
              <h3>Book {pick.mentor.name}, {fmt(pick.slot.starts_at)}</h3>
              <div className="row">
                <label>Name<input value={me.name} readOnly /></label>
                <label>Email<input value={me.email} readOnly /></label>
              </div>
              <label>
                Topic
                <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} required autoFocus />
              </label>
              <div className="row">
                <button type="submit" className="primary">Confirm booking</button>
                <button type="button" onClick={() => setPick(null)}>Cancel</button>
              </div>
            </form>
          )}
          {mentors.length === 0 ? (
            <p className="muted">No mentors found.</p>
          ) : (
            mentors.map((m) => (
              <section key={m.id} className="card mentor">
                <img src={photo(m)} alt="" width="64" height="64" />
                <div>
                  <h3>{m.name}</h3>
                  <p className="tags">{m.expertise.map((x) => <span key={x.id}>{x.name}</span>)}</p>
                  {m.bio && <p className="muted">{m.bio}</p>}
                  {m.slots.length === 0 ? (
                    <p className="muted">No available slots.</p>
                  ) : (
                    <ul className="slots">
                      {m.slots.map((s) => (
                        <li key={s.id}>
                          {fmt(s.starts_at)} - {fmt(s.ends_at)}
                          <button onClick={() => { setPick({ slot: s, mentor: m }); setMsg(null); }}>Book</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </>
  );
}
