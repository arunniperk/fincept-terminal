import React from 'react';

export function Btn({ children, onClick, variant, disabled, T, style, ...props }) {
  const isPrimary = variant === 'primary';
  return (
    <button onClick={onClick} disabled={disabled} {...props} style={{
      padding: '6px 14px', borderRadius: 6, border: isPrimary ? 'none' : `1px solid ${T.border2}`,
      background: isPrimary ? T.accent : 'transparent',
      color: isPrimary ? '#000' : T.text2, cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      opacity: disabled ? 0.4 : 1, transition: 'all .12s', ...style,
    }}
    onMouseEnter={e => { if (!disabled && !isPrimary) { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}}
    onMouseLeave={e => { if (!disabled && !isPrimary) { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text2; }}}
    >{children}</button>
  );
}

export function Badge({ val, pct, currency, T, small }) {
  const num = parseFloat(val);
  if (isNaN(num)) return <span style={{ color: T.text3, fontSize: small ? 10 : 11 }}>—</span>;
  const isPos = num >= 0;
  const color = pct ? (isPos ? T.positive : T.negative) : T.text;
  const sign = isPos && num > 0 ? '+' : '';
  const fmt = pct ? `${sign}${num.toFixed(2)}%` : currency ? `${currency}${sign}${num.toFixed(2)}` : `${sign}${num.toFixed(2)}`;
  return <span style={{ color, fontSize: small ? 10 : 11, fontWeight: 600 }}>{fmt}</span>;
}

export function Card({ children, T, style, ...props }) {
  return <div style={{ background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}`, padding: 16, ...style }} {...props}>{children}</div>;
}

export function Input({ value, onChange, placeholder, T, style, ...props }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} style={{
    padding: '7px 10px', background: T.surface3, border: `1px solid ${T.border2}`, borderRadius: 6,
    color: T.text, fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: T.font, ...style,
  }} {...props} />;
}

export function Tabs({ tabs, active, onChange, T }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: T.surface3, borderRadius: 6, padding: 2 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '8px 16px', borderRadius: 5, border: 'none',
          background: active === t.id ? T.surface : 'transparent',
          color: active === t.id ? T.accent : T.text3, cursor: 'pointer',
          fontSize: 11, fontWeight: active === t.id ? 700 : 400, transition: 'all .1s',
          flex: 1, whiteSpace: 'nowrap',
        }}>{t.label}</button>
      ))}
    </div>
  );
}

export function Loading({ T }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: T.text3, fontSize: 12, gap: 8 }}>
    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.border2}`, borderTopColor: T.accent, animation: 'spin .6s linear infinite' }} />
    Loading...
  </div>;
}
