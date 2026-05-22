import React, { useReducer, useEffect, useMemo, useState, useCallback } from 'react';
import { Ic } from '../icons';
import { Btn, Badge, Input, Card } from '../components/ui';

const STORAGE_KEY = 'pm_portfolios';

const MOCK_HOLDINGS = [
  { id: 'h1', symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', qty: 600, freeQty: 600, buyPrice: 2600, ltp: 2756.30, dayChg: 1.75, dayPnl: 28455 },
  { id: 'h2', symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', qty: 150, freeQty: 150, buyPrice: 3900, ltp: 4192.15, dayChg: 0.73, dayPnl: 4560 },
  { id: 'h3', symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', qty: 1000, freeQty: 1000, buyPrice: 1620, ltp: 1578.25, dayChg: -0.52, dayPnl: -8450 },
  { id: 'h4', symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', qty: 1200, freeQty: 1200, buyPrice: 1120, ltp: 1225.60, dayChg: 1.42, dayPnl: 20460 },
  { id: 'h5', symbol: 'INFY', name: 'Infosys', sector: 'IT', qty: 500, freeQty: 500, buyPrice: 1520, ltp: 1478.40, dayChg: -0.77, dayPnl: -5730 },
  { id: 'h6', symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', qty: 2500, freeQty: 2500, buyPrice: 662, ltp: 678.90, dayChg: -0.76, dayPnl: -13000 },
  { id: 'h7', symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto', qty: 60, freeQty: 60, buyPrice: 9900, ltp: 10875.20, dayChg: 1.29, dayPnl: 8340 },
  { id: 'h8', symbol: 'SUNPHARMA', name: 'Sun Pharma', sector: 'Pharma', qty: 400, freeQty: 400, buyPrice: 1480, ltp: 1667.80, dayChg: 1.20, dayPnl: 7920 },
];

const MOCK_TRADES = [
  { date: '2026-05-21', symbol: 'RELIANCE', type: 'BUY', qty: 50, price: 2750.00 },
  { date: '2026-05-20', symbol: 'INFY', type: 'SELL', qty: 25, price: 1480.50 },
  { date: '2026-05-19', symbol: 'HDFCBANK', type: 'BUY', qty: 100, price: 1575.00 },
  { date: '2026-05-18', symbol: 'MARUTI', type: 'BUY', qty: 10, price: 10860.00 },
  { date: '2026-05-15', symbol: 'SUNPHARMA', type: 'SELL', qty: 50, price: 1655.00 },
];

const MOCK_PERFORMANCE = [
  { month: 'Jun', value: 85.20 }, { month: 'Jul', value: 84.60 },
  { month: 'Aug', value: 86.10 }, { month: 'Sep', value: 87.45 },
  { month: 'Oct', value: 86.80 }, { month: 'Nov', value: 88.30 },
  { month: 'Dec', value: 89.95 }, { month: 'Jan', value: 90.50 },
  { month: 'Feb', value: 91.20 }, { month: 'Mar', value: 92.65 },
  { month: 'Apr', value: 93.80 }, { month: 'May', value: 94.23 },
];

const SECTOR_DATA = [
  { label: 'IT', value: 35, color: '#f0b90b' },
  { label: 'Banking', value: 25, color: '#00c853' },
  { label: 'Auto', value: 15, color: '#42a5f5' },
  { label: 'Pharma', value: 12, color: '#ab47bc' },
  { label: 'Energy', value: 8, color: '#ff5252' },
  { label: 'Others', value: 5, color: '#ff9800' },
];

const COLUMNS = [
  { key: 'symbol', label: 'Stock' },
  { key: 'qty', label: 'Qty' },
  { key: 'freeQty', label: 'Free Qty' },
  { key: 'buyPrice', label: 'Buy Price' },
  { key: 'invested', label: 'Invested' },
  { key: 'ltp', label: 'LTP' },
  { key: 'dayChg', label: 'Day%' },
  { key: 'dayPnl', label: 'Day P&L' },
  { key: 'value', label: 'Value' },
  { key: 'pnl', label: 'P&L' },
  { key: 'pnlPct', label: 'P&L%' },
  { key: 'allocPct', label: 'Alloc%' },
  { key: 'actions', label: '' },
];

function fmtCurrency(v) {
  return '\u20B9' + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function fmtValue(v) {
  if (v >= 1e7) return (v / 1e7).toFixed(2) + 'Cr';
  if (v >= 1e5) return (v / 1e5).toFixed(2) + 'L';
  return Math.abs(v).toLocaleString('en-IN');
}

function initState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    portfolios: [
      { id: 'main', name: 'Main Portfolio', holdings: [] },
      { id: 'us', name: 'US Stocks', holdings: [] },
      { id: 'options', name: 'Options', holdings: [] },
    ],
    activePortfolioId: 'main',
    trades: MOCK_TRADES,
    performance: MOCK_PERFORMANCE,
  };
}

function portfolioReducer(state, action) {
  switch (action.type) {
    case 'SET_PORTFOLIO':
      return { ...state, activePortfolioId: action.id };
    case 'ADD_PORTFOLIO':
      return {
        ...state,
        portfolios: [...state.portfolios, { id: 'pf_' + Date.now(), name: action.name, holdings: [] }],
      };
    case 'ADD_HOLDING':
      return {
        ...state,
        portfolios: state.portfolios.map(p =>
          p.id === state.activePortfolioId
            ? { ...p, holdings: [...p.holdings, action.holding] }
            : p
        ),
      };
    case 'REMOVE_HOLDING':
      return {
        ...state,
        portfolios: state.portfolios.map(p =>
          p.id === state.activePortfolioId
            ? { ...p, holdings: p.holdings.filter(h => h.id !== action.id) }
            : p
        ),
      };
    case 'REFRESH_PRICES':
      return {
        ...state,
        portfolios: state.portfolios.map(p => ({
          ...p,
          holdings: p.holdings.map(h => ({
            ...h,
            ltp: +(h.ltp * (1 + (Math.random() - 0.48) * 0.02)).toFixed(2),
            dayChg: +((Math.random() - 0.45) * 3).toFixed(2),
            dayPnl: Math.round(h.qty * h.ltp * (Math.random() - 0.45) * 0.02),
          })),
        })),
      };
    case 'ADD_TRADE':
      return { ...state, trades: [action.trade, ...state.trades].slice(0, 20) };
    case 'LOAD_DEMO':
      return {
        ...state,
        portfolios: state.portfolios.map(p =>
          p.id === state.activePortfolioId
            ? { ...p, holdings: action.payload }
            : p
        ),
        performance: MOCK_PERFORMANCE,
      };
    default:
      return state;
  }
}

function DonutChart({ data, size = 140, strokeWidth = 22, T }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.surface3} strokeWidth={strokeWidth} />
      {data.map(d => {
        const filled = (d.value / total) * circumference;
        const seg = (
          <circle
            key={d.label}
            cx={cx} cy={cy} r={r}
            fill="none" stroke={d.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 0.3s' }}
          />
        );
        offset += filled;
        return seg;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={T.text2} fontSize={10} fontWeight={600}>Sectors</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={T.text} fontSize={16} fontWeight={700}>{data.length}</text>
    </svg>
  );
}

function LineChart({ data, width = 400, height = 140, color, T }) {
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pad = { t: 8, r: 8, b: 20, l: 8 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;

  const points = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * w,
    y: pad.t + h - ((d.value - min) / range) * h,
    ...d,
  }));

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${points[points.length - 1].x} ${height - pad.b} L ${points[0].x} ${height - pad.b} Z`;

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartGrad)" />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={T.surface2} stroke={color} strokeWidth={1.5} />
      ))}
      {points.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((p, i) => (
        <text key={i} x={p.x} y={height - 4} textAnchor="middle" fill={T.text3} fontSize={8}>
          {p.month}
        </text>
      ))}
    </svg>
  );
}

export function Portfolio({ T }) {
  const [state, dispatch] = useReducer(portfolioReducer, null, initState);
  const [sortKey, setSortKey] = useState('symbol');
  const [sortDir, setSortDir] = useState('asc');
  const [newPfName, setNewPfName] = useState('');
  const [showNewPf, setShowNewPf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addSymbol, setAddSymbol] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addPrice, setAddPrice] = useState('');

  const handleAddHolding = () => {
    if (!addSymbol.trim() || !addQty || !addPrice) return;
    dispatch({
      type: 'ADD_HOLDING',
      holding: {
        id: 'h_' + Date.now(),
        symbol: addSymbol.trim().toUpperCase(),
        name: addSymbol.trim().toUpperCase(),
        sector: 'Others',
        qty: parseFloat(addQty),
        freeQty: parseFloat(addQty),
        buyPrice: parseFloat(addPrice),
        ltp: parseFloat(addPrice),
        dayChg: 0,
        dayPnl: 0,
      },
    });
    setAddSymbol(''); setAddQty(''); setAddPrice(''); setShowAddForm(false);
  };

  const loadDemoData = useCallback(() => {
    dispatch({ type: 'LOAD_DEMO', payload: MOCK_HOLDINGS });
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const activePortfolio = useMemo(
    () => state.portfolios.find(p => p.id === state.activePortfolioId) || state.portfolios[0],
    [state.portfolios, state.activePortfolioId]
  );

  const sortedHoldings = useMemo(() => {
    const h = [...activePortfolio.holdings];
    h.forEach(holding => {
      holding.invested = holding.qty * holding.buyPrice;
      holding.value = holding.qty * holding.ltp;
      holding.pnl = holding.value - holding.invested;
      holding.pnlPct = holding.invested ? ((holding.pnl / holding.invested) * 100) : 0;
    });
    const totalValue = h.reduce((s, h) => s + h.value, 0);
    h.forEach(holding => { holding.allocPct = totalValue ? (holding.value / totalValue) * 100 : 0; });

    h.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const mul = sortDir === 'asc' ? 1 : -1;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal) * mul;
      return (aVal - bVal) * mul;
    });
    return h;
  }, [activePortfolio.holdings, sortKey, sortDir]);

  const summary = useMemo(() => {
    const totalInvested = sortedHoldings.reduce((s, h) => s + h.invested, 0);
    const totalValue = sortedHoldings.reduce((s, h) => s + h.value, 0);
    const totalPnl = totalValue - totalInvested;
    const totalPnlPct = totalInvested ? (totalPnl / totalInvested) * 100 : 0;
    const todayPnl = sortedHoldings.reduce((s, h) => s + h.dayPnl, 0);
    return { totalInvested, totalValue, totalPnl, totalPnlPct, todayPnl };
  }, [sortedHoldings]);

  const winners = useMemo(
    () => [...sortedHoldings].filter(h => h.pnl > 0).sort((a, b) => b.pnlPct - a.pnlPct).slice(0, 3),
    [sortedHoldings]
  );
  const losers = useMemo(
    () => [...sortedHoldings].filter(h => h.pnl < 0).sort((a, b) => a.pnlPct - b.pnlPct).slice(0, 3),
    [sortedHoldings]
  );
  const trades = useMemo(() => state.trades.slice(0, 5), [state.trades]);

  const handleSort = useCallback((key) => {
    if (key === 'invested' || key === 'ltp' || key === 'value' || key === 'pnl' || key === 'pnlPct' || key === 'allocPct') {
      key = sortKey;
    }
    if (sortKey === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortKey(key); setSortDir('asc'); }
  }, [sortKey, sortDir]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch({ type: 'REFRESH_PRICES' });
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleAddPortfolio = useCallback(() => {
    if (newPfName.trim()) {
      dispatch({ type: 'ADD_PORTFOLIO', name: newPfName.trim() });
      setNewPfName('');
      setShowNewPf(false);
    }
  }, [newPfName]);

  const numericKeys = ['qty', 'freeQty', 'buyPrice', 'invested', 'ltp', 'dayChg', 'dayPnl', 'value', 'pnl', 'pnlPct', 'allocPct'];
  const isNum = (k) => numericKeys.includes(k);

  const renderCell = (h, col) => {
    const val = h[col.key];
    if (col.key === 'symbol') {
      return (
        <div>
          <span style={{ color: T.accent, fontWeight: 700 }}>{h.symbol}</span>
          <span style={{ color: T.text3, fontSize: 9, marginLeft: 6 }}>{h.name}</span>
        </div>
      );
    }
    if (col.key === 'ltp') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: T.text, fontWeight: 600 }}>{fmtCurrency(val)}</span>
          <span style={{
            fontSize: 8, padding: '1px 5px', borderRadius: 3, background: T.positiveBg,
            color: T.positive, fontWeight: 700, letterSpacing: 0.5, animation: 'livePulse 1.5s ease-in-out infinite',
          }}>LIVE</span>
        </div>
      );
    }
    if (col.key === 'dayChg' || col.key === 'dayPnl' || col.key === 'pnl' || col.key === 'pnlPct') {
      const isPos = val >= 0;
      const prefix = isPos && val > 0 ? '+' : '';
      const suffix = col.key === 'dayChg' || col.key === 'pnlPct' ? '%' : '';
      return (
        <span style={{ color: isPos ? T.positive : T.negative, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {prefix}{col.key === 'dayPnl' || col.key === 'pnl' ? fmtCurrency(val) : val.toFixed(2)}{suffix}
        </span>
      );
    }
    if (col.key === 'allocPct') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 40, height: 4, background: T.surface3, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${val}%`, height: '100%', background: T.accent, borderRadius: 2 }} />
          </div>
          <span style={{ color: T.text2, fontSize: 10, fontWeight: 600 }}>{val.toFixed(1)}%</span>
        </div>
      );
    }
    if (col.key === 'qty' || col.key === 'freeQty') {
      return <span style={{ color: T.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{val.toLocaleString()}</span>;
    }
    if (col.key === 'buyPrice' || col.key === 'invested' || col.key === 'value') {
      return <span style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(val)}</span>;
    }
    if (col.key === 'actions') {
      return (
        <button onClick={() => dispatch({ type: 'REMOVE_HOLDING', id: h.id })}
          style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: '4px 6px', borderRadius: 4, fontSize: 12, transition: 'all .1s' }}
          onMouseEnter={e => { e.currentTarget.style.color = T.negative; e.currentTarget.style.background = T.negativeBg; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'transparent'; }}
          title="Remove holding">✕</button>
      );
    }
    return <span style={{ color: T.text }}>{val}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'auto', fontFamily: T.font }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ic.Portfolio />
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>Portfolio</span>
          <span style={{ color: T.text3, fontSize: 10, fontWeight: 500, background: T.surface3, padding: '2px 8px', borderRadius: 4 }}>
            {activePortfolio.name}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Invested', value: summary.totalInvested, fmt: (v) => fmtCurrency(v), color: T.text },
          { label: 'Current Value', value: summary.totalValue, fmt: (v) => fmtCurrency(v), color: T.text },
          { label: 'Total P&L', value: summary.totalPnl, fmt: (v) => `${summary.totalPnl >= 0 ? '+' : ''}${fmtCurrency(v)} (${summary.totalPnlPct >= 0 ? '+' : ''}${summary.totalPnlPct.toFixed(2)}%)`, color: summary.totalPnl >= 0 ? T.positive : T.negative },
          { label: "Today's P&L", value: summary.todayPnl, fmt: (v) => `${summary.todayPnl >= 0 ? '+' : ''}${fmtCurrency(v)}`, color: summary.todayPnl >= 0 ? T.positive : T.negative },
        ].map((s, i) => (
          <div key={i} style={{ background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: T.text3, fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.fmt(s.value)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {state.portfolios.map(p => (
            <button key={p.id} onClick={() => dispatch({ type: 'SET_PORTFOLIO', id: p.id })} style={{
              padding: '5px 14px', borderRadius: 6, border: `1px solid ${state.activePortfolioId === p.id ? T.accent : T.border2}`,
              background: state.activePortfolioId === p.id ? T.accentBg : T.surface3,
              color: state.activePortfolioId === p.id ? T.accent : T.text2, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', transition: 'all .1s',
            }}>{p.name}</button>
          ))}
          {showNewPf ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Input T={T} value={newPfName} onChange={e => setNewPfName(e.target.value)} placeholder="Name..." style={{ width: 120, fontSize: 10, padding: '5px 8px' }}
                onKeyDown={e => e.key === 'Enter' && handleAddPortfolio()} />
              <Btn T={T} style={{ padding: '5px 8px', fontSize: 10 }} onClick={handleAddPortfolio}><Ic.Check /></Btn>
              <Btn T={T} style={{ padding: '5px 8px', fontSize: 10 }} onClick={() => { setShowNewPf(false); setNewPfName(''); }}><Ic.X /></Btn>
            </div>
          ) : (
            <Btn T={T} style={{ padding: '5px 12px', fontSize: 10 }} onClick={() => setShowNewPf(true)}>
              <Ic.Plus /> New
            </Btn>
          )}
        </div>
        <span style={{ color: T.text3, fontSize: 9 }}>Holdings: {activePortfolio.holdings.length}</span>
      </div>

      {showAddForm && (
        <Card T={T} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ color: T.text3, fontSize: 9, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>SYMBOL</div>
            <Input T={T} value={addSymbol} onChange={e => setAddSymbol(e.target.value.toUpperCase())} placeholder="e.g. RELIANCE" style={{ fontSize: 12 }} />
          </div>
          <div style={{ width: 100 }}>
            <div style={{ color: T.text3, fontSize: 9, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>QTY</div>
            <Input T={T} type="number" value={addQty} onChange={e => setAddQty(e.target.value)} placeholder="10" style={{ fontSize: 12 }} />
          </div>
          <div style={{ width: 120 }}>
            <div style={{ color: T.text3, fontSize: 9, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>BUY PRICE (₹)</div>
            <Input T={T} type="number" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="2800" style={{ fontSize: 12 }} />
          </div>
          <Btn T={T} variant="primary" onClick={handleAddHolding} disabled={!addSymbol || !addQty || !addPrice} style={{ padding: '8px 20px' }}>
            <Ic.Check /> Add
          </Btn>
        </Card>
      )}

      <Card T={T} style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {COLUMNS.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)} style={{
                  padding: '10px 12px', textAlign: isNum(c.key) ? 'right' : 'left', color: T.text3, fontWeight: 600,
                  fontSize: 10, letterSpacing: 0.5, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
                  borderBottom: sortKey === c.key ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {c.label}
                    {sortKey === c.key && <span style={{ color: T.accent, fontSize: 9 }}>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} style={{ padding: 32, textAlign: 'center', color: T.text3, fontSize: 11 }}>
                  No holdings in this portfolio. Add a holding to get started.
                </td>
              </tr>
            ) : (
              sortedHoldings.map((h, i) => (
                <tr key={h.id} style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: i % 2 === 0 ? 'transparent' : `${T.surface3}40`,
                  transition: 'background .1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface4}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : `${T.surface3}40`}
                >
                  {COLUMNS.map(c => (
                    <td key={c.key} style={{
                      padding: '9px 12px', textAlign: isNum(c.key) ? 'right' : 'left',
                      fontVariantNumeric: isNum(c.key) ? 'tabular-nums' : 'normal',
                    }}>
                      {renderCell(h, c)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <div style={{ display: 'flex', gap: 14 }}>
        <Card T={T} style={{ flex: 1, display: 'flex', gap: 16, alignItems: 'center' }}>
          <DonutChart data={SECTOR_DATA} size={130} strokeWidth={20} T={T} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <span style={{ color: T.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, marginBottom: 2 }}>SECTOR ALLOCATION</span>
            {SECTOR_DATA.map(d => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ color: T.text2, fontSize: 10, flex: 1 }}>{d.label}</span>
                <div style={{ flex: 1, height: 3, background: T.surface3, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${d.value}%`, height: '100%', background: d.color, borderRadius: 2 }} />
                </div>
                <span style={{ color: T.text, fontSize: 10, fontWeight: 600, width: 40, textAlign: 'right' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card T={T} style={{ flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: T.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>PORTFOLIO VALUE (12M)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: T.positive, fontSize: 12, fontWeight: 700 }}>{fmtCurrency(87.45e5)}</span>
              <span style={{ color: T.positive, fontSize: 10, fontWeight: 600 }}>+10.6%</span>
            </div>
          </div>
          <LineChart data={state.performance} width={400} height={120} color={T.positive} T={T} />
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn T={T} variant="primary" style={{ gap: 7, padding: '8px 18px' }} onClick={() => setShowAddForm(!showAddForm)}><Ic.Plus /> {showAddForm ? 'Cancel' : 'Add Holding'}</Btn>
        <Btn T={T} style={{ gap: 7, padding: '8px 18px' }}><Ic.Download /> Import CSV</Btn>
        <Btn T={T} style={{ gap: 7, padding: '8px 18px' }}><Ic.Download /> Export XLSX</Btn>
        <Btn T={T} style={{ gap: 7, padding: '8px 18px' }} disabled={refreshing} onClick={handleRefresh}>
          <Ic.Refresh s={refreshing} /> {refreshing ? 'Refreshing...' : 'Refresh Prices'}
        </Btn>
        <Btn T={T} style={{ gap: 7, padding: '8px 18px', color: T.warning, borderColor: T.warning }} onClick={loadDemoData}>
          📊 Load Demo Data
        </Btn>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <Card T={T} style={{ flex: 1 }}>
          <span style={{ color: T.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>WINNERS / LOSERS</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {winners.length > 0 && (
              <div>
                <span style={{ color: T.positive, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>WINNERS</span>
                {winners.map((h, i) => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < winners.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <div>
                      <span style={{ color: T.text, fontSize: 11, fontWeight: 600 }}>{h.symbol}</span>
                      <span style={{ color: T.text3, fontSize: 9, marginLeft: 6 }}>{h.name}</span>
                    </div>
                    <span style={{ color: T.positive, fontSize: 11, fontWeight: 700 }}>+{h.pnlPct.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            )}
            {losers.length > 0 && (
              <div>
                <span style={{ color: T.negative, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>LOSERS</span>
                {losers.map((h, i) => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < losers.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <div>
                      <span style={{ color: T.text, fontSize: 11, fontWeight: 600 }}>{h.symbol}</span>
                      <span style={{ color: T.text3, fontSize: 9, marginLeft: 6 }}>{h.name}</span>
                    </div>
                    <span style={{ color: T.negative, fontSize: 11, fontWeight: 700 }}>{h.pnlPct.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            )}
            {winners.length === 0 && losers.length === 0 && (
              <span style={{ color: T.text3, fontSize: 10 }}>No holdings to evaluate</span>
            )}
          </div>
        </Card>

        <Card T={T} style={{ flex: 1 }}>
          <span style={{ color: T.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>RECENT TRADES</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {trades.length === 0 ? (
              <span style={{ color: T.text3, fontSize: 10 }}>No recent trades</span>
            ) : (
              trades.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < trades.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: T.text3, fontSize: 9, fontVariantNumeric: 'tabular-nums', minWidth: 52 }}>{t.date.slice(5)}</span>
                    <span style={{
                      padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                      background: t.type === 'BUY' ? T.positiveBg : T.negativeBg,
                      color: t.type === 'BUY' ? T.positive : T.negative,
                    }}>{t.type}</span>
                    <span style={{ color: T.accent, fontSize: 11, fontWeight: 600 }}>{t.symbol}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: T.text2, fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>{t.qty}</span>
                    <span style={{ color: T.text, fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(t.price)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: T.text3, fontSize: 9 }}>Data refreshes every 15s • Last updated: {new Date().toLocaleString('en-IN', { hour12: false })}</span>
        <span style={{ color: T.text3, fontSize: 9 }}>Portfolio health: <span style={{ color: summary.totalPnl >= 0 ? T.positive : T.negative, fontWeight: 600 }}>{summary.totalPnl >= 0 ? 'Profit' : 'Loss'}</span></span>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
