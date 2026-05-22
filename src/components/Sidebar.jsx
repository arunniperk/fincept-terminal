import React from 'react';
import { Ic } from '../icons';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',  icon: Ic.Home },
  { id: 'markets',    label: 'Markets',    icon: Ic.Market },
  { id: 'portfolio',  label: 'Portfolio',  icon: Ic.Portfolio },
  { id: 'watchlist',  label: 'Watchlist',  icon: Ic.Watchlist },
  { id: 'news',       label: 'News',       icon: Ic.News },
  { id: 'ai',         label: 'AI Agents',  icon: Ic.AI },
  { id: 'economics',  label: 'Economics',  icon: Ic.Economics },
  { id: 'brokers',    label: 'Brokers',    icon: Ic.Broker },
  { id: 'optimizer',  label: 'Optimizer',  icon: Ic.Optimize },
  { id: 'notes',      label: 'Notes',      icon: Ic.Notes },
  { id: 'alerts',     label: 'Alerts',     icon: Ic.Alert },
  { id: 'settings',   label: 'Settings',   icon: Ic.Settings },
];

export function Sidebar({ active, onChange, T, collapsed, onToggle }) {
  return (
    <div style={{
      width: collapsed ? 52 : 200, height: '100%', background: T.surface,
      borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column',
      transition: 'width .15s', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{
        padding: collapsed ? '14px 0' : '14px 16px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>F</div>
        {!collapsed && <span style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>Fincept</span>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map(n => {
          const Icon = n.icon;
          const isActive = active === n.id;
          return (
            <div key={n.id} onClick={() => onChange(n.id)} style={{
              padding: collapsed ? '10px 0' : '8px 16px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start',
              background: isActive ? T.accentBg : 'transparent',
              color: isActive ? T.accent : T.text3, fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
              fontSize: 12, transition: 'all .1s',
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = T.text; e.currentTarget.style.background = T.surface2; }}}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'transparent'; }}}
            ><Icon />{!collapsed && n.label}</div>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, padding: '8px 0', textAlign: 'center' }}>
        <div onClick={onToggle} style={{
          padding: '6px 0', cursor: 'pointer', color: T.text3, fontSize: 11,
          transition: 'color .1s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = T.text}
        onMouseLeave={e => e.currentTarget.style.color = T.text3}
        >{collapsed ? '▶' : '◀ Collapse'}</div>
      </div>
    </div>
  );
}
