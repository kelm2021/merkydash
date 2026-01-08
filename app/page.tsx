
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
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

// Register Chart.js components
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

  // Fetch market data for Market Cap and Volume
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

  // Calculate market cap from price and circulating supply
  const circulatingSupply = 2.10e9; // 2.10B MERC
  let currentPrice = 0.007204; // Default fallback
  
  // Get average price from pools if available
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

  // Price chart data - use real data from API if available
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

  // ATH/ATL data from API
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
        ticks: { color: '#8F9194' }
      },
      x: {
        ticks: { color: '#8F9194' }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-6">
        {/* Page Header with Refresh */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Token Metrics</h1>
            <p className="text-sm text-muted-foreground">Overview of MERC token performance</p>
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
        {/* Header Card */}
        <Card className="bg-black text-white p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-5">
            <div className="flex items-center gap-5">
              <svg 
                className="w-[60px] h-[60px]" 
                viewBox="0 0 500 500" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="125" cy="125" r="115" fill="#BBBABC"/>
                <circle cx="375" cy="125" r="115" fill="#BBBABC"/>
                <circle cx="125" cy="375" r="115" fill="#BBBABC"/>
                <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
              </svg>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-wide">Liquid Mercury</h1>
                  <span className="bg-[#9DD7E6] text-black px-3 py-1 rounded-md text-lg font-semibold">
                    MERC
                  </span>
                </div>
                <p className="text-[#BBBABC] text-sm font-medium mt-1">
                  Powering Professional Crypto Trading
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-semibold text-[#9DD7E6] mb-1">
                ${loading ? '...' : currentPrice.toFixed(6)}
              </div>
              <div className="text-base font-semibold text-green-400">
                ↑ 5.2% (24h)
              </div>
            </div>
          </div>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard 
            label="Market Cap" 
            value={loading ? 'Loading...' : `$${(marketCap / 1e6).toFixed(2)}M`} 
          />
          <MetricCard 
            label="24h Volume" 
            value={loading ? 'Loading...' : `$${(parseFloat(volume24h) / 1e3).toFixed(0)}K`} 
          />
          <MetricCard label="Total Holders" value="3,370" />
          <MetricCard label="24h Transactions" value="156" />
          <MetricCard label="Circulating Supply" value="2.10B" />
          <MetricCard label="Total Supply" value="6.0B" />
        </div>

        {/* Contract Addresses Section */}
        <Card className="p-5 mb-6">
          <h3 className="text-xl font-semibold mb-5 text-foreground">
            Contract Addresses & Supply Distribution
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ContractCard
              title="Ethereum (Native)"
              badge="ETH"
              badgeColor="bg-[#8B5CF6]"
              address="0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810"
              explorerUrl="https://etherscan.io/token/0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810"
              supply="4.98B MERC"
              percentage="83.03%"
              borderColor="border-[#9DD7E6]"
            />
            <ContractCard
              title="Base (Bridged Wrapper)"
              badge="BASE"
              badgeColor="bg-[#14B8A6]"
              address="0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058"
              explorerUrl="https://basescan.org/token/0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058"
              supply="1.02B MERC"
              percentage="16.97%"
              borderColor="border-[#6AB5C6]"
            />
          </div>
        </Card>

        {/* Tabs Section */}
        <Card className="overflow-hidden">
          <div className="w-full">
            <div className="flex w-full border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-semibold uppercase text-sm tracking-wide cursor-pointer transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-[#9DD7E6] text-black'
                    : 'bg-white text-muted-foreground hover:bg-muted'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-4 font-semibold uppercase text-sm tracking-wide cursor-pointer transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-[#9DD7E6] text-black'
                    : 'bg-white text-muted-foreground hover:bg-muted'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('holders')}
                className={`px-6 py-4 font-semibold uppercase text-sm tracking-wide cursor-pointer transition-colors ${
                  activeTab === 'holders'
                    ? 'bg-[#9DD7E6] text-black'
                    : 'bg-white text-muted-foreground hover:bg-muted'
                }`}
              >
                Holders
              </button>
            </div>

            <div className="p-6">
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
          <p className="font-medium mb-1">Powering Professional Crypto Trading</p>
          <p>Data updates in real-time • Multi-chain support: Ethereum & Base</p>
        </div>
      </div>
    </div>
  );
}

// MetricCard Component
function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5 border shadow-sm">
      <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-2xl font-semibold text-foreground">
        {value}
      </div>
    </Card>
  );
}

