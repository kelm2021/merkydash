'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DataBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'ethereum' | 'base' | 'positive' | 'negative' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  shimmer?: boolean;
}

const DataBadge = React.forwardRef<HTMLSpanElement, DataBadgeProps>(
  (
    { className, variant = 'default', size = 'md', shimmer = false, children, ...props },
    ref
  ) => {
    const variantClasses = {
      default:
        'bg-white/10 text-white border-white/20',
      ethereum:
        'badge-chain-eth text-white border-transparent',
      base:
        'badge-chain-base text-white border-transparent',
      positive:
        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      negative:
        'bg-red-500/20 text-red-400 border-red-500/30',
      neutral:
        'bg-mercury-aqua/10 text-mercury-aqua border-mercury-aqua/30',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full border font-semibold tracking-wide uppercase transition-all',
          variantClasses[variant],
          sizeClasses[size],
          shimmer && 'relative overflow-hidden',
          className
        )}
        {...props}
      >
        {shimmer && (
          <span className="absolute inset-0 shimmer" />
        )}
        <span className="relative z-10">{children}</span>
      </span>
    );
  }
);

DataBadge.displayName = 'DataBadge';

// Chain badge specifically for ETH/BASE indicators
interface ChainBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  chain: 'ETH' | 'BASE' | 'BOTH';
}

const ChainBadge = React.forwardRef<HTMLSpanElement, ChainBadgeProps>(
  ({ className, chain, ...props }, ref) => {
    if (chain === 'BOTH') {
      return (
        <span ref={ref} className={cn('inline-flex gap-1', className)} {...props}>
          <DataBadge variant="ethereum" size="sm">
            ETH
          </DataBadge>
          <DataBadge variant="base" size="sm">
            BASE
          </DataBadge>
        </span>
      );
    }

    return (
      <DataBadge
        ref={ref}
        variant={chain === 'ETH' ? 'ethereum' : 'base'}
        size="sm"
        className={className}
        {...props}
      >
        {chain}
      </DataBadge>
    );
  }
);

ChainBadge.displayName = 'ChainBadge';

// Status badge for showing status indicators
interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'active' | 'inactive' | 'pending' | 'warning';
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, children, ...props }, ref) => {
    const statusConfig = {
      active: {
        dotColor: 'bg-emerald-400',
        bgColor: 'bg-emerald-500/20',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
      },
      inactive: {
        dotColor: 'bg-gray-400',
        bgColor: 'bg-gray-500/20',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-500/30',
      },
      pending: {
        dotColor: 'bg-amber-400 animate-pulse',
        bgColor: 'bg-amber-500/20',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
      },
      warning: {
        dotColor: 'bg-red-400',
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/30',
      },
    };

    const config = statusConfig[status];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
          config.bgColor,
          config.textColor,
          config.borderColor,
          className
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
        {children}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// Percentage change badge
interface ChangeIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  showIcon?: boolean;
}

const ChangeIndicator = React.forwardRef<HTMLSpanElement, ChangeIndicatorProps>(
  ({ className, value, showIcon = true, ...props }, ref) => {
    const isPositive = value >= 0;

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-0.5 text-sm font-medium tabular-nums',
          isPositive ? 'text-emerald-400' : 'text-red-400',
          className
        )}
        {...props}
      >
        {showIcon && (
          <svg
            className={cn('w-3.5 h-3.5', !isPositive && 'rotate-180')}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {isPositive ? '+' : ''}
        {value.toFixed(2)}%
      </span>
    );
  }
);

ChangeIndicator.displayName = 'ChangeIndicator';

export { DataBadge, ChainBadge, StatusBadge, ChangeIndicator };
