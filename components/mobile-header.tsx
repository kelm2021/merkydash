'use client';

import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

export function MobileHeader({ isMenuOpen, onToggleMenu }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-mercury-dark-grey border-b border-white/10">
      <div className="flex items-center justify-between h-full px-4">
        {/* Menu Toggle Button */}
        <button
          onClick={onToggleMenu}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <Menu className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Logo & Title */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden">
            <Image
              src="/LiquidMercury-Icon-500px.png"
              alt="Liquid Mercury"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-base font-display font-semibold text-white">
            MERC Dashboard
          </span>
        </div>

        {/* Spacer for centering */}
        <div className="w-10" />
      </div>
    </header>
  );
}

export default MobileHeader;
