import { useState, useEffect, useMemo } from 'react';
import { Ic } from '../icons';
import { Btn, Input } from '../components/ui';

const LISTS_KEY = 'pm_watchlists';

const DEFAULT_LISTS = [
  {
    id: 'main', label: 'Main',
    items: [
      { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2456.30, change: 1.75, volume: 5280000, low52: 2120.50, high52: 2685.00 },
      { symbol: 'TCS', name: 'Tata Consultancy', ltp: 3892.15, change: 0.73, volume: 2150000, low52: 3250.00, high52: 4125.00 },
      { symbol: 'INFY', name: 'Infosys', ltp: 1578.40, change: -0.77, volume: 8900000, low52: 1350.20, high52: 1785.00 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', ltp: 1678.25, change: -0.52, volume: 12500000, low52: 1360.50, high52: 1890.00 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', ltp: 1125.60, change: 1.42, volume: 9800000, low52: 985.30, high52: 1275.00 },
      { symbol: 'AAPL', name: 'Apple Inc.', ltp: 226.40, change: 0.84, volume: 45100000, low52: 164.08, high52: 237.23 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', ltp: 428.15, change: -0.32, volume: 18200000, low52: 309.45, high52: 468.35 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', ltp: 176.20, change: 1.12, volume: 23500000, low52: 124.50, high52: 193.28 },
    ],
  },
  {
    id: 'tech', label: 'Tech',
    items: [
      { symbol: 'TCS', name: 'Tata Consultancy', ltp: 3892.15, change: 0.73, volume: 2150000, low52: 3250.00, high52: 4125.00 },
      { symbol: 'INFY', name: 'Infosys', ltp: 1578.40, change: -0.77, volume: 8900000, low52: 1350.20, high52: 1785.00 },
      { symbol: 'AAPL', name: 'Apple Inc.', ltp: 226.40, change: 0.84, volume: 45100000, low52: 164.08, high52: 237.23 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', ltp: 428.15, change: -0.32, volume: 18200000, low52: 309.45, high52: 468.35 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', ltp: 176.20, change: 1.12, volume: 23500000, low52: 124.50, high52: 193.28 },
    ],
  },
  {
    id: 'crypto', label: 'Crypto',
    items: [
      { symbol: 'BTC', name: 'Bitcoin', ltp: 67845.20, change: 2.45, volume: 285000000, low52: 38500.00, high52: 73800.00 },
      { symbol: 'ETH', name: 'Ethereum', ltp: 3456.80, change: -1.23, volume: 156000000, low52: 2180.00, high52: 4090.00 },
      { symbol: 'SOL', name: 'Solana', ltp: 145.30, change: 5.67, volume: 42000000, low52: 82.50, high52: 210.00 },
      { symbol: 'XRP', name: 'Ripple', ltp: 0.62, change: 0.85, volume: 89000000, low52: 0.38, high52: 0.95 },
    ],
  },
  {
    id: 'highyield', label: 'High Yield',
    items: [
      { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2456.30, change: 1.75, volume: 5280000, low52: 2120.50, high52: 2685.00 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', ltp: 1678.25, change: -0.52, volume: 12500000, low52: 1360.50, high52: 1890.00 },
      { symbol: 'ITC', name: 'ITC Limited', ltp: 456.30, change: -0.74, volume: 18500000, low52: 399.50, high52: 542.00 },
    ],
  },
];

const COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'name', label: 'Name' },
  { key: 'ltp', label: 'LTP' },
  { key: 'change', label: 'Change%' },
  { key: 'volume', label: 'Volume' },
  { key: 'range', label: '52W Range' },
  { key: 'graph', label: '' },
];

function fmtVolume(v) {
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  return v.toLocaleString();
}

function loadLists() {
  try {
    const d = localStorage.getItem(LISTS_KEY);
    if (d) { const p = JSON.parse(d); if (p?.length) return p; }
  } catch {}
  return DEFAULT_LISTS;
}

