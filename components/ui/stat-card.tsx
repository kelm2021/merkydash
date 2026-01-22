'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  delay?: number;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      subtitle,
      icon: Icon,
      iconColor = 'text-mercury-aqua',
      trend,
      delay = 0,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-card rounded-2xl p-6 card-lift animate-fade-up',
          className
        )}
        style={{ animationDelay: `${delay}ms` }}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Label */}
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              {title}
            </p>

            {/* Value */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-display font-bold text-mercury-dark-grey tabular-nums">
                {value}
              </span>
              {trend && (
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive !== false ? 'text-emerald-500' : 'text-red-500'
                  )}
                >
                  {trend.isPositive !== false ? '+' : ''}
                  {trend.value}%
                </span>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div className="icon-container icon-container-md">
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';

// Compact variant for smaller stat displays
interface CompactStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
}

const CompactStatCard = React.forwardRef<HTMLDivElement, CompactStatCardProps>(
  ({ className, label, value, icon: Icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 rounded-xl bg-white/50 px-4 py-3 backdrop-blur-sm',
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="icon-container icon-container-sm">
            <Icon className="h-4 w-4 text-mercury-aqua" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-lg font-display font-semibold text-mercury-dark-grey tabular-nums">
            {value}
          </p>
        </div>
      </div>
    );
  }
);

CompactStatCard.displayName = 'CompactStatCard';

export { StatCard, CompactStatCard };
