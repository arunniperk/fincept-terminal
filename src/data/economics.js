const FRED_BASE = 'https://api.stlouisfed.org/fred';

export const FRED_SERIES = {
  GDP: 'GDP',                    // US GDP
  GDPC1: 'GDPC1',                // Real GDP
  CPIAUCSL: 'CPIAUCSL',          // CPI All Items
  FEDFUNDS: 'FEDFUNDS',          // Fed Funds Rate
  UNRATE: 'UNRATE',              // Unemployment
  DGS10: 'DGS10',                // 10Y Treasury
  DGS2: 'DGS2',                  // 2Y Treasury
  T10YIE: 'T10YIE',              // 10Y Breakeven Inflation
  SP500: 'SP500',                // S&P 500
  M2SL: 'M2SL',                  // M2 Money Stock
  INDPRO: 'INDPRO',              // Industrial Production
};

export const INDICATORS = [
  { id: 'FEDFUNDS', name: 'Fed Funds Rate', source: 'FRED', country: 'US', unit: '%', color: '#f44336', desc: 'US Federal Reserve interest rate target' },
  { id: 'CPIAUCSL', name: 'CPI Inflation', source: 'FRED', country: 'US', unit: 'YoY%', color: '#ff9800', desc: 'Consumer Price Index for All Urban Consumers' },
  { id: 'UNRATE', name: 'Unemployment', source: 'FRED', country: 'US', unit: '%', color: '#2196f3', desc: 'US civilian unemployment rate' },
  { id: 'GDPC1', name: 'Real GDP', source: 'FRED', country: 'US', unit: 'B$', color: '#4caf50', desc: 'Real Gross Domestic Product (chained)' },
  { id: 'DGS10', name: '10Y Treasury', source: 'FRED', country: 'US', unit: '%', color: '#9c27b0', desc: 'US 10-Year Treasury Constant Maturity Rate' },
  { id: 'DGS2', name: '2Y Treasury', source: 'FRED', country: 'US', unit: '%', color: '#00bcd4', desc: 'US 2-Year Treasury Constant Maturity Rate' },
  { id: 'T10YIE', name: '10Y Breakeven', source: 'FRED', country: 'US', unit: '%', color: '#ff5722', desc: '10-Year Breakeven Inflation Rate' },
  { id: 'M2SL', name: 'M2 Money Supply', source: 'FRED', country: 'US', unit: 'B$', color: '#607d8b', desc: 'M2 Money Stock' },
  { id: 'INDPRO', name: 'Industrial Prod.', source: 'FRED', country: 'US', unit: 'Index', color: '#795548', desc: 'Industrial Production Index' },
  { id: 'GDP', name: 'Nominal GDP', source: 'FRED', country: 'US', unit: 'B$', color: '#8bc34a', desc: 'Gross Domestic Product' },
  // World Bank indicators
  { id: 'NY.GDP.MKTP.CD', name: 'GDP (World)', source: 'WORLD_BANK', country: 'World', unit: 'B$', color: '#3f51b5', desc: 'World GDP (current US$)' },
  // IMF indicators
  { id: 'NGDP_R', name: 'IMF World GDP', source: 'IMF', country: 'World', unit: '%', color: '#e91e63', desc: 'IMF World GDP Growth Projection' },
];

export async function fetchFredSeries(seriesId, apiKey, count = 120) {
  const url = `${FRED_BASE}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${count}&observation_start=2020-01-01`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${seriesId}: HTTP ${res.status}`);
  const json = await res.json();
  if (json?.error_message) throw new Error(`FRED ${seriesId}: ${json.error_message}`);
  return (json.observations || [])
    .filter(o => o.value !== '.')
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
    .reverse();
}

export async function fetchWorldBankIndicator(indicatorId, count = 60) {
  const url = `https://api.worldbank.org/v2/country/1W/indicator/${indicatorId}?format=json&per_page=${count}&date=2000:2026`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank ${indicatorId}: HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || json.length < 2) return [];
  return json[1].filter(d => d.value != null).map(d => ({ date: `${d.date}`, value: parseFloat(d.value) })).reverse();
}

export async function fetchImfData(country = 'W00', indicator = 'NGDP_R', count = 20) {
  const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}/?periods=2020:2030`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const values = json?.values?.[indicator];
    if (!values) return [];
    const series = values[country] || values['W00'] || {};
    return Object.entries(series)
      .filter(([, v]) => v != null)
      .map(([year, value]) => ({ date: year, value: parseFloat(value) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch { return []; }
}

export async function fetchIndicatorData(indicator, fredApiKey) {
  switch (indicator.source) {
    case 'FRED':
      if (!fredApiKey) return { data: [], error: 'FRED API key required' };
      try {
        const data = await fetchFredSeries(indicator.id, fredApiKey);
        return { data, error: null };
      } catch (e) {
        return { data: [], error: e.message };
      }
    case 'WORLD_BANK':
      try {
        const data = await fetchWorldBankIndicator(indicator.id);
        return { data, error: null };
      } catch (e) {
        return { data: [], error: e.message };
      }
    case 'IMF':
      try {
        const data = await fetchImfData('W00', indicator.id);
        return { data, error: null };
      } catch (e) {
        return { data: [], error: e.message };
      }
    default:
      return { data: [], error: 'Unknown source' };
  }
}

export async function fetchMultipleIndicators(indicators, fredApiKey, onProgress) {
  const results = {};
  for (let i = 0; i < indicators.length; i++) {
    const ind = indicators[i];
    results[ind.id] = { loading: true, data: [], error: null };
    if (onProgress) onProgress(i + 1, indicators.length, ind);
    const result = await fetchIndicatorData(ind, fredApiKey);
    results[ind.id] = { loading: false, data: result.data, error: result.error };
  }
  return results;
}

export function formatIndicatorValue(indicator, value) {
  if (value == null) return '—';
  switch (indicator.unit) {
    case '%':
    case 'YoY%':
      return value.toFixed(2) + '%';
    case 'B$':
      return '$' + (value / 1e9).toFixed(1) + 'T';
    case 'Index':
      return value.toFixed(1);
    default:
      return value.toFixed(2);
  }
}