function saveLists(lists) {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

export function Watchlist({ T }) {
  const [lists, setLists] = useState(loadLists);
  const [activeListId, setActiveListId] = useState(lists[0]?.id || 'main');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addSymbol, setAddSymbol] = useState('');
  const [addList, setAddList] = useState(activeListId);
  const [sortKey, setSortKey] = useState('symbol');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => { saveLists(lists); }, [lists]);

  const activeList = lists.find(l => l.id === activeListId) || lists[0];

  const filtered = useMemo(() => {
    if (!activeList) return [];
    let data = [...activeList.items];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    data.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const mul = sortDir === 'asc' ? 1 : -1;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal) * mul;
      return (aVal - bVal) * mul;
    });
    return data;
  }, [activeList, search, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function handleAdd() {
    if (!addSymbol.trim()) return;
    setLists(prev => prev.map(l => {
      if (l.id !== addList) return l;
      const exists = l.items.find(i => i.symbol === addSymbol.trim().toUpperCase());
      if (exists) return l;
      return {
        ...l,
        items: [...l.items, {
          symbol: addSymbol.trim().toUpperCase(),
          name: addSymbol.trim().toUpperCase(),
          ltp: 0,
          change: 0,
          volume: 0,
          low52: 0,
          high52: 0,
        }],
      };
    }));
    setAddSymbol('');
    setShowAdd(false);
  }

  function handleRemove(symbol) {
    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return { ...l, items: l.items.filter(i => i.symbol !== symbol) };
    }));
  }

  const sStyle = {
    padding: '4px 14px', borderRadius: 20, border: 'none',
    background: T.surface3, color: T.text2, fontSize: 11, fontWeight: 500,
    cursor: 'pointer', transition: 'all .1s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'auto', fontFamily: T.font }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>Watchlist</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 200 }}>
            <Input
              T={T}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter symbols..."
              style={{ fontSize: 11, padding: '6px 10px' }}
            />
          </div>
          <Btn T={T} variant="primary" style={{ gap: 6, padding: '6px 14px', fontSize: 11 }} onClick={() => setShowAdd(!showAdd)}>
            <Ic.Plus /> Add Symbol
          </Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {lists.map(l => (
          <button key={l.id} onClick={() => { setActiveListId(l.id); setSearch(''); }} style={{
            ...sStyle,
            background: activeListId === l.id ? T.accentBg : T.surface3,
            color: activeListId === l.id ? T.accent : T.text2,
            border: activeListId === l.id ? `1px solid ${T.accent}` : `1px solid transparent`,
          }}>
            {l.label}
            <span style={{ marginLeft: 5, color: T.text3, fontSize: 10 }}>({l.items.length})</span>
          </button>
        ))}
      </div>

      {showAdd && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}` }}>
          <Input
            T={T}
            value={addSymbol}
            onChange={e => setAddSymbol(e.target.value)}
            placeholder="Symbol (e.g. TATAMOTORS)"
            style={{ fontSize: 11, padding: '6px 10px', width: 220 }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          />
          <select
            value={addList}
            onChange={e => setAddList(e.target.value)}
            style={{
              background: T.surface3, color: T.text, border: `1px solid ${T.border2}`,
              borderRadius: 4, padding: '6px 10px', fontSize: 11, fontFamily: T.font, outline: 'none',
            }}
          >
            {lists.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <Btn T={T} variant="primary" style={{ padding: '6px 14px', fontSize: 11 }} onClick={handleAdd}>
            <Ic.Check /> Add
          </Btn>
          <Btn T={T} style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => { setShowAdd(false); setAddSymbol(''); }}>
            <Ic.X />
          </Btn>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 12 }}>
          {search ? 'No matching symbols' : 'This list is empty. Add symbols to track.'}
        </div>
      ) : (
        <div style={{ background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}`, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {COLUMNS.map(c => (
                  <th key={c.key} onClick={() => c.key !== 'graph' && c.key !== 'range' && handleSort(c.key)} style={{
                    padding: '10px 12px', textAlign: c.key === 'graph' ? 'center' : 'left', color: T.text3, fontWeight: 600,
                    fontSize: 10, letterSpacing: 0.5, cursor: c.key !== 'graph' && c.key !== 'range' ? 'pointer' : 'default',
                    whiteSpace: 'nowrap', userSelect: 'none',
                    borderBottom: sortKey === c.key ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: c.key === 'graph' ? 'center' : 'flex-start' }}>
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
              {filtered.map((s, i) => {
                const pos = s.change >= 0;
                const rangePct = s.high52 > s.low52 ? ((s.ltp - s.low52) / (s.high52 - s.low52)) * 100 : 50;
                return (
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
                      {s.ltp.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '8px 12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                      color: pos ? T.positive : T.negative,
                    }}>
                      {pos ? '+' : ''}{s.change.toFixed(2)}%
                    </td>
                    <td style={{ padding: '8px 12px', color: T.text2, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                      {fmtVolume(s.volume)}
                    </td>
                    <td style={{ padding: '8px 12px', minWidth: 140 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.text3 }}>
                          <span>{s.low52.toFixed(1)}</span>
                          <span>{s.high52.toFixed(1)}</span>
                        </div>
                        <div style={{ height: 4, background: T.surface3, borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            width: `${rangePct}%`, height: '100%', borderRadius: 2,
                            background: pos ? T.positive : T.negative,
                            transition: 'width .3s',
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: T.text3 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', cursor: 'pointer' }}>
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                      <button onClick={() => handleRemove(s.symbol)} style={{
                        background: 'none', border: 'none', color: T.text3, cursor: 'pointer',
                        fontSize: 11, padding: '2px 6px', borderRadius: 3,
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = T.negative}
                        onMouseLeave={e => e.currentTarget.style.color = T.text3}
                      >
                        <Ic.X />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
