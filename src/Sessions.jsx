import { fmt } from './api.js';

const GROUPS = ['upcoming', 'ongoing', 'past'];

// who: 'mentee' (viewer is mentee, show mentor + contact), 'mentor' (show mentee), 'admin' (show both)
export default function Sessions({ sessions, who }) {
  return GROUPS.map((g) => {
    const items = sessions.filter((s) => s.status === g);
    return (
      <section key={g}>
        <h3>{g[0].toUpperCase() + g.slice(1)} ({items.length})</h3>
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
    );
  });
}
