import { useState, useEffect, useRef, useCallback } from 'react';
import { Ic } from '../icons';
import { Btn } from '../components/ui';

const NOTES_KEY = 'pm_notes';

const DEFAULT_NOTES = [
  {
    id: 'n1',
    title: 'Earnings Insights',
    body: 'Q2 earnings season highlights:\n\n- TCS beat estimates by 3%\n- Reliance margins improved 120bps\n- HDFC Bank NII grew 15% YoY\n- IT sector showing strong deal pipeline\n\nWatch for commentary on AI adoption in Q3 calls.',
    updated: Date.now() - 3600000 * 2,
  },
  {
    id: 'n2',
    title: 'Market Observations',
    body: 'Nifty volatility expected this week due to:\n- FII outflows continuing\n- Crude above $80\n- US Fed minutes due Wednesday\n\nKey levels:\nSupport: 25,200\nResistance: 25,800\n\nSector rotation visible from IT to Pharma.',
    updated: Date.now() - 3600000 * 24,
  },
  {
    id: 'n3',
    title: 'IPO Tracker',
    body: 'Upcoming IPOs to watch:\n\nCompany: Swiggy\nPrice band: ₹350-380\nDate: Nov 6-8\n\nCompany: NTPC Green\nPrice band: ₹100-110\nDate: Nov 12-14\n\nCompany: ACME Solar\nPrice band: ₹270-285\nDate: Nov 18-20',
    updated: Date.now() - 3600000 * 48,
  },
];

function loadNotes() {
  try {
    const d = localStorage.getItem(NOTES_KEY);
    if (d) { const p = JSON.parse(d); if (p?.length) return p; }
  } catch {}
  return DEFAULT_NOTES;
}

function fmtDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffH = Math.floor((now - d) / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function genId() {
  return 'n' + Date.now() + Math.random().toString(36).slice(2, 6);
}

export function Notes({ T }) {
  const [notes, setNotes] = useState(loadNotes);
  const [activeId, setActiveId] = useState(notes[0]?.id || null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [hoverId, setHoverId] = useState(null);
  const saveTimer = useRef(null);

  const active = notes.find(n => n.id === activeId) || null;

  useEffect(() => {
    if (active) {
      setDraftTitle(active.title);
      setDraftBody(active.body);
    } else {
      setDraftTitle('');
      setDraftBody('');
    }
  }, [activeId]);

  const debouncedSave = useCallback((id, title, body) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setNotes(prev => {
        const next = prev.map(n => {
          if (n.id !== id) return n;
          return { ...n, title, body, updated: Date.now() };
        });
        localStorage.setItem(NOTES_KEY, JSON.stringify(next));
        return next;
      });
    }, 300);
  }, []);

  function handleTitleChange(val) {
    setDraftTitle(val);
    if (activeId) debouncedSave(activeId, val, draftBody);
  }

  function handleBodyChange(val) {
    setDraftBody(val);
    if (activeId) debouncedSave(activeId, draftTitle, val);
  }

  function handleNew() {
    const id = genId();
    const now = Date.now();
    const note = { id, title: 'Untitled Note', body: '', updated: now };
    setNotes(prev => {
      const next = [note, ...prev];
      localStorage.setItem(NOTES_KEY, JSON.stringify(next));
      return next;
    });
    setActiveId(id);
  }

  function handleDelete(id, e) {
    e.stopPropagation();
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      localStorage.setItem(NOTES_KEY, JSON.stringify(next));
      return next;
    });
    if (activeId === id) {
      setActiveId(notes.length > 1 ? (notes[0]?.id === id ? (notes[1]?.id || null) : notes[0]?.id) : null);
    }
  }

  function getPreview(body) {
    if (!body) return 'Empty note';
    const clean = body.replace(/\n/g, ' ');
    return clean.length > 80 ? clean.slice(0, 80) + '...' : clean;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'hidden', fontFamily: T.font }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>Notes</span>
        </div>
        <Btn T={T} variant="primary" style={{ gap: 6, padding: '6px 14px', fontSize: 11 }} onClick={handleNew}>
          <Ic.Plus /> New Note
        </Btn>
      </div>

      <div style={{ display: 'flex', gap: 14, flex: 1, overflow: 'hidden' }}>

        <div style={{
          width: 260, minWidth: 260, background: T.surface2, borderRadius: T.r,
          border: `1px solid ${T.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '8px 12px', borderBottom: `1px solid ${T.border}`,
            color: T.text3, fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
          }}>
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {notes.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: T.text3, fontSize: 11 }}>
                No notes yet. Create one.
              </div>
            ) : (
              notes.map(n => {
                const isActive = n.id === activeId;
                const firstLine = n.title;
                return (
                  <div key={n.id} onClick={() => setActiveId(n.id)}
                    onMouseEnter={() => setHoverId(n.id)}
                    onMouseLeave={() => setHoverId(null)}
                    style={{
                      padding: '12px 14px', cursor: 'pointer', transition: 'background .1s',
                      borderBottom: `1px solid ${T.border}`,
                      background: isActive ? T.accentBg : 'transparent',
                      borderLeft: isActive ? `3px solid ${T.accent}` : '3px solid transparent',
                      position: 'relative',
                    }}
                    onMouseOver={e => { if (!isActive) e.currentTarget.style.background = T.surface3; }}
                    onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {hoverId === n.id && (
                      <button onClick={(e) => handleDelete(n.id, e)} style={{
                        position: 'absolute', top: 6, right: 8,
                        background: T.negativeBg, border: `1px solid ${T.negative}`,
                        color: T.negative, borderRadius: 3, cursor: 'pointer',
                        padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, lineHeight: 1,
                      }}>
                        <Ic.X />
                      </button>
                    )}
                    <span style={{
                      color: T.text, fontSize: 11, fontWeight: 600, lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      marginBottom: 3, paddingRight: hoverId === n.id ? 18 : 0,
                    }}>
                      {firstLine}
                    </span>
                    <span style={{ color: T.text3, fontSize: 9, display: 'block', marginBottom: 4 }}>
                      {fmtDate(n.updated)}
                    </span>
                    <span style={{
                      color: T.text2, fontSize: 10, lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {getPreview(n.body)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{
          flex: 1, background: T.surface2, borderRadius: T.r,
          border: `1px solid ${T.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {!active ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 12 }}>
              No notes yet. Create one.
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  value={draftTitle}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Note title..."
                  style={{
                    flex: 1, background: 'none', border: 'none', color: T.text, fontSize: 16,
                    fontWeight: 700, fontFamily: T.font, outline: 'none', padding: 0,
                  }}
                />
                <span style={{ color: T.text3, fontSize: 10, whiteSpace: 'nowrap' }}>
                  {fmtDate(active.updated)}
                </span>
              </div>
              <textarea
                value={draftBody}
                onChange={e => handleBodyChange(e.target.value)}
                placeholder="Start writing..."
                style={{
                  flex: 1, width: '100%', background: T.surface, border: 'none', color: T.text2,
                  fontSize: 12, fontFamily: T.font, lineHeight: 1.6, padding: '14px 16px',
                  resize: 'none', outline: 'none',
                }}
              />
            </>
          )}
        </div>

      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
