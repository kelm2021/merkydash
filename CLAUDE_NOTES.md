# Merkydash - Claude Session Notes

## Project Overview
- **Stack:** Next.js 14, TypeScript, Tailwind CSS, Chart.js/react-chartjs-2
- **Purpose:** MERC token (Liquid Mercury) monitoring dashboard with multi-chain support (Ethereum & Base)
- **Repo:** https://github.com/kelm2021/merkydash.git
- **Branch:** main

## Key Files
- `app/markets/page.tsx` — Markets & Liquidity page, contains Price History chart component (`PriceHistorySection`)
- `app/api/market-data/route.ts` — API route fetching OHLCV data from DexScreener/GeckoTerminal
- `components/ui/` — Shared UI components (GlassCard, StatCard, PageHeader, etc.)
- `lib/utils.ts` — Helper utilities
- `lib/types.ts` — TypeScript type definitions

## Design System
- **Primary color:** Mercury Aqua `#9DD7E6`
- **Theme:** Dark with glass morphism effects
- **Chart colors:** Price `#9DD7E6`, 7D MA `#8b5cf6` (purple, dashed), 30D MA `#fbbf24` (amber, dashed)
- **Grid lines:** Horizontal `rgba(143,145,148, 0.15)`, Vertical `rgba(143,145,148, 0.1)`

## Changes Made (Jan 27, 2026)

### 1. Tooltip Redesign (commit 9c0c3a3)
- **Problem:** Large floating tooltip box obscured the chart when hovering
- **Solution:** Replaced with a fixed "data bar" above the chart that updates on hover. Chart only shows a thin vertical crosshair line — no box overlay.
- Data bar shows: date, price, day change, H/L, 7D/30D MA, ATH/ATL distance, volume
- When not hovering, displays the latest day's data
- Subtle border highlight when actively hovering

### 2. Grid Lines (commits 8be9bc0, 4083389)
- Added subtle vertical grid lines to x-axis
- Increased horizontal grid line opacity for better readability
- Final values: horizontal 0.15, vertical 0.1

## Architecture Notes
- Chart uses `onHover` callback to set React state (`hoveredData`), which renders the data bar via JSX — keeps tooltip out of canvas entirely
- External tooltip callback only renders a crosshair `<div>` line
- Data flows: DexScreener/GeckoTerminal → `/api/market-data` → `PriceHistorySection` component
- OHLCV data aggregated across 3 pools (Uniswap Base, Uniswap ETH, Aerodrome)
- VWAP calculated for 7D/30D/60D/90D/180D/360D periods
