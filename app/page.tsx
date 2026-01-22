'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Coins, TrendingUp, Users, Activity, Wallet, BarChart3, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { PageHeader, PriceBadge, SectionHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataBadge, ChainBadge } from '@/components/ui/data-badge';
import { cn } from '@/lib/utils';
import {
  Line
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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

export default function TokenMetricsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMarketData(data);
        }
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch(err => {
        console.error('Error fetching market data:', err);
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

  const circulatingSupply = 2.10e9;
  let currentPrice = 0.007204;

  if (marketData?.success) {
    const pools = [
      ...(marketData.base?.pools || []),
      ...(marketData.ethereum?.pools || [])
    ];

    if (pools.length > 0) {
      const prices = pools.map((p: any) => parseFloat(p.price)).filter((p: number) => p > 0);
      if (prices.length > 0) {
        currentPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      }
    }
  }

  const marketCap = currentPrice * circulatingSupply;
  const volume24h = marketData?.aggregate?.totalVolume24h || '0';

  const priceHistory = marketData?.priceHistory;
  const priceChartData = {
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

  const allTimeHigh = priceHistory?.allTimeHigh || 0.0245;
  const allTimeLow = priceHistory?.allTimeLow || 0.001078;

  const priceChartOptions = {
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
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { color: '#8F9194', font: { family: 'var(--font-body)' } },
        grid: { color: 'rgba(143, 145, 148, 0.08)' }
      },
      x: {
        ticks: { color: '#8F9194', font: { family: 'var(--font-body)' } },
        grid: { display: false }
      }
    }
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
            <p className="mt-6 text-lg text-muted-foreground font-display">Loading token metrics...</p>
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
          title="Liquid Mercury"
          subtitle="Powering Professional Crypto Trading"
          badge={
            <DataBadge variant="neutral" size="lg" shimmer>MERC</DataBadge>
          }
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
          <PriceBadge price={`$${currentPrice.toFixed(6)}`} />
        </PageHeader>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Market Cap"
            value={`$${(marketCap / 1e6).toFixed(2)}M`}
            icon={Coins}
            iconColor="text-mercury-aqua"
            delay={0}
          />
          <StatCard
            title="24h Volume"
            value={`$${(parseFloat(volume24h) / 1e3).toFixed(0)}K`}
            icon={BarChart3}
            iconColor="text-mercury-dark-grey"
            delay={50}
          />
          <StatCard
            title="Total Holders"
            value="3,370"
            icon={Users}
            iconColor="text-emerald-500"
            delay={100}
          />
          <StatCard
            title="24h Transactions"
            value="156"
            icon={Activity}
            iconColor="text-violet-500"
            delay={150}
          />
          <StatCard
            title="Circulating"
            value="2.10B"
            icon={Wallet}
            iconColor="text-mercury-dark-grey"
            delay={200}
          />
          <StatCard
            title="Total Supply"
            value="6.0B"
            icon={Coins}
            iconColor="text-mercury-dark-grey"
            delay={250}
          />
        </div>

        {/* Contract Addresses Section */}
        <div className="mb-8">
          <SectionHeader
            title="Contract Addresses"
            subtitle="Multi-chain supply distribution"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ContractCard
              title="Ethereum (Native)"
              badge="ETH"
              address="0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810"
              explorerUrl="https://etherscan.io/token/0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810"
              supply="4.98B MERC"
              percentage="83.03%"
            />
            <ContractCard
              title="Base (Bridged Wrapper)"
              badge="BASE"
              address="0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058"
              explorerUrl="https://basescan.org/token/0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058"
              supply="1.02B MERC"
              percentage="16.97%"
            />
          </div>
        </div>

        {/* Tabs Section */}
        <GlassCard hover={false} className="overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 bg-white/5">
            {['overview', 'transactions', 'holders'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative px-6 py-4 font-display font-semibold text-sm tracking-wide transition-all duration-200',
                  activeTab === tab
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-white hover:bg-white/10'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mercury-aqua to-mercury-aqua-dark" />
                )}
              </button>
            ))}
          </div>

          <GlassCardContent className="p-6 pt-6">
            {activeTab === 'overview' && (
              <OverviewTab
                priceChartData={priceChartData}
                priceChartOptions={priceChartOptions}
                allTimeHigh={allTimeHigh}
                allTimeLow={allTimeLow}
                currentPrice={currentPrice}
              />
            )}
            {activeTab === 'transactions' && <TransactionsTab />}
            {activeTab === 'holders' && <HoldersTab />}
          </GlassCardContent>
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
              Powering Professional Crypto Trading • Multi-chain: Ethereum & Base
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Contract Card Component
function ContractCard({
  title,
  badge,
  address,
  explorerUrl,
  supply,
  percentage
}: {
  title: string;
  badge: 'ETH' | 'BASE';
  address: string;
  explorerUrl: string;
  supply: string;
  percentage: string;
}) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-white">{title}</span>
          <ChainBadge chain={badge} />
        </div>
      </div>
      <GlassCardContent className="p-4 pt-4">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-mercury-aqua text-xs font-mono break-all hover:text-mercury-aqua-dark transition-colors mb-4"
        >
          {address}
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Supply on {badge}</p>
            <p className="font-display font-bold text-white">{supply}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">% of Total</p>
            <p className="font-display font-bold text-white">{percentage}</p>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

