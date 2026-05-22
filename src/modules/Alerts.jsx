import { useState, useEffect } from 'react';
import { T } from '../theme';
import { Ic } from '../icons';
import { Btn, Badge, Input, Card, Tabs } from '../components/ui';

const ALERTS_KEY = 'pm_alerts';
const HISTORY_KEY = 'pm_alert_history';

const CONDITIONS = [
  { value: 'crosses_above', label: 'Crosses Above' },
  { value: 'crosses_below', label: 'Crosses Below' },
  { value: 'pct_change_above', label: '% Change >' },
  { value: 'pct_change_below', label: '% Change <' },
  { value: 'volume_above', label: 'Volume >' },
];

const DEFAULT_ALERTS = [
  { id: 'a1', symbol: 'RELIANCE', condition: 'crosses_above', value: '3000', displayCondition: 'RELIANCE > ₹3,000', isOneTime: false, active: true, status: 'watching', lastTriggered: null, created: Date.now() - 86400000 * 3 },
  { id: 'a2', symbol: 'INFY', condition: 'crosses_below', value: '1200', displayCondition: 'INFY < ₹1,200', isOneTime: false, active: true, status: 'triggered', lastTriggered: Date.now() - 3600000 * 5, created: Date.now() - 86400000 * 7 },
  { id: 'a3', symbol: 'TCS', condition: 'volume_above', value: '5000000', displayCondition: 'TCS Volume > 5M', isOneTime: true, active: false, status: 'watching', lastTriggered: null, created: Date.now() - 86400000 * 2 },
  { id: 'a4', symbol: 'NIFTY', condition: 'crosses_above', value: '25000', displayCondition: 'NIFTY crosses 25,000', isOneTime: false, active: true, status: 'watching', lastTriggered: Date.now() - 86400000, created: Date.now() - 86400000 * 14 },
];

const DEFAULT_HISTORY = [
  { id: 'h1', alertId: 'a2', symbol: 'INFY', condition: 'Crosses Below', value: '1198.50', timestamp: Date.now() - 3600000 * 5 },
  { id: 'h2', alertId: null, symbol: 'HDFCBANK', condition: '% Change <', value: '-3.2%', timestamp: Date.now() - 86400000 * 2 },
  { id: 'h3', alertId: null, symbol: 'RELIANCE', condition: 'Crosses Above', value: '2456.30', timestamp: Date.now() - 86400000 * 5 },
];

function loadAlerts() {
  try {
    const d = localStorage.getItem(ALERTS_KEY);
    if (d) { const p = JSON.parse(d); if (p?.length) return p; }
  } catch {}
  return DEFAULT_ALERTS;
}

function loadHistory() {
  try {
    const d = localStorage.getItem(HISTORY_KEY);
    if (d) { const p = JSON.parse(d); if (p?.length) return p; }
  } catch {}
  return DEFAULT_HISTORY;
}

function genId() {
  return 'a' + Date.now() + Math.random().toString(36).slice(2, 6);
}

function fmtDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const now = new Date();
  const diffH = Math.floor((now - d) / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const now = new Date();
  const diffD = Math.floor((now - d) / 86400000);
  if (diffD < 1) return 'Today';
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtCondValue(condition, value) {
  if (condition === 'volume_above') return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return value;
}

function getTypeMeta(condition, theme) {
  const map = {
    crosses_above: { label: '\u2191', color: theme.positive, desc: 'Price' },
    crosses_below: { label: '\u2193', color: theme.negative, desc: 'Price' },
    pct_change_above: { label: '%\u2191', color: theme.warning, desc: '% Change' },
    pct_change_below: { label: '%\u2193', color: theme.negative, desc: '% Change' },
    volume_above: { label: 'V', color: theme.info, desc: 'Volume' },
  };
  return map[condition] || { label: '?', color: theme.text3, desc: 'Unknown' };
}

function StatusBadge({ status, T }) {
  const isTriggered = status === 'triggered';
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
      background: isTriggered ? T.positiveBg : T.surface3,
      color: isTriggered ? T.positive : T.text3,
      border: `1px solid ${isTriggered ? T.positive : T.border2}`,
    }}>
      {isTriggered ? 'Triggered' : 'Watching'}
    </span>
  );
}

