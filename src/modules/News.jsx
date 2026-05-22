import { useState, useMemo } from 'react';
import { Ic } from '../icons';
import { Btn, Badge, Input } from '../components/ui';

const READ_KEY = 'pm_news_read';

const CATEGORIES = ['All', 'Markets', 'Macro', 'Earnings', 'IPO', 'Economy'];

const SOURCES = ['Bloomberg', 'Reuters', 'CNBC', 'Economic Times', 'Mint', 'Financial Times', 'WSJ', 'Business Standard'];

const SENTIMENTS = ['positive', 'neutral', 'negative'];

const MOCK_ARTICLES = Array.from({ length: 20 }, (_, i) => {
  const cat = CATEGORIES[1 + (i % 5)];
  const source = SOURCES[i % SOURCES.length];
  const sentiment = SENTIMENTS[i % 3];
  const date = new Date(Date.now() - i * 3600000 * (2 + (i % 5)));
  const headlines = [
    'RBI holds repo rate steady at 6.5% amid inflation concerns',
    'Nifty hits fresh all-time high above 25,800 driven by IT rally',
    'India GDP growth revised to 7.2% for FY25 by World Bank',
    'SEBI tightens F&O regulations for retail investors',
    'TCS wins $2.5B contract from UK-based banking giant',
    'Crude oil prices drop below $75 as demand fears persist',
    'Rupee strengthens to 83.12 against US dollar on FII inflows',
    'IPO boom continues; 8 companies file DRHP this week',
    'Fed signals potential rate cut in December meeting',
    'Adani Group stocks rally after positive Q2 earnings report',
    'Gold prices surge to record high above $2,700 per ounce',
    'Zomato shares jump 12% on first profitable quarter',
    'India manufacturing PMI expands to 58.4 in October',
    'Paytm receives final payment aggregator approval from RBI',
    'European markets mixed as energy crisis concerns ease',
    'Reliance Jio launches 5G services in 200 additional cities',
    'Bitcoin crosses $68,000 as ETF inflows accelerate',
    'HDFC Bank reported 18% rise in net profit for Q2',
    'India retail inflation eases to 4.87% in September',
    'Nvidia shares surge on strong AI chip demand guidance',
  ];
  return {
    id: i + 1,
    category: cat,
    source,
    headline: headlines[i],
    date: date.toISOString(),
    sentiment,
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.

This is a significant development that market participants have been closely watching. Analysts suggest this could have far-reaching implications for the sector, with potential ripple effects across related industries. Market experts recommend keeping a close watch on upcoming policy announcements and earnings reports for further clarity.`,
    url: '#',
  };
});

function loadRead() {
  try {
    const d = localStorage.getItem(READ_KEY);
    if (d) { const p = JSON.parse(d); if (Array.isArray(p)) return p; }
  } catch {}
  return [];
}

function SentBadge({ sentiment, T }) {
  const colors = {
    positive: { bg: T.positiveBg, text: T.positive, label: 'Bullish' },
    neutral: { bg: T.warningBg, text: T.warning, label: 'Neutral' },
    negative: { bg: T.negativeBg, text: T.negative, label: 'Bearish' },
  };
  const c = colors[sentiment] || colors.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10,
      background: c.bg, color: c.text, fontSize: 9, fontWeight: 600, letterSpacing: 0.3,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.text }} />
      {c.label}
    </span>
  );
}

export function News({ T }) {
  const [articles] = useState(MOCK_ARTICLES);
  const [readIds, setReadIds] = useState(loadRead);
  const [activeId, setActiveId] = useState(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let data = [...articles];
    if (category !== 'All') data = data.filter(a => a.category === category);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(a => a.headline.toLowerCase().includes(q) || a.source.toLowerCase().includes(q));
    }
    return data;
  }, [articles, category, search]);

  const active = articles.find(a => a.id === activeId) || filtered[0] || null;

  function markRead(id) {
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      localStorage.setItem(READ_KEY, JSON.stringify(next));
    }
  }

  function markAllRead() {
    const all = articles.map(a => a.id);
    setReadIds(all);
    localStorage.setItem(READ_KEY, JSON.stringify(all));
  }

  function selectArticle(a) {
    setActiveId(a.id);
    markRead(a.id);
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diffH = Math.floor((now - d) / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  const pillBase = {
    padding: '4px 14px', borderRadius: 4, border: 'none',
    fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all .1s',
    fontFamily: T.font,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, height: '100%', overflow: 'hidden', fontFamily: T.font }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: T.text, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>News</span>
        </div>
        <Btn T={T} style={{ gap: 6, padding: '6px 14px', fontSize: 11 }} onClick={markAllRead}>
          <Ic.Check /> Mark All Read
        </Btn>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            ...pillBase,
            background: category === c ? T.accentBg : T.surface3,
            color: category === c ? T.accent : T.text2,
            border: category === c ? `1px solid ${T.accent}` : `1px solid ${T.border2}`,
          }}>
            {c}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ width: 200 }}>
          <Input
            T={T}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search headlines..."
            style={{ fontSize: 11, padding: '6px 10px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flex: 1, overflow: 'hidden' }}>

        <div style={{
          width: 300, minWidth: 300, background: T.surface2, borderRadius: T.r,
          border: `1px solid ${T.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '8px 12px', borderBottom: `1px solid ${T.border}`,
            color: T.text3, fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
          }}>
            {filtered.length} article{filtered.length !== 1 ? 's' : ''}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: T.text3, fontSize: 11 }}>
                No articles found
              </div>
            ) : (
              filtered.map(a => {
                const isActive = active?.id === a.id;
                const isRead = readIds.includes(a.id);
                return (
                  <div key={a.id} onClick={() => selectArticle(a)} style={{
                    padding: '12px 14px', cursor: 'pointer', transition: 'background .1s',
                    borderBottom: `1px solid ${T.border}`,
                    background: isActive ? T.accentBg : 'transparent',
                    borderLeft: isActive ? `3px solid ${T.accent}` : '3px solid transparent',
                    opacity: isRead && !isActive ? 0.65 : 1,
                  }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.surface3; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ color: T.text3, fontSize: 9, fontWeight: 500 }}>{fmtDate(a.date)}</span>
                      <span style={{
                        padding: '1px 6px', borderRadius: 3, background: T.surface3,
                        color: T.text2, fontSize: 8, fontWeight: 600, letterSpacing: 0.3,
                      }}>
                        {a.source}
                      </span>
                      <SentBadge sentiment={a.sentiment} T={T} />
                    </div>
                    <span style={{
                      color: T.text, fontSize: 11, fontWeight: 500, lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {a.headline}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{
          flex: 1, background: T.surface2, borderRadius: T.r,
          border: `1px solid ${T.border}`, overflow: 'auto', padding: 20,
        }}>
          {!active ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.text3, fontSize: 12 }}>
              Select an article to read
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 3, background: T.surface3,
                  color: T.accent, fontSize: 9, fontWeight: 600, letterSpacing: 0.3,
                }}>
                  {active.category}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: 3, background: T.surface3,
                  color: T.text2, fontSize: 9, fontWeight: 600,
                }}>
                  {active.source}
                </span>
                <SentBadge sentiment={active.sentiment} T={T} />
                <span style={{ color: T.text3, fontSize: 10, marginLeft: 'auto' }}>
                  {new Date(active.date).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  })}
                </span>
              </div>

              <h1 style={{ color: T.text, fontSize: 20, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
                {active.headline}
              </h1>

              <div style={{
                color: T.text2, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                borderTop: `1px solid ${T.border}`, paddingTop: 16,
              }}>
                {active.body}
              </div>

              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                <a href={active.url} style={{
                  color: T.accent, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  Read More <span style={{ fontSize: 14 }}>→</span>
                </a>
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
