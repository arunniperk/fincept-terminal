export const BROKERS = [
  {
    id: 'zerodha',
    name: 'Zerodha',
    logo: 'Z',
    color: '#4184f3',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Your Zerodha Client ID', type: 'text' },
      { key: 'apiKey', label: 'API Key', placeholder: 'Your Kite API Key', type: 'text' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Paste access token from Kite', type: 'password' },
    ],
    docUrl: 'https://kite.trade/docs/connect/v3/',
    apiBase: 'https://api.kite.trade',
    csvFormat: 'zerodha',
  },
  {
    id: 'angelone',
    name: 'Angel One',
    logo: 'A',
    color: '#2a2a2a',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Your Angel Client ID', type: 'text' },
      { key: 'apiKey', label: 'API Key', placeholder: 'Your SmartAPI Key', type: 'text' },
      { key: 'totp', label: 'TOTP Secret', placeholder: 'Base32 TOTP secret (optional)', type: 'password' },
    ],
    docUrl: 'https://smartapi.angelbroking.com/',
    apiBase: 'https://apiconnect.angelbroking.com',
    csvFormat: 'angelone',
  },
  {
    id: 'upstox',
    name: 'Upstox',
    logo: 'U',
    color: '#00bcd4',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Your Upstox Client ID', type: 'text' },
      { key: 'apiKey', label: 'API Key', placeholder: 'Your Upstox API Key', type: 'text' },
      { key: 'redirectUri', label: 'Redirect URI', placeholder: 'http://localhost:5173/callback', type: 'text' },
    ],
    docUrl: 'https://upstox.com/developer/',
    apiBase: 'https://api.upstox.com/v2',
    csvFormat: 'upstox',
  },
  {
    id: 'dhan',
    name: 'Dhan',
    logo: 'D',
    color: '#162b3c',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Your Dhan Client ID', type: 'text' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Your Dhan API Token', type: 'password' },
    ],
    docUrl: 'https://api.dhan.co/',
    apiBase: 'https://api.dhan.co',
    csvFormat: 'dhan',
  },
  {
    id: 'groww',
    name: 'Groww',
    logo: 'G',
    color: '#00d09c',
    fields: [
      { key: 'email', label: 'Email', placeholder: 'Your Groww registered email', type: 'text' },
    ],
    docUrl: 'https://groww.in/',
    apiBase: null,
    csvFormat: 'groww',
    note: 'Groww does not provide a public API. Use CSV export from Groww app → Holdings → Export.',
  },
  {
    id: 'iiFl',
    name: 'IIFL',
    logo: 'I',
    color: '#003366',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Your IIFL Client ID', type: 'text' },
      { key: 'apiKey', label: 'API Key', placeholder: 'Your IIFL API Key', type: 'text' },
    ],
    docUrl: 'https://www.iifl.com/',
    apiBase: 'https://api.iifl.com',
    csvFormat: 'iifl',
  },
  {
    id: 'kotak',
    name: 'Kotak Sec',
    logo: 'K',
    color: '#f16623',
    fields: [
      { key: 'clientId', label: 'User ID', placeholder: 'Your Kotak User ID', type: 'text' },
      { key: 'consumerKey', label: 'Consumer Key', placeholder: 'Your API Consumer Key', type: 'text' },
    ],
    docUrl: 'https://www.kotaksecurities.com/',
    apiBase: 'https://api.kotaksecurities.com',
    csvFormat: 'kotak',
  },
  {
    id: '5paisa',
    name: '5Paisa',
    logo: '5',
    color: '#e31e24',
    fields: [
      { key: 'clientId', label: 'Client Code', placeholder: 'Your 5Paisa Client Code', type: 'text' },
      { key: 'apiKey', label: 'App Key', placeholder: 'Your App Key', type: 'text' },
    ],
    docUrl: 'https://www.5paisa.com/',
    apiBase: 'https://OpenAPI.5paisa.com',
    csvFormat: '5paisa',
  },
];

export function getBroker(id) {
  return BROKERS.find(b => b.id === id) || null;
}

export function encryptCreds(value) {
  try {
    const encoded = btoa(encodeURIComponent(value));
    const reversed = encoded.split('').reverse().join('');
    return `b1_${reversed}`;
  } catch { return value; }
}

