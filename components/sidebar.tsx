'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileHeader } from './mobile-header';

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
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header - visible on mobile only */}
      <MobileHeader isMenuOpen={isOpen} onToggleMenu={toggleMenu} />

      {/* Overlay - visible when mobile menu is open */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 bg-mercury-dark-grey overflow-hidden',
          'transition-transform duration-300 ease-in-out',
          // Desktop: always visible
          'lg:translate-x-0',
          // Mobile: slide in/out based on isOpen state
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-noise" />

        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(157, 215, 230, 0.08) 0%, transparent 50%)',
          }}
        />

        <div className="relative flex h-full flex-col">
          {/* Logo Section */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-glow-sm">
                <Image
                  src="/LiquidMercury-Icon-500px.png"
                  alt="Liquid Mercury"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-display font-semibold text-white">
                  MERC Dashboard
                </h1>
                <p className="text-xs text-mercury-silver/70 tracking-wide">
                  Internal Monitoring
                </p>
              </div>
            </div>
          </div>

          {/* Chrome gradient separator */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-mercury-silver/30 to-transparent" />

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-mercury-aqua text-mercury-dark-grey shadow-glow'
                          : 'text-mercury-silver hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-mercury-dark-grey/10'
                            : 'bg-white/5 group-hover:bg-mercury-aqua/20 group-hover:scale-110'
                        )}
                      >
                        <Icon className={cn(
                          'h-4.5 w-4.5 transition-transform duration-200',
                          !isActive && 'group-hover:scale-110'
                        )} />
                      </span>
                      <span className="font-display">{item.label}</span>

                      {/* Active indicator glow */}
                      {isActive && (
                        <div className="absolute left-0 w-1 h-8 rounded-r-full bg-mercury-aqua shadow-glow" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Chrome gradient separator */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-mercury-silver/30 to-transparent" />

          {/* Footer */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 500 500"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="125" cy="125" r="115" fill="#BBBABC" opacity="0.8"/>
                  <circle cx="375" cy="125" r="115" fill="#BBBABC" opacity="0.8"/>
                  <circle cx="125" cy="375" r="115" fill="#BBBABC" opacity="0.8"/>
                  <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-display font-semibold tracking-[0.2em] text-mercury-silver/60 uppercase">
                  Liquid Mercury
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
