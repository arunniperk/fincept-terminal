import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ic } from '../icons';
import { Btn, Input, Card } from '../components/ui';
import { PERSONAS, PERSONA_LIST, DEFAULT_PERSONA, getPersonaPrompt } from '../data/personas';

const QUICK_ACTIONS = ['Analyze Market', 'Best Opportunity', 'Portfolio Review'];

function generateMockResponse(personaId, userMessage) {
  const p = PERSONAS[personaId] || PERSONAS[DEFAULT_PERSONA];
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'SBIN', 'WIPRO', 'ITC', 'LT'];
  const symbol = userMessage.match(/\b[A-Z]{2,10}\b/g)?.[0] || symbols[Math.floor(Math.random() * symbols.length)];
  const sentiments = ['Bullish', 'Neutral', 'Bearish'];
  const convic = ['Strong', 'Moderate', 'Low'];
  const horizons = ['Short-term', 'Medium-term', 'Long-term'];
  const basePrice = 500 + Math.random() * 5000;
  const fv = basePrice * (0.8 + Math.random() * 0.6);
  const upside = ((fv - basePrice) / basePrice * 100);

  return {
    overview: `Analysing ${symbol} through the lens of ${p.title.toLowerCase()}. ${p.desc}. The current setup presents a compelling case based on core principles.`,
    sentiment: sentiments[Math.floor(Math.random() * 3)],
    conviction: convic[Math.floor(Math.random() * 3)],
    fairValue: Math.round(fv * 100) / 100,
    upside: Math.round(upside * 10) / 10,
    keyInsight: `The key factor driving ${symbol} is its ability to generate sustainable value over time, consistent with ${p.name}'s approach.`,
    opportunities: [
      `${symbol} shows strong alignment with ${p.name}'s investment criteria`,
      'Current valuation provides a reasonable entry point for disciplined investors',
      'Market sentiment appears overly pessimistic relative to underlying fundamentals'
    ],
    risks: [
      'Macroeconomic headwinds could pressure near-term performance',
      'Competitive dynamics in the sector remain intense',
      'Regulatory changes may impact business model assumptions'
    ],
    positionComment: upside > 0
      ? `Your position in ${symbol} appears well-aligned with the analysis — the current setup favours holding or adding.`
      : `Given the current valuation, consider reviewing your position size in ${symbol}.`,
    timeHorizon: horizons[Math.floor(Math.random() * 3)],
    disclaimer: 'Not financial advice.'
  };
}

function SentimentBadge({ sentiment, T }) {
  const colors = {
    Bullish: { bg: T.positiveBg, text: T.positive, label: 'Bullish ▲' },
    Neutral: { bg: T.warningBg, text: T.warning, label: 'Neutral ◆' },
    Bearish: { bg: T.negativeBg, text: T.negative, label: 'Bearish ▼' }
  };
  const c = colors[sentiment] || colors.Neutral;
  return (
    <span style={{
      background: c.bg, color: c.text, padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5, border: `1px solid ${c.text}33`
    }}>{c.label}</span>
  );
}

function ConvictionDot({ level, T }) {
  const colors = { Strong: T.positive, Moderate: T.warning, Low: T.text3 };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.text3 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[level] || T.text3, display: 'inline-block' }} />
      {level}
    </span>
  );
}

function PersonaIcon({ icon, size = 24 }) {
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
}

