import { useState, useEffect, useMemo, useCallback } from 'react';
import { Ic } from '../icons';
import { Btn, Input, Card } from '../components/ui';
import { INDICATORS, fetchMultipleIndicators, formatIndicatorValue } from '../data/economics';

function Sparkline({ data, color, T }) {
  if (!data || data.length < 2) return <div style={{ height: 32 }} />;
  const vals = data.map(d => d.value);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const r = mx - mn || 1;
  const w = 120, h = 32;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - mn) / r) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color || T.accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Skeleton({ T }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ height: 12, width: '55%', background: T.surface3, borderRadius: 3 }} />
      <div style={{ height: 8, width: '35%', background: T.surface3, borderRadius: 3 }} />
      <div style={{ height: 32, width: 120, background: T.surface3, borderRadius: 3 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ height: 16, width: 60, background: T.surface3, borderRadius: 3 }} />
        <div style={{ height: 12, width: 40, background: T.surface3, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function pctChange(data) {
  if (!data || data.length < 2) return null;
  const first = data[0].value;
  const last = data[data.length - 1].value;
  if (first === 0) return null;
  return ((last - first) / first) * 100;
}

export function Economics({ T }) {
  const [fredApiKey, setFredApiKey] = useState('');
  const [dataMap, setDataMap] = useState({});
  const [filterCountry, setFilterCountry] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pm_fred_key');
    if (saved) setFredApiKey(saved);
  }, []);

  const countries = useMemo(() => {
    const set = new Set(INDICATORS.map(i => i.country));
    return ['All', ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    if (filterCountry === 'All') return INDICATORS;
    return INDICATORS.filter(i => i.country === filterCountry);
  }, [filterCountry]);

  const handleRefresh = useCallback(async () => {
    if (!fredApiKey) { setShowConfig(true); return; }
    setIsRefreshing(true);
    const init = {};
    INDICATORS.forEach(i => { init[i.id] = { data: [], loading: true, error: null }; });
    setDataMap(init);
    try {
      const results = await fetchMultipleIndicators(INDICATORS, fredApiKey);
      setDataMap(results);
    } catch {
      setDataMap(p => {
        const n = { ...p };
        INDICATORS.forEach(i => { if (n[i.id]?.loading) n[i.id] = { data: [], loading: false, error: 'Fetch failed' }; });
        return n;
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fredApiKey]);

  const handleKeyChange = useCallback((val) => {
    setFredApiKey(val);
    localStorage.setItem('pm_fred_key', val);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'auto', fontFamily: T.font }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: T.accent }}><Ic.Economics /></span>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>Economic Indicators</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn T={T} onClick={() => setShowConfig(s => !s)} style={{ fontSize: 10, padding: '5px 10px' }}>
            {showConfig ? <Ic.X /> : null}
            {fredApiKey ? 'API Key' : 'Set API Key'}
          </Btn>
          <Btn T={T} variant="primary" onClick={handleRefresh} disabled={isRefreshing}>
            <Ic.Refresh s={isRefreshing} />
            {isRefreshing ? 'Loading...' : 'Refresh All'}
          </Btn>
        </div>
      </div>

      {showConfig && (
        <Card T={T} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <span style={{ color: T.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>FRED API KEY</span>
          <Input
            T={T}
            value={fredApiKey}
            onChange={e => handleKeyChange(e.target.value)}
            placeholder="Enter your FRED API key..."
            style={{ fontSize: 11, padding: '5px 10px', maxWidth: 320 }}
          />
          {fredApiKey && (
            <span style={{ color: T.positive, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Ic.Check /> Saved
            </span>
          )}
          <span style={{ color: T.text3, fontSize: 9, marginLeft: 'auto' }}>
            <a href="https://fred.stlouisfed.org/docs/api/api_key.html" target="_blank" rel="noopener noreferrer" style={{ color: T.info }}>Get free key</a>
          </span>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {countries.map(c => {
          const active = filterCountry === c;
          return (
            <button key={c} onClick={() => setFilterCountry(c)} style={{
              padding: '4px 14px', borderRadius: 12, border: `1px solid ${active ? T.accent : T.border2}`,
              background: active ? T.accentBg : 'transparent',
              color: active ? T.accent : T.text2, fontSize: 10, fontWeight: active ? 700 : 500,
              cursor: 'pointer', transition: 'all .12s',
            }}>{c}</button>
          );
        })}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 12,
      }}>
        {filtered.map(ind => {
          const entry = dataMap[ind.id];
          const entryData = entry?.data;
          const isLoading = entry?.loading || (isRefreshing && !entry);
          const hasError = entry?.error;
          const change = !isLoading && entryData ? pctChange(entryData) : null;
          const lastVal = entryData?.length > 0 ? entryData[entryData.length - 1].value : null;

          return (
            <div key={ind.id} style={{
              background: T.surface2, borderRadius: T.r, border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${ind.color || T.accent}`,
              padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>{ind.name}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: T.text3, fontSize: 9, background: T.surface3, padding: '1px 6px', borderRadius: 3 }}>{ind.source}</span>
                    <span style={{ color: T.text3, fontSize: 9 }}>{ind.country}</span>
                  </div>
                </div>
                <Sparkline data={entryData} color={ind.color} T={T} />
              </div>

              <div style={{ color: T.text3, fontSize: 9, lineHeight: 1.4, minHeight: 24 }}>{ind.desc}</div>

              {isLoading ? (
                <Skeleton T={T} />
              ) : hasError ? (
                <div style={{
                  color: T.negative, fontSize: 10, background: T.negativeBg, borderRadius: 4,
                  padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontWeight: 700 }}>!</span>
                  {hasError}
                </div>
              ) : entryData && entryData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: T.text, fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>
                    {formatIndicatorValue(ind, lastVal)}
                  </span>
                  {change !== null && (
                    <span style={{
                      color: change >= 0 ? T.positive : T.negative, fontSize: 11, fontWeight: 600,
                    }}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  )}
                  <span style={{ color: T.text3, fontSize: 9, marginLeft: 'auto' }}>
                    {entryData.length} obs
                  </span>
                </div>
              ) : (
                <div style={{ color: T.text3, fontSize: 10 }}>No data available</div>
              )}
            </div>
          );
        })}
      </div>

      <Card T={T} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 16px' }}>
        <span style={{ color: T.text3, fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>DATA SOURCES</span>
        <span style={{ color: T.text3, fontSize: 9, lineHeight: 1.5 }}>
          FRED data sourced from the Federal Reserve Bank of St. Louis (<a href="https://fred.stlouisfed.org" target="_blank" rel="noopener noreferrer" style={{ color: T.info }}>fred.stlouisfed.org</a>).
          World Bank data from the World Bank API. IMF data from the International Monetary Fund.
          Data may be delayed. Verify critical figures with primary sources.
        </span>
      </Card>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
