
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, TrendingUp, Mail, Users } from 'lucide-react';

const navItems = [
  {
    href: '/',
    label: 'Token Metrics',
    icon: BarChart3,
  },
  {
    href: '/markets',
    label: 'Markets',
    icon: TrendingUp,
  },
  {
    href: '/holder-metrics',
    label: 'Wallet Holders',
    icon: Users,
  },
  {
    href: '/saliba-signal',
    label: 'The Saliba Signal',
    icon: Mail,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/40 bg-background">
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex items-center gap-3 border-b border-border/40 px-6 py-5">
          <div className="relative w-10 h-10">
            <Image
              src="/LiquidMercury-Icon-500px.png"
              alt="Liquid Mercury"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              MERC Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Internal Monitoring
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#9DD7E6] text-black'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-6 h-6"
              viewBox="0 0 500 500"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="125" cy="125" r="115" fill="#BBBABC"/>
              <circle cx="375" cy="125" r="115" fill="#BBBABC"/>
              <circle cx="125" cy="375" r="115" fill="#BBBABC"/>
              <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
            </svg>
            <span className="text-xs font-semibold text-muted-foreground">
              LIQUID MERCURY
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
