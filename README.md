# MERC Token Dashboard - Token Metrics & Markets

Internal dashboard for Liquid Mercury displaying real-time MERC token metrics and market data.

## 🎯 Features Included

### Token Metrics Page (Landing Page)
- **Real-time Market Data**: Live price, market cap, 24h volume, and TVL
- **Live Transactions**: On-chain transactions from Ethereum and Base networks with transaction type identification (Buy/Sell/Transfer)
- **Top Holders**: Top 20 token holders across both chains with ownership percentages
- **Interactive Charts**: Price history and market trends

### Markets Page
- **DEX Integration**: Live data from Uniswap V3 (Ethereum & Base) and Aerodrome (Base)
- **TVL Tracking**: Total Value Locked across all liquidity pools
- **Market Statistics**: Trading volume, price changes, and liquidity metrics
- **Multi-chain Support**: Aggregated data from Ethereum and Base networks
- **Transaction Breakdown**: Total buy/sell transaction counts

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Liquid Mercury branding
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Data Sources**: 
  - DexScreener API (primary)
  - GeckoTerminal API (fallback)
  - Etherscan/Basescan APIs

## 🎨 Branding

- **Colors**: Silver (#B8BABC), Aqua (#9DD7e6), Black (#000000)
- **Font**: Montserrat
- **Logos**: Included in `/public` directory

## 📁 Project Structure

```
.
├── app/
│   ├── page.tsx                              # Token Metrics (Landing)
│   ├── markets/page.tsx                      # Markets Page
│   ├── token-metrics/page.tsx                # Token Metrics (Alternative Route)
│   ├── api/
│   │   ├── market-data/route.ts              # DEX data aggregation
│   │   ├── blockchain-transactions/route.ts  # Live transactions with type detection
│   │   └── blockchain-holders/route.ts       # Top holders data
│   ├── layout.tsx                            # Root layout
│   └── globals.css                           # Global styles
├── components/
│   ├── dashboard-header.tsx                  # Navigation header with refresh
│   ├── theme-provider.tsx                    # Dark mode support
│   └── ui/                                   # shadcn/ui components
├── lib/
│   ├── utils.ts                              # Utility functions
│   └── types.ts                              # TypeScript interfaces
└── public/                                   # Brand assets
```

## 🔧 Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Environment Variables:**
   Create a `.env` file with:
   ```env
   ETHERSCAN_API_KEY=your_etherscan_key
   BASESCAN_API_KEY=your_basescan_key
   ```

3. **Run development server:**
   ```bash
   yarn dev
   ```

4. **Build for production:**
   ```bash
   yarn build
   yarn start
   ```

## 🌐 Contract Addresses

- **Ethereum**: `0x2f27118E3D2332aFb7E3d059B5C850aC4BB01a99`
- **Base**: `0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058`

## 🔄 Refresh Functionality

Both pages include a Refresh button in the header that:
- Reloads live market data
- Updates transaction feeds
- Refreshes holder information
- Shows loading state during refresh

## 📊 Data Sources

### Market Data
- **Primary**: DexScreener API (https://api.dexscreener.com)
- **Fallback**: GeckoTerminal API (https://api.geckoterminal.com)
- **Cache**: 60-second cache for performance

### Blockchain Data
- **Transactions**: Etherscan v2 API & Basescan API
- **Holders**: Etherscan v2 API & Basescan API
- **Real-time**: Live data from blockchain explorers

## 🎯 Key Features

- ✅ Real-time price tracking
- ✅ Multi-chain support (Ethereum + Base)
- ✅ Transaction type identification (Buy/Sell/Transfer)
- ✅ Live TVL calculation across all pools
- ✅ Top holders with ownership percentages
- ✅ Responsive design with dark mode
- ✅ Error handling with fallback data
- ✅ 60s caching for optimal performance
- ✅ Explorer links to transactions and addresses
- ✅ Chain-specific badges and formatting

## 📝 Notes

- This is an internal dashboard for Liquid Mercury
- Excludes staking records functionality
- Focuses on market metrics and live blockchain data
- Uses official Liquid Mercury branding guidelines
- Optimized for performance with API caching

## 🚀 Deployment

Deployed at: `merc.abacusai.app`

---

**Built for Liquid Mercury** | [Website](https://liquidmercury.com)