export function decryptCreds(encrypted) {
  try {
    if (!encrypted?.startsWith('b1_')) return encrypted;
    const reversed = encrypted.slice(3).split('').reverse().join('');
    return decodeURIComponent(atob(reversed));
  } catch { return encrypted; }
}

export function brokerApiCall(brokerId, endpoint, method = 'GET', body = null, creds = {}) {
  const broker = getBroker(brokerId);
  if (!broker?.apiBase) return Promise.reject(new Error('No API base for this broker'));

  const headers = { 'Content-Type': 'application/json' };

  switch (brokerId) {
    case 'zerodha':
      headers['X-Kite-Version'] = '3';
      if (creds.accessToken) headers['Authorization'] = `token ${creds.apiKey}:${creds.accessToken}`;
      break;
    case 'angelone':
      headers['X-ClientCode'] = creds.clientId || '';
      headers['X-ApiKey'] = creds.apiKey || '';
      // Requires JWT token from login step
      if (creds.jwtToken) headers['Authorization'] = `Bearer ${creds.jwtToken}`;
      break;
    case 'upstox':
      if (creds.accessToken) headers['Authorization'] = `Bearer ${creds.accessToken}`;
      break;
    case 'dhan':
      headers['access-token'] = creds.accessToken || '';
      break;
    default:
      break;
  }

  const url = `${broker.apiBase}${endpoint}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  return fetch(url, opts).then(r => {
    if (!r.ok) return r.json().then(e => { throw new Error(e?.message || e?.error_description || `HTTP ${r.status}`); });
    return r.json();
  });
}

export function isApiAvailable(brokerId) {
  const broker = getBroker(brokerId);
  return !!broker?.apiBase;
}

export const ZERODHA_HOLDINGS_ENDPOINT = '/portfolio/holdings';
export const ANGELONE_HOLDINGS_ENDPOINT = '/rest/secure/angelbroking/portfolio/v1/getPosition';
export const UPSTOX_HOLDINGS_ENDPOINT = '/portfolio/long-term-holdings';
export const DHAN_HOLDINGS_ENDPOINT = '/v2/portfolios/holdings';

export function parseBrokerCsv(text, brokerId) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const rows = lines.slice(1).map(l => {
    const vals = l.split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });

  switch (brokerId) {
    case 'zerodha':
      return rows.map(r => ({
        symbol: (r.tradingsymbol || r.symbol || '').trim(),
        name: r.isin || '',
        qty: parseFloat(r.quantity || r.qty || 0),
        buyPrice: parseFloat(r.averageprice || r.buy_price || r.avg_cost || 0),
        exchange: (r.exchange || 'NSE').toUpperCase(),
      })).filter(r => r.symbol && r.qty > 0);

    case 'angelone':
      return rows.map(r => ({
        symbol: (r.tradingsymbol || r.symbol || '').trim(),
        name: (r.symbolname || r.name || '').trim(),
        qty: parseFloat(r.quantity || r.qty || r.netqty || 0),
        buyPrice: parseFloat(r.averageprice || r.avgprice || r.buy_price || 0),
        exchange: (r.exchange || 'NSE').toUpperCase(),
      })).filter(r => r.symbol && r.qty > 0);

    case 'groww':
      return rows.map(r => ({
        symbol: ((r.symbol || r.ticker || '').trim() + '.NS').trim(),
        name: (r.company || r.name || '').trim(),
        qty: parseFloat(r.quantity || r.qty || r.units || 0),
        buyPrice: parseFloat(r.avg_cost || r.average_price || r.buy_price || 0),
        exchange: 'NSE',
      })).filter(r => r.symbol.replace('.NS', '') && r.qty > 0);

    case 'upstox':
    case 'dhan':
    case 'iifl':
    case 'kotak':
    case '5paisa':
    default:
      return rows.map(r => ({
        symbol: (r.tradingsymbol || r.symbol || r.ticker || r.scripname || '').trim(),
        name: (r.company || r.name || r.symbolname || '').trim(),
        qty: parseFloat(r.quantity || r.qty || r.netqty || r.units || 0),
        buyPrice: parseFloat(r.averageprice || r.buy_price || r.avg_cost || r.average_price || 0),
        exchange: (r.exchange || r.exch_segment || 'NSE').toUpperCase(),
      })).filter(r => {
        const sym = r.symbol.replace('.NS', '').replace('.BO', '').trim();
        return sym && r.qty > 0;
      });
  }
}
