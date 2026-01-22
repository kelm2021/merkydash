'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Droplets, BarChart3, Layers, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { PageHeader, PriceBadge, SectionHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataBadge, ChainBadge } from '@/components/ui/data-badge';
import { cn } from '@/lib/utils';

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
      <div className="min-h-screen page-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-mercury-aqua/20 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-mercury-aqua border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-lg text-muted-foreground font-display">Loading market data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <div className="min-h-screen page-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">!</span>
            </div>
            <p className="text-lg text-red-500 font-display">{error || 'Failed to load market data'}</p>
            <Button onClick={fetchData} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Header */}
        <PageHeader
          title="Markets & Liquidity"
          subtitle="Real-time MERC liquidity across Ethereum & Base"
          actions={
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-mercury-aqua hover:bg-mercury-aqua-dark text-mercury-dark-grey font-semibold shadow-glow hover:shadow-glow transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          }
        >
          {marketData.priceHistory?.currentPrice > 0 && (
            <PriceBadge price={`$${formatPrice(marketData.priceHistory.currentPrice)}`} />
          )}
        </PageHeader>

        {/* Aggregate Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Liquidity"
            value={`$${formatNumber(marketData.aggregate.totalTVL)}`}
            icon={Droplets}
            iconColor="text-mercury-aqua"
            delay={0}
          />
          <StatCard
            title="24h Volume"
            value={`$${formatNumber(marketData.aggregate.totalVolume24h)}`}
            icon={BarChart3}
            iconColor="text-mercury-dark-grey"
            delay={50}
          />
          <TransactionStatCard
            totalTransactions={marketData.aggregate.totalTransactions}
            buys={marketData.aggregate.totalBuys}
            sells={marketData.aggregate.totalSells}
          />
          <StatCard
            title="Active Pools"
            value={marketData.aggregate.poolCount.toString()}
            icon={Layers}
            iconColor="text-mercury-dark-grey"
            delay={150}
          />
        </div>

        {/* VWAP Section */}
        {marketData.priceHistory?.vwap && (
          <div className="mb-8">
            <SectionHeader
              title="VWAP Indicators"
              subtitle="Volume-weighted average price across all pools"
            />
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
        <footer className="mt-12 pt-8 border-t border-mercury-light-grey/50">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                <circle cx="125" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="125" cy="375" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
              </svg>
              <span className="text-lg font-display font-bold text-mercury-dark-grey tracking-tight">LIQUID MERCURY</span>
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
    <GlassCard className="p-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            24h Transactions
          </p>
          <span className="text-2xl md:text-3xl font-display font-bold text-mercury-dark-grey tabular-nums">
            {formatNumber(totalTransactions)}
          </span>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600 font-semibold tabular-nums">{formatNumber(buys)}</span>
            </span>
            <span className="flex items-center gap-1 text-xs">
              <ArrowDownRight className="w-3 h-3 text-red-500" />
              <span className="text-red-600 font-semibold tabular-nums">{formatNumber(sells)}</span>
            </span>
          </div>
        </div>
        <div className="icon-container icon-container-md bg-gradient-to-br from-emerald-100 to-red-100">
          <TrendingUp className="h-5 w-5 text-mercury-dark-grey" />
        </div>
      </div>
    </GlassCard>
  );
}

// VWAP Card Component
function VWAPCard({ period, vwap, currentPrice }: { period: string; vwap: number; currentPrice: number }) {
  const isAbove = currentPrice >= vwap;

  return (
    <GlassCard className="p-4 hover:shadow-glow transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-display font-bold text-mercury-aqua uppercase">{period}</span>
        <div className={cn(
          'w-2 h-2 rounded-full',
          isAbove ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-red-500 shadow-sm shadow-red-500/50'
        )}></div>
      </div>
      <p className="text-lg font-display font-bold text-mercury-dark-grey tabular-nums">${formatPrice(vwap)}</p>
    </GlassCard>
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

  return (
    <GlassCard className={cn(
      'p-6 border',
      isBase ? 'border-[#0052FF]/20' : 'border-[#627EEA]/20'
    )}>
      {/* Network Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <ChainBadge chain={isBase ? 'BASE' : 'ETH'} />
          <div>
            <h3 className="font-display font-bold text-mercury-dark-grey">{label}</h3>
            <p className="text-xs text-muted-foreground">{pools.length} active pool{pools.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/60 rounded-xl p-3 border border-mercury-light-grey/30">
          <p className="text-xs text-muted-foreground font-medium mb-1">TVL</p>
          <p className="text-lg font-display font-bold text-mercury-dark-grey tabular-nums">${formatNumber(tvl)}</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 border border-mercury-light-grey/30">
          <p className="text-xs text-muted-foreground font-medium mb-1">24h Volume</p>
          <p className="text-lg font-display font-bold text-mercury-dark-grey tabular-nums">${formatNumber(volume)}</p>
        </div>
      </div>

      {/* Pools */}
      <div className="space-y-3">
        {pools.map((pool, idx) => (
          <PoolCard key={idx} pool={pool} network={network} />
        ))}
      </div>
    </GlassCard>
  );
}

// Pool Card Component
function PoolCard({ pool, network }: { pool: PoolData; network: 'base' | 'ethereum' }) {
  const isBase = network === 'base';

  return (
    <div className={cn(
      'rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg bg-white/80 border border-mercury-light-grey/30',
      pool.unavailable && 'opacity-60'
    )}>
      {/* Pool Header */}
      <div className={cn(
        'p-4 border-b border-mercury-light-grey/30',
        isBase ? 'bg-gradient-to-r from-[#0052FF]/5 to-transparent' : 'bg-gradient-to-r from-[#627EEA]/5 to-transparent'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-display font-bold text-mercury-dark-grey">{pool.token0}/{pool.token1}</span>
            <DataBadge variant={isBase ? 'base' : 'ethereum'} size="sm">
              {pool.dex}
            </DataBadge>
          </div>
          {pool.unavailable && (
            <DataBadge variant="negative" size="sm">
              Unavailable
            </DataBadge>
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
          <div className="mb-4 p-3 bg-mercury-aqua/10 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Current Price</p>
            <p className="text-2xl font-display font-bold text-mercury-aqua tabular-nums">${pool.price}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">TVL</p>
              <p className="font-semibold text-mercury-dark-grey tabular-nums">${formatNumber(pool.tvl)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">24h Volume</p>
              <p className="font-semibold text-mercury-dark-grey tabular-nums">${formatNumber(pool.volume24h)}</p>
            </div>
          </div>

          {/* Transactions */}
          <div className="flex items-center justify-between py-3 border-t border-mercury-light-grey/30">
            <span className="text-xs text-muted-foreground">Transactions</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                <span className="font-semibold text-emerald-600 tabular-nums">{formatNumber(pool.buys || 0)}</span>
              </span>
              <span className="flex items-center gap-1 text-xs">
                <ArrowDownRight className="w-3 h-3 text-red-500" />
                <span className="font-semibold text-red-600 tabular-nums">{formatNumber(pool.sells || 0)}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <a
              href={pool.dexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-mercury-aqua hover:bg-mercury-aqua-dark text-mercury-dark-grey font-semibold py-2.5 px-3 rounded-xl text-sm transition-all duration-200 shadow-glow-sm hover:shadow-glow"
            >
              Trade
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={pool.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-mercury-fog hover:bg-mercury-light-grey text-mercury-dark-grey font-semibold py-2.5 px-3 rounded-xl text-sm transition-colors"
            >
              Contract
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
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