// ContractCard Component
function ContractCard({
  title,
  badge,
  badgeColor,
  address,
  explorerUrl,
  supply,
  percentage,
  borderColor
}: {
  title: string;
  badge: string;
  badgeColor: string;
  address: string;
  explorerUrl: string;
  supply: string;
  percentage: string;
  borderColor: string;
}) {
  return (
    <div className={`p-4 bg-muted rounded-lg border-2 ${borderColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-sm text-foreground">{title}</span>
        <span className={`${badgeColor} text-white px-2 py-0.5 rounded text-xs font-semibold`}>
          {badge}
        </span>
      </div>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#9DD7E6] text-xs font-mono break-all hover:underline block mb-3"
      >
        {address}
      </a>
      <div className="pt-3 border-t border-border">
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="text-muted-foreground font-semibold">Supply on {badge}:</span>
          <span className="font-semibold text-foreground">{supply}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground font-semibold">% of Total Supply:</span>
          <span className="font-semibold text-foreground">{percentage}</span>
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ priceChartData, priceChartOptions, allTimeHigh, allTimeLow, currentPrice }: any) {
  // Calculate percentage changes from ATH/ATL
  const athChange = allTimeHigh > 0 ? ((currentPrice - allTimeHigh) / allTimeHigh * 100).toFixed(1) : '0';
  const atlChange = allTimeLow > 0 ? ((currentPrice - allTimeLow) / allTimeLow * 100).toFixed(1) : '0';

  return (
    <>
      <h3 className="text-xl font-semibold mb-5 text-foreground">Price History</h3>
      <div className="h-[300px] mb-6">
        <Line data={priceChartData} options={priceChartOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border">
          <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
            All-Time High
          </div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            ${allTimeHigh > 0 ? allTimeHigh.toFixed(6) : '0.00'}
          </div>
          <div className={`text-xs ${parseFloat(athChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {parseFloat(athChange) >= 0 ? '+' : ''}{athChange}% from ATH
          </div>
        </Card>
        <Card className="p-5 border">
          <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
            All-Time Low
          </div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            ${allTimeLow > 0 ? allTimeLow.toFixed(6) : '0.00'}
          </div>
          <div className={`text-xs ${parseFloat(atlChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {parseFloat(atlChange) >= 0 ? '+' : ''}{atlChange}% from ATL
          </div>
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

  // Fetch transactions from blockchain explorers
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
      <>
        <h3 className="text-xl font-semibold mb-5 text-foreground">Recent On-Chain Transactions</h3>
        <div className="text-center py-8 text-muted-foreground">
          Loading transactions from blockchain...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <h3 className="text-xl font-semibold mb-5 text-foreground">Recent On-Chain Transactions</h3>
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="text-xl font-semibold mb-5 text-foreground">Recent On-Chain Transactions</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Real-time token transfers from Ethereum and Base blockchains
      </p>
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No transactions found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b-2">
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Hash</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Type</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Amount (MERC)</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">From</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">To</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Time</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Chain</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="px-3 py-3">
                    <a
                      href={`${tx.explorerUrl}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9DD7E6] font-mono text-xs hover:underline"
                    >
                      {tx.shortHash}
                    </a>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      tx.type === 'Buy' 
                        ? 'bg-green-500 text-white' 
                        : tx.type === 'Sell' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold">
                    {parseFloat(tx.value).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <a
                      href={`${tx.explorerUrl}/address/${tx.from}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9DD7E6] font-mono text-xs hover:underline"
                    >
                      {tx.shortFrom}
                    </a>
                  </td>
                  <td className="px-3 py-3">
                    <a
                      href={`${tx.explorerUrl}/address/${tx.to}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9DD7E6] font-mono text-xs hover:underline"
                    >
                      {tx.shortTo}
                    </a>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground text-sm">{tx.timeAgo}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                      tx.chain === 'ETH' ? 'bg-[#8B5CF6]' : 'bg-[#14B8A6]'
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

  // Fetch holders from blockchain explorers
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
      <>
        <h3 className="text-xl font-semibold mb-5 text-foreground">Top 20 Holders</h3>
        <div className="text-center py-8 text-muted-foreground">
          Loading holders from blockchain...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <h3 className="text-xl font-semibold mb-5 text-foreground">Top 20 Holders</h3>
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="text-xl font-semibold mb-5 text-foreground">Top 20 Holders</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Combined top holders across Ethereum and Base networks
      </p>
      {holders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No holders found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b-2">
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Rank</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Address</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Balance (MERC)</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Percentage</th>
                <th className="px-3 py-3 text-left text-muted-foreground font-semibold text-xs uppercase">Chain</th>
              </tr>
            </thead>
            <tbody>
              {holders.map((holder) => (
                <tr key={holder.rank} className="border-b hover:bg-muted/50">
                  <td className="px-3 py-3 font-semibold">{holder.rank}</td>
                  <td className="px-3 py-3">
                    <a
                      href={`${holder.explorerUrl}/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9DD7E6] font-mono text-xs hover:underline"
                    >
                      {holder.shortAddress}
                    </a>
                  </td>
                  <td className="px-3 py-3 font-semibold">
                    {holder.balanceFormatted}
                  </td>
                  <td className="px-3 py-3 text-sm">{holder.percentage}%</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                      holder.chain === 'ETH' ? 'bg-[#8B5CF6]' : 'bg-[#14B8A6]'
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


