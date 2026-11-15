import { useState } from 'react';
import { getSession, setSession } from './api.js';
import Auth from './Auth.jsx';
import Admin from './Admin.jsx';
import Mentee from './Mentee.jsx';
import Mentor from './Mentor.jsx';

const isAdminPage = location.pathname.startsWith('/admin');
const PORTAL = { admin: Admin, mentor: Mentor, mentee: Mentee };

export default function App() {
  const [session, setS] = useState(getSession());

  const login = (s) => {
    setSession(s);
    setS(s);
  };
  const logout = () => {
    setSession(null);
    setS(null);
  };

  // a session belongs to one portal: admin only on /admin, mentee/mentor only on /
  const allowed = session && (session.user.role === 'admin') === isAdminPage;
  const Portal = allowed && PORTAL[session.user.role];

  return (
    <>
      <header>
        <strong>Mentoring Booking{isAdminPage && ' / Admin'}</strong>
        {session && (
          <span className="who">
            {session.user.name} ({session.user.role})
            <button onClick={logout}>Logout</button>
          </span>
        )}
      </header>
      <main>
        {Portal ? (
          <Portal />
        ) : (
          <>
            {session && (
              <p className="error" role="alert">
                Signed in as {session.user.role}. <a href={isAdminPage ? '/' : '/admin'}>Go to the {isAdminPage ? 'mentee/mentor' : 'admin'} portal</a> or log out.
              </p>
            )}
            {!session && <Auth onLogin={login} admin={isAdminPage} />}
          </>
        )}
      </main>
    </>
  );
}
