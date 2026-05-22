import React, { useState, useMemo, useCallback } from 'react';
import { Ic } from '../icons';
import { Btn, Badge, Input, Card, Tabs } from '../components/ui';
import {
  calcReturns, mean, variance, stddev, covariance, correlation,
  annualizedReturn, annualizedVol, sharpeRatio, sortinoRatio,
  maxDrawdown, varHistorical, cvarHistorical, beta, alpha,
  correlationMatrix, portfolioReturn, portfolioStddev, portfolioVariance,
  portfolioSharpe, efficientFrontier, maxSharpePortfolio,
  minVariancePortfolio, rebalanceSuggestions,
} from '../data/portfolio-optimizer';

const STOCKS = [
  { sym: 'RELIANCE', name: 'Reliance Industries' },
  { sym: 'TCS', name: 'Tata Consultancy Services' },
  { sym: 'HDFCBANK', name: 'HDFC Bank' },
  { sym: 'INFY', name: 'Infosys' },
  { sym: 'ICICIBANK', name: 'ICICI Bank' },
  { sym: 'BHARTIARTL', name: 'Bharti Airtel' },
  { sym: 'SBIN', name: 'State Bank of India' },
  { sym: 'BAJFINANCE', name: 'Bajaj Finance' },
  { sym: 'ITC', name: 'ITC' },
  { sym: 'WIPRO', name: 'Wipro' },
];

const REBALANCE_HOLDINGS = [
  { sym: 'RELIANCE', current: 25, target: 20 },
  { sym: 'TCS', current: 18, target: 15 },
  { sym: 'HDFCBANK', current: 22, target: 25 },
  { sym: 'INFY', current: 12, target: 10 },
  { sym: 'ICICIBANK', current: 10, target: 15 },
  { sym: 'SBIN', current: 8, target: 10 },
  { sym: 'ITC', current: 5, target: 5 },
];

const CHART = { w: 700, h: 420, pt: 30, pr: 30, pb: 45, pl: 60 };
CHART.pw = CHART.w - CHART.pl - CHART.pr;
CHART.ph = CHART.h - CHART.pt - CHART.pb;

function seededPrices(base, n, vol, seed) {
  let s = seed;
  const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const out = [];
  let p = base;
  for (let i = 0; i < n; i++) {
    p = p * (1 + (rng() - 0.5) * vol * 2.4);
    out.push(Math.round(p * 100) / 100);
  }
  return out;
}

const MOCK_PRICES = {
  RELIANCE: seededPrices(2845, 63, 0.024, 42),
  TCS: seededPrices(3912, 63, 0.019, 137),
  HDFCBANK: seededPrices(1668, 63, 0.027, 89),
  INFY: seededPrices(1523, 63, 0.021, 256),
  ICICIBANK: seededPrices(1228, 63, 0.025, 511),
  BHARTIARTL: seededPrices(1457, 63, 0.023, 777),
  SBIN: seededPrices(678, 63, 0.029, 333),
  BAJFINANCE: seededPrices(7145, 63, 0.026, 444),
  ITC: seededPrices(432, 63, 0.017, 555),
  WIPRO: seededPrices(528, 63, 0.019, 666),
};

const MOCK_MARKET = seededPrices(25100, 63, 0.018, 999);

function randomPortfolios(annReturns, covMatrix, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let w = Array.from({ length: annReturns.length }, () => Math.random());
    const sum = w.reduce((s, v) => s + v, 0);
    w = w.map(v => v / sum);
    out.push({ ret: portfolioReturn(w, annReturns), vol: portfolioStddev(w, covMatrix) });
  }
  return out;
}

function toSvg(x, y, xMin, xMax, yMin, yMax) {
  const px = CHART.pl + ((x - xMin) / (xMax - xMin)) * CHART.pw;
  const py = CHART.pt + CHART.ph - ((y - yMin) / (yMax - yMin)) * CHART.ph;
  return { x: px, y: py };
}

