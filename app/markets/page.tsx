'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Droplets, BarChart3, Layers, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { PageHeader, PriceBadge, SectionHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataBadge, ChainBadge } from '@/components/ui/data-badge';
import { cn } from '@/lib/utils';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

interface DailyDataPoint {
  timestamp: number;
  date: string;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma7: number;
  ma30: number;
  athDistance: number;
  atlDistance: number;
}

interface PriceHistory {
  chartLabels: string[];
  chartPrices: number[];
  allTimeHigh: number;
  allTimeLow: number;
  currentPrice: number;
  vwap: VWAPData;
  dailyData?: DailyDataPoint[];
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

  // Calculate current price from live pool data (same as Token Metrics page)
  const pools = [
    ...(marketData?.base?.pools || []),
    ...(marketData?.ethereum?.pools || [])
  ];
  const livePrices = pools.map((p: any) => parseFloat(p.price)).filter((p: number) => p > 0);
  const currentPrice = livePrices.length > 0
    ? livePrices.reduce((a: number, b: number) => a + b, 0) / livePrices.length
    : marketData?.priceHistory?.currentPrice || 0;

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
              className="bg-mercury-aqua hover:bg-mercury-aqua-dark text-white font-semibold shadow-glow hover:shadow-glow transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          }
        >
          {currentPrice > 0 && (
            <PriceBadge price={`$${currentPrice.toFixed(6)}`} />
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
            iconColor="text-white"
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
            iconColor="text-white"
            delay={150}
          />
        </div>

        {/* Price History Chart */}
        <PriceHistorySection priceHistory={marketData.priceHistory} currentPrice={currentPrice} />

        {/* VWAP Section */}
        {marketData.priceHistory?.vwap && (
          <div className="mb-8">
            <SectionHeader
              title="VWAP Indicators"
              subtitle="Volume-weighted average price across all pools"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <VWAPCard period="7D" vwap={marketData.priceHistory.vwap.vwap7d} currentPrice={currentPrice} />
              <VWAPCard period="30D" vwap={marketData.priceHistory.vwap.vwap30d} currentPrice={currentPrice} />
              <VWAPCard period="60D" vwap={marketData.priceHistory.vwap.vwap60d} currentPrice={currentPrice} />
              <VWAPCard period="90D" vwap={marketData.priceHistory.vwap.vwap90d} currentPrice={currentPrice} />
              <VWAPCard period="180D" vwap={marketData.priceHistory.vwap.vwap180d} currentPrice={currentPrice} />
              <VWAPCard period="360D" vwap={marketData.priceHistory.vwap.vwap360d} currentPrice={currentPrice} />
            </div>
          </div>
        )}

        {/* Networks Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
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
        <footer className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                <circle cx="125" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="125" cy="375" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
              </svg>
              <span className="text-lg font-display font-bold text-white tracking-tight">LIQUID MERCURY</span>
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
          <span className="text-2xl md:text-3xl font-display font-bold text-white tabular-nums">
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
        <div className="icon-container icon-container-md bg-gradient-to-br from-emerald-500/20 to-red-500/20">
          <TrendingUp className="h-5 w-5 text-white" />
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
      <p className="text-lg font-display font-bold text-white tabular-nums">${formatPrice(vwap)}</p>
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
            <h3 className="font-display font-bold text-white">{label}</h3>
            <p className="text-xs text-muted-foreground">{pools.length} active pool{pools.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-muted-foreground font-medium mb-1">TVL</p>
          <p className="text-lg font-display font-bold text-white tabular-nums">${formatNumber(tvl)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-muted-foreground font-medium mb-1">24h Volume</p>
          <p className="text-lg font-display font-bold text-white tabular-nums">${formatNumber(volume)}</p>
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
      'rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg bg-white/5 border border-white/10',
      pool.unavailable && 'opacity-60'
    )}>
      {/* Pool Header */}
      <div className={cn(
        'p-4 border-b border-white/10',
        isBase ? 'bg-gradient-to-r from-[#0052FF]/5 to-transparent' : 'bg-gradient-to-r from-[#627EEA]/5 to-transparent'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-display font-bold text-white">{pool.token0}/{pool.token1}</span>
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
              <p className="font-semibold text-white tabular-nums">${formatNumber(pool.tvl)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">24h Volume</p>
              <p className="font-semibold text-white tabular-nums">${formatNumber(pool.volume24h)}</p>
            </div>
          </div>

          {/* Transactions */}
          <div className="flex items-center justify-between py-3 border-t border-white/10">
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
              className="flex items-center justify-center gap-1.5 bg-mercury-aqua hover:bg-mercury-aqua-dark text-white font-semibold py-2.5 px-3 rounded-xl text-sm transition-all duration-200 shadow-glow-sm hover:shadow-glow"
            >
              Trade
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={pool.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-3 rounded-xl text-sm transition-colors"
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

// Format volume helper
function formatVolume(vol: number): string {
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

// Format percentage helper
function formatPercent(pct: number, showSign = true): string {
  const sign = showSign && pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

// Time frame options
type TimeFrame = '7D' | '30D' | '90D' | '1Y';

const TIME_FRAME_DAYS: Record<TimeFrame, number> = {
  '7D': 7,
  '30D': 30,
  '90D': 90,
  '1Y': 365,
};

// Price History Section Component
function PriceHistorySection({ priceHistory, currentPrice: livePriceParam }: { priceHistory: PriceHistory; currentPrice: number }) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('90D');

  const allDailyData = priceHistory?.dailyData || [];
  const currentPrice = livePriceParam || priceHistory?.currentPrice || 0;
  const allTimeHigh = priceHistory?.allTimeHigh || 0;
  const allTimeLow = priceHistory?.allTimeLow || 0;

  // Filter data based on selected time frame
  const daysToShow = TIME_FRAME_DAYS[timeFrame];
  const dailyData = allDailyData.slice(-daysToShow);
  const useDetailedChart = dailyData.length > 0;

  // Calculate period high/low for the selected timeframe
  const periodHigh = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.high)) : 0;
  const periodLow = dailyData.length > 0 ? Math.min(...dailyData.map(d => d.low).filter(l => l > 0)) : 0;

  // Calculate period change
  const periodStartPrice = dailyData.length > 0 ? dailyData[0].close : 0;
  const periodEndPrice = dailyData.length > 0 ? dailyData[dailyData.length - 1].close : 0;
  const periodChange = periodStartPrice > 0 ? ((periodEndPrice - periodStartPrice) / periodStartPrice * 100) : 0;

  // Chart data
  const priceChartData = useDetailedChart ? {
    labels: dailyData.map((d: DailyDataPoint) => d.label),
    datasets: [
      {
        label: 'Price',
        data: dailyData.map((d: DailyDataPoint) => d.close),
        borderColor: '#9DD7E6',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(157, 215, 230, 0.25)');
          gradient.addColorStop(1, 'rgba(157, 215, 230, 0.02)');
          return gradient;
        },
        borderWidth: 2.5,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#9DD7E6',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#9DD7E6',
        pointHoverBorderWidth: 2,
        order: 1,
      },
      {
        label: '7D MA',
        data: dailyData.map((d: DailyDataPoint) => d.ma7),
        borderColor: 'rgba(139, 92, 246, 0.8)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [4, 4],
        tension: 0.3,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        order: 2,
      },
      {
        label: '30D MA',
        data: dailyData.map((d: DailyDataPoint) => d.ma30),
        borderColor: 'rgba(251, 191, 36, 0.7)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [8, 4],
        tension: 0.3,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        order: 3,
      }
    ]
  } : {
    labels: priceHistory?.chartLabels?.length > 0
      ? priceHistory.chartLabels
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Price',
      data: priceHistory?.chartPrices?.length > 0
        ? priceHistory.chartPrices
        : [0.0012, 0.0015, 0.0018, 0.0025, 0.0042, 0.0058, 0.0072],
      borderColor: '#9DD7E6',
      backgroundColor: 'rgba(157, 215, 230, 0.15)',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#9DD7E6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  // Chart options
  const priceChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
        external: useDetailedChart ? (context: any) => {
          const { chart, tooltip } = context;

          // Get or create tooltip element
          let tooltipEl = chart.canvas.parentNode.querySelector('.custom-tooltip');
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'custom-tooltip';
            tooltipEl.style.cssText = `
              position: absolute;
              background: rgba(30, 30, 32, 0.95);
              border: 1px solid rgba(157, 215, 230, 0.3);
              border-radius: 10px;
              padding: 14px;
              pointer-events: none;
              font-size: 12px;
              font-weight: bold;
              color: #B8BABC;
              z-index: 100;
              transition: opacity 0.15s ease;
            `;
            chart.canvas.parentNode.appendChild(tooltipEl);
          }

          // Hide if no tooltip
          if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
          }

          // Get data
          const dataIndex = tooltip.dataPoints?.[0]?.dataIndex;
          if (dataIndex === undefined) return;

          const day = dailyData[dataIndex];
          if (!day) return;

          const prevDay = dataIndex > 0 ? dailyData[dataIndex - 1] : null;
          const dayChange = prevDay ? ((day.close - prevDay.close) / prevDay.close * 100) : 0;
          const dayChangeColor = dayChange >= 0 ? '#34d399' : '#f87171';
          const athColor = day.athDistance >= 0 ? '#34d399' : '#f87171';
          const atlColor = day.atlDistance >= 0 ? '#34d399' : '#f87171';

          // Build HTML
          tooltipEl.innerHTML = `
            <div style="color: #fff; font-size: 13px; margin-bottom: 10px;">${day.date}</div>
            <div style="margin-bottom: 4px;">Price: <span style="color: #9DD7E6;">$${formatPrice(day.close)}</span></div>
            <div style="margin-bottom: 10px;">Day Change: <span style="color: ${dayChangeColor};">${prevDay ? formatPercent(dayChange) : 'N/A'}</span></div>
            <div style="margin-bottom: 4px;">High: <span style="color: #fff;">$${formatPrice(day.high)}</span></div>
            <div style="margin-bottom: 10px;">Low: <span style="color: #fff;">$${formatPrice(day.low)}</span></div>
            <div style="margin-bottom: 4px;">7D MA: <span style="color: #a78bfa;">$${formatPrice(day.ma7)}</span></div>
            <div style="margin-bottom: 10px;">30D MA: <span style="color: #fbbf24;">$${formatPrice(day.ma30)}</span></div>
            <div style="margin-bottom: 4px;">From ATH: <span style="color: ${athColor};">${formatPercent(day.athDistance)}</span></div>
            <div style="margin-bottom: ${day.volume > 0 ? '10px' : '0'};">From ATL: <span style="color: ${atlColor};">${formatPercent(day.atlDistance)}</span></div>
            ${day.volume > 0 ? `<div>Volume: <span style="color: #fff;">${formatVolume(day.volume)}</span></div>` : ''}
          `;

          // Position tooltip
          const canvasRect = chart.canvas.getBoundingClientRect();
          const tooltipWidth = tooltipEl.offsetWidth;
          const tooltipHeight = tooltipEl.offsetHeight;

          let left = tooltip.caretX + 10;
          let top = tooltip.caretY - tooltipHeight / 2;

          // Keep tooltip within bounds
          if (left + tooltipWidth > chart.width) {
            left = tooltip.caretX - tooltipWidth - 10;
          }
          if (top < 0) top = 10;
          if (top + tooltipHeight > chart.height) {
            top = chart.height - tooltipHeight - 10;
          }

          tooltipEl.style.opacity = '1';
          tooltipEl.style.left = left + 'px';
          tooltipEl.style.top = top + 'px';
        } : undefined,
        backgroundColor: 'rgba(30, 30, 32, 0.95)',
        titleColor: '#fff',
        titleFont: { size: 13, weight: 'bold' as const },
        bodyColor: '#B8BABC',
        bodyFont: { size: 12, weight: 'bold' as const },
        borderColor: 'rgba(157, 215, 230, 0.3)',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 10,
        displayColors: false,
        callbacks: !useDetailedChart ? {
          label: (context: any) => {
            return `Price: $${formatPrice(context.parsed.y)}`;
          }
        } : undefined
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        position: 'right' as const,
        ticks: {
          color: '#8F9194',
          font: { size: 10 },
          callback: (value: number) => `$${formatPrice(value)}`,
          maxTicksLimit: 6,
        },
        grid: {
          color: 'rgba(143, 145, 148, 0.08)',
          drawBorder: false,
        },
        border: { display: false },
      },
      x: {
        ticks: {
          color: '#8F9194',
          font: { size: 10 },
          maxRotation: 0,
          maxTicksLimit: timeFrame === '7D' ? 7 : timeFrame === '30D' ? 10 : timeFrame === '90D' ? 8 : 12,
        },
        grid: { display: false },
        border: { display: false },
      }
    }
  };

  const athChange = allTimeHigh > 0 ? ((currentPrice - allTimeHigh) / allTimeHigh * 100).toFixed(1) : '0';
  const atlChange = allTimeLow > 0 ? ((currentPrice - allTimeLow) / allTimeLow * 100).toFixed(1) : '0';

  // Get subtitle based on time frame
  const getSubtitle = () => {
    const labels: Record<TimeFrame, string> = {
      '7D': '7-day price action',
      '30D': '30-day price action',
      '90D': '90-day price action',
      '1Y': 'Yearly price action',
    };
    return useDetailedChart ? `${labels[timeFrame]} with moving averages` : 'Historical price performance';
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <SectionHeader
          title="Price History"
          subtitle={getSubtitle()}
        />
        {useDetailedChart && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 sm:mt-0">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-mercury-aqua rounded"></span>
              <span>Price</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded" style={{background: 'repeating-linear-gradient(90deg, #8b5cf6 0px, #8b5cf6 4px, transparent 4px, transparent 8px)'}}></span>
              <span>7D MA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded" style={{background: 'repeating-linear-gradient(90deg, #fbbf24 0px, #fbbf24 8px, transparent 8px, transparent 12px)'}}></span>
              <span>30D MA</span>
            </div>
          </div>
        )}
      </div>

      <GlassCard className="p-4 md:p-6 mb-6">
        {/* Time Frame Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
            {(['7D', '30D', '90D', '1Y'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200',
                  timeFrame === tf
                    ? 'bg-mercury-aqua text-mercury-dark-grey shadow-sm'
                    : 'text-muted-foreground hover:text-white hover:bg-white/10'
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Period Stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Period:</span>
              <span className={cn(
                'font-semibold tabular-nums',
                periodChange >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {periodChange >= 0 ? '+' : ''}{periodChange.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">High:</span>
              <span className="font-semibold text-white tabular-nums">${formatPrice(periodHigh)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Low:</span>
              <span className="font-semibold text-white tabular-nums">${formatPrice(periodLow)}</span>
            </div>
          </div>
        </div>

        {/* Mobile Period Stats */}
        <div className="flex sm:hidden items-center justify-between mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Period:</span>
            <span className={cn(
              'font-semibold tabular-nums',
              periodChange >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {periodChange >= 0 ? '+' : ''}{periodChange.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 tabular-nums">H: ${formatPrice(periodHigh)}</span>
            <span className="text-red-400 tabular-nums">L: ${formatPrice(periodLow)}</span>
          </div>
        </div>

        <div className="h-[250px] md:h-[350px] mb-4">
          <Line data={priceChartData} options={priceChartOptions} />
        </div>
        {useDetailedChart && (
          <p className="text-xs text-muted-foreground text-center">
            💡 Hover over the chart to see detailed metrics including daily high/low, moving averages, and distance from ATH/ATL
          </p>
        )}
      </GlassCard>

      {/* ATH/ATL Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-container icon-container-sm bg-emerald-500/20">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">All-Time High</span>
          </div>
          <p className="text-2xl font-display font-bold text-white mb-1 tabular-nums">
            ${allTimeHigh > 0 ? allTimeHigh.toFixed(6) : '0.00'}
          </p>
          <p className={`text-sm font-semibold tabular-nums ${parseFloat(athChange) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {parseFloat(athChange) >= 0 ? '+' : ''}{athChange}% from ATH
          </p>
        </GlassCard>
        <GlassCard className="p-5 border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-container icon-container-sm bg-red-500/20">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">All-Time Low</span>
          </div>
          <p className="text-2xl font-display font-bold text-white mb-1 tabular-nums">
            ${allTimeLow > 0 ? allTimeLow.toFixed(6) : '0.00'}
          </p>
          <p className={`text-sm font-semibold tabular-nums ${parseFloat(atlChange) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {parseFloat(atlChange) >= 0 ? '+' : ''}{atlChange}% from ATL
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
