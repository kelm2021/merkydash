'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LiquidBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'hero' | 'page' | 'card';
  showBlobs?: boolean;
  showNoise?: boolean;
}

const LiquidBackground = React.forwardRef<HTMLDivElement, LiquidBackgroundProps>(
  ({ className, variant = 'page', showBlobs = true, showNoise = true, children, ...props }, ref) => {
    const baseClasses = {
      hero: 'hero-background',
      page: 'page-background',
      card: 'relative overflow-hidden',
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses[variant], 'relative', className)}
        {...props}
      >
        {/* Animated gradient blobs */}
        {showBlobs && variant === 'hero' && (
          <>
            <div
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float liquid-blob"
              style={{
                background: 'linear-gradient(135deg, var(--mercury-aqua) 0%, var(--mercury-aqua-dark) 100%)',
              }}
            />
            <div
              className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-float liquid-blob"
              style={{
                background: 'linear-gradient(135deg, var(--mercury-silver) 0%, var(--mercury-light-grey) 100%)',
                animationDelay: '-4s',
              }}
            />
          </>
        )}

        {/* Mesh gradient overlay */}
        {variant === 'page' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse at 30% 0%, rgba(157, 215, 230, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 100%, rgba(184, 186, 188, 0.08) 0%, transparent 50%)
              `,
            }}
          />
        )}

        {/* Noise texture overlay */}
        {showNoise && (
          <div className="noise-overlay absolute inset-0 pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

LiquidBackground.displayName = 'LiquidBackground';

export { LiquidBackground };