export function Alerts({ T }) {
  const [alerts, setAlerts] = useState(loadAlerts);
  const [history, setHistory] = useState(loadHistory);
  const [showForm, setShowForm] = useState(false);
  const [formSymbol, setFormSymbol] = useState('');
  const [formCondition, setFormCondition] = useState('crosses_above');
  const [formValue, setFormValue] = useState('');
  const [formOneTime, setFormOneTime] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  function resetForm() {
    setFormSymbol('');
    setFormValue('');
    setFormCondition('crosses_above');
    setFormOneTime(false);
    setShowForm(false);
  }

  function handleCreate() {
    if (!formSymbol.trim() || !formValue.trim()) return;
    const symbol = formSymbol.trim().toUpperCase();
    const cond = CONDITIONS.find(c => c.value === formCondition);
    const value = formValue.trim();
    const fv = fmtCondValue(formCondition, value);
    const displayCondition = `${symbol} ${cond.label} ${fv}`;
    const alert = {
      id: genId(), symbol, condition: formCondition, value,
      displayCondition, isOneTime: formOneTime,
      active: true, status: 'watching', lastTriggered: null, created: Date.now(),
    };
    setAlerts(prev => [alert, ...prev]);
    resetForm();
  }

  function handleToggle(id) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }

  function handleDelete(id) {
    setDeleteId(id);
  }

  function confirmDelete() {
    setAlerts(prev => prev.filter(a => a.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'auto', fontFamily: T.font }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>Alerts</span>
          <span style={{ color: T.text3, fontSize: 10 }}>{alerts.filter(a => a.active).length} active</span>
        </div>
        <Btn T={T} variant="primary" style={{ gap: 6, padding: '6px 14px', fontSize: 11 }} onClick={() => setShowForm(!showForm)}>
          <Ic.Plus /> New Alert
        </Btn>
      </div>

      {showForm && (
        <Card T={T} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ display: 'block', color: T.text3, fontSize: 10, marginBottom: 4 }}>Symbol</label>
              <Input T={T} value={formSymbol} onChange={e => setFormSymbol(e.target.value)} placeholder="e.g. RELIANCE" style={{ fontSize: 11 }} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ display: 'block', color: T.text3, fontSize: 10, marginBottom: 4 }}>Condition</label>
              <select value={formCondition} onChange={e => setFormCondition(e.target.value)} style={{
                width: '100%', padding: '7px 10px', background: T.surface3, color: T.text,
                border: `1px solid ${T.border2}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, outline: 'none',
              }}>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={{ display: 'block', color: T.text3, fontSize: 10, marginBottom: 4 }}>Value</label>
              <Input T={T} value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="e.g. 3000" style={{ fontSize: 11 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: formOneTime ? T.accent : T.text2, fontSize: 11 }}>
              <input type="checkbox" checked={formOneTime} onChange={e => setFormOneTime(e.target.checked)} style={{ accentColor: T.accent }} />
              One-time
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: !formOneTime ? T.accent : T.text2, fontSize: 11 }}>
              <input type="checkbox" checked={!formOneTime} onChange={e => setFormOneTime(!e.target.checked)} style={{ accentColor: T.accent }} />
              Repeat
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn T={T} variant="primary" style={{ padding: '6px 14px', fontSize: 11 }} onClick={handleCreate}>
              <Ic.Check /> Create Alert
            </Btn>
            <Btn T={T} style={{ padding: '6px 10px', fontSize: 11 }} onClick={resetForm}>
              <Ic.X /> Cancel
            </Btn>
          </div>
        </Card>
      )}

      {alerts.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 12 }}>
          No alerts yet. Create one to track market conditions.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 10 }}>
          {alerts.map(a => {
            const meta = getTypeMeta(a.condition, T);
            return (
              <div key={a.id} style={{
                background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}`,
                padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
                opacity: a.active ? 1 : 0.5, transition: 'opacity .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, background: meta.color + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: meta.color, fontSize: 15, fontWeight: 700, flexShrink: 0,
                    }}>
                      {meta.label}
                    </div>
                    <div>
                      <div style={{ color: T.accent, fontSize: 13, fontWeight: 700 }}>{a.symbol}</div>
                      <div style={{ color: T.text3, fontSize: 9, marginTop: 1 }}>{meta.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusBadge status={a.status} T={T} />
                    <div onClick={() => handleToggle(a.id)} style={{
                      width: 34, height: 19, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
                      background: a.active ? T.accent : T.surface3, position: 'relative',
                      transition: 'background .15s', border: `1px solid ${a.active ? T.accent : T.border2}`,
                    }}>
                      <div style={{
                        width: 13, height: 13, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 2, transition: 'left .15s',
                        left: a.active ? 18 : 2,
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{ color: T.text, fontSize: 12, fontWeight: 500, paddingLeft: 44 }}>
                  {a.displayCondition}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 44 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div>
                      <span style={{ color: T.text3, fontSize: 9 }}>Last triggered </span>
                      <span style={{ color: T.text2, fontSize: 10 }}>{fmtDateTime(a.lastTriggered)}</span>
                    </div>
                    <div>
                      <span style={{ color: T.text3, fontSize: 9 }}>Created </span>
                      <span style={{ color: T.text2, fontSize: 10 }}>{fmtDate(a.created)}</span>
                    </div>
                    {a.isOneTime && (
                      <span style={{ color: T.warning, fontSize: 9, fontWeight: 600 }}>One-time</span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    {deleteId === a.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ color: T.text3, fontSize: 9 }}>Delete?</span>
                        <button onClick={confirmDelete} style={{
                          background: T.negativeBg, border: `1px solid ${T.negative}`, color: T.negative,
                          borderRadius: 4, fontSize: 9, padding: '2px 6px', cursor: 'pointer', fontWeight: 600,
                        }}>Yes</button>
                        <button onClick={() => setDeleteId(null)} style={{
                          background: T.surface3, border: `1px solid ${T.border2}`, color: T.text2,
                          borderRadius: 4, fontSize: 9, padding: '2px 6px', cursor: 'pointer',
                        }}>No</button>
                      </div>
                    ) : (
                      <button onClick={() => handleDelete(a.id)} style={{
                        background: 'none', border: 'none', color: T.text3, cursor: 'pointer',
                        fontSize: 10, padding: '2px 6px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 3,
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = T.negative}
                        onMouseLeave={e => e.currentTarget.style.color = T.text3}
                      >
                        <Ic.X /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Card T={T} style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: T.text, fontSize: 14, fontWeight: 700 }}>Alert History</span>
          <span style={{ color: T.text3, fontSize: 10 }}>{history.length} events</span>
        </div>
        {history.length === 0 ? (
          <div style={{ color: T.text3, fontSize: 11, padding: '12px 0', textAlign: 'center' }}>
            No alerts triggered yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: T.text3, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>Time</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: T.text3, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>Symbol</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: T.text3, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>Condition</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: T.text3, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>Value at Trigger</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surface3}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '8px 10px', color: T.text2, whiteSpace: 'nowrap' }}>{fmtDateTime(h.timestamp)}</td>
                    <td style={{ padding: '8px 10px', color: T.accent, fontWeight: 600, whiteSpace: 'nowrap' }}>{h.symbol}</td>
                    <td style={{ padding: '8px 10px', color: T.text, whiteSpace: 'nowrap' }}>{h.condition}</td>
                    <td style={{ padding: '8px 10px', color: T.text, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{h.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
