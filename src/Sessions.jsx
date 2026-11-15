import { useState } from 'react';
import { fmt } from './api.js';
import { Empty, Icon, initials } from './ui.jsx';

const Who = ({ name, sub }) => (
  <div className="person">
    <span className="initials" aria-hidden="true">{initials(name)}</span>
    <div><strong>{name}</strong>{sub && <span className="muted">{sub}</span>}</div>
  </div>
);
const When = ({ s }) => {
  const [date, start] = fmt(s.starts_at).split(', ');
  return <div className="when-cell"><strong>{date}</strong><span className="muted">{start.replace(' WIB', '')} - {fmt(s.ends_at).split(', ')[1]}</span></div>;
};

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
          <div className="panel"><Empty icon="sessions" title={`No ${g} sessions`} /></div>
        ) : (
          <div className="panel scroll">
            <table className="data">
              <thead>
                <tr>
                  {who !== 'mentee' && <th>Mentee</th>}
                  {who !== 'mentor' && <th>Mentor</th>}
                  <th>Topic</th>
                  <th>When</th>
                  {who === 'mentee' && <th>Mentor WhatsApp</th>}
                  {who === 'admin' && <th>Invite</th>}
                  {who !== 'admin' && <th>Meeting</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    {who !== 'mentee' && <td><Who name={s.mentee_name} sub={s.mentee_email} /></td>}
                    {who !== 'mentor' && <td><Who name={s.mentor_name} /></td>}
                    <td className="topic">{s.topic}</td>
                    <td><When s={s} /></td>
                    {who === 'mentee' && <td className="nowrap">{s.mentor_phone || '-'}</td>}
                    {who === 'admin' && <td><span className={`badge ${s.invite_sent_at ? 'ongoing' : 'past'}`}>{s.invite_sent_at ? 'Sent' : 'Not sent'}</span></td>}
                    {who !== 'admin' && <td className="actions-col"><a className="join" href={s.meeting_link} target="_blank" rel="noreferrer"><Icon name="play" size={14} />Join</a></td>}
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
