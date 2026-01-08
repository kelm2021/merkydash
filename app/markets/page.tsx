
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import DashboardHeader from '@/components/dashboard-header';
import { Layers, Activity, TrendingUp, ExternalLink, Shield, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

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
      <div className="min-h-screen bg-black text-white">
        <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <main className="container mx-auto px-6 py-20 text-center font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
          Initializing Market Link...
        </main>
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <div className="min-h-screen bg-black text-white">
        <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <main className="container mx-auto px-6 py-20 text-center">
          <div className="p-8 glass-dark inline-block rounded-2xl border border-red-500/20">
            <p className="text-xl text-red-400 font-bold mb-4">{error || 'Handshake Failed'}</p>
            <Button onClick={handleRefresh} variant="outline" className="border-white/10 text-white">Retry Connection</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-accent/30">
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-6 py-12 max-w-7xl"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-8 border-b border-white/10">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                Markets & Liquidity
              </h1>
              <p className="text-muted-foreground font-medium">
                Deep liquidity monitoring across Ethereum and Base networks
              </p>
            </div>

            <div className="hidden lg:flex gap-4">
              <div className="px-4 py-2 glass-dark rounded-xl border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Sync: Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Aggregate Overview */}
        <motion.div variants={itemVariants} className="mb-16">
          <Card className="p-8 bg-gradient-to-br from-accent/10 via-transparent to-transparent border-white/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-64 h-64 -translate-y-20 translate-x-20 rotate-12" />
            </div>

            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Aggregate Real-Time Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <MetricBox label="Total Liquidity (TVL)" value={`$${formatNumber(marketData.aggregate.totalTVL)}`} />
              <MetricBox label="24h Volume" value={`$${formatNumber(marketData.aggregate.totalVolume24h)}`} />
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Transactions</p>
                <div className="text-3xl font-mono font-bold">{formatNumber(marketData.aggregate.totalTransactions)}</div>
                <div className="flex gap-4">
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full" /> {formatNumber(marketData.aggregate.totalBuys)} Buys
                  </span>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
                    <div className="w-1 h-1 bg-red-400 rounded-full" /> {formatNumber(marketData.aggregate.totalSells)} Sells
                  </span>
                </div>
              </div>
              <MetricBox label="Connected Pools" value={marketData.aggregate.poolCount.toString()} />
            </div>
          </Card>
        </motion.div>

        {/* Network Sections */}
        <div className="space-y-20">
          <NetworkSection
            name="Base Network"
            badge="BASE"
            theme="teal"
            pools={marketData.base.pools}
            tvl={marketData.base.tvl}
            volume={marketData.base.volume24h}
          />

          <NetworkSection
            name="Ethereum Network"
            badge="ETH"
            theme="purple"
            pools={marketData.ethereum.pools}
            tvl={marketData.ethereum.tvl}
            volume={marketData.ethereum.volume24h}
          />
        </div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="mt-32 pt-16 border-t border-white/10 text-center pb-12">
          <Zap className="h-8 w-8 text-accent mx-auto mb-6" />
          <p className="text-muted-foreground font-medium mb-2">MERC OS Institutional Data Stream</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em]">Latency: 14ms • Status: Nominal</p>
        </motion.div>
      </motion.main>
    </div>
  );
}

function NetworkSection({ name, badge, theme, pools, tvl, volume }: { name: string, badge: string, theme: 'teal' | 'purple', pools: PoolData[], tvl: string, volume: string }) {
  return (
    <motion.section variants={itemVariants}>
      <div className="flex items-center justify-between mb-8 border-l-4 border-white pl-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">{name}</h2>
          <span className={cn(
            "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white",
            theme === 'teal' ? 'bg-teal-500' : 'bg-purple-500'
          )}>
            {badge}
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Network TVL</p>
            <p className="text-sm font-mono font-bold text-white">${formatNumber(tvl)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Network Volume</p>
            <p className="text-sm font-mono font-bold text-white">${formatNumber(volume)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pools.map((pool, idx) => (
          <PoolCard key={idx} pool={pool} theme={theme} />
        ))}
      </div>
    </motion.section>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
        {label}
      </div>
      <div className="text-3xl font-mono font-bold tracking-tighter">
        {value}
      </div>
    </div>
  );
}

function PoolCard({ pool, theme }: { pool: PoolData, theme: 'teal' | 'purple' }) {
  return (
    <Card className={cn(
      "p-6 border-white/10 bg-black/40 hover:bg-black/60 transition-all duration-500 group relative",
      pool.unavailable && "opacity-80"
    )}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold tracking-tight">
              {pool.token0} / {pool.token1}
            </h3>
            {pool.unavailable && (
              <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                Maintenance
              </span>
            )}
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {pool.dex} • Fee Tier: <span className="text-accent">{pool.feeTier}</span>
          </p>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transition-transform">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" asChild>
            <a href={pool.dexUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" asChild>
            <a href={pool.explorerUrl} target="_blank" rel="noopener noreferrer"><Shield className="h-3 w-3" /></a>
          </Button>
        </div>
      </div>

      {pool.unavailable ? (
        <div className="py-10 text-center glass-dark rounded-2xl border border-white/5 mx-2">
          <Info className="h-6 w-6 text-orange-400 mx-auto mb-3" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Stream Interrupted</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Exchange Rate</p>
              <p className="text-lg font-mono font-bold text-accent">${pool.price}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Liquidity Dept</p>
              <p className="text-lg font-mono font-bold">${formatNumber(pool.tvl)}</p>
            </div>
          </div>

          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              className={cn(
                "h-full",
                theme === 'teal' ? "bg-teal-500" : "bg-purple-500"
              )}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-muted-foreground">Vol:</span>
                <span className="text-white">${formatNumber(pool.volume24h)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span className="text-muted-foreground">TX:</span>
                <span className="text-white">{formatNumber(pool.transactions)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

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
