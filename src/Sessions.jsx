import { useState } from 'react';
import { fmt } from './api.js';

const GROUPS = ['upcoming', 'ongoing', 'past'];

// who: 'mentee' (viewer is mentee, show mentor + contact), 'mentor' (show mentee), 'admin' (show both)
export default function Sessions({ sessions, who }) {
  const [g, setG] = useState('upcoming');
  const items = sessions.filter((s) => s.status === g);
  return (
    <>
      <div className="seg" role="tablist" aria-label="Session status">
        {GROUPS.map((x) => (
          <button key={x} type="button" role="tab" id={`tab-${x}`} aria-selected={g === x} aria-controls="sessions-panel" className={g === x ? 'on' : ''} onClick={() => setG(x)}>
            {x[0].toUpperCase() + x.slice(1)} <span className="count">{sessions.filter((s) => s.status === x).length}</span>
          </button>
        ))}
      </div>
      <section id="sessions-panel" role="tabpanel" aria-labelledby={`tab-${g}`}>
        {items.length === 0 ? (
          <p className="muted">No {g} sessions.</p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  {who !== 'mentee' && <th>Mentee</th>}
                  {who !== 'mentor' && <th>Mentor</th>}
                  <th>Topic</th>
                  <th>Start</th>
                  <th>End</th>
                  {who !== 'admin' && <th>Link</th>}
                  {who === 'mentee' && <th>Mentor WhatsApp</th>}
                  {who === 'admin' && <th>Invite</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    {who !== 'mentee' && <td>{s.mentee_name} ({s.mentee_email})</td>}
                    {who !== 'mentor' && <td>{s.mentor_name}</td>}
                    <td>{s.topic}</td>
                    <td>{fmt(s.starts_at)}</td>
                    <td>{fmt(s.ends_at)}</td>
                    {who !== 'admin' && <td><a href={s.meeting_link} target="_blank" rel="noreferrer">Join</a></td>}
                    {who === 'mentee' && <td>{s.mentor_phone || '-'}</td>}
                    {who === 'admin' && <td>{s.invite_sent_at ? 'Sent' : 'Not sent'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
