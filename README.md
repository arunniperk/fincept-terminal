# Fincept Terminal

A web-based desktop trading & investment platform with Bloomberg-terminal aesthetics and Obsidian dark theme. Built with Electron + Vite + React.

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Live market indices (SENSEX, NIFTY, DOW, S&P 500, NASDAQ, USD/INR), top movers, market summary |
| **Markets** | Sector performance grid, 12-stock NIFTY50 depth table, sortable columns, NSE/BSE/US tabs |
| **Portfolio** | Holdings table with add/delete/import/export, SVG donut allocation chart, performance chart, winners/losers, load demo data |
| **Watchlist** | Multi-list tabs (Main/Tech/Crypto/HighYield), add symbols, sortable |
| **News** | 20+ articles with category filter and sentiment badges |
| **AI Agents** | 37 research personas, structured analysis cards (conviction, fair value, upside, risks), Groq/Gemini API key config |
| **Economics** | 15 FRED/World Bank indicators with sparklines, country filter, API key config |
| **Brokers** | 8 Indian broker cards (Zerodha, Angel One, Upstox, Dhan, Groww, IIFL, Kotak, 5Paisa), CSV import, encrypted storage |
| **Optimizer** | Modern Portfolio Theory engine — risk metrics, efficient frontier chart, rebalance table, correlation heatmap |
| **Notes** | Sidebar list with 300ms auto-save debounce |
| **Alerts** | Trigger conditions, on/off toggle, create form, history table |
| **Settings** | API key config, font size, density, market defaults, data export/import/clear |

## Quick Start

```bash
npm install
npm run build
npx electron .
```

### Development

```bash
npm run dev        # Vite dev server at http://localhost:5173
electron .         # Launch in Electron (loads dev server)
```

### Build Installer (Admin only)

```bash
npm run dist:win   # Produces portable + NSIS installer in release/
```

## Tech Stack

- **Frontend:** React 19 + Vite
- **Desktop:** Electron 42
- **State:** localStorage + Electron IPC file storage
- **Styling:** Plain CSS (Obsidian dark theme)
- **Charts:** SVG (allocation, performance, efficient frontier, heatmap)

## Data

Currently uses mock data. API keys can be configured in Settings for live data via Groq, Gemini, and FRED.

## Project Structure

```
src/
  modules/     — 12 lazy-loaded feature modules
  components/  — Shared UI (Sidebar, Button, Card, Tabs, etc.)
  data/        — Personas, brokers, economic indicators, MPT engine
  theme.js     — Obsidian dark theme tokens
  storage.js   — localStorage wrapper
main.cjs       — Electron main process (IPC, net-fetch, file storage)
preload.cjs    — Context bridge (storageRead, storageWrite, fileSave, netFetch)
```
