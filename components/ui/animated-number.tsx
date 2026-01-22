'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

const AnimatedNumber = React.forwardRef<HTMLSpanElement, AnimatedNumberProps>(
  (
    {
      className,
      value,
      duration = 1000,
      decimals = 0,
      prefix = '',
      suffix = '',
      formatOptions,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState(0);
    const [hasAnimated, setHasAnimated] = React.useState(false);
    const elementRef = React.useRef<HTMLSpanElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => elementRef.current!);

    React.useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              setHasAnimated(true);
              animateValue(0, value, duration);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, [value, duration, hasAnimated]);

    // Re-animate when value changes after initial animation
    React.useEffect(() => {
      if (hasAnimated) {
        animateValue(displayValue, value, duration / 2);
      }
    }, [value]);

    const animateValue = (start: number, end: number, animDuration: number) => {
      const startTime = performance.now();
      const diff = end - start;

      const easeOutQuart = (x: number): number => {
        return 1 - Math.pow(1 - x, 4);
      };

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animDuration, 1);
        const easedProgress = easeOutQuart(progress);

        setDisplayValue(start + diff * easedProgress);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };

    const formatNumber = (num: number): string => {
      if (formatOptions) {
        return new Intl.NumberFormat('en-US', formatOptions).format(num);
      }

      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    return (
      <span
        ref={elementRef}
        className={cn('tabular-nums font-display animate-count-up', className)}
        {...props}
      >
        {prefix}
        {formatNumber(displayValue)}
        {suffix}
      </span>
    );
  }
);

AnimatedNumber.displayName = 'AnimatedNumber';

// Simplified version for static display with animation class only
interface StaticAnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

const StaticAnimatedNumber = React.forwardRef<HTMLSpanElement, StaticAnimatedNumberProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn('tabular-nums font-display animate-count-up', className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

StaticAnimatedNumber.displayName = 'StaticAnimatedNumber';

export { AnimatedNumber, StaticAnimatedNumber };
