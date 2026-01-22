'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Users, TrendingUp, Calendar, Target, Wallet, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { PageHeader, SectionHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataBadge, ChainBadge } from '@/components/ui/data-badge';
import { cn } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface NewWallet {
  address: string;
  shortAddress: string;
  chain: string;
  firstAcquisitionDate: string;
  daysSinceAcquisition: number;
  acquisitionMethod: 'Bought' | 'Received' | 'Mixed';
  totalAcquired: number;
  currentBalance: number;
  totalSold: number;
  retentionRate: number;
  status: 'Holding' | 'Partial Exit' | 'Full Exit';
  heldOver20Days: boolean;
  explorerUrl: string;
}

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  newWallets: number;
  totalAcquired: number;
  avgAcquired: number;
}

interface CampaignMetrics {
  campaignStart: string;
  daysSinceCampaign: number;
  totalNewWallets: number;
  totalNewWalletsETH: number;
  totalNewWalletsBASE: number;
  avgAcquisitionAmount: number;
  medianAcquisitionAmount: number;
  walletsHeldOver20Days: number;
  walletsHeldOver20DaysPercent: number;
  walletsStillHolding: number;
  walletsStillHoldingPercent: number;
  walletsFullExit: number;
  walletsFullExitPercent: number;
  totalTokensAcquired: number;
  totalTokensRetained: number;
  overallRetentionRate: number;
  acquisitionByMethod: {
    bought: number;
    received: number;
    mixed: number;
  };
  weeklyBreakdown: WeeklyData[];
  topNewHolders: NewWallet[];
  recentNewWallets: NewWallet[];
  holderSnapshot?: {
    baseline: { eth: number; base: number; total: number };
    current: { eth: number; base: number; total: number };
    growth: { absolute: number; percentage: number; dailyRate: number };
  };
}

