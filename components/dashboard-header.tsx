
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw, BarChart3, TrendingUp, Mail, Users } from 'lucide-react';
import { Button } from './ui/button';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({ onRefresh, isRefreshing = false }: DashboardHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="relative w-8 h-8">
            <Image
              src="/LiquidMercury-Icon-500px.png"
              alt="Liquid Mercury"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              MERC Dashboard
            </h1>
            <p className="text-sm text-[#414042]">
              Internal Monitoring System
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant={pathname === '/' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Token Metrics
              </Button>
            </Link>
            <Link href="/markets">
              <Button
                variant={pathname === '/markets' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Markets
              </Button>
            </Link>
            <Link href="/holder-metrics">
              <Button
                variant={pathname === '/holder-metrics' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Wallet Holders
              </Button>
            </Link>
            <Link href="/saliba-signal">
              <Button
                variant={pathname === '/saliba-signal' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                The Saliba Signal Metrics
              </Button>
            </Link>
          </nav>

          {onRefresh && (
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
