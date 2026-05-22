import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import { Btn, Badge } from '../components/ui';

const indices = [
  { name: 'SENSEX', value: '82,345.67', change: '+0.45', pos: true },
  { name: 'NIFTY50', value: '25,123.45', change: '+0.52', pos: true },
  { name: 'DOW JONES', value: '42,186.32', change: '-0.23', pos: false },
  { name: 'S&P500', value: '5,732.18', change: '+0.31', pos: true },
  { name: 'NASDAQ', value: '18,456.90', change: '+0.67', pos: true },
  { name: 'USD/INR', value: '83.45', change: '-0.12', pos: false },
];

const movers = [
  { name: 'Reliance Industries', sym: 'RELIANCE', price: 2845.60, change: '+5.67', pos: true, vol: '12.4M', data: [42, 45, 44, 48, 52, 50, 55] },
  { name: 'Tata Consultancy', sym: 'TCS', price: 3912.80, change: '+4.82', pos: true, vol: '8.2M', data: [38, 40, 39, 43, 46, 48, 50] },
  { name: 'HDFC Bank', sym: 'HDFCBANK', price: 1668.35, change: '-3.91', pos: false, vol: '15.7M', data: [55, 52, 48, 46, 44, 42, 40] },
  { name: 'Infosys', sym: 'INFY', price: 1523.40, change: '+3.45', pos: true, vol: '6.8M', data: [30, 33, 32, 36, 38, 37, 41] },
  { name: 'ICICI Bank', sym: 'ICICIBANK', price: 1124.25, change: '-2.78', pos: false, vol: '10.3M', data: [48, 46, 44, 42, 40, 38, 35] },
  { name: 'Bharti Airtel', sym: 'BHARTIARTL', price: 1456.75, change: '+2.34', pos: true, vol: '5.1M', data: [25, 28, 27, 32, 35, 33, 37] },
];

const summary = [
  { label: 'Advancers', value: '1,847', sub: '58%', pos: true },
  { label: 'Decliners', value: '1,312', sub: '42%', pos: false },
  { label: 'Total Traded Value', value: '₹8,45,692 Cr', sub: '+12.3%', pos: true },
  { label: 'Market Cap', value: '₹4,12,56,890 Cr', sub: '+0.78%', pos: true },
  { label: 'FII Net', value: '₹2,456 Cr', sub: '+1,234 Cr', pos: true },
  { label: 'DII Net', value: '₹-892 Cr', sub: '-456 Cr', pos: false },
];

function Sparkline({ data, color, width = 80, height = 26 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Dashboard({ T }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);

  const inHours = time.getHours();
  const isOpen = (inHours >= 9 && inHours < 16) || (inHours === 9 && time.getMinutes() >= 15);
  const timeStr = time.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'auto', fontFamily: T.font }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>Dashboard</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: isOpen ? T.positiveBg : T.negativeBg, border: `1px solid ${isOpen ? T.positive : T.negative}` }}>
            <span style={{ fontSize: 8 }}>{isOpen ? '🟢' : '🔴'}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: isOpen ? T.positive : T.negative }}>{isOpen ? 'Market Open' : 'Market Closed'}</span>
          </div>
        </div>
        <span style={{ color: T.text2, fontSize: 13, fontWeight: 500, letterSpacing: 0.5, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
      </div>

      {/* ── Indices Bar ── */}
      <div style={{ display: 'flex', gap: 1, background: T.border, borderRadius: T.r, overflow: 'hidden' }}>
        {indices.map((ix, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 14px', background: T.surface2 }}>
            <span style={{ color: T.text3, fontSize: 9, fontWeight: 600, letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{ix.name}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: T.text, fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{ix.value}</span>
              <Badge val={ix.change} pct T={T} small />
            </div>
          </div>
        ))}
      </div>

      {/* ── Top Movers ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: T.text2, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>TOP MOVERS</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'Gainers', 'Losers'].map(l => (
              <button key={l} style={{ padding: '3px 10px', borderRadius: 4, border: `1px solid ${T.border2}`, background: T.surface3, color: T.text2, fontSize: 10, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {movers.map((m, i) => (
            <div key={i} style={{ background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: T.text, fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{m.name}</div>
                  <span style={{ color: T.text3, fontSize: 10 }}>{m.sym}</span>
                </div>
                <Badge val={m.change} pct T={T} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ color: T.text, fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{m.price.toLocaleString()}</div>
                  <span style={{ color: T.text3, fontSize: 9 }}>Vol: {m.vol}</span>
                </div>
                <Sparkline data={m.data} color={m.pos ? T.positive : T.negative} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Market Summary ── */}
      <div>
        <span style={{ color: T.text2, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>MARKET SUMMARY</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {summary.map((s, i) => (
            <div key={i} style={{ background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: T.text3, fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>{s.label}</span>
              <span style={{ color: T.text, fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              <Badge val={s.sub} pct={s.sub.includes('%')} T={T} small />
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 14, marginTop: 2 }}>
        <Btn T={T} variant="primary" style={{ gap: 7, padding: '8px 18px' }}>
          <Ic.Refresh /> Refresh All
        </Btn>
        <Btn T={T} style={{ gap: 7, padding: '8px 18px' }}>
          <Ic.Plus /> Add Holding
        </Btn>
        <Btn T={T} style={{ gap: 7, padding: '8px 18px' }}>
          <Ic.Download /> Export Report
        </Btn>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
