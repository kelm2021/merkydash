
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { RefreshCw, Users, TrendingUp, Calendar, Target, Wallet, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#9DD7E6]/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#9DD7E6]/20 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[#9DD7E6] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-lg text-muted-foreground font-medium">Loading campaign metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#9DD7E6]/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-lg text-red-500 font-medium">{error || 'Failed to load campaign metrics'}</p>
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
      borderRadius: 6
    }]
  };

  const weeklyVolumeData = {
    labels: metrics.weeklyBreakdown.map(w => w.weekStart),
    datasets: [{
      label: 'Tokens Acquired',
      data: metrics.weeklyBreakdown.map(w => w.totalAcquired),
      borderColor: '#14B8A6',
      backgroundColor: 'rgba(20, 184, 166, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
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
      backgroundColor: ['#14B8A6', '#F59E0B', '#EF4444'],
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
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#8F9194' },
        grid: { color: 'rgba(143, 145, 148, 0.1)' }
      },
      x: {
        ticks: { color: '#8F9194' },
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
        labels: { color: '#8F9194', padding: 15, font: { size: 11 } }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#9DD7E6]/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#414042] via-[#414042] to-[#414042]/90 p-8 shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5REQ3RTYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#9DD7E6]/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-[#9DD7E6]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Wallet Holders</h1>
                <p className="text-[#B8BABC] text-sm mt-1">
                  Campaign adoption metrics since October 20, 2025
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

          {/* Campaign Info Badge */}
          <div className="mt-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5">
            <Calendar className="w-4 h-4 text-[#9DD7E6]" />
            <span className="text-[#B8BABC] text-sm font-medium">Campaign Started: {metrics.campaignStart}</span>
            <span className="text-[#9DD7E6] font-bold">{metrics.daysSinceCampaign} days active</span>
          </div>
        </div>

        {/* Holder Growth Snapshot */}
        {metrics.holderSnapshot && metrics.holderSnapshot.baseline.total > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#14B8A6]/70 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Holder Growth Snapshot</h2>
                <p className="text-xs text-muted-foreground">Comparing campaign start to current</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 bg-gradient-to-br from-[#B8BABC]/10 to-[#B8BABC]/5 border-0 shadow-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Campaign Start</p>
                <p className="text-3xl font-bold text-muted-foreground">{metrics.holderSnapshot.baseline.total.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#627EEA]/20 text-[#627EEA] font-semibold">{metrics.holderSnapshot.baseline.eth.toLocaleString()} ETH</span>
                  <span className="px-2 py-0.5 rounded bg-[#0052FF]/20 text-[#0052FF] font-semibold">{metrics.holderSnapshot.baseline.base.toLocaleString()} BASE</span>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-[#9DD7E6]/10 to-[#9DD7E6]/5 border-0 shadow-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Current Holders</p>
                <p className="text-3xl font-bold text-[#9DD7E6]">{metrics.holderSnapshot.current.total.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#627EEA]/20 text-[#627EEA] font-semibold">{metrics.holderSnapshot.current.eth.toLocaleString()} ETH</span>
                  <span className="px-2 py-0.5 rounded bg-[#0052FF]/20 text-[#0052FF] font-semibold">{metrics.holderSnapshot.current.base.toLocaleString()} BASE</span>
                </div>
              </Card>
              <Card className={`p-5 border-0 shadow-sm ${metrics.holderSnapshot.growth.absolute >= 0 ? 'bg-gradient-to-br from-green-500/10 to-green-500/5' : 'bg-gradient-to-br from-red-500/10 to-red-500/5'}`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Growth</p>
                <div className="flex items-center gap-2">
                  {metrics.holderSnapshot.growth.absolute >= 0 ? (
                    <ArrowUpRight className="w-6 h-6 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-red-500" />
                  )}
                  <p className={`text-3xl font-bold ${metrics.holderSnapshot.growth.absolute >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metrics.holderSnapshot.growth.absolute >= 0 ? '+' : ''}{metrics.holderSnapshot.growth.absolute.toLocaleString()}
                  </p>
                </div>
                <p className={`text-sm font-semibold mt-1 ${metrics.holderSnapshot.growth.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.holderSnapshot.growth.percentage >= 0 ? '+' : ''}{metrics.holderSnapshot.growth.percentage}% (~{metrics.holderSnapshot.growth.dailyRate}/day)
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="New Wallets"
            value={metrics.totalNewWallets.toLocaleString()}
            subtext={`${metrics.totalNewWalletsETH} ETH / ${metrics.totalNewWalletsBASE} BASE`}
            gradient="from-[#9DD7E6]/10 to-[#9DD7E6]/5"
            iconBg="bg-[#9DD7E6]/20"
            iconColor="text-[#9DD7E6]"
          />
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label="Avg Acquisition"
            value={`${metrics.avgAcquisitionAmount.toLocaleString()}`}
            subtext={`Median: ${metrics.medianAcquisitionAmount.toLocaleString()}`}
            gradient="from-[#B8BABC]/10 to-[#B8BABC]/5"
            iconBg="bg-[#B8BABC]/20"
            iconColor="text-[#414042]"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Held 20+ Days"
            value={metrics.walletsHeldOver20Days.toString()}
            subtext={`${metrics.walletsHeldOver20DaysPercent}% of new wallets`}
            gradient="from-[#14B8A6]/10 to-[#14B8A6]/5"
            iconBg="bg-[#14B8A6]/20"
            iconColor="text-[#14B8A6]"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Retention Rate"
            value={`${metrics.overallRetentionRate}%`}
            subtext={`${metrics.totalTokensRetained.toLocaleString()} MERC retained`}
            gradient={metrics.overallRetentionRate >= 70 ? "from-green-500/10 to-green-500/5" : metrics.overallRetentionRate >= 40 ? "from-yellow-500/10 to-yellow-500/5" : "from-red-500/10 to-red-500/5"}
            iconBg={metrics.overallRetentionRate >= 70 ? "bg-green-500/20" : metrics.overallRetentionRate >= 40 ? "bg-yellow-500/20" : "bg-red-500/20"}
            iconColor={metrics.overallRetentionRate >= 70 ? "text-green-500" : metrics.overallRetentionRate >= 40 ? "text-yellow-500" : "text-red-500"}
          />
        </div>

        {/* Retention & Acquisition Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#14B8A6]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Wallet Status</h3>
                <p className="text-xs text-muted-foreground">Current holding status</p>
              </div>
            </div>
            <div className="h-[180px]">
              <Doughnut data={retentionData} options={doughnutOptions} />
            </div>
          </Card>

          <Card className="p-5 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#9DD7E6]/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#9DD7E6]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Acquisition Method</h3>
                <p className="text-xs text-muted-foreground">How wallets got MERC</p>
              </div>
            </div>
            <div className="h-[180px]">
              <Doughnut data={acquisitionData} options={doughnutOptions} />
            </div>
          </Card>

          <Card className="p-5 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#9DD7E6]/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#9DD7E6]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">20-Day Retention</h3>
                <p className="text-xs text-muted-foreground">Wallets holding 20+ days</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-[140px]">
              <div className="text-center">
                <p className="text-5xl font-bold text-[#9DD7E6]">{metrics.walletsHeldOver20DaysPercent}%</p>
                <p className="text-muted-foreground text-sm mt-1">{metrics.walletsHeldOver20Days} wallets</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-3 bg-[#E2E3E4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9DD7E6] to-[#14B8A6] rounded-full transition-all duration-500"
                  style={{ width: `${metrics.walletsHeldOver20DaysPercent}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Weekly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#9DD7E6]/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#9DD7E6]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">New Wallets by Week</h3>
                <p className="text-xs text-muted-foreground">Weekly acquisition breakdown</p>
              </div>
            </div>
            <div className="h-[250px]">
              <Bar data={weeklyWalletsData} options={chartOptions} />
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#14B8A6]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Tokens Acquired by Week</h3>
                <p className="text-xs text-muted-foreground">Total MERC acquired each week</p>
              </div>
            </div>
            <div className="h-[250px]">
              <Line data={weeklyVolumeData} options={chartOptions} />
            </div>
          </Card>
        </div>

        {/* Weekly Data Table */}
        <Card className="p-6 mb-8 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#9DD7E6]/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#9DD7E6]" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Weekly Performance Summary</h3>
              <p className="text-xs text-muted-foreground">Detailed weekly breakdown</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#E2E3E4]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F6F6F6]">
                  <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Week</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">New Wallets</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">Total Acquired</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">Avg per Wallet</th>
                </tr>
              </thead>
              <tbody>
                {metrics.weeklyBreakdown.map((week, idx) => (
                  <tr key={idx} className="border-t border-[#E2E3E4] hover:bg-[#F6F6F6]/50">
                    <td className="px-4 py-3 font-medium">{week.weekStart} - {week.weekEnd}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#9DD7E6]">{week.newWallets}</td>
                    <td className="px-4 py-3 text-right">{week.totalAcquired.toLocaleString()} MERC</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{week.avgAcquired.toLocaleString()} MERC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top New Holders */}
        <Card className="p-6 mb-8 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#9DD7E6]/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#9DD7E6]" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Top New Holders</h3>
              <p className="text-xs text-muted-foreground">Largest positions since campaign start</p>
            </div>
          </div>
          {metrics.topNewHolders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No holder data available. Alchemy API key may be required.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#E2E3E4]">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F6F6F6]">
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Wallet</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">First Acquired</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Days Held</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Method</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">Acquired</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">Current</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">Retention</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topNewHolders.map((holder, idx) => (
                    <tr key={idx} className="border-t border-[#E2E3E4] hover:bg-[#F6F6F6]/50">
                      <td className="px-3 py-3">
                        <a
                          href={`${holder.explorerUrl}/address/${holder.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#9DD7E6] font-mono text-xs hover:underline"
                        >
                          {holder.shortAddress}
                        </a>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-semibold ${holder.chain === 'ETH' ? 'bg-[#627EEA]/20 text-[#627EEA]' : 'bg-[#0052FF]/20 text-[#0052FF]'}`}>
                          {holder.chain}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm">{holder.firstAcquisitionDate}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          holder.daysSinceAcquisition >= 20 ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'
                        }`}>
                          {holder.daysSinceAcquisition}d
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium ${
                          holder.acquisitionMethod === 'Bought' ? 'text-[#9DD7E6]' :
                          holder.acquisitionMethod === 'Received' ? 'text-[#627EEA]' : 'text-[#F59E0B]'
                        }`}>
                          {holder.acquisitionMethod}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm">{holder.totalAcquired.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-bold">{holder.currentBalance.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-bold ${
                          holder.retentionRate >= 80 ? 'text-green-500' :
                          holder.retentionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {holder.retentionRate}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          holder.status === 'Holding' ? 'bg-green-500/20 text-green-600' :
                          holder.status === 'Partial Exit' ? 'bg-yellow-500/20 text-yellow-600' :
                          'bg-red-500/20 text-red-600'
                        }`}>
                          {holder.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent New Wallets */}
        <Card className="p-6 mb-8 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Recent New Wallets</h3>
              <p className="text-xs text-muted-foreground">Most recent acquisitions since campaign start</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#E2E3E4]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F6F6F6]">
                  <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Wallet</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Acquired On</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Days Ago</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Method</th>
                  <th className="px-3 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">Amount</th>
                  <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentNewWallets.map((wallet, idx) => (
                  <tr key={idx} className="border-t border-[#E2E3E4] hover:bg-[#F6F6F6]/50">
                    <td className="px-3 py-3">
                      <a
                        href={`${wallet.explorerUrl}/address/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9DD7E6] font-mono text-xs hover:underline"
                      >
                        {wallet.shortAddress}
                      </a>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-semibold ${wallet.chain === 'ETH' ? 'bg-[#627EEA]/20 text-[#627EEA]' : 'bg-[#0052FF]/20 text-[#0052FF]'}`}>
                        {wallet.chain}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm">{wallet.firstAcquisitionDate}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">{wallet.daysSinceAcquisition}d ago</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium ${
                        wallet.acquisitionMethod === 'Bought' ? 'text-[#9DD7E6]' :
                        wallet.acquisitionMethod === 'Received' ? 'text-[#627EEA]' : 'text-[#F59E0B]'
                      }`}>
                        {wallet.acquisitionMethod}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm">{wallet.totalAcquired.toLocaleString()} MERC</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        wallet.status === 'Holding' ? 'bg-green-500/20 text-green-600' :
                        wallet.status === 'Partial Exit' ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-red-500/20 text-red-600'
                      }`}>
                        {wallet.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

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
              Campaign data tracked via Alchemy and Ethplorer APIs
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
  subtext,
  gradient,
  iconBg,
  iconColor
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
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
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </Card>
  );
}