export default function HolderMetricsPage() {
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/campaign-metrics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.metrics);
        } else {
          setError(data.error || 'Failed to load campaign metrics');
        }
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch(err => {
        console.error('Error fetching campaign metrics:', err);
        setError('Failed to load campaign metrics');
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
            <p className="mt-6 text-lg text-muted-foreground font-display">Loading campaign metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen page-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">!</span>
            </div>
            <p className="text-lg text-red-500 font-display">{error || 'Failed to load campaign metrics'}</p>
            <p className="text-muted-foreground mt-2 text-sm">Ensure Alchemy API key is configured in Vercel.</p>
            <Button onClick={fetchData} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const weeklyWalletsData = {
    labels: metrics.weeklyBreakdown.map(w => w.weekStart),
    datasets: [{
      label: 'New Wallets',
      data: metrics.weeklyBreakdown.map(w => w.newWallets),
      backgroundColor: '#9DD7E6',
      borderColor: '#9DD7E6',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  const weeklyVolumeData = {
    labels: metrics.weeklyBreakdown.map(w => w.weekStart),
    datasets: [{
      label: 'Tokens Acquired',
      data: metrics.weeklyBreakdown.map(w => w.totalAcquired),
      borderColor: '#14B8A6',
      backgroundColor: 'rgba(20, 184, 166, 0.15)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#14B8A6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };

  const retentionData = {
    labels: ['Still Holding', 'Partial Exit', 'Full Exit'],
    datasets: [{
      data: [
        metrics.walletsStillHolding,
        metrics.totalNewWallets - metrics.walletsStillHolding - metrics.walletsFullExit,
        metrics.walletsFullExit
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0
    }]
  };

  const acquisitionData = {
    labels: ['Bought on DEX', 'Received Transfer', 'Mixed'],
    datasets: [{
      data: [
        metrics.acquisitionByMethod.bought,
        metrics.acquisitionByMethod.received,
        metrics.acquisitionByMethod.mixed
      ],
      backgroundColor: ['#9DD7E6', '#627EEA', '#F59E0B'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(65, 64, 66, 0.95)',
        titleColor: '#fff',
        bodyColor: '#9DD7E6',
        borderColor: 'rgba(157, 215, 230, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#8F9194', font: { family: 'var(--font-body)' } },
        grid: { color: 'rgba(143, 145, 148, 0.08)' }
      },
      x: {
        ticks: { color: '#8F9194', font: { family: 'var(--font-body)' } },
        grid: { display: false }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#8F9194', padding: 15, font: { size: 11, family: 'var(--font-body)' } }
      }
    }
  };

  return (
    <div className="min-h-screen page-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Header */}
        <PageHeader
          title="Wallet Holders"
          subtitle="Campaign adoption metrics since October 20, 2025"
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
          <div className="glass-dark rounded-xl px-5 py-3 inline-flex items-center gap-3">
            <Calendar className="w-4 h-4 text-mercury-aqua" />
            <span className="text-mercury-silver/80 text-sm font-medium">Campaign Started: {metrics.campaignStart}</span>
            <span className="text-mercury-aqua font-display font-bold">{metrics.daysSinceCampaign} days active</span>
          </div>
        </PageHeader>

        {/* Holder Growth Snapshot */}
        {metrics.holderSnapshot && metrics.holderSnapshot.baseline.total > 0 && (
          <div className="mb-8">
            <SectionHeader
              title="Holder Growth Snapshot"
              subtitle="Comparing campaign start to current"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Campaign Start</p>
                <p className="text-3xl font-display font-bold text-muted-foreground tabular-nums">{metrics.holderSnapshot.baseline.total.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <ChainBadge chain="ETH" />
                  <span className="tabular-nums">{metrics.holderSnapshot.baseline.eth.toLocaleString()}</span>
                  <ChainBadge chain="BASE" />
                  <span className="tabular-nums">{metrics.holderSnapshot.baseline.base.toLocaleString()}</span>
                </div>
              </GlassCard>
              <GlassCard className="p-5 border border-mercury-aqua/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Current Holders</p>
                <p className="text-3xl font-display font-bold text-mercury-aqua tabular-nums">{metrics.holderSnapshot.current.total.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <ChainBadge chain="ETH" />
                  <span className="tabular-nums">{metrics.holderSnapshot.current.eth.toLocaleString()}</span>
                  <ChainBadge chain="BASE" />
                  <span className="tabular-nums">{metrics.holderSnapshot.current.base.toLocaleString()}</span>
                </div>
              </GlassCard>
              <GlassCard className={cn(
                'p-5 border',
                metrics.holderSnapshot.growth.absolute >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'
              )}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Growth</p>
                <div className="flex items-center gap-2">
                  {metrics.holderSnapshot.growth.absolute >= 0 ? (
                    <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-red-500" />
                  )}
                  <p className={cn(
                    'text-3xl font-display font-bold tabular-nums',
                    metrics.holderSnapshot.growth.absolute >= 0 ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {metrics.holderSnapshot.growth.absolute >= 0 ? '+' : ''}{metrics.holderSnapshot.growth.absolute.toLocaleString()}
                  </p>
                </div>
                <p className={cn(
                  'text-sm font-semibold mt-1 tabular-nums',
                  metrics.holderSnapshot.growth.percentage >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {metrics.holderSnapshot.growth.percentage >= 0 ? '+' : ''}{metrics.holderSnapshot.growth.percentage}% (~{metrics.holderSnapshot.growth.dailyRate}/day)
                </p>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="New Wallets"
            value={metrics.totalNewWallets.toLocaleString()}
            subtitle={`${metrics.totalNewWalletsETH} ETH / ${metrics.totalNewWalletsBASE} BASE`}
            icon={Users}
            iconColor="text-mercury-aqua"
            delay={0}
          />
          <StatCard
            title="Avg Acquisition"
            value={metrics.avgAcquisitionAmount.toLocaleString()}
            subtitle={`Median: ${metrics.medianAcquisitionAmount.toLocaleString()}`}
            icon={Wallet}
            iconColor="text-white"
            delay={50}
          />
          <StatCard
            title="Held 20+ Days"
            value={metrics.walletsHeldOver20Days.toString()}
            subtitle={`${metrics.walletsHeldOver20DaysPercent}% of new wallets`}
            icon={Calendar}
            iconColor="text-emerald-500"
            delay={100}
          />
          <StatCard
            title="Retention Rate"
            value={`${metrics.overallRetentionRate}%`}
            subtitle={`${metrics.totalTokensRetained.toLocaleString()} MERC retained`}
            icon={Target}
            iconColor={metrics.overallRetentionRate >= 70 ? 'text-emerald-500' : metrics.overallRetentionRate >= 40 ? 'text-amber-500' : 'text-red-500'}
            delay={150}
          />
        </div>

        {/* Retention & Acquisition Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="icon-container icon-container-sm bg-emerald-500/20">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white">Wallet Status</h3>
                <p className="text-xs text-muted-foreground">Current holding status</p>
              </div>
            </div>
            <div className="h-[180px]">
              <Doughnut data={retentionData} options={doughnutOptions} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="icon-container icon-container-sm">
                <Wallet className="w-4 h-4 text-mercury-aqua" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white">Acquisition Method</h3>
                <p className="text-xs text-muted-foreground">How wallets got MERC</p>
              </div>
            </div>
            <div className="h-[180px]">
              <Doughnut data={acquisitionData} options={doughnutOptions} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="icon-container icon-container-sm">
                <Calendar className="w-4 h-4 text-mercury-aqua" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white">20-Day Retention</h3>
                <p className="text-xs text-muted-foreground">Wallets holding 20+ days</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-[140px]">
              <div className="text-center">
                <p className="text-5xl font-display font-bold text-mercury-aqua tabular-nums">{metrics.walletsHeldOver20DaysPercent}%</p>
                <p className="text-muted-foreground text-sm mt-1">{metrics.walletsHeldOver20Days} wallets</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-mercury-aqua to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.walletsHeldOver20DaysPercent}%` }}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Weekly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GlassCard className="p-6">
            <SectionHeader
              title="New Wallets by Week"
              subtitle="Weekly acquisition breakdown"
            />
            <div className="h-[250px] p-2 bg-white/5 rounded-xl">
              <Bar data={weeklyWalletsData} options={chartOptions} />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <SectionHeader
              title="Tokens Acquired by Week"
              subtitle="Total MERC acquired each week"
            />
            <div className="h-[250px] p-2 bg-white/5 rounded-xl">
              <Line data={weeklyVolumeData} options={chartOptions} />
            </div>
          </GlassCard>
        </div>

        {/* Weekly Data Table */}
        <GlassCard className="p-6 mb-8">
          <SectionHeader
            title="Weekly Performance Summary"
            subtitle="Detailed weekly breakdown"
          />
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Week</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">New Wallets</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Total Acquired</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Avg per Wallet</th>
                </tr>
              </thead>
              <tbody>
                {metrics.weeklyBreakdown.map((week, idx) => (
                  <tr key={idx} className="border-t border-white/10 table-row-hover">
                    <td className="px-4 py-3 font-medium">{week.weekStart} - {week.weekEnd}</td>
                    <td className="px-4 py-3 text-right font-display font-bold text-mercury-aqua tabular-nums">{week.newWallets}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{week.totalAcquired.toLocaleString()} MERC</td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{week.avgAcquired.toLocaleString()} MERC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Top New Holders */}
        <GlassCard className="p-6 mb-8">
          <SectionHeader
            title="Top New Holders"
            subtitle="Largest positions since campaign start"
          />
          {metrics.topNewHolders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No holder data available. Alchemy API key may be required.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Wallet</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">First Acquired</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Days Held</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Method</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Acquired</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Current</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Retention</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topNewHolders.map((holder, idx) => (
                    <tr key={idx} className="border-t border-white/10 table-row-hover">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`${holder.explorerUrl}/address/${holder.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-mercury-aqua font-mono text-xs hover:text-mercury-aqua-dark transition-colors"
                          >
                            {holder.shortAddress}
                          </a>
                          <ChainBadge chain={holder.chain as 'ETH' | 'BASE'} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">{holder.firstAcquisitionDate}</td>
                      <td className="px-3 py-3">
                        <DataBadge variant={holder.daysSinceAcquisition >= 20 ? 'positive' : 'neutral'} size="sm">
                          {holder.daysSinceAcquisition}d
                        </DataBadge>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn(
                          'text-xs font-medium',
                          holder.acquisitionMethod === 'Bought' ? 'text-mercury-aqua' :
                          holder.acquisitionMethod === 'Received' ? 'text-[#627EEA]' : 'text-amber-500'
                        )}>
                          {holder.acquisitionMethod}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">{holder.totalAcquired.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-bold tabular-nums">{holder.currentBalance.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={cn(
                          'font-bold tabular-nums',
                          holder.retentionRate >= 80 ? 'text-emerald-500' :
                          holder.retentionRate >= 50 ? 'text-amber-500' : 'text-red-500'
                        )}>
                          {holder.retentionRate}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <DataBadge
                          variant={holder.status === 'Holding' ? 'positive' : holder.status === 'Partial Exit' ? 'neutral' : 'negative'}
                          size="sm"
                        >
                          {holder.status}
                        </DataBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Recent New Wallets */}
        <GlassCard className="p-6 mb-8">
          <SectionHeader
            title="Recent New Wallets"
            subtitle="Most recent acquisitions since campaign start"
          />
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Wallet</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Acquired On</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Days Ago</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Method</th>
                  <th className="px-3 py-3 text-right text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentNewWallets.map((wallet, idx) => (
                  <tr key={idx} className="border-t border-white/10 table-row-hover">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`${wallet.explorerUrl}/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-mercury-aqua font-mono text-xs hover:text-mercury-aqua-dark transition-colors"
                        >
                          {wallet.shortAddress}
                        </a>
                        <ChainBadge chain={wallet.chain as 'ETH' | 'BASE'} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm">{wallet.firstAcquisitionDate}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{wallet.daysSinceAcquisition}d ago</td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        'text-xs font-medium',
                        wallet.acquisitionMethod === 'Bought' ? 'text-mercury-aqua' :
                        wallet.acquisitionMethod === 'Received' ? 'text-[#627EEA]' : 'text-amber-500'
                      )}>
                        {wallet.acquisitionMethod}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">{wallet.totalAcquired.toLocaleString()} MERC</td>
                    <td className="px-3 py-3">
                      <DataBadge
                        variant={wallet.status === 'Holding' ? 'positive' : wallet.status === 'Partial Exit' ? 'neutral' : 'negative'}
                        size="sm"
                      >
                        {wallet.status}
                      </DataBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

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
              Campaign data tracked via Alchemy and Ethplorer APIs
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
