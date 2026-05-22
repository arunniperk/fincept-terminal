export const T = {
  name: 'Obsidian',
  bg: '#080808',
  surface: '#111111',
  surface2: '#1a1a1a',
  surface3: '#222222',
  surface4: '#2a2a2a',
  border: '#2a2a2a',
  border2: '#333333',
  text: '#e8e8e8',
  text2: '#b0b0b0',
  text3: '#707070',
  accent: '#f0b90b',
  accent2: '#d4a408',
  accentBg: '#f0b90b10',
  positive: '#00c853',
  positiveBg: '#00c85310',
  negative: '#ff5252',
  negativeBg: '#ff525210',
  warning: '#ff9800',
  warningBg: '#ff980010',
  info: '#42a5f5',
  infoBg: '#42a5f510',
  chart: ['#f0b90b', '#00c853', '#42a5f5', '#ff5252', '#ab47bc', '#ff9800'],
  r: 8,
  font: "'SF Mono', 'Menlo', 'Consolas', 'Courier New', monospace",
};

export function applyTheme(t) {
  const r = document.documentElement;
  Object.entries(t).forEach(([k, v]) => {
    if (typeof v === 'string' && k !== 'name' && k !== 'font' && k !== 'chart') {
      r.style.setProperty(`--${k}`, v);
    }
  });
  r.style.setProperty('--font', t.font);
}