// Overview Tab Component
function OverviewTab({ priceChartData, priceChartOptions, allTimeHigh, allTimeLow, currentPrice }: any) {
  const athChange = allTimeHigh > 0 ? ((currentPrice - allTimeHigh) / allTimeHigh * 100).toFixed(1) : '0';
  const atlChange = allTimeLow > 0 ? ((currentPrice - allTimeLow) / allTimeLow * 100).toFixed(1) : '0';

  return (
    <>
      <SectionHeader
        title="Price History"
        subtitle="Historical price performance"
      />
      <div className="h-[300px] mb-8 p-4 rounded-xl bg-white/5">
        <Line data={priceChartData} options={priceChartOptions} />
      </div>

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
    </>
  );
}

// Transactions Tab Component
function TransactionsTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/blockchain-transactions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTransactions(data.transactions);
        } else {
          setError(data.error || 'Failed to load transactions');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-mercury-aqua/20 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-mercury-aqua border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-muted-foreground font-display">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title="Recent Transactions"
        subtitle="Real-time token transfers from Ethereum and Base"
      />
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No transactions found</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Hash</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">From</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">To</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Chain</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={idx} className="border-t border-white/10 table-row-hover">
                  <td className="px-4 py-3">
                    <a
                      href={`${tx.explorerUrl}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mercury-aqua font-mono text-xs hover:text-mercury-aqua-dark transition-colors"
                    >
                      {tx.shortHash}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <DataBadge
                      variant={tx.type === 'Buy' ? 'positive' : tx.type === 'Sell' ? 'negative' : 'default'}
                      size="sm"
                    >
                      {tx.type}
                    </DataBadge>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums">{parseFloat(tx.value).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`${tx.explorerUrl}/address/${tx.from}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mercury-aqua font-mono text-xs hover:text-mercury-aqua-dark transition-colors"
                    >
                      {tx.shortFrom}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`${tx.explorerUrl}/address/${tx.to}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mercury-aqua font-mono text-xs hover:text-mercury-aqua-dark transition-colors"
                    >
                      {tx.shortTo}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{tx.timeAgo}</td>
                  <td className="px-4 py-3">
                    <ChainBadge chain={tx.chain} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Balance display component for dual-chain wallets
function BalanceDisplay({ wallet }: { wallet: any }) {
  const hasEth = wallet.ethBalance > 0;
  const hasBase = wallet.baseBalance > 0;
  const hasBoth = hasEth && hasBase;

  if (hasBoth) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ChainBadge chain="ETH" />
          <span className="text-sm tabular-nums">{wallet.ethBalanceFormatted}</span>
        </div>
        <div className="flex items-center gap-2">
          <ChainBadge chain="BASE" />
          <span className="text-sm tabular-nums">{wallet.baseBalanceFormatted}</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Total</span>
          <span className="text-sm font-bold tabular-nums">{wallet.totalBalanceFormatted}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ChainBadge chain={hasEth ? 'ETH' : 'BASE'} />
      <span className="font-semibold tabular-nums">{wallet.totalBalanceFormatted}</span>
    </div>
  );
}

// Chain badges display
function ChainBadgesDisplay({ wallet }: { wallet: any }) {
  const hasEth = wallet.ethBalance > 0;
  const hasBase = wallet.baseBalance > 0;

  if (hasEth && hasBase) {
    return <ChainBadge chain="BOTH" />;
  }

  return <ChainBadge chain={hasEth ? 'ETH' : 'BASE'} />;
}

// Holders Tab Component
function HoldersTab() {
  const [knownWallets, setKnownWallets] = useState<any[]>([]);
  const [externalHolders, setExternalHolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/blockchain-holders')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setKnownWallets(data.knownWallets || []);
          setExternalHolders(data.externalHolders || data.holders || []);
        } else {
          setError(data.error || 'Failed to load holders');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching holders:', err);
        setError('Failed to load holders');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-mercury-aqua/20 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-mercury-aqua border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-muted-foreground font-display">Loading holders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Group known wallets by category
  const liquidityPools = knownWallets.filter(w => w.category === 'Liquidity Pool');
  const lmControlled = knownWallets.filter(w => w.category === 'Liquid Mercury Controlled');

  return (
    <div className="space-y-8">
      {/* Known Wallets Section */}
      {knownWallets.length > 0 && (
        <div>
          <SectionHeader
            title="Known Wallets"
            subtitle="Liquidity pools and Liquid Mercury controlled wallets"
          />

          {/* Liquidity Pools */}
          {liquidityPools.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Liquidity Pools
              </h4>
              <div className="overflow-x-auto rounded-xl border border-emerald-500/30">
                <table className="w-full">
                  <thead>
                    <tr className="bg-emerald-500/10">
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Address</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">% of Supply</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Chain(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liquidityPools.map((wallet, idx) => (
                      <tr key={idx} className="border-t border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">{wallet.name}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://etherscan.io/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-mercury-aqua font-mono text-xs hover:text-mercury-aqua-dark transition-colors"
                          >
                            {wallet.shortAddress}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <BalanceDisplay wallet={wallet} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">{wallet.percentage}%</td>
                        <td className="px-4 py-3">
                          <ChainBadgesDisplay wallet={wallet} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LM Controlled Wallets */}
          {lmControlled.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                Liquid Mercury Controlled
              </h4>
              <div className="overflow-x-auto rounded-xl border border-violet-500/30">
                <table className="w-full">
                  <thead>
                    <tr className="bg-violet-500/10">
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Address</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">% of Supply</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Chain(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lmControlled.map((wallet, idx) => (
                      <tr key={idx} className="border-t border-violet-500/20 hover:bg-violet-500/10 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">{wallet.name}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://etherscan.io/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-mercury-aqua font-mono text-xs hover:text-mercury-aqua-dark transition-colors"
                          >
                            {wallet.shortAddress}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <BalanceDisplay wallet={wallet} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">{wallet.percentage}%</td>
                        <td className="px-4 py-3">
                          <ChainBadgesDisplay wallet={wallet} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* External Holders Section */}
      <div>
        <SectionHeader
          title="Top 20 External Holders"
          subtitle="Top holders excluding known wallets across Ethereum and Base"
        />
        {externalHolders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No external holders found</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Address</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Balance</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">% of Supply</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-display font-semibold text-xs uppercase tracking-wider">Chain(s)</th>
                </tr>
              </thead>
              <tbody>
                {externalHolders.map((holder) => (
                  <tr key={holder.rank} className="border-t border-white/10 table-row-hover">
                    <td className="px-4 py-3 font-display font-bold text-mercury-aqua">{holder.rank}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://etherscan.io/address/${holder.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mercury-aqua font-mono text-xs hover:text-mercury-aqua-dark transition-colors"
                      >
                        {holder.shortAddress}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <BalanceDisplay wallet={holder} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{holder.percentage}%</td>
                    <td className="px-4 py-3">
                      <ChainBadgesDisplay wallet={holder} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
