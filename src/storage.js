export function getItem(key, def = null) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
export function setItem(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
