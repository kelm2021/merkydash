'use client';

import { Newspaper, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { GlassCard } from '@/components/ui/glass-card';

export default function SalibaSignalPage() {
  return (
    <div className="min-h-screen page-background flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">

        {/* Hero Header */}
        <PageHeader
          title="The Saliba Signal"
          subtitle="Newsletter metrics and subscriber analytics"
          actions={
            <a
              href="https://thesalibasignal.beehiiv.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-mercury-aqua hover:bg-mercury-aqua-dark text-mercury-dark-grey font-semibold shadow-glow hover:shadow-glow transition-all duration-200 px-4 py-2.5 rounded-xl text-sm"
            >
              <span>Visit Newsletter</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          }
        />

        {/* Dashboard Embed */}
        <GlassCard hover={false} className="flex-1 overflow-hidden">
          <iframe
            src="https://beehiiv-dashboard.vercel.app/"
            className="w-full h-full border-0"
            title="The Saliba Signal Metrics"
            style={{ minHeight: 'calc(100vh - 280px)' }}
          />
        </GlassCard>

        {/* Footer */}
        <footer className="mt-8 pt-8 border-t border-mercury-light-grey/50">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                <circle cx="125" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="125" cy="375" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
              </svg>
              <span className="text-lg font-display font-bold text-mercury-dark-grey tracking-tight">LIQUID MERCURY</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Powered by Liquid Mercury
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