function metricColor(val, type, T) {
  if (type === 'return') return val >= 0 ? T.positive : T.negative;
  if (type === 'vol') return val < 0.15 ? T.positive : val < 0.25 ? T.warning : T.negative;
  if (type === 'ratio') return val >= 1 ? T.positive : val >= 0.5 ? T.warning : T.negative;
  if (type === 'dd') return val < 0.15 ? T.positive : val < 0.25 ? T.warning : T.negative;
  if (type === 'var') return val > -0.05 ? T.positive : val > -0.10 ? T.warning : T.negative;
  if (type === 'beta') return val >= 0.8 && val <= 1.2 ? T.positive : val >= 0.5 && val <= 1.5 ? T.warning : T.negative;
  if (type === 'alpha') return val >= 0 ? T.positive : T.negative;
  return T.text;
}

const TABS = [
  { id: 'metrics', label: 'Risk Metrics' },
  { id: 'frontier', label: 'Efficient Frontier' },
  { id: 'rebalance', label: 'Rebalance' },
  { id: 'correlation', label: 'Correlation' },
];

export function Optimizer({ T }) {
  const [activeTab, setActiveTab] = useState('metrics');
  const [riskFreeRate, setRiskFreeRate] = useState('6.5');
  const [selected, setSelected] = useState(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL']);

  const rfr = parseFloat(riskFreeRate) / 100 || 0.065;

  const toggleStock = useCallback((sym) => {
    setSelected(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  }, []);

  const portfolioData = useMemo(() => {
    const symbols = selected.filter(s => MOCK_PRICES[s]);
    if (symbols.length < 2) return null;

    const returnSeries = symbols.map(s => calcReturns(MOCK_PRICES[s]));
    const annReturns = returnSeries.map(r => annualizedReturn(r));
    const covMatrix = correlationMatrix(returnSeries);

    const n = symbols.length;
    const ew = Array(n).fill(1 / n);
    const portRet = portfolioReturn(ew, annReturns);
    const portVol = portfolioStddev(ew, covMatrix);
    const portSharpe = portfolioSharpe(ew, annReturns, covMatrix, rfr);

    const allReturns = returnSeries[0].map((_, i) =>
      symbols.reduce((s, sym, j) => {
        const rs = returnSeries[j];
        return s + (rs[i] || 0) * ew[j];
      }, 0)
    );

    const portPrices = symbols.reduce((acc, sym) => {
      if (!acc.length) return [...MOCK_PRICES[sym]];
      return acc.map((v, i) => v + MOCK_PRICES[sym][i]);
    }, []).map(v => v / symbols.length);

    const dd = maxDrawdown(portPrices).drawdown;
    const portVaR = varHistorical(allReturns, 0.95);
    const portCVaR = cvarHistorical(allReturns, 0.95);
    const mktReturns = calcReturns(MOCK_MARKET);
    const portBeta = beta(allReturns, mktReturns);
    const portAlpha = alpha(allReturns, mktReturns, rfr);
    const portSortino = sortinoRatio(allReturns, rfr);

    const frontierPoints = efficientFrontier(annReturns, covMatrix, 50);
    const maxSharpePf = maxSharpePortfolio(annReturns, covMatrix, rfr);
    const minVarPf = minVariancePortfolio(annReturns, covMatrix);
    const scatterPoints = randomPortfolios(annReturns, covMatrix, 2000);

    const corrMat = correlationMatrix(returnSeries);

    return {
      symbols,
      annReturns,
      covMatrix,
      metrics: [
        { label: 'Portfolio Return', val: portRet, fmt: 'pct', type: 'return' },
        { label: 'Volatility', val: portVol, fmt: 'pct', type: 'vol' },
        { label: 'Sharpe Ratio', val: portSharpe, fmt: 'num', type: 'ratio' },
        { label: 'Sortino Ratio', val: portSortino, fmt: 'num', type: 'ratio' },
        { label: 'Max Drawdown', val: dd, fmt: 'pct', type: 'dd' },
        { label: 'VaR (95%)', val: portVaR, fmt: 'pct', type: 'var' },
        { label: 'CVaR (95%)', val: portCVaR, fmt: 'pct', type: 'var' },
        { label: 'Beta', val: portBeta, fmt: 'num', type: 'beta' },
        { label: 'Alpha', val: portAlpha, fmt: 'pct', type: 'alpha' },
      ],
      scatterPoints,
      frontierPoints,
      maxSharpePf,
      minVarPf,
      corrMat,
      rfr,
    };
  }, [selected, rfr]);

  const rebalanceData = useMemo(() => {
    if (!portfolioData) return [];
    const current = REBALANCE_HOLDINGS.map(h => h.current / 100);
    const target = REBALANCE_HOLDINGS.map(h => h.target / 100);
    const suggestions = rebalanceSuggestions(current, target, 0.03);
    return REBALANCE_HOLDINGS.map((h, i) => {
      const drift = h.current - h.target;
      const sug = suggestions.find(s => s.idx === i);
      const absDrift = Math.abs(drift);
      const tol = '> 0.0' + (absDrift < 3 ? '3' : absDrift < 8 ? '5' : '0');
      return {
        ...h,
        target: h.target,
        drift: drift > 0 ? `+${drift.toFixed(1)}` : drift.toFixed(1),
        absDrift,
        suggested: sug ? (sug.action === 'buy' ? h.target + 2 : h.target - 2) : h.target,
        action: sug ? (sug.action === 'buy' ? 'Buy' : 'Sell') : '—',
        status: absDrift < 3 ? 'ok' : absDrift < 8 ? 'drift' : 'alert',
      };
    });
  }, [portfolioData]);

  const fmtPct = (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`;

  const renderChart = useMemo(() => {
    if (!portfolioData || portfolioData.symbols.length < 2) return null;
    const { scatterPoints, frontierPoints, maxSharpePf, minVarPf, rfr } = portfolioData;

    const allPoints = [
      ...scatterPoints,
      ...frontierPoints.map(p => ({ ret: p.ret, vol: p.vol })),
    ];
    if (maxSharpePf) allPoints.push({ ret: maxSharpePf.ret, vol: maxSharpePf.vol });
    if (minVarPf) allPoints.push({ ret: minVarPf.ret, vol: minVarPf.vol });

    let xMin = 0;
    let xMax = Math.max(...allPoints.map(p => p.vol)) * 1.15;
    let yMin = Math.min(...allPoints.map(p => p.ret)) * 0.85;
    let yMax = Math.max(...allPoints.map(p => p.ret)) * 1.15;

    if (rfr < yMin) yMin = rfr * 0.9;

    const cmlEndX = xMax;
    const sharpeMax = maxSharpePf ? (maxSharpePf.ret - rfr) / maxSharpePf.vol : 0;
    const cmlEndY = rfr + sharpeMax * cmlEndX;

    const xTicks = 6;
    const yTicks = 6;
    const tickLabels = [];

    const gridLinesX = [];
    for (let i = 0; i <= xTicks; i++) {
      const v = xMin + (xMax - xMin) * (i / xTicks);
      const p = toSvg(v, 0, xMin, xMax, yMin, yMax);
      gridLinesX.push({ x: p.x, label: `${(v * 100).toFixed(0)}%` });
    }

    const gridLinesY = [];
    for (let i = 0; i <= yTicks; i++) {
      const v = yMin + (yMax - yMin) * (i / yTicks);
      const p = toSvg(0, v, xMin, xMax, yMin, yMax);
      gridLinesY.push({ y: p.y, label: `${(v * 100).toFixed(1)}%` });
    }

    const CML_P1 = toSvg(0, rfr, xMin, xMax, yMin, yMax);
    const CML_P2 = toSvg(cmlEndX, cmlEndY, xMin, xMax, yMin, yMax);

    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${CHART.w} ${CHART.h}`} style={{ width: '100%', maxWidth: CHART.w, height: CHART.h }}>
          <defs>
            <linearGradient id="scatterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.accent} stopOpacity="0.06" />
              <stop offset="100%" stopColor={T.accent} stopOpacity="0.02" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={0} y={0} width={CHART.w} height={CHART.h} fill="none" />

          {gridLinesX.map((g, i) => (
            <line key={`gx${i}`} x1={g.x} y1={CHART.pt} x2={g.x} y2={CHART.pt + CHART.ph} stroke={T.surface4} strokeWidth={0.5} />
          ))}
          {gridLinesY.map((g, i) => (
            <line key={`gy${i}`} x1={CHART.pl} y1={g.y} x2={CHART.pl + CHART.pw} y2={g.y} stroke={T.surface4} strokeWidth={0.5} />
          ))}

          {gridLinesX.map((g, i) => (
            <text key={`tx${i}`} x={g.x} y={CHART.pt + CHART.ph + 16} textAnchor="middle" fill={T.text3} fontSize={9} fontFamily={T.font}>{g.label}</text>
          ))}
          {gridLinesY.map((g, i) => (
            <text key={`ty${i}`} x={CHART.pl - 12} y={g.y + 3} textAnchor="end" fill={T.text3} fontSize={9} fontFamily={T.font}>{g.label}</text>
          ))}

          <text x={CHART.pl + CHART.pw / 2} y={CHART.h - 2} textAnchor="middle" fill={T.text2} fontSize={10} fontFamily={T.font}>
            Risk (Annualized Volatility)
          </text>
          <text x={16} y={CHART.pt + CHART.ph / 2} textAnchor="middle" fill={T.text2} fontSize={10} fontFamily={T.font}
            transform={`rotate(-90, 16, ${CHART.pt + CHART.ph / 2})`}>
            Expected Return
          </text>

          {scatterPoints.map((p, i) => {
            const sp = toSvg(p.vol, p.ret, xMin, xMax, yMin, yMax);
            return <circle key={`sc${i}`} cx={sp.x} cy={sp.y} r={1.5} fill={T.accent} opacity={0.25} />;
          })}

          {frontierPoints.length > 0 && (
            <path
              d={frontierPoints.map((p, i) => {
                const sp = toSvg(p.vol, p.ret, xMin, xMax, yMin, yMax);
                return `${i === 0 ? 'M' : 'L'} ${sp.x} ${sp.y}`;
              }).join(' ')}
              fill="none" stroke={T.info} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            />
          )}

          <line x1={CML_P1.x} y1={CML_P1.y} x2={CML_P2.x} y2={CML_P2.y}
            stroke={T.accent} strokeWidth={1.5} strokeDasharray="6,3" opacity={0.6} />

          {maxSharpePf && (() => {
            const sp = toSvg(maxSharpePf.vol, maxSharpePf.ret, xMin, xMax, yMin, yMax);
            return (
              <g>
                <circle cx={sp.x} cy={sp.y} r={8} fill="none" stroke={T.accent} strokeWidth={2} filter="url(#glow)" />
                <circle cx={sp.x} cy={sp.y} r={4} fill={T.accent} />
                <text x={sp.x} y={sp.y - 14} textAnchor="middle" fill={T.accent} fontSize={9} fontWeight={700} fontFamily={T.font}>
                  Max Sharpe
                </text>
              </g>
            );
          })()}

          {minVarPf && (() => {
            const sp = toSvg(minVarPf.vol, minVarPf.ret, xMin, xMax, yMin, yMax);
            return (
              <g>
                <circle cx={sp.x} cy={sp.y} r={8} fill="none" stroke={T.info} strokeWidth={2} filter="url(#glow)" />
                <circle cx={sp.x} cy={sp.y} r={4} fill={T.info} />
                <text x={sp.x} y={sp.y + 20} textAnchor="middle" fill={T.info} fontSize={9} fontWeight={700} fontFamily={T.font}>
                  Min Variance
                </text>
              </g>
            );
          })()}

          {(() => {
            const rfP = toSvg(0, rfr, xMin, xMax, yMin, yMax);
            return (
              <g>
                <rect x={rfP.x - 3} y={rfP.y - 3} width={6} height={6} fill={T.warning} rx={1} />
                <text x={rfP.x + 10} y={rfP.y + 4} fill={T.warning} fontSize={9} fontFamily={T.font}>Rf</text>
              </g>
            );
          })()}
        </svg>
      </div>
    );
  }, [portfolioData, T]);

  const renderCorrelation = useMemo(() => {
    if (!portfolioData || portfolioData.symbols.length < 2) return null;
    const { symbols, corrMat } = portfolioData;
    const n = Math.min(symbols.length, 6);
    const subset = symbols.slice(0, n);

    const cellSize = 70;
    const gap = 2;
    const totalW = n * cellSize + 80;
    const totalH = n * cellSize + 40;

    return (
      <div style={{ display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
        <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ width: '100%', maxWidth: totalW }}>
          {subset.map((sym, i) => (
            <text key={`rl${i}`} x={78} y={38 + i * cellSize + cellSize / 2 + 4}
              textAnchor="end" fill={T.accent} fontSize={10} fontWeight={700} fontFamily={T.font}>
              {sym}
            </text>
          ))}
          {subset.map((sym, j) => (
            <text key={`cl${j}`} x={80 + j * cellSize + cellSize / 2} y={30}
              textAnchor="middle" fill={T.accent} fontSize={10} fontWeight={700} fontFamily={T.font}>
              {sym}
            </text>
          ))}
          {subset.map((_, i) => subset.map((_, j) => {
            const v = corrMat[i]?.[j] ?? 0;
            const clamped = Math.max(-1, Math.min(1, v));
            const r = clamped < 0 ? Math.abs(clamped) : 0;
            const g = clamped > 0 ? clamped : 0;
            const b = 0;
            const x = 80 + j * cellSize;
            const y = 40 + i * cellSize;

            let fill;
            if (clamped >= 0) {
              const intensity = Math.round(clamped * 200);
              fill = `rgb(${255 - intensity}, 255, ${255 - intensity})`;
            } else {
              const intensity = Math.round(Math.abs(clamped) * 200);
              fill = `rgb(255, ${255 - intensity}, ${255 - intensity})`;
            }

            return (
              <g key={`c${i}_${j}`}>
                <rect x={x + gap} y={y + gap} width={cellSize - gap * 2} height={cellSize - gap * 2}
                  rx={4} fill={fill} opacity={0.85} />
                <text x={x + cellSize / 2} y={y + cellSize / 2 + 4}
                  textAnchor="middle" fill={Math.abs(clamped) > 0.6 ? '#fff' : '#333'}
                  fontSize={12} fontWeight={700} fontFamily={T.font}>
                  {v.toFixed(2)}
                </text>
              </g>
            );
          }))}
        </svg>
      </div>
    );
  }, [portfolioData, T]);

  const metricsCards = useMemo(() => {
    if (!portfolioData) return null;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {portfolioData.metrics.map((m, i) => {
          const color = metricColor(m.val, m.type, T);
          const formatted = m.fmt === 'pct'
            ? `${m.val >= 0 ? '+' : ''}${(m.val * 100).toFixed(2)}%`
            : m.val.toFixed(4);
          return (
            <Card key={i} T={T} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: T.text3, fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>{m.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color, fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{formatted}</span>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}40`,
                }} />
              </div>
            </Card>
          );
        })}
      </div>
    );
  }, [portfolioData, T]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'auto', fontFamily: T.font }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Ic.Optimize />
        <div>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3, display: 'block' }}>Portfolio Optimizer</span>
          <span style={{ color: T.text3, fontSize: 10, letterSpacing: 0.3 }}>Modern Portfolio Theory · Efficient Frontier · Risk Metrics</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 140 }}>
          <span style={{ color: T.text3, fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>Risk-Free Rate (%)</span>
          <Input T={T} value={riskFreeRate} onChange={e => setRiskFreeRate(e.target.value)}
            placeholder="6.5" style={{ fontSize: 12, padding: '7px 10px' }} />
        </div>
        <Btn T={T} variant="primary" style={{ gap: 6, padding: '8px 18px', fontSize: 12 }}
          onClick={() => setSelected(prev => [...prev])}>
          <Ic.Refresh /> Run Optimization
        </Btn>
        <span style={{ color: T.text3, fontSize: 9, marginLeft: 4 }}>
          {selected.length} of {STOCKS.length} selected
        </span>
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {STOCKS.map(s => {
          const active = selected.includes(s.sym);
          return (
            <button key={s.sym} onClick={() => toggleStock(s.sym)} title={s.name} style={{
              padding: '5px 12px', borderRadius: 20, border: `1px solid ${active ? T.accent : T.border2}`,
              background: active ? T.accentBg : T.surface3, color: active ? T.accent : T.text3,
              fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all .1s',
              fontFamily: T.font, letterSpacing: 0.3,
            }}>
              {s.sym}
            </button>
          );
        })}
      </div>

      <Tabs T={T} tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {(!portfolioData || portfolioData.symbols.length < 2) && (
        <Card T={T} style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ color: T.text3, fontSize: 12, marginBottom: 8 }}>Select at least 2 stocks to run optimization</div>
          <span style={{ color: T.text3, fontSize: 10 }}>Choose symbols from the chips above</span>
        </Card>
      )}

      {activeTab === 'metrics' && metricsCards}

      {activeTab === 'frontier' && renderChart}

      {activeTab === 'rebalance' && (
        <Card T={T} style={{ padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Stock', 'Current %', 'Target %', 'Suggested %', 'Drift %', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.text3, fontWeight: 600, fontSize: 10, letterSpacing: 0.5 }}>
                    {h === 'Stock' ? h : h.replace(' %', ' (%)')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rebalanceData.map((h, i) => (
                <tr key={h.sym} style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: i % 2 === 0 ? 'transparent' : `${T.surface3}40`,
                }}>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: T.accent, fontWeight: 700, fontSize: 12 }}>{h.sym}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: T.text, fontWeight: 600 }}>{h.current.toFixed(1)}%</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: T.text2 }}>{h.target.toFixed(1)}%</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{
                      color: h.status === 'ok' ? T.positive : h.status === 'drift' ? T.warning : T.negative,
                      fontWeight: 600,
                    }}>
                      {h.suggested.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{
                      color: h.status === 'ok' ? T.positive : h.status === 'drift' ? T.warning : T.negative,
                      fontWeight: 600,
                    }}>
                      {h.drift}
                    </span>
                    <div style={{
                      marginTop: 4, height: 4, width: 60, background: T.surface3, borderRadius: 2, overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.min(Math.abs(parseFloat(h.drift)), 15) / 15 * 100}%`, height: '100%',
                        background: h.status === 'ok' ? T.positive : h.status === 'drift' ? T.warning : T.negative,
                        borderRadius: 2,
                      }} />
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {h.action !== '—' ? (
                      <span style={{
                        padding: '2px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: h.action === 'Buy' ? T.positiveBg : T.negativeBg,
                        color: h.action === 'Buy' ? T.positive : T.negative,
                      }}>
                        {h.action}
                      </span>
                    ) : (
                      <span style={{ color: T.text3, fontSize: 10 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'correlation' && renderCorrelation}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
