import { useState, useMemo } from 'react';
import { Ic } from '../icons';
import { Btn, Tabs, Input } from '../components/ui';

const SECTORS = [
  { id: 'IT', label: 'Information Technology', change: 1.45 },
  { id: 'Banking', label: 'Banking', change: -0.32 },
  { id: 'Auto', label: 'Automobile', change: 2.18 },
  { id: 'Pharma', label: 'Pharmaceuticals', change: 0.87 },
  { id: 'FMCG', label: 'FMCG', change: -0.54 },
  { id: 'Energy', label: 'Energy', change: 1.92 },
  { id: 'Metals', label: 'Metals & Mining', change: -1.23 },
  { id: 'Realty', label: 'Real Estate', change: 3.45 },
];

const STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', last: 2456.30, change: 42.15, changePct: 1.75, volume: 5280000, high52: 2685.00, low52: 2120.50 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', last: 3892.15, change: 28.40, changePct: 0.73, volume: 2150000, high52: 4125.00, low52: 3250.00 },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', last: 1578.40, change: -12.30, changePct: -0.77, volume: 8900000, high52: 1785.00, low52: 1350.20 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', last: 1678.25, change: -8.75, changePct: -0.52, volume: 12500000, high52: 1890.00, low52: 1360.50 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', last: 1125.60, change: 15.80, changePct: 1.42, volume: 9800000, high52: 1275.00, low52: 985.30 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', last: 678.90, change: -5.20, changePct: -0.76, volume: 15200000, high52: 845.00, low52: 590.10 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto', last: 9875.20, change: 125.40, changePct: 1.29, volume: 1850000, high52: 10650.00, low52: 8240.00 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', sector: 'Pharma', last: 1567.80, change: 18.60, changePct: 1.20, volume: 4200000, high52: 1720.00, low52: 1280.50 },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', last: 456.30, change: -3.40, changePct: -0.74, volume: 18500000, high52: 542.00, low52: 399.50 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', last: 2567.80, change: 22.30, changePct: 0.88, volume: 3200000, high52: 2850.00, low52: 2210.00 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals', last: 567.30, change: -9.80, changePct: -1.70, volume: 7600000, high52: 720.00, low52: 475.30 },
  { symbol: 'DLF', name: 'DLF Limited', sector: 'Realty', last: 789.45, change: 25.60, changePct: 3.35, volume: 5400000, high52: 920.00, low52: 610.00 },
];

const TABS = [
  { id: 'All', label: 'All' },
  { id: 'NSE', label: 'NSE' },
  { id: 'BSE', label: 'BSE' },
  { id: 'US Markets', label: 'US Markets' },
];

const COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'name', label: 'Name' },
  { key: 'last', label: 'Last Price' },
  { key: 'change', label: 'Change' },
  { key: 'changePct', label: 'Chg%' },
  { key: 'volume', label: 'Volume' },
  { key: 'high52', label: '52W High' },
  { key: 'low52', label: '52W Low' },
];

function fmtVolume(v) {
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  return v.toLocaleString();
}

export function Markets({ T }) {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [activeSector, setActiveSector] = useState(null);
  const [sortKey, setSortKey] = useState('symbol');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let data = [...STOCKS];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q));
    }

    if (activeSector) {
      data = data.filter(s => s.sector === activeSector);
    }

    data.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const mul = sortDir === 'asc' ? 1 : -1;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal) * mul;
      return (aVal - bVal) * mul;
    });

    return data;
  }, [search, activeSector, sortKey, sortDir]);

  const maxSectorAbs = Math.max(...SECTORS.map(s => Math.abs(s.change)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'auto', fontFamily: T.font }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>Markets</span>
        </div>
        <div style={{ width: 260 }}>
          <Input
            T={T}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by symbol, name or sector..."
            style={{ fontSize: 11, padding: '6px 10px' }}
          />
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} T={T} />

      {/* ── Sector Performance Grid ── */}
      <div>
        <span style={{ color: T.text2, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>SECTOR PERFORMANCE</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {SECTORS.map(s => {
            const isPos = s.change >= 0;
            const absPct = Math.abs(s.change);
            const barWidth = (absPct / maxSectorAbs) * 100;
            return (
              <div key={s.id} style={{
                background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}`,
                padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
                cursor: 'pointer',
                borderColor: activeSector === s.id ? T.accent : T.border,
              }}
                onClick={() => setActiveSector(activeSector === s.id ? null : s.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: T.text, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ color: isPos ? T.positive : T.negative, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {isPos ? '+' : ''}{s.change.toFixed(2)}%
                  </span>
                </div>
                <div style={{ height: 4, background: T.surface3, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${barWidth}%`, height: '100%', borderRadius: 2,
                    background: isPos ? T.positive : T.negative,
                    transition: 'width .3s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sector Filter Tags ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SECTORS.map(s => (
          <button key={s.id} onClick={() => setActiveSector(activeSector === s.id ? null : s.id)} style={{
            padding: '4px 12px', borderRadius: 4, border: `1px solid ${activeSector === s.id ? T.accent : T.border2}`,
            background: activeSector === s.id ? T.accentBg : T.surface3,
            color: activeSector === s.id ? T.accent : T.text2, fontSize: 10, fontWeight: 500,
            cursor: 'pointer', transition: 'all .1s',
          }}>{s.id}</button>
        ))}
        {activeSector && (
          <Btn T={T} style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => setActiveSector(null)}>
            <Ic.X /> Clear
          </Btn>
        )}
      </div>

      {/* ── Market Depth Table ── */}
      <div>
        <span style={{ color: T.text2, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>
          MARKET INDICES
          {activeSector && <span style={{ color: T.text3, fontWeight: 400 }}> — filtered by {activeSector}</span>}
        </span>
        <div style={{ background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}`, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {COLUMNS.map(c => (
                  <th key={c.key} onClick={() => handleSort(c.key)} style={{
                    padding: '10px 12px', textAlign: 'left', color: T.text3, fontWeight: 600,
                    fontSize: 10, letterSpacing: 0.5, cursor: 'pointer', whiteSpace: 'nowrap',
                    userSelect: 'none', borderBottom: sortKey === c.key ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {c.label}
                      {sortKey === c.key && (
                        <span style={{ color: T.accent, fontSize: 9 }}>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ padding: 24, textAlign: 'center', color: T.text3, fontSize: 11 }}>
                    No matching securities found
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.symbol} style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: i % 2 === 0 ? 'transparent' : T.surface3 + '40',
                    transition: 'background .1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surface4}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : T.surface3 + '40'}
                  >
                    <td style={{ padding: '8px 12px', color: T.accent, fontWeight: 700, whiteSpace: 'nowrap' }}>{s.symbol}</td>
                    <td style={{ padding: '8px 12px', color: T.text, whiteSpace: 'nowrap' }}>{s.name}</td>
                    <td style={{ padding: '8px 12px', color: T.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                      {s.last.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '8px 12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                      color: s.change >= 0 ? T.positive : T.negative,
                    }}>
                      {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '8px 12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                      color: s.changePct >= 0 ? T.positive : T.negative,
                    }}>
                      {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                    </td>
                    <td style={{ padding: '8px 12px', color: T.text2, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                      {fmtVolume(s.volume)}
                    </td>
                    <td style={{ padding: '8px 12px', color: T.text2, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                      {s.high52.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 12px', color: T.text2, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                      {s.low52.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <span style={{ color: T.text3, fontSize: 10 }}>Updated: {new Date().toLocaleString('en-IN', { hour12: false })}</span>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
