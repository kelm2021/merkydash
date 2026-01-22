
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import DashboardHeader from '@/components/dashboard-header';
import HolderDistributionChart from '@/components/holder-distribution-chart';
import PriceAlertModal from '@/components/price-alert-modal';
import usePriceAlerts from '@/hooks/use-price-alerts';
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
import { ArrowUpRight, ArrowDownRight, Users, Activity, Layers, Database, ChevronRight, ExternalLink, TrendingUp, Globe, Zap, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

export default function TokenMetricsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Fetch market data
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
  let currentPrice = 0.003072;

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
  const volume24h = marketData?.aggregate?.totalVolume24h || '1000';

  // Price alerts hook
  const { alerts, addAlert, activeAlerts } = usePriceAlerts(currentPrice);

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
      backgroundColor: (context: any) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return null;
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(157, 215, 230, 0.2)');
        gradient.addColorStop(1, 'rgba(157, 215, 230, 0)');
        return gradient;
      },
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 6,
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
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: false
      }
    },
    scales: {
      y: {
        display: false,
        beginAtZero: false,
      },
      x: {
        grid: { display: false },
        ticks: { color: '#8F9194', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-accent/30 selection:text-white">
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-6 py-12 max-w-7xl"
      >
        {/* Animated Hero Header */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-8 border-b border-white/10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 glass-dark rounded-2xl border border-white/10">
                  <svg
                    className="w-10 h-10"
                    viewBox="0 0 500 500"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="125" cy="125" r="115" fill="#BBBABC" />
                    <circle cx="375" cy="125" r="115" fill="#BBBABC" />
                    <circle cx="125" cy="375" r="115" fill="#BBBABC" />
                    <circle cx="375" cy="375" r="115" fill="#9DD7E6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-1">
                    Liquid Mercury
                  </h1>
                  <p className="text-muted-foreground font-medium">Powering Professional Crypto Trading</p>
                </div>
              </div>
            </div>

            <div className="md:text-right">
              <div className="flex items-center justify-end gap-4 mb-2">
                <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Live Price</div>
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
                >
                  <Bell className="h-3 w-3" />
                  {activeAlerts.length > 0 && (
                    <span className="bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {activeAlerts.length}
                    </span>
                  )}
                  Add Alert
                </button>
              </div>
              <div className="flex items-baseline gap-3 md:justify-end">
                <span className="text-5xl font-mono font-medium text-white tracking-tighter">
                  ${loading ? '...' : currentPrice.toFixed(6)}
                </span>
                <span className="flex items-center gap-1 text-green-400 font-semibold px-2 py-1 glass-dark rounded-full text-sm">
                  <ArrowUpRight className="h-4 w-4" /> 5.2%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-16">
          <MetricCard
            label="Adjusted MC"
            value={loading ? '...' : `$${(marketCap / 1e6).toFixed(2)}M`}
            icon={<Activity className="h-4 w-4 text-accent" />}
            subValue="Institutional Grade"
          />
          <MetricCard
            label="24h Volume"
            value={loading ? '...' : `$${(parseFloat(volume24h) / 1e3).toFixed(1)}K`}
            icon={<ArrowUpRight className="h-4 w-4 text-accent" />}
            subValue="Velocity: 0.82"
          />
          <MetricCard
            label="2% Depth"
            value="$42,500"
            icon={<TrendingUp className="h-4 w-4 text-accent" />}
            subValue="Slippage Resistance"
          />
          <MetricCard label="Buy Delta" value="+12.4%" icon={<ArrowUpRight className="h-4 w-4 text-green-400" />} subValue="Bulls Leading" />
          <MetricCard label="Holders" value="3,370" icon={<Users className="h-4 w-4 text-accent" />} subValue="+12 Today" />
          <MetricCard label="Gas (Base)" value="12 Gwei" icon={<Zap className="h-4 w-4 text-accent" />} subValue="Nominal" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Main Chart Section */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="p-8 h-full bg-black/40 border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold mb-1">Price Performance</h3>
                  <p className="text-sm text-muted-foreground">Historical price volatility on native chain</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Real-time</span>
                </div>
              </div>
              <div className="h-[350px]">
                <Line data={priceChartData} options={priceChartOptions} />
              </div>
            </Card>
          </motion.div>

          {/* Right Sidebar - Distribution & Info */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Card className="p-6 bg-black/40 border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/20 rounded text-[8px] font-black text-accent uppercase tracking-widest animate-pulse">
                  <Activity className="h-2 w-2" /> LiveIntelligence
                </div>
              </div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent" />
                Connectivity & Vitals
              </h3>
              <div className="space-y-4">
                <ContractRow
                  title="Ethereum Mainnet"
                  badge="ETH v3"
                  color="purple"
                  percentage="83.03%"
                />
                <ContractRow
                  title="Base Network"
                  badge="BASE"
                  color="teal"
                  percentage="16.97%"
                />
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-start gap-3 p-3 glass-dark rounded-xl border border-white/5 hover:border-accent/30 transition-colors">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-1 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Whale Alert</p>
                    <p className="text-xs text-white">Wallet 0x72a...d3e moved 500k MERC to Cold Storage</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 glass-dark rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-1 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Network Notice</p>
                    <p className="text-xs text-white">Base Sequencer latency optimized at 14ms</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-accent/10 border-accent/20">
              <h3 className="text-lg font-bold mb-4">Market Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">ATH</p>
                  <p className="text-lg font-mono font-medium">${allTimeHigh.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">ATL</p>
                  <p className="text-lg font-mono font-medium">${allTimeLow.toFixed(4)}</p>
                </div>
              </div>
              <Button className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-bold py-6 group">
                View Detailed Reports
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>

            {/* Holder Distribution Chart */}
            <HolderDistributionChart />
          </motion.div>
        </div>

        {/* Dynamic Tabs Section */}
        <motion.div variants={itemVariants}>
          <div className="flex gap-1 p-1 bg-white/5 rounded-2xl w-fit mb-8 border border-white/5">
            {['overview', 'transactions', 'holders'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-300",
                  activeTab === tab
                    ? "bg-white text-black shadow-lg"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-8 border-white/10 bg-black/40">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Volume Statistics</h4>
                      <div className="text-3xl font-bold mb-2">$1,204,500 <span className="text-sm font-normal text-muted-foreground">USD</span></div>
                      <p className="text-muted-foreground text-sm">Aggregated volume across all decentralized liquidity pools on ETH and Base.</p>
                    </Card>
                    <Card className="p-8 border-white/10 bg-black/40">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Liquidity Depth</h4>
                      <div className="text-3xl font-bold mb-2">$450,000 <span className="text-sm font-normal text-muted-foreground">TVL</span></div>
                      <p className="text-muted-foreground text-sm">Combined liquidity across Uniswap V3 and Aerodrome pools.</p>
                    </Card>
                  </div>
                )}

                {activeTab === 'transactions' && <TransactionsTab />}

                {activeTab === 'holders' && <HoldersTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="mt-32 pt-16 border-t border-white/10 text-center pb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 glass-dark rounded-full border border-white/10 text-xs font-bold tracking-widest text-muted-foreground">
            LIQUID MERCURY • STATUS: <span className="text-green-400">OPERATIONAL</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">The Future of Institutional Crypto Trading</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our infrastructure is designed for speed, security, and scalability. Providing the liquidity needed for top-tier market making.
          </p>
        </motion.div>
      </motion.main>

      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        currentPrice={currentPrice}
        onAddAlert={addAlert}
      />
    </div>
  );
}

function MetricCard({ label, value, icon, subValue }: { label: string; value: string, icon: React.ReactNode, subValue?: string }) {
  return (
    <Card className="p-6 border-white/5 bg-black/20 hover:bg-black/40 transition-smooth group cursor-default relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">
            {label}
          </div>
          <div className="text-2xl font-mono font-bold tracking-tighter">
            {value}
          </div>
        </div>
        {subValue && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{subValue}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function ContractRow({ title, badge, color, percentage }: { title: string; badge: string; color: string; percentage: string }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-2 h-8 rounded-full",
          color === 'purple' ? "bg-purple-500" : "bg-teal-500"
        )} />
        <div>
          <p className="text-sm font-bold">{title}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{badge}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono font-bold">{percentage}</p>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Supply</p>
      </div>
    </div>
  );
}

// Transactions Tab Component
function TransactionsTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blockchain-transactions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTransactions(data.transactions);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-muted-foreground font-mono">ESTABLISHING DATA CONNECTION...</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">HASH</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">TYPE</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">VALUE</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">CHAIN</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">AGE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {transactions.map((tx, idx) => (
            <tr key={idx} className="hover:bg-white/5 transition-colors cursor-pointer group">
              <td className="px-6 py-4 font-mono text-xs text-accent">{tx.shortHash}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                  tx.type === 'Buy' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                )}>
                  {tx.type}
                </span>
              </td>
              <td className="px-6 py-4 font-bold font-mono text-sm">{parseFloat(tx.value).toLocaleString()} <span className="text-[10px] text-muted-foreground">MERC</span></td>
              <td className="px-6 py-4">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
                  tx.chain === 'ETH' ? "border-purple-500/50 text-purple-400" : "border-teal-500/50 text-teal-400"
                )}>
                  {tx.chain}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-xs text-muted-foreground font-bold">{tx.timeAgo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Holders Tab Component
function HoldersTab() {
  const [holders, setHolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blockchain-holders')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHolders(data.holders);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-muted-foreground font-mono">INDEXING TOP WALLETS...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {holders.slice(0, 12).map((holder, idx) => (
        <Card key={idx} className="p-6 border-white/10 bg-black/40 hover:border-accent/40 transition-smooth group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 text-white/5 font-black text-6xl select-none leading-none">
            {idx + 1}
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Wallet Address</p>
                <p className="font-mono text-xs text-white group-hover:text-accent transition-colors">{holder.shortAddress}</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Balance</p>
                <p className="text-xl font-bold font-mono">{holder.balanceFormatted}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Share</p>
                <p className="text-sm font-bold text-accent">{holder.percentage}%</p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}


