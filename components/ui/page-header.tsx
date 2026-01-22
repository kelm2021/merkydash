'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, badge, actions, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('hero-background rounded-2xl p-8 mb-8', className)}
        {...props}
      >
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {/* Badge */}
              {badge && <div className="mb-3">{badge}</div>}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                {title}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <p className="text-mercury-silver/80 text-sm md:text-base max-w-xl">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Actions */}
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>

          {/* Additional content */}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

// Price display badge for headers
interface PriceBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  price: string;
  change?: number;
  label?: string;
}

const PriceBadge = React.forwardRef<HTMLDivElement, PriceBadgeProps>(
  ({ className, price, change, label = 'Current Price', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-dark rounded-xl px-5 py-3 inline-flex flex-col',
          className
        )}
        {...props}
      >
        <span className="text-[10px] font-medium uppercase tracking-wider text-mercury-silver/60 mb-1">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-display font-bold text-white tabular-nums">
            {price}
          </span>
          {change !== undefined && (
            <span
              className={cn(
                'text-sm font-medium',
                change >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {change >= 0 ? '+' : ''}
              {change.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
    );
  }
);

PriceBadge.displayName = 'PriceBadge';

// Section header for content areas
interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, subtitle, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between mb-6', className)}
        {...props}
      >
        <div>
          <h2 className="text-xl font-display font-semibold text-mercury-dark-grey section-underline">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';

export { PageHeader, PriceBadge, SectionHeader };
