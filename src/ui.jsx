import { useEffect, useRef, useState } from 'react';

const PATHS = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  sessions: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  mentors: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  expertise: 'M12 2l3 7 7 .6-5.3 4.6 1.6 7.1L12 17.8 5.7 21.3l1.6-7.1L2 9.6 9 9z',
  admins: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  plus: 'M12 5v14M5 12h14',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  play: 'M5 3l14 9-14 9z',
  archive: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
};

export const Icon = ({ name, size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={PATHS[name]} />
  </svg>
);

export const PageHead = ({ title, desc, children }) => (
  <div className="page-head">
    <div>
      <h2>{title}</h2>
      {desc && <p className="muted">{desc}</p>}
    </div>
    {children}
  </div>
);

export const Empty = ({ icon, title, children }) => (
  <div className="empty">
    <span className="empty-icon"><Icon name={icon} size={22} /></span>
    <strong>{title}</strong>
    {children}
  </div>
);

export const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// controlled native <dialog>: Esc, focus trap and backdrop come from the platform
export function Modal({ open, title, onClose, children, wide }) {
  const ref = useRef();
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`modal${wide ? ' wide' : ''}`} onClose={onClose} onClick={(e) => e.target === ref.current && ref.current.close()}>
      <div className="modal-head">
        <h3>{title}</h3>
        <button type="button" className="icon-btn" aria-label="Close" onClick={() => ref.current.close()}><Icon name="x" /></button>
      </div>
      {open && children}
    </dialog>
  );
}

// state: { title, body, label, run } | null
export function Confirm({ state, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => { setError(''); onClose(); };
  async function go() {
    setBusy(true);
    setError('');
    try {
      await state.run();
      close();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }
  return (
    <Modal open={!!state} title={state?.title} onClose={close}>
      <p className="muted">{state?.body}</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" onClick={close}>Cancel</button>
        <button type="button" className="danger" disabled={busy} onClick={go}>{state?.label}</button>
      </div>
    </Modal>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const node = (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`toast ${toast.kind}`}>
          <Icon name={toast.kind === 'error' ? 'x' : 'check'} size={16} />
          {toast.text}
        </div>
      )}
    </div>
  );
  const notify = (text, kind = 'ok') => setToast({ text, kind, id: Date.now() });
  return [notify, node];
}
