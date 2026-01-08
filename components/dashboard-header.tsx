
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw, BarChart3, TrendingUp, Mail, Zap, Globe, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({ onRefresh, isRefreshing = false }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [gasPrice, setGasPrice] = useState('12');

  // Simulation for live ticker data
  const tickerItems = [
    { label: 'MERC/USD', value: '$0.428', change: '+5.2%', positive: true },
    { label: 'BTC/USD', value: '$96,240', change: '-1.4%', positive: false },
    { label: 'ETH/USD', value: '$3,482', change: '+2.1%', positive: true },
    { label: 'BASE GAS', value: `${gasPrice} Gwei`, change: '', positive: true },
    { label: 'VOLATILITY INDEX', value: 'LOW', change: 'NOMINAL', positive: true },
    { label: 'SYS_STATUS', value: 'STABLE', change: 'v2.1', positive: true },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setGasPrice((Math.random() * (15 - 8) + 8).toFixed(0));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      {/* Bloomberg Ticker Wire */}
      <div className="w-full bg-black/80 border-b border-white/5 backdrop-blur-md h-8 flex items-center overflow-hidden">
        <div className="bg-accent px-3 h-full flex items-center shrink-0 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
          <Globe className="h-3 w-3 text-black animate-pulse" />
          <span className="text-[10px] font-black text-black ml-2 tracking-tighter">MARKET WIRE</span>
        </div>
        <div className="animate-ticker">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-8 border-r border-white/5 h-full">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{item.label}</span>
              <span className="text-[10px] font-mono font-black text-white leading-none">{item.value}</span>
              {item.change && (
                <span className={cn(
                  "text-[8px] font-black leading-none",
                  item.positive ? "text-green-400" : "text-red-400"
                )}>
                  {item.change}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <header className="w-full glass border-b border-white/10 backdrop-blur-2xl">
        <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 transition-smooth group-hover:scale-110">
                <Image
                  src="/LiquidMercury-Icon-500px.png"
                  alt="Liquid Mercury"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                  MERC <span className="text-accent">OS</span>
                </h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                  Terminal 01
                </p>
              </div>
            </Link>

            <div className="hidden xl:flex items-center ml-4">
              <div className="h-8 bg-[#ECC94B] rounded-sm px-3 flex items-center border border-black/10 shadow-inner group cursor-text">
                <span className="text-[10px] font-black text-black mr-2 tracking-tighter uppercase">Command:</span>
                <div className="w-48 text-[11px] font-mono font-bold text-black opacity-60 group-hover:opacity-100 transition-opacity">
                  SEARCH_METRIC...
                </div>
                <ChevronRight className="h-3 w-3 text-black opacity-40 ml-auto" />
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1 ml-4 border-l border-white/5 pl-4">
              <NavLink href="/" icon={<BarChart3 className="h-4 w-4" />} active={pathname === '/'}>
                Metrics
              </NavLink>
              <NavLink href="/markets" icon={<TrendingUp className="h-4 w-4" />} active={pathname === '/markets'}>
                Markets
              </NavLink>
              <NavLink href="/saliba-signal" icon={<Zap className="h-4 w-4" />} active={pathname === '/saliba-signal'}>
                Signals
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-6 ml-auto">
            <div className="flex items-center gap-4 border-r border-white/10 pr-6 mr-2">
              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-white/5 px-4"
                >
                  <RefreshCw className={cn("h-3 w-3 transition-all", isRefreshing && "animate-spin text-accent")} />
                  {isRefreshing ? 'Syncing...' : 'Refresh'}
                </Button>
              )}
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Flow</span>
              </div>
            </div>
          </div>
        </div>
      </header >
    </div >
  );
}

function NavLink({ href, icon, children, active }: { href: string; icon: React.ReactNode; children: React.ReactNode; active: boolean }) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-smooth relative group",
        active ? "text-white" : "text-muted-foreground hover:text-white"
      )}>
        {icon}
        {children}
        <div className="absolute inset-x-0 -bottom-[21px] h-[2px] bg-white/0 group-hover:bg-white/10 transition-colors rounded-full" />
        {active && (
          <motion.div
            layoutId="nav-glow"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="absolute inset-x-2 -bottom-[21px] h-[3px] bg-accent rounded-full shadow-[0_0_15px_rgba(157,215,230,0.8)] z-10"
          />
        )}
      </div>
    </Link>
  );
}

export default DashboardHeader;
