
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center py-12">
            <div className="text-xl text-muted-foreground">Loading market data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center py-12">
            <div className="text-xl text-red-500">{error || 'Failed to load market data'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-6">
        {/* Page Header with Refresh */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">MERC Markets & Liquidity</h1>
            <p className="text-sm text-muted-foreground">
              Real-time liquidity pool data across Ethereum and Base networks
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Aggregate Overview */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-[#9DD7E6]/10 to-[#6AB5C6]/10 border-[#9DD7E6]">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Aggregate Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Liquidity (TVL)" value={`$${formatNumber(marketData.aggregate.totalTVL)}`} />
            <MetricCard label="24h Volume" value={`$${formatNumber(marketData.aggregate.totalVolume24h)}`} />
            <TransactionsMetricCard 
              totalTransactions={marketData.aggregate.totalTransactions}
              buys={marketData.aggregate.totalBuys}
              sells={marketData.aggregate.totalSells}
            />
            <MetricCard label="Active Pools" value={marketData.aggregate.poolCount.toString()} />
          </div>
        </Card>

        {/* Base Network Section */}
        <section className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-foreground">Base Network</h2>
            <span className="bg-[#14B8A6] text-white px-3 py-1 rounded text-sm font-semibold">
              BASE
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <MetricCard label="Total TVL" value={`$${formatNumber(marketData.base.tvl)}`} />
            <MetricCard label="24h Volume" value={`$${formatNumber(marketData.base.volume24h)}`} />
            <MetricCard label="Pools" value={marketData.base.pools.length.toString()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {marketData.base.pools.map((pool, idx) => (
              <PoolCard key={idx} pool={pool} />
            ))}
          </div>
        </section>

        {/* Ethereum Network Section */}
        <section className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-foreground">Ethereum Network</h2>
            <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded text-sm font-semibold">
              ETH
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <MetricCard label="Total TVL" value={`$${formatNumber(marketData.ethereum.tvl)}`} />
            <MetricCard label="24h Volume" value={`$${formatNumber(marketData.ethereum.volume24h)}`} />
            <MetricCard label="Pools" value={marketData.ethereum.pools.length.toString()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {marketData.ethereum.pools.map((pool, idx) => (
              <PoolCard key={idx} pool={pool} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-6 text-muted-foreground text-sm mt-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg
              className="w-[30px] h-[30px]"
              viewBox="0 0 500 500"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="125" cy="125" r="115" fill="#BBBABC"/>
              <circle cx="375" cy="125" r="115" fill="#BBBABC"/>
              <circle cx="125" cy="375" r="115" fill="#BBBABC"/>
              <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
            </svg>
            <span className="text-base font-semibold text-foreground">LIQUID MERCURY</span>
          </div>
          <p className="font-medium">Data updates in real-time from DEX subgraphs and APIs</p>
        </div>
      </div>
    </div>
  );
}

// MetricCard Component
function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 border shadow-sm">
      <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-xl font-bold text-foreground">
        {value}
      </div>
    </Card>
  );
}

// TransactionsMetricCard Component with buy/sell breakdown
function TransactionsMetricCard({ 
  totalTransactions, 
  buys, 
  sells 
}: { 
  totalTransactions: number; 
  buys: number; 
  sells: number; 
}) {
  return (
    <Card className="p-4 border shadow-sm">
      <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">
        Total Transactions
      </div>
      <div className="text-xl font-bold text-foreground mb-2">
        {formatNumber(totalTransactions)}
      </div>
      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-muted-foreground">Buys:</span>
          <span className="font-semibold text-foreground">{formatNumber(buys)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-muted-foreground">Sells:</span>
          <span className="font-semibold text-foreground">{formatNumber(sells)}</span>
        </div>
      </div>
    </Card>
  );
}

// PoolCard Component
function PoolCard({ pool }: { pool: PoolData }) {
  return (
    <Card className={`p-5 border-2 transition-colors ${
      pool.unavailable 
        ? 'border-orange-500/30 bg-orange-50/5' 
        : 'border-[#9DD7E6]/30 hover:border-[#9DD7E6]'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-lg font-bold text-foreground">
              {pool.token0}/{pool.token1}
            </h3>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${
              pool.chain === 'base' ? 'bg-[#14B8A6]' : 'bg-[#8B5CF6]'
            }`}>
              {pool.chain.toUpperCase()}
            </span>
            {pool.unavailable && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-500 text-white">
                DATA UNAVAILABLE
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground font-semibold">
            {pool.dex} • Fee: {pool.feeTier}
          </div>
        </div>
      </div>

      {pool.unavailable ? (
        <div className="py-6 mb-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            ⚠️ Unable to fetch live data from APIs
          </p>
          <p className="text-xs text-muted-foreground">
            The pool exists but data providers are temporarily unavailable.
            <br />
            Try refreshing in a few minutes.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-semibold">Price ({pool.token1}):</span>
            <span className="text-sm font-bold text-[#9DD7E6]">${pool.price}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-semibold">TVL:</span>
            <span className="text-sm font-bold text-foreground">${formatNumber(pool.tvl)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-semibold">24h Volume:</span>
            <span className="text-sm font-bold text-foreground">${formatNumber(pool.volume24h)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-semibold">Transactions:</span>
            <span className="text-sm font-bold text-foreground">{formatNumber(pool.transactions)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-muted-foreground">Buys:</span>
              <span className="font-semibold text-foreground">{formatNumber(pool.buys || 0)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-muted-foreground">Sells:</span>
              <span className="font-semibold text-foreground">{formatNumber(pool.sells || 0)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-border">
        <a
          href={pool.dexUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#9DD7E6] hover:bg-[#8AC5D4] text-black font-semibold py-2 px-3 rounded text-sm text-center transition-colors"
        >
          View on {pool.dex}
        </a>
        <a
          href={pool.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 px-3 rounded text-sm text-center transition-colors"
        >
          View Contract
        </a>
      </div>
    </Card>
  );
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
