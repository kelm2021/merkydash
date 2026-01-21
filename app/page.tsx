
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { RefreshCw, Coins, TrendingUp, Users, Activity, Wallet, BarChart3, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      backgroundColor: 'rgba(157, 215, 230, 0.1)',
      borderWidth: 3,
      tension: 0.4,
      fill: true
    }]
  };

  const allTimeHigh = priceHistory?.allTimeHigh || 0.0245;
  const allTimeLow = priceHistory?.allTimeLow || 0.001078;

  const priceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { color: '#8F9194' },
        grid: { color: 'rgba(143, 145, 148, 0.1)' }
      },
      x: {
        ticks: { color: '#8F9194' },
        grid: { display: false }
      }
    }
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
            <p className="mt-6 text-lg text-muted-foreground font-medium">Loading token metrics...</p>
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
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-10 h-10" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="125" cy="125" r="115" fill="#B8BABC"/>
                  <circle cx="375" cy="125" r="115" fill="#B8BABC"/>
                  <circle cx="125" cy="375" r="115" fill="#B8BABC"/>
                  <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Liquid Mercury</h1>
                  <span className="bg-[#9DD7E6] text-[#414042] px-3 py-1 rounded-lg text-sm font-bold">
                    MERC
                  </span>
                </div>
                <p className="text-[#B8BABC] text-sm mt-1">
                  Powering Professional Crypto Trading
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
                <p className="text-[#B8BABC] text-xs font-medium mb-1">Current Price</p>
                <p className="text-3xl font-bold text-[#9DD7E6]">${currentPrice.toFixed(6)}</p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-[#9DD7E6] hover:bg-[#9DD7E6]/90 text-[#414042] font-semibold shadow-lg"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={<Coins className="w-5 h-5" />}
            label="Market Cap"
            value={`$${(marketCap / 1e6).toFixed(2)}M`}
            gradient="from-[#9DD7E6]/10 to-[#9DD7E6]/5"
            iconBg="bg-[#9DD7E6]/20"
            iconColor="text-[#9DD7E6]"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="24h Volume"
            value={`$${(parseFloat(volume24h) / 1e3).toFixed(0)}K`}
            gradient="from-[#B8BABC]/10 to-[#B8BABC]/5"
            iconBg="bg-[#B8BABC]/20"
            iconColor="text-[#414042]"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Holders"
            value="3,370"
            gradient="from-[#14B8A6]/10 to-[#14B8A6]/5"
            iconBg="bg-[#14B8A6]/20"
            iconColor="text-[#14B8A6]"
          />
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            label="24h Transactions"
            value="156"
            gradient="from-[#8B5CF6]/10 to-[#8B5CF6]/5"
            iconBg="bg-[#8B5CF6]/20"
            iconColor="text-[#8B5CF6]"
          />
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label="Circulating"
            value="2.10B"
            gradient="from-[#414042]/10 to-[#414042]/5"
            iconBg="bg-[#414042]/20"
            iconColor="text-[#414042]"
          />
          <StatCard
            icon={<Coins className="w-5 h-5" />}
            label="Total Supply"
            value="6.0B"
            gradient="from-[#414042]/10 to-[#414042]/5"
            iconBg="bg-[#414042]/20"
            iconColor="text-[#414042]"
          />
        </div>

        {/* Contract Addresses Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9DD7E6] to-[#9DD7E6]/70 flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Contract Addresses</h2>
              <p className="text-xs text-muted-foreground">Multi-chain supply distribution</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ContractCard
              title="Ethereum (Native)"
              badge="ETH"
              accentColor="#627EEA"
              address="0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810"
              explorerUrl="https://etherscan.io/token/0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810"
              supply="4.98B MERC"
              percentage="83.03%"
            />
            <ContractCard
              title="Base (Bridged Wrapper)"
              badge="BASE"
              accentColor="#0052FF"
              address="0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058"
              explorerUrl="https://basescan.org/token/0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058"
              supply="1.02B MERC"
              percentage="16.97%"
            />
          </div>
        </div>

        {/* Tabs Section */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="flex border-b border-[#E2E3E4]">
            {['overview', 'transactions', 'holders'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold text-sm tracking-wide transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-[#9DD7E6] text-[#414042]'
                    : 'bg-white text-muted-foreground hover:bg-[#F6F6F6]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6 bg-white">
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
              Powering Professional Crypto Trading • Multi-chain: Ethereum & Base
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
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </Card>
  );
}

// Contract Card Component
function ContractCard({
  title,
  badge,
  accentColor,
  address,
  explorerUrl,
  supply,
  percentage
}: {
  title: string;
  badge: string;
  accentColor: string;
  address: string;
  explorerUrl: string;
  supply: string;
  percentage: string;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4 bg-gradient-to-r from-[#F6F6F6] to-white border-b border-[#E2E3E4]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">{title}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {badge}
          </span>
        </div>
      </div>
      <div className="p-4">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[#9DD7E6] text-xs font-mono break-all hover:underline mb-4"
        >
          {address}
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Supply on {badge}</p>
            <p className="font-bold text-foreground">{supply}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">% of Total</p>
            <p className="font-bold text-foreground">{percentage}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Overview Tab Component
function OverviewTab({ priceChartData, priceChartOptions, allTimeHigh, allTimeLow, currentPrice }: any) {
  const athChange = allTimeHigh > 0 ? ((currentPrice - allTimeHigh) / allTimeHigh * 100).toFixed(1) : '0';
  const atlChange = allTimeLow > 0 ? ((currentPrice - allTimeLow) / allTimeLow * 100).toFixed(1) : '0';

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9DD7E6] to-[#9DD7E6]/70 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Price History</h3>
          <p className="text-xs text-muted-foreground">Historical price performance</p>
        </div>
      </div>
      <div className="h-[300px] mb-8">
        <Line data={priceChartData} options={priceChartOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-gradient-to-br from-green-500/5 to-green-500/0 border border-green-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase">All-Time High</span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">
            ${allTimeHigh > 0 ? allTimeHigh.toFixed(6) : '0.00'}
          </p>
          <p className={`text-sm font-semibold ${parseFloat(athChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {parseFloat(athChange) >= 0 ? '+' : ''}{athChange}% from ATH
          </p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-red-500/5 to-red-500/0 border border-red-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase">All-Time Low</span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">
            ${allTimeLow > 0 ? allTimeLow.toFixed(6) : '0.00'}
          </p>
          <p className={`text-sm font-semibold ${parseFloat(atlChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {parseFloat(atlChange) >= 0 ? '+' : ''}{atlChange}% from ATL
          </p>
        </Card>
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
          <div className="w-12 h-12 border-4 border-[#9DD7E6]/20 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-[#9DD7E6] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-muted-foreground">Loading transactions...</p>
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9DD7E6] to-[#9DD7E6]/70 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Recent Transactions</h3>
          <p className="text-xs text-muted-foreground">Real-time token transfers from Ethereum and Base</p>
        </div>
      </div>
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No transactions found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E2E3E4]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F6F6F6]">
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Hash</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Type</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">From</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">To</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Time</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Chain</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={idx} className="border-t border-[#E2E3E4] hover:bg-[#F6F6F6]/50">
                  <td className="px-4 py-3">
                    <a
                      href={`${tx.explorerUrl}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9DD7E6] font-mono text-xs hover:underline"
                    >
                      {tx.shortHash}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      tx.type === 'Buy'
                        ? 'bg-green-500/20 text-green-600'
                        : tx.type === 'Sell'
                        ? 'bg-red-500/20 text-red-600'
                        : 'bg-gray-500/20 text-gray-600'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{parseFloat(tx.value).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`${tx.explorerUrl}/address/${tx.from}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9DD7E6] font-mono text-xs hover:underline"
                    >
                      {tx.shortFrom}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`${tx.explorerUrl}/address/${tx.to}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9DD7E6] font-mono text-xs hover:underline"
                    >
                      {tx.shortTo}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{tx.timeAgo}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                      tx.chain === 'ETH' ? 'bg-[#627EEA]' : 'bg-[#0052FF]'
                    }`}>
                      {tx.chain}
                    </span>
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

// Holders Tab Component
function HoldersTab() {
  const [holders, setHolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/blockchain-holders')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHolders(data.holders);
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
          <div className="w-12 h-12 border-4 border-[#9DD7E6]/20 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-[#9DD7E6] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-muted-foreground">Loading holders...</p>
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9DD7E6] to-[#9DD7E6]/70 flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Top 20 Holders</h3>
          <p className="text-xs text-muted-foreground">Combined top holders across Ethereum and Base</p>
        </div>
      </div>
      {holders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No holders found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E2E3E4]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F6F6F6]">
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Address</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Balance</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Percentage</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Chain</th>
              </tr>
            </thead>
            <tbody>
              {holders.map((holder) => (
                <tr key={holder.rank} className="border-t border-[#E2E3E4] hover:bg-[#F6F6F6]/50">
                  <td className="px-4 py-3 font-bold text-[#9DD7E6]">{holder.rank}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`${holder.explorerUrl}/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9DD7E6] font-mono text-xs hover:underline"
                    >
                      {holder.shortAddress}
                    </a>
                  </td>
                  <td className="px-4 py-3 font-semibold">{holder.balanceFormatted}</td>
                  <td className="px-4 py-3 text-muted-foreground">{holder.percentage}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                      holder.chain === 'ETH' ? 'bg-[#627EEA]' : 'bg-[#0052FF]'
                    }`}>
                      {holder.chain}
                    </span>
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