function AiResponseCard({ analysis, T }) {
  const sectionTitle = (label) => (
    <div style={{ color: T.text3, fontSize: 9, fontWeight: 600, letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ color: T.text, fontSize: 12, lineHeight: 1.6, fontStyle: 'italic' }}>"{analysis.overview}"</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <SentimentBadge sentiment={analysis.sentiment} T={T} />
        <ConvictionDot level={analysis.conviction} T={T} />
        {analysis.timeHorizon && (
          <span style={{ fontSize: 10, color: T.info, background: T.infoBg, padding: '2px 8px', borderRadius: 4, border: `1px solid ${T.info}33` }}>
            {analysis.timeHorizon}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {analysis.fairValue && (
          <div style={{ background: T.surface3, borderRadius: 6, padding: '8px 10px' }}>
            {sectionTitle('Fair Value')}
            <span style={{ color: T.text, fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {analysis.fairValue > 100 ? `${analysis.fairValue.toLocaleString()}` : analysis.fairValue.toFixed(2)}
            </span>
          </div>
        )}
        {analysis.upside !== null && analysis.upside !== undefined && (
          <div style={{ background: T.surface3, borderRadius: 6, padding: '8px 10px' }}>
            {sectionTitle('Upside')}
            <span style={{
              color: analysis.upside >= 0 ? T.positive : T.negative,
              fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums'
            }}>
              {analysis.upside >= 0 ? '+' : ''}{analysis.upside}%
            </span>
          </div>
        )}
        <div style={{ background: T.surface3, borderRadius: 6, padding: '8px 10px' }}>
          {sectionTitle('Key Insight')}
          <span style={{ color: T.text2, fontSize: 10, lineHeight: 1.4, display: 'block' }}>{analysis.keyInsight}</span>
        </div>
      </div>

      {analysis.opportunities?.length > 0 && (
        <div>
          {sectionTitle('Opportunities')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {analysis.opportunities.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11, color: T.text2, lineHeight: 1.4 }}>
                <span style={{ color: T.positive, flexShrink: 0 }}>+</span>
                <span>{o}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.risks?.length > 0 && (
        <div>
          {sectionTitle('Risks')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {analysis.risks.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11, color: T.text2, lineHeight: 1.4 }}>
                <span style={{ color: T.negative, flexShrink: 0 }}>—</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.positionComment && (
        <div style={{ borderLeft: `2px solid ${T.accent}33`, paddingLeft: 10, fontSize: 11, color: T.text2, lineHeight: 1.5 }}>
          {analysis.positionComment}
        </div>
      )}

      <div style={{ fontSize: 9, color: T.text3, fontStyle: 'italic', borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
        {analysis.disclaimer || 'Not financial advice.'}
      </div>
    </div>
  );
}

function ApiKeyModal({ isOpen, onClose, keys, onSave, T }) {
  const [groq, setGroq] = useState(keys.groq || '');
  const [gemini, setGemini] = useState(keys.gemini || '');

  useEffect(() => { setGroq(keys.groq || ''); setGemini(keys.gemini || ''); }, [keys]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ groq, gemini });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: T.surface2, border: `1px solid ${T.border}`, borderRadius: T.r,
        padding: 24, width: 400, maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: 16
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.text, fontSize: 14, fontWeight: 700 }}>API Configuration</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 4 }}>
            <Ic.X />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: T.text3, fontSize: 10, fontWeight: 600 }}>GROQ API KEY</span>
          <Input T={T} value={groq} onChange={e => setGroq(e.target.value)} placeholder="gsk_..." style={{ fontSize: 11 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: T.text3, fontSize: 10, fontWeight: 600 }}>GEMINI API KEY</span>
          <Input T={T} value={gemini} onChange={e => setGemini(e.target.value)} placeholder="AIza..." style={{ fontSize: 11 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} variant="primary" onClick={handleSave}>Save Keys</Btn>
        </div>
      </div>
    </div>
  );
}

export function AIAgentChat({ T }) {
  const [selectedPersona, setSelectedPersona] = useState(DEFAULT_PERSONA);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeys, setApiKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fincept_api_keys') || '{}'); }
    catch { return {}; }
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    localStorage.setItem('fincept_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const hasLiveKey = !!(apiKeys.groq || apiKeys.gemini);

  const handleSelectPersona = (id) => {
    setSelectedPersona(id);
  };

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), timestamp: new Date().toISOString(), ...msg }]);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    addMessage({ role: 'user', content: text });

    setTimeout(() => {
      const analysis = generateMockResponse(selectedPersona, text);
      addMessage({ role: 'ai', content: analysis, personaId: selectedPersona });
    }, 600 + Math.random() * 400);
  };

  const handleQuickAction = (action) => {
    setInput(action);
    setTimeout(() => handleSend(), 50);
  };

  const handleClear = () => {
    setMessages([]);
  };

  const filteredPersonas = PERSONA_LIST.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const currentPersona = PERSONAS[selectedPersona] || PERSONAS[DEFAULT_PERSONA];

  const s = {
    container: {
      display: 'flex', height: '100%', fontFamily: T.font,
      background: T.bg, overflow: 'hidden'
    },
    sidebar: {
      width: 280, flexShrink: 0, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', background: T.surface
    },
    sidebarHeader: {
      padding: '14px 14px 10px', borderBottom: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', gap: 8
    },
    sidebarTitle: {
      color: T.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.8
    },
    personaList: {
      flex: 1, overflow: 'auto', padding: '6px 0'
    },
    personaCard: (isSelected) => ({
      padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
      borderLeft: `3px solid ${isSelected ? T.accent : 'transparent'}`,
      background: isSelected ? T.accentBg : 'transparent',
      transition: 'all .1s'
    }),
    mainArea: {
      flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0
    },
    topBar: {
      padding: '12px 18px', borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 10, background: T.surface
    },
    messagesArea: {
      flex: 1, overflow: 'auto', padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 14
    },
    inputBar: {
      borderTop: `1px solid ${T.border}`, padding: '12px 18px',
      background: T.surface, display: 'flex', flexDirection: 'column', gap: 8
    }
  };

  return (
    <div style={s.container}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <span style={s.sidebarTitle}>INVESTOR PERSONAS ({PERSONA_LIST.length})</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: T.text3, display: 'flex' }}>
              <Ic.Search />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search personas..."
              style={{
                width: '100%', padding: '7px 10px 7px 30px', background: T.surface3,
                border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text,
                fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: T.font
              }}
            />
          </div>
        </div>
        <div style={s.personaList}>
          {filteredPersonas.map(p => (
            <div
              key={p.id}
              style={s.personaCard(selectedPersona === p.id)}
              onClick={() => handleSelectPersona(p.id)}
              onMouseEnter={e => { if (selectedPersona !== p.id) e.currentTarget.style.background = T.surface2; }}
              onMouseLeave={e => { if (selectedPersona !== p.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <PersonaIcon icon={p.icon} size={20} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: selectedPersona === p.id ? T.accent : T.text, fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ color: T.text3, fontSize: 9, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <div style={{ color: T.text3, fontSize: 8, marginTop: 2, opacity: 0.7, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={s.mainArea}>
        {/* Top Bar */}
        <div style={s.topBar}>
          <PersonaIcon icon={currentPersona.icon} size={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>{currentPersona.name}</span>
              {hasLiveKey && (
                <span style={{
                  background: T.positiveBg, color: T.positive, fontSize: 9, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 3, border: `1px solid ${T.positive}44`
                }}>LIVE</span>
              )}
            </div>
            <span style={{ color: T.text3, fontSize: 10 }}>{currentPersona.title}</span>
          </div>
          <button
            onClick={() => setShowApiModal(true)}
            style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex' }}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surface3; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'none'; }}
            title="Configure API Keys"
          >
            <Ic.Settings />
          </button>
        </div>

        {/* Messages */}
        <div style={s.messagesArea}>
          {messages.length === 0 && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 12, color: T.text3, padding: 40
            }}>
              <PersonaIcon icon={currentPersona.icon} size={48} />
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ color: T.text2, fontSize: 13, fontWeight: 600 }}>Start a conversation with {currentPersona.name}</span>
                <span style={{ fontSize: 11, color: T.text3 }}>Ask about a stock, market analysis, or portfolio advice</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {QUICK_ACTIONS.map(a => (
                  <button
                    key={a}
                    onClick={() => handleQuickAction(a)}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.border2}`,
                      background: T.surface3, color: T.text2, cursor: 'pointer',
                      fontSize: 10, fontWeight: 500, transition: 'all .1s', fontFamily: T.font
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text2; }}
                  >{a}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              {msg.role === 'ai' && (
                <div style={{ flexShrink: 0, marginRight: 8, marginTop: 4 }}>
                  <PersonaIcon icon={PERSONAS[msg.personaId]?.icon || currentPersona.icon} size={18} />
                </div>
              )}
              <div style={{
                background: msg.role === 'user' ? T.accentBg : T.surface2,
                border: `1px solid ${msg.role === 'user' ? T.accent + '44' : T.border}`,
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                padding: '10px 14px',
                color: msg.role === 'user' ? T.text : T.text,
                fontSize: 12,
                lineHeight: 1.5,
                minWidth: msg.role === 'user' ? 'auto' : 200,
              }}>
                {msg.role === 'user' ? (
                  <span style={{ color: T.accent }}>{msg.content}</span>
                ) : (
                  <AiResponseCard analysis={msg.content} T={T} />
                )}
                <div style={{ fontSize: 9, color: T.text3, marginTop: 6, opacity: 0.5 }}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={s.inputBar}>
          {messages.length > 0 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a}
                  onClick={() => handleQuickAction(a)}
                  style={{
                    padding: '4px 10px', borderRadius: 4, border: `1px solid ${T.border2}`,
                    background: T.surface3, color: T.text3, cursor: 'pointer',
                    fontSize: 9, fontWeight: 500, transition: 'all .1s', fontFamily: T.font
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text3; }}
                >{a}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Ask ${currentPersona.name} about a stock...`}
              style={{
                flex: 1, padding: '9px 12px', background: T.surface3,
                border: `1px solid ${T.border2}`, borderRadius: 8, color: T.text,
                fontSize: 12, outline: 'none', fontFamily: T.font
              }}
            />
            <Btn T={T} variant="primary" onClick={handleSend} style={{ padding: '9px 16px', fontSize: 11 }}>
              Send
            </Btn>
            <Btn T={T} onClick={handleClear} style={{ padding: '9px 12px', fontSize: 11 }}>
              Clear
            </Btn>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        keys={apiKeys}
        onSave={setApiKeys}
        T={T}
      />
    </div>
  );
}
