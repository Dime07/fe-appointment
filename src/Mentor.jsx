import { useEffect, useState } from 'react';
import { api } from './api.js';
import Sessions from './Sessions.jsx';

export default function Mentor() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api('GET', '/mentor/sessions').then(setSessions, (e) => setError(e.message)); }, []);
  return (
    <>
      <h2>My sessions</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <Sessions sessions={sessions} who="mentor" />
    </>
  );
}
