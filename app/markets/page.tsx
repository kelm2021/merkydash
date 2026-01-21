
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { RefreshCw, TrendingUp, Droplets, BarChart3, Layers, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PoolData {
  address: string;
  chain: string;
  dex: string;
  explorerUrl: string;
  dexUrl: string;
  token0: string;
  token1: string;
  price: string;
  tvl: string;
  volume24h: string;
  transactions: number;
  buys?: number;
  sells?: number;
  feeTier: string;
  unavailable?: boolean;
}

interface VWAPData {
  vwap7d: number;
  vwap30d: number;
  vwap60d: number;
  vwap90d: number;
  vwap180d: number;
  vwap360d: number;
}

interface PriceHistory {
  chartLabels: string[];
  chartPrices: number[];
  allTimeHigh: number;
  allTimeLow: number;
  currentPrice: number;
  vwap: VWAPData;
}

interface MarketData {
  aggregate: {
    totalTVL: string;
    totalVolume24h: string;
    totalTransactions: number;
    totalBuys: number;
    totalSells: number;
    poolCount: number;
  };
  base: {
    pools: PoolData[];
    tvl: string;
    volume24h: string;
  };
  ethereum: {
    pools: PoolData[];
    tvl: string;
    volume24h: string;
  };
  priceHistory: PriceHistory;
}

export default function MarketsPage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMarketData(data);
        } else {
          setError(data.error || 'Failed to load market data');
        }
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch(err => {
        console.error('Error fetching market data:', err);
        setError('Failed to load market data');
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#9DD7E6]/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#9DD7E6]/20 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[#9DD7E6] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-lg text-muted-foreground font-medium">Loading market data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#9DD7E6]/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-lg text-red-500 font-medium">{error || 'Failed to load market data'}</p>
            <Button onClick={fetchData} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#9DD7E6]/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#414042] via-[#414042] to-[#414042]/90 p-8 shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5REQ3RTYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#9DD7E6]/20 flex items-center justify-center">
                <Droplets className="w-7 h-7 text-[#9DD7E6]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Markets & Liquidity</h1>
                <p className="text-[#B8BABC] text-sm mt-1">
                  Real-time MERC liquidity across Ethereum & Base
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-[#9DD7E6] hover:bg-[#9DD7E6]/90 text-[#414042] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>

          {/* Current Price Badge */}
          {marketData.priceHistory?.currentPrice > 0 && (
            <div className="mt-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5">
              <span className="text-[#B8BABC] text-sm font-medium">Current MERC Price</span>
              <span className="text-2xl font-bold text-[#9DD7E6]">${formatPrice(marketData.priceHistory.currentPrice)}</span>
            </div>
          )}
        </div>

        {/* Aggregate Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Droplets className="w-5 h-5" />}
            label="Total Liquidity"
            value={`$${formatNumber(marketData.aggregate.totalTVL)}`}
            gradient="from-[#9DD7E6]/10 to-[#9DD7E6]/5"
            iconBg="bg-[#9DD7E6]/20"
            iconColor="text-[#9DD7E6]"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="24h Volume"
            value={`$${formatNumber(marketData.aggregate.totalVolume24h)}`}
            gradient="from-[#B8BABC]/10 to-[#B8BABC]/5"
            iconBg="bg-[#B8BABC]/20"
            iconColor="text-[#414042]"
          />
          <TransactionStatCard
            totalTransactions={marketData.aggregate.totalTransactions}
            buys={marketData.aggregate.totalBuys}
            sells={marketData.aggregate.totalSells}
          />
          <StatCard
            icon={<Layers className="w-5 h-5" />}
            label="Active Pools"
            value={marketData.aggregate.poolCount.toString()}
            gradient="from-[#414042]/10 to-[#414042]/5"
            iconBg="bg-[#414042]/20"
            iconColor="text-[#414042]"
          />
        </div>

        {/* VWAP Section */}
        {marketData.priceHistory?.vwap && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9DD7E6] to-[#9DD7E6]/70 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">VWAP Indicators</h2>
                <p className="text-xs text-muted-foreground">Volume-weighted average price across all pools</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <VWAPCard period="7D" vwap={marketData.priceHistory.vwap.vwap7d} currentPrice={marketData.priceHistory.currentPrice} />
              <VWAPCard period="30D" vwap={marketData.priceHistory.vwap.vwap30d} currentPrice={marketData.priceHistory.currentPrice} />
              <VWAPCard period="60D" vwap={marketData.priceHistory.vwap.vwap60d} currentPrice={marketData.priceHistory.currentPrice} />
              <VWAPCard period="90D" vwap={marketData.priceHistory.vwap.vwap90d} currentPrice={marketData.priceHistory.currentPrice} />
              <VWAPCard period="180D" vwap={marketData.priceHistory.vwap.vwap180d} currentPrice={marketData.priceHistory.currentPrice} />
              <VWAPCard period="360D" vwap={marketData.priceHistory.vwap.vwap360d} currentPrice={marketData.priceHistory.currentPrice} />
            </div>
          </div>
        )}

        {/* Networks Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Base Network */}
          <NetworkSection
            network="base"
            label="Base Network"
            pools={marketData.base.pools}
            tvl={marketData.base.tvl}
            volume={marketData.base.volume24h}
          />

          {/* Ethereum Network */}
          <NetworkSection
            network="ethereum"
            label="Ethereum Network"
            pools={marketData.ethereum.pools}
            tvl={marketData.ethereum.tvl}
            volume={marketData.ethereum.volume24h}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-[#E2E3E4]">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                <circle cx="125" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="125" cy="375" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
              </svg>
              <span className="text-lg font-bold text-[#414042] tracking-tight">LIQUID MERCURY</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Real-time data from DEX APIs • Auto-refreshes every request
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  gradient,
  iconBg,
  iconColor
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className={`relative overflow-hidden p-5 bg-gradient-to-br ${gradient} border-0 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </Card>
  );
}

// Transaction Stat Card
function TransactionStatCard({
  totalTransactions,
  buys,
  sells
}: {
  totalTransactions: number;
  buys: number;
  sells: number;
}) {
  return (
    <Card className="relative overflow-hidden p-5 bg-gradient-to-br from-green-500/5 to-red-500/5 border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-red-500/20 flex items-center justify-center mb-3">
        <TrendingUp className="w-5 h-5 text-[#414042]" />
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">24h Transactions</p>
      <p className="text-2xl font-bold text-foreground mt-1">{formatNumber(totalTransactions)}</p>
      <div className="flex items-center gap-3 mt-2">
        <span className="flex items-center gap-1 text-xs">
          <ArrowUpRight className="w-3 h-3 text-green-500" />
          <span className="text-green-600 font-semibold">{formatNumber(buys)}</span>
        </span>
        <span className="flex items-center gap-1 text-xs">
          <ArrowDownRight className="w-3 h-3 text-red-500" />
          <span className="text-red-600 font-semibold">{formatNumber(sells)}</span>
        </span>
      </div>
    </Card>
  );
}

// VWAP Card Component
function VWAPCard({ period, vwap, currentPrice }: { period: string; vwap: number; currentPrice: number }) {
  const isAbove = currentPrice >= vwap;

  return (
    <Card className="p-4 bg-white border border-[#E2E3E4] hover:border-[#9DD7E6] transition-colors duration-200 shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#9DD7E6] uppercase">{period}</span>
        <div className={`w-2 h-2 rounded-full ${isAbove ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
      <p className="text-lg font-bold text-foreground">${formatPrice(vwap)}</p>
    </Card>
  );
}

// Network Section Component
function NetworkSection({
  network,
  label,
  pools,
  tvl,
  volume
}: {
  network: 'base' | 'ethereum';
  label: string;
  pools: PoolData[];
  tvl: string;
  volume: string;
}) {
  const isBase = network === 'base';
  const accentColor = isBase ? '#0052FF' : '#627EEA';
  const bgGradient = isBase
    ? 'from-[#0052FF]/5 to-[#0052FF]/0'
    : 'from-[#627EEA]/5 to-[#627EEA]/0';

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${bgGradient} p-6 border border-[#E2E3E4]`}>
      {/* Network Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: accentColor }}
          >
            {isBase ? 'B' : 'E'}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{label}</h3>
            <p className="text-xs text-muted-foreground">{pools.length} active pool{pools.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl p-3 border border-[#E2E3E4]">
          <p className="text-xs text-muted-foreground font-medium">TVL</p>
          <p className="text-lg font-bold text-foreground">${formatNumber(tvl)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#E2E3E4]">
          <p className="text-xs text-muted-foreground font-medium">24h Volume</p>
          <p className="text-lg font-bold text-foreground">${formatNumber(volume)}</p>
        </div>
      </div>

      {/* Pools */}
      <div className="space-y-3">
        {pools.map((pool, idx) => (
          <PoolCard key={idx} pool={pool} accentColor={accentColor} />
        ))}
      </div>
    </div>
  );
}

// Pool Card Component
function PoolCard({ pool, accentColor }: { pool: PoolData; accentColor: string }) {
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
      pool.unavailable ? 'opacity-60' : ''
    }`}>
      {/* Pool Header */}
      <div className="p-4 bg-gradient-to-r from-[#F6F6F6] to-white border-b border-[#E2E3E4]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">{pool.token0}/{pool.token1}</span>
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {pool.dex}
            </span>
          </div>
          {pool.unavailable && (
            <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded">
              Unavailable
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Fee Tier: {pool.feeTier}</p>
      </div>

      {/* Pool Body */}
      {pool.unavailable ? (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Data temporarily unavailable</p>
        </div>
      ) : (
        <div className="p-4">
          {/* Price Highlight */}
          <div className="mb-4 p-3 bg-[#9DD7E6]/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Current Price</p>
            <p className="text-2xl font-bold text-[#9DD7E6]">${pool.price}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">TVL</p>
              <p className="font-semibold text-foreground">${formatNumber(pool.tvl)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">24h Volume</p>
              <p className="font-semibold text-foreground">${formatNumber(pool.volume24h)}</p>
            </div>
          </div>

          {/* Transactions */}
          <div className="flex items-center justify-between py-3 border-t border-[#E2E3E4]">
            <span className="text-xs text-muted-foreground">Transactions</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs">
                <ArrowUpRight className="w-3 h-3 text-green-500" />
                <span className="font-semibold text-green-600">{formatNumber(pool.buys || 0)}</span>
              </span>
              <span className="flex items-center gap-1 text-xs">
                <ArrowDownRight className="w-3 h-3 text-red-500" />
                <span className="font-semibold text-red-600">{formatNumber(pool.sells || 0)}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <a
              href={pool.dexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-[#9DD7E6] hover:bg-[#9DD7E6]/90 text-[#414042] font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors"
            >
              Trade
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={pool.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-[#F6F6F6] hover:bg-[#E2E3E4] text-[#414042] font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors"
            >
              Contract
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}

// Helper function to format prices
function formatPrice(value: number): string {
  if (isNaN(value) || value === 0) return '0.00';

  if (value < 0.01) {
    return value.toFixed(6);
  } else if (value < 1) {
    return value.toFixed(4);
  } else {
    return value.toFixed(2);
  }
}

// Helper function to format numbers
function formatNumber(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }

  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
