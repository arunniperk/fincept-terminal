import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ic } from '../icons';
import { Btn, Input, Card } from '../components/ui';
import { BROKERS, parseBrokerCsv, encryptCreds, decryptCreds } from '../data/brokers';

const STORAGE_KEY = 'pm_broker_connections';
const HISTORY_KEY = 'pm_broker_imports';

function loadConnections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const decrypted = {};
      Object.keys(parsed).forEach(id => {
        const c = parsed[id];
        const creds = {};
        if (c.creds) {
          Object.keys(c.creds).forEach(k => { creds[k] = decryptCreds(c.creds[k]); });
        }
        decrypted[id] = { ...c, creds };
      });
      return decrypted;
    }
  } catch {}
  return {};
}

function saveConnections(connections) {
  const toSave = {};
  Object.keys(connections).forEach(id => {
    const c = connections[id];
    const creds = {};
    if (c.creds) {
      Object.keys(c.creds).forEach(k => { creds[k] = encryptCreds(c.creds[k]); });
    }
    toSave[id] = { ...c, creds };
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch {}
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

export function Brokers({ T }) {
  const [connections, setConnections] = useState(loadConnections);
  const [showForm, setShowForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [csvPreview, setCsvPreview] = useState(null);
  const [importHistory, setImportHistory] = useState(loadHistory);
  const [csvLoading, setCsvLoading] = useState(false);
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => { saveConnections(connections); }, [connections]);
  useEffect(() => { saveHistory(importHistory); }, [importHistory]);

  const openForm = useCallback((broker) => {
    const existing = connections[broker.id];
    setFormData(existing?.creds ? { ...existing.creds } : {});
    setShowForm(broker.id);
  }, [connections]);

  const closeForm = useCallback(() => {
    setShowForm(null);
    setFormData({});
  }, []);

  const handleFieldChange = useCallback((key, val) => {
    setFormData(p => ({ ...p, [key]: val }));
  }, []);

  const handleSave = useCallback((brokerId) => {
    setSaving(brokerId);
    const allFilled = BROKERS.find(b => b.id === brokerId).fields.every(f => formData[f.key]?.trim());
    if (!allFilled) { setSaving(null); return; }
    setConnections(p => ({
      ...p,
      [brokerId]: { creds: { ...formData }, lastSync: new Date().toISOString() },
    }));
    setTimeout(() => { setSaving(null); closeForm(); }, 400);
  }, [formData, closeForm]);

  const handleDisconnect = useCallback((brokerId) => {
    setConnections(p => {
      const next = { ...p };
      delete next[brokerId];
      return next;
    });
  }, []);

  const handleCsvClick = useCallback((brokerId) => {
    fileRef.current.brokerId = brokerId;
    fileRef.current.value = '';
    fileRef.current.click();
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    const brokerId = e.target.brokerId;
    if (!file || !brokerId) return;
    setCsvLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const holdings = parseBrokerCsv(text, brokerId);
        const broker = BROKERS.find(b => b.id === brokerId);
        setCsvPreview({ brokerId, brokerName: broker?.name || brokerId, holdings, fileName: file.name });
      } catch (err) {
        setCsvPreview({ error: 'Failed to parse CSV: ' + err.message });
      }
      setCsvLoading(false);
    };
    reader.onerror = () => { setCsvLoading(false); setCsvPreview({ error: 'Failed to read file' }); };
    reader.readAsText(file);
  }, []);

  const handleImportCsv = useCallback(() => {
    if (!csvPreview || csvPreview.error || csvPreview.holdings.length === 0) return;
    setImportHistory(h => [
      { brokerId: csvPreview.brokerId, brokerName: csvPreview.brokerName, date: new Date().toISOString(), count: csvPreview.holdings.length },
      ...h,
    ].slice(0, 5));
    setConnections(p => ({
      ...p,
      [csvPreview.brokerId]: {
        ...(p[csvPreview.brokerId] || {}),
        creds: p[csvPreview.brokerId]?.creds || {},
        lastSync: new Date().toISOString(),
      },
    }));
    setCsvPreview(null);
  }, [csvPreview]);

  const closePreview = useCallback(() => setCsvPreview(null), []);

  const brokerColor = (broker) => broker.color || T.accent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'auto', fontFamily: T.font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Ic.Broker />
        <div>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>Broker Integration</span>
          <div style={{ color: T.text3, fontSize: 10, marginTop: 2 }}>Connect Indian brokers to auto-sync your holdings</div>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10,
      }}>
        {BROKERS.map(broker => {
          const connected = connections[broker.id];
          const hasApi = !!broker.apiBase;
          const hasCsv = !!broker.csvFormat;
          return (
            <div key={broker.id} style={{
              background: T.surface2, borderRadius: T.r, border: `1px solid ${connected ? broker.color + '40' : T.border}`,
              padding: 16, display: 'flex', flexDirection: 'column', gap: 12, transition: 'border .2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: brokerColor(broker) + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: brokerColor(broker), fontSize: 14, fontWeight: 700, flexShrink: 0,
                }}>{broker.logo || broker.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{broker.name}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                    {connected ? (
                      <span style={{
                        fontSize: 9, padding: '1px 7px', borderRadius: 4,
                        background: T.positiveBg, color: T.positive, fontWeight: 700, letterSpacing: 0.3,
                      }}>Connected</span>
                    ) : (
                      <span style={{
                        fontSize: 9, padding: '1px 7px', borderRadius: 4,
                        background: T.surface4, color: T.text3, fontWeight: 500,
                      }}>Not Connected</span>
                    )}
                  </div>
                </div>
              </div>

              {broker.note && (
                <div style={{ fontSize: 9, color: T.warning, lineHeight: 1.4, padding: '6px 8px', background: T.warningBg, borderRadius: 4 }}>
                  {broker.note}
                </div>
              )}

              {connected && connected.lastSync && (
                <div style={{ fontSize: 9, color: T.text3 }}>
                  Last sync: {new Date(connected.lastSync).toLocaleString('en-IN', { hour12: false })}
                </div>
              )}

              {showForm === broker.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, background: T.surface3, borderRadius: 6, border: `1px solid ${T.border}` }}>
                  <span style={{ color: T.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>{broker.name} API Credentials</span>
                  {broker.fields.map(f => (
                    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <label style={{ color: T.text3, fontSize: 9, fontWeight: 500 }}>{f.label}</label>
                      <Input
                        T={T}
                        type={f.type || 'text'}
                        placeholder={f.placeholder || ''}
                        value={formData[f.key] || ''}
                        onChange={e => handleFieldChange(f.key, e.target.value)}
                        style={{ fontSize: 10, padding: '5px 8px' }}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <Btn T={T} variant="primary" style={{ flex: 1, padding: '6px 10px', fontSize: 10, justifyContent: 'center' }}
                      onClick={() => handleSave(broker.id)} disabled={saving === broker.id}>
                      {saving === broker.id ? 'Saving...' : 'Save'}
                    </Btn>
                    <Btn T={T} style={{ padding: '6px 10px', fontSize: 10 }} onClick={closeForm}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  {hasApi && (
                    <Btn T={T} style={{ flex: 1, padding: '6px 10px', fontSize: 10, justifyContent: 'center' }} onClick={() => openForm(broker)}>
                      {connected ? 'Update Keys' : 'Add Keys'}
                    </Btn>
                  )}
                  {hasCsv && (
                    <Btn T={T} style={{ flex: 1, padding: '6px 10px', fontSize: 10, justifyContent: 'center' }} onClick={() => handleCsvClick(broker.id)}>
                      Import CSV
                    </Btn>
                  )}
                  {connected && (
                    <Btn T={T} style={{ padding: '6px 8px', fontSize: 10, color: T.negative, borderColor: T.negative + '40' }}
                      onClick={() => handleDisconnect(broker.id)}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.negative; e.currentTarget.style.color = T.negative; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.negative + '40'; e.currentTarget.style.color = T.negative; }}>
                      <Ic.X />
                    </Btn>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileSelect} />

      {csvPreview && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={closePreview}>
          <div style={{
            background: T.surface, borderRadius: T.r, border: `1px solid ${T.border}`,
            padding: 20, maxWidth: 600, width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            {csvPreview.error ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: 20 }}>
                <span style={{ color: T.negative, fontSize: 13, fontWeight: 700 }}>CSV Import Error</span>
                <span style={{ color: T.text2, fontSize: 11 }}>{csvPreview.error}</span>
                <Btn T={T} style={{ fontSize: 10 }} onClick={closePreview}>Close</Btn>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <span style={{ color: T.text, fontSize: 14, fontWeight: 700 }}>CSV Preview</span>
                    <div style={{ color: T.text3, fontSize: 10, marginTop: 2 }}>
                      {csvPreview.brokerName} — {csvPreview.fileName} — {csvPreview.holdings.length} holdings found
                    </div>
                  </div>
                  <Btn T={T} style={{ padding: '4px 8px', fontSize: 10 }} onClick={closePreview}><Ic.X /></Btn>
                </div>
                <div style={{ overflow: 'auto', flex: 1, border: `1px solid ${T.border}`, borderRadius: T.r }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: T.text3, fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>Symbol</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: T.text3, fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>Qty</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', color: T.text3, fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>Buy Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.holdings.map((h, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '7px 10px', color: T.accent, fontWeight: 600 }}>{h.symbol}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: T.text, fontVariantNumeric: 'tabular-nums' }}>{h.qty}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: T.text, fontVariantNumeric: 'tabular-nums' }}>
                            {h.buyPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                  <Btn T={T} style={{ fontSize: 10 }} onClick={closePreview}>Cancel</Btn>
                  <Btn T={T} variant="primary" style={{ fontSize: 10, gap: 6 }} onClick={handleImportCsv}>
                    <Ic.Check /> Import Holdings ({csvPreview.holdings.length})
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Card T={T} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12 }}>
        <span style={{ color: T.info, fontSize: 14, flexShrink: 0, lineHeight: 1 }}>\u26A0\uFE0F</span>
        <div style={{ fontSize: 10, color: T.text2, lineHeight: 1.5 }}>
          <strong style={{ color: T.text }}>Security Note:</strong> Your API credentials are encrypted before storage and never shared.
          All data syncs happen locally in your browser. For brokers without API support, use the CSV import option.
        </div>
      </Card>

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <span style={{ color: T.text2, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>IMPORT HISTORY</span>
        {importHistory.length === 0 ? (
          <span style={{ color: T.text3, fontSize: 10 }}>No imports yet</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {importHistory.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                background: i % 2 === 0 ? 'transparent' : T.surface3 + '40',
                borderRadius: 4,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 5,
                  background: (BROKERS.find(b => b.id === h.brokerId)?.color || T.accent) + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: BROKERS.find(b => b.id === h.brokerId)?.color || T.accent,
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>{BROKERS.find(b => b.id === h.brokerId)?.logo || '?'}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: T.text, fontSize: 11, fontWeight: 600 }}>{h.brokerName}</span>
                  <span style={{ color: T.text3, fontSize: 9, marginLeft: 6 }}>{h.count} holdings</span>
                </div>
                <span style={{ color: T.text3, fontSize: 9, fontVariantNumeric: 'tabular-nums' }}>
                  {new Date(h.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
