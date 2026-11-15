export const getSession = () => JSON.parse(localStorage.getItem('session') || 'null');
export const setSession = (s) =>
  s ? localStorage.setItem('session', JSON.stringify(s)) : localStorage.removeItem('session');

export async function api(method, path, body) {
  const s = getSession();
  const r = await fetch('/api' + path, {
    method,
    headers: { 'content-type': 'application/json', ...(s && { authorization: `Bearer ${s.token}` }) },
    body: body && JSON.stringify(body),
  });
  if (r.status === 401 && s) {
    setSession(null);
    location.reload();
  }
  const data = r.status === 204 ? null : await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `request failed (${r.status})`);
  return data;
}

// all times are WIB (UTC+7, no DST): datetime-local input is read/written as WIB
const TZ = 'Asia/Jakarta';
export const toIso = (local) => new Date(`${local}:00+07:00`).toISOString();
export const toLocalInput = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 16);
export const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }) + ' WIB';
export const photo = (m) => m.photo || '/avatars/default.svg';
