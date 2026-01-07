
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import DashboardHeader from '@/components/dashboard-header';
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
      <div className="min-h-screen bg-background">
        <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="text-xl text-muted-foreground">Loading campaign metrics...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="text-xl text-red-500">{error || 'Failed to load campaign metrics'}</div>
            <p className="text-muted-foreground mt-2">Ensure Alchemy API key is configured in Vercel.</p>
          </div>
        </main>
      </div>
    );
  }

  // Weekly new wallets chart
  const weeklyWalletsData = {
    labels: metrics.weeklyBreakdown.map(w => w.weekStart),
    datasets: [{
      label: 'New Wallets',
      data: metrics.weeklyBreakdown.map(w => w.newWallets),
      backgroundColor: '#9DD7E6',
      borderColor: '#9DD7E6',
      borderWidth: 2
    }]
  };

  // Weekly acquisition volume chart
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

  // Retention status doughnut
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

  // Acquisition method doughnut
  const acquisitionData = {
    labels: ['Bought on DEX', 'Received Transfer', 'Mixed'],
    datasets: [{
      data: [
        metrics.acquisitionByMethod.bought,
        metrics.acquisitionByMethod.received,
        metrics.acquisitionByMethod.mixed
      ],
      backgroundColor: ['#9DD7E6', '#8B5CF6', '#F59E0B'],
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
        labels: { color: '#8F9194', padding: 15 }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className="container mx-auto px-4 py-6">
        {/* Campaign Header */}
        <Card className="bg-gradient-to-r from-[#9DD7E6]/20 to-[#14B8A6]/20 border-[#9DD7E6] p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Adoption Campaign Metrics</h1>
              <p className="text-muted-foreground">
                Tracking new wallet acquisition and retention since campaign launch
              </p>
            </div>
            <div className="text-right bg-background/50 px-5 py-3 rounded-lg">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Campaign Started</div>
              <div className="text-xl font-bold text-foreground">{metrics.campaignStart}</div>
              <div className="text-sm text-[#9DD7E6] font-semibold">{metrics.daysSinceCampaign} days active</div>
            </div>
          </div>
        </Card>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            label="New Wallets"
            value={metrics.totalNewWallets.toLocaleString()}
            subtext={`${metrics.totalNewWalletsETH} ETH / ${metrics.totalNewWalletsBASE} BASE`}
            color="text-[#9DD7E6]"
          />
          <KPICard
            label="Avg Acquisition"
            value={`${metrics.avgAcquisitionAmount.toLocaleString()} MERC`}
            subtext={`Median: ${metrics.medianAcquisitionAmount.toLocaleString()}`}
            color="text-[#9DD7E6]"
          />
          <KPICard
            label="Held 20+ Days"
            value={`${metrics.walletsHeldOver20Days}`}
            subtext={`${metrics.walletsHeldOver20DaysPercent}% of new wallets`}
            color="text-green-500"
          />
          <KPICard
            label="Overall Retention"
            value={`${metrics.overallRetentionRate}%`}
            subtext={`${metrics.totalTokensRetained.toLocaleString()} of ${metrics.totalTokensAcquired.toLocaleString()} MERC`}
            color={metrics.overallRetentionRate >= 70 ? 'text-green-500' : metrics.overallRetentionRate >= 40 ? 'text-yellow-500' : 'text-red-500'}
          />
        </div>

        {/* Retention & Acquisition Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Wallet Status</h3>
            <p className="text-xs text-muted-foreground mb-4">Current holding status of new wallets</p>
            <div className="h-[180px]">
              <Doughnut data={retentionData} options={doughnutOptions} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Still Holding:</span>
                <span className="font-bold text-green-500">{metrics.walletsStillHolding} ({metrics.walletsStillHoldingPercent}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Exit:</span>
                <span className="font-bold text-red-500">{metrics.walletsFullExit} ({metrics.walletsFullExitPercent}%)</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Acquisition Method</h3>
            <p className="text-xs text-muted-foreground mb-4">How new wallets obtained MERC</p>
            <div className="h-[180px]">
              <Doughnut data={acquisitionData} options={doughnutOptions} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bought on DEX:</span>
                <span className="font-bold text-[#9DD7E6]">{metrics.acquisitionByMethod.bought}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Received:</span>
                <span className="font-bold text-[#8B5CF6]">{metrics.acquisitionByMethod.received}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-2 text-foreground">20-Day Retention</h3>
            <p className="text-xs text-muted-foreground mb-4">Wallets holding for 20+ days</p>
            <div className="flex items-center justify-center h-[180px]">
              <div className="text-center">
                <div className="text-5xl font-bold text-[#9DD7E6]">{metrics.walletsHeldOver20DaysPercent}%</div>
                <div className="text-muted-foreground mt-2">{metrics.walletsHeldOver20Days} wallets</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#9DD7E6] to-[#14B8A6] rounded-full"
                    style={{ width: `${metrics.walletsHeldOver20DaysPercent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{metrics.walletsHeldOver20DaysPercent}%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Weekly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-foreground">New Wallets by Week</h3>
            <p className="text-sm text-muted-foreground mb-4">Weekly breakdown of new wallet acquisitions</p>
            <div className="h-[250px]">
              <Bar data={weeklyWalletsData} options={chartOptions} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-foreground">Tokens Acquired by Week</h3>
            <p className="text-sm text-muted-foreground mb-4">Total MERC acquired by new wallets each week</p>
            <div className="h-[250px]">
              <Line data={weeklyVolumeData} options={chartOptions} />
            </div>
          </Card>
        </div>

        {/* Weekly Data Table */}
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Weekly Performance Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b-2">
                  <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Week</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">New Wallets</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">Total Acquired</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-xs uppercase">Avg per Wallet</th>
                </tr>
              </thead>
              <tbody>
                {metrics.weeklyBreakdown.map((week, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{week.weekStart} - {week.weekEnd}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#9DD7E6]">{week.newWallets}</td>
                    <td className="px-4 py-3 text-right">{week.totalAcquired.toLocaleString()} MERC</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{week.avgAcquired.toLocaleString()} MERC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top New Holders */}
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Top New Holders</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Largest positions among wallets that acquired MERC since campaign start
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b-2">
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
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="px-3 py-3">
                      <a
                        href={`${holder.explorerUrl}/address/${holder.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9DD7E6] font-mono text-xs hover:underline"
                      >
                        {holder.shortAddress}
                      </a>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${holder.chain === 'ETH' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'bg-[#14B8A6]/20 text-[#14B8A6]'}`}>
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
                        holder.acquisitionMethod === 'Received' ? 'text-[#8B5CF6]' : 'text-[#F59E0B]'
                      }`}>
                        {holder.acquisitionMethod}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm">{holder.totalAcquired.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm font-semibold">{holder.currentBalance.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-semibold ${
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
          {metrics.topNewHolders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No holder data available. Alchemy API key may be required.
            </div>
          )}
        </Card>

        {/* Recent New Wallets */}
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Recent New Wallets</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Most recent wallets to acquire MERC since campaign start
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b-2">
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
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="px-3 py-3">
                      <a
                        href={`${wallet.explorerUrl}/address/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9DD7E6] font-mono text-xs hover:underline"
                      >
                        {wallet.shortAddress}
                      </a>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${wallet.chain === 'ETH' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'bg-[#14B8A6]/20 text-[#14B8A6]'}`}>
                        {wallet.chain}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm">{wallet.firstAcquisitionDate}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">{wallet.daysSinceAcquisition}d ago</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium ${
                        wallet.acquisitionMethod === 'Bought' ? 'text-[#9DD7E6]' :
                        wallet.acquisitionMethod === 'Received' ? 'text-[#8B5CF6]' : 'text-[#F59E0B]'
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
          <p className="font-medium">Campaign data tracked via Alchemy and Ethplorer APIs</p>
        </div>
      </main>
    </div>
  );
}

// KPI Card Component
function KPICard({ label, value, subtext, color }: { label: string; value: string; subtext: string; color: string }) {
  return (
    <Card className="p-5 border shadow-sm">
      <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className={`text-2xl font-bold mb-1 ${color}`}>
        {value}
      </div>
      <div className="text-sm text-muted-foreground">
        {subtext}
      </div>
    </Card>
  );
}
