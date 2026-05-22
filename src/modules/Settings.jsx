import { useState, useEffect, useRef } from 'react';
import { T } from '../theme';
import { Ic } from '../icons';
import { Btn, Input, Card } from '../components/ui';

const STORAGE_KEYS = {
  groqKey: 'pm_groq_key',
  geminiKey: 'pm_gemini_key',
  fredKey: 'pm_fred_key',
  fontSize: 'pm_font_size',
  density: 'pm_density',
  exchange: 'pm_exchange',
  currency: 'pm_currency',
  refresh: 'pm_refresh',
};

function SectionTitle({ T, children }) {
  return (
    <div style={{ color: T.text, fontSize: 13, fontWeight: 700, marginBottom: 14, letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}

function ApiKeyRow({ T, label, value, onChange, visible, onToggleVisible, onSave }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <label style={{ display: 'block', color: T.text3, fontSize: 10, marginBottom: 3 }}>{label}</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type={visible ? 'text' : 'password'}
              value={value}
              onChange={onChange}
              placeholder={`Enter ${label}`}
              style={{
                width: '100%', padding: '7px 10px', background: T.surface3, color: T.text,
                border: `1px solid ${T.border2}`, borderRadius: 6, fontSize: 11,
                fontFamily: T.font, outline: 'none', boxSizing: 'border-box', paddingRight: 32,
              }}
            />
            <button onClick={onToggleVisible} style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 2, fontSize: 11,
            }}>
              {visible ? <Ic.X /> : <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
          {value && (
            <Btn T={T} variant="primary" style={{ padding: '6px 12px', fontSize: 10, flexShrink: 0 }} onClick={onSave}>
              <Ic.Check /> Save
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

export function Settings({ T, onThemeChange }) {
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem(STORAGE_KEYS.groqKey) || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem(STORAGE_KEYS.geminiKey) || '');
  const [fredKey, setFredKey] = useState(() => localStorage.getItem(STORAGE_KEYS.fredKey) || '');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem(STORAGE_KEYS.fontSize)) || 12);
  const [density, setDensity] = useState(() => localStorage.getItem(STORAGE_KEYS.density) || 'default');
  const [exchange, setExchange] = useState(() => localStorage.getItem(STORAGE_KEYS.exchange) || 'NSE');
  const [currency, setCurrency] = useState(() => localStorage.getItem(STORAGE_KEYS.currency) || 'INR');
  const [refresh, setRefresh] = useState(() => parseInt(localStorage.getItem(STORAGE_KEYS.refresh)) || 60);
  const [showKeys, setShowKeys] = useState({ groq: false, gemini: false, fred: false });
  const [clearConfirm, setClearConfirm] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const fileRef = useRef(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.groqKey, groqKey); }, [groqKey]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.geminiKey, geminiKey); }, [geminiKey]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.fredKey, fredKey); }, [fredKey]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.fontSize, String(fontSize)); }, [fontSize]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.density, density); }, [density]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.exchange, exchange); }, [exchange]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.currency, currency); }, [currency]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.refresh, String(refresh)); }, [refresh]);

  function showSaved(label) {
    setSavedMsg(`${label} saved`);
    setTimeout(() => setSavedMsg(''), 2000);
  }

  function handleExport() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fincept-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, String(v)));
        setSavedMsg('Data imported! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        alert('Invalid file format. Please select a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleClear() {
    localStorage.clear();
    window.location.reload();
  }

  const inputStyle = { fontSize: 11, padding: '7px 10px' };
  const selectStyle = {
    padding: '7px 10px', background: T.surface3, color: T.text,
    border: `1px solid ${T.border2}`, borderRadius: 6, fontSize: 11,
    fontFamily: T.font, outline: 'none', cursor: 'pointer',
  };
  const labelStyle = { display: 'block', color: T.text3, fontSize: 10, marginBottom: 4 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'auto', fontFamily: T.font }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>Settings</span>
          <span style={{ color: T.text3, fontSize: 10, fontWeight: 400 }}>Fincept Terminal v1.0.0</span>
        </div>
        {savedMsg && (
          <span style={{ color: T.positive, fontSize: 10, fontWeight: 600 }}>{savedMsg}</span>
        )}
      </div>

      <Card T={T}>
        <SectionTitle T={T}>API Keys</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ApiKeyRow
            T={T} label="Groq API Key" value={groqKey}
            onChange={e => setGroqKey(e.target.value)}
            visible={showKeys.groq}
            onToggleVisible={() => setShowKeys(s => ({ ...s, groq: !s.groq }))}
            onSave={() => showSaved('Groq key')}
          />
          <ApiKeyRow
            T={T} label="Gemini API Key" value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            visible={showKeys.gemini}
            onToggleVisible={() => setShowKeys(s => ({ ...s, gemini: !s.gemini }))}
            onSave={() => showSaved('Gemini key')}
          />
          <ApiKeyRow
            T={T} label="FRED API Key" value={fredKey}
            onChange={e => setFredKey(e.target.value)}
            visible={showKeys.fred}
            onToggleVisible={() => setShowKeys(s => ({ ...s, fred: !s.fred }))}
            onSave={() => showSaved('FRED key')}
          />
        </div>
      </Card>

      <Card T={T}>
        <SectionTitle T={T}>Appearance</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Font Size: {fontSize}px</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: T.text3, fontSize: 10 }}>11</span>
              <input type="range" min={11} max={16} value={fontSize}
                onChange={e => setFontSize(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: T.accent, height: 4, cursor: 'pointer' }}
              />
              <span style={{ color: T.text3, fontSize: 10 }}>16</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Theme</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select disabled style={{ ...selectStyle, opacity: 0.5, cursor: 'not-allowed' }}>
                <option>Obsidian Dark</option>
              </select>
              <span style={{ color: T.text3, fontSize: 9 }}>More themes coming soon</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Layout Density</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Compact', 'Default', 'Comfortable'].map(d => (
                <label key={d} onClick={() => setDensity(d.toLowerCase())} style={{
                  padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500,
                  background: density === d.toLowerCase() ? T.accentBg : T.surface3,
                  color: density === d.toLowerCase() ? T.accent : T.text2,
                  border: `1px solid ${density === d.toLowerCase() ? T.accent : T.border2}`,
                  transition: 'all .1s',
                }}>
                  <input type="radio" name="density" checked={density === d.toLowerCase()}
                    onChange={() => setDensity(d.toLowerCase())}
                    style={{ display: 'none' }}
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card T={T}>
        <SectionTitle T={T}>Market Defaults</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Default Exchange</label>
            <select value={exchange} onChange={e => setExchange(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={labelStyle}>Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Portfolio Refresh Interval</label>
            <select value={refresh} onChange={e => setRefresh(parseInt(e.target.value))} style={{ ...selectStyle, width: '100%' }}>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>
        </div>
      </Card>

      <Card T={T}>
        <SectionTitle T={T}>Data Management</SectionTitle>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn T={T} variant="primary" style={{ gap: 6, padding: '6px 14px', fontSize: 11 }} onClick={handleExport}>
            <Ic.Download /> Export All Data
          </Btn>
          <div style={{ position: 'relative' }}>
            <Btn T={T} style={{ gap: 6, padding: '6px 14px', fontSize: 11 }} onClick={() => fileRef.current?.click()}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import Data
            </Btn>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </div>
          {clearConfirm ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 10px', background: T.negativeBg, borderRadius: 6, border: `1px solid ${T.negative}` }}>
              <span style={{ color: T.negative, fontSize: 10, fontWeight: 600 }}>Clear all data?</span>
              <button onClick={handleClear} style={{
                background: T.negative, border: 'none', color: '#fff', borderRadius: 4,
                padding: '4px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}>Yes, Clear</button>
              <button onClick={() => setClearConfirm(false)} style={{
                background: T.surface3, border: `1px solid ${T.border2}`, color: T.text2,
                borderRadius: 4, padding: '4px 10px', fontSize: 10, cursor: 'pointer',
              }}>Cancel</button>
            </div>
          ) : (
            <Btn T={T} style={{ gap: 6, padding: '6px 14px', fontSize: 11, color: T.negative }} onClick={() => setClearConfirm(true)}>
              <Ic.X /> Clear All Data
            </Btn>
          )}
        </div>
      </Card>

      <Card T={T}>
        <SectionTitle T={T}>About</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: T.accentBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.accent, fontSize: 16, fontWeight: 700,
            }}>F</div>
            <div>
              <div style={{ color: T.text, fontSize: 14, fontWeight: 700 }}>Fincept Terminal</div>
              <div style={{ color: T.text3, fontSize: 10 }}>Version 1.0.0</div>
            </div>
          </div>
          <p style={{ color: T.text2, fontSize: 11, lineHeight: 1.5, margin: 0 }}>
            A professional-grade financial data terminal for Indian and US markets.
            Track equities, indices, forex, and commodities with real-time data,
            advanced charting, AI-powered insights, and portfolio management.
          </p>
          <div>
            <div style={{ color: T.text3, fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Data Sources</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['Yahoo Finance', 'FRED Economic Data', 'Alpha Vantage', 'NSE India', 'BSE India', 'Twelvedata', 'Polygon.io'].map(s => (
                <span key={s} style={{
                  padding: '2px 8px', background: T.surface3, borderRadius: 4,
                  color: T.text2, fontSize: 9, border: `1px solid ${T.border2}`,
                }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
