'use client';

import { Newspaper, ExternalLink } from 'lucide-react';

export default function SalibaSignalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#9DD7E6]/5 flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">

        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#414042] via-[#414042] to-[#414042]/90 p-8 shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5REQ3RTYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#9DD7E6]/20 flex items-center justify-center">
                <Newspaper className="w-7 h-7 text-[#9DD7E6]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">The Saliba Signal</h1>
                <p className="text-[#B8BABC] text-sm mt-1">
                  Newsletter metrics and subscriber analytics
                </p>
              </div>
            </div>
            <a
              href="https://thesalibasignal.beehiiv.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#9DD7E6] hover:bg-[#9DD7E6]/90 text-[#414042] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2.5 rounded-lg text-sm"
            >
              <span>Visit Newsletter</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Dashboard Embed */}
        <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E2E3E4]">
          <iframe
            src="https://beehiiv-dashboard.vercel.app/"
            className="w-full h-full border-0"
            title="The Saliba Signal Metrics"
            style={{ minHeight: 'calc(100vh - 280px)' }}
          />
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-8 border-t border-[#E2E3E4]">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                <circle cx="125" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="125" r="115" fill="#B8BABC"/>
                <circle cx="125" cy="375" r="115" fill="#B8BABC"/>
                <circle cx="375" cy="375" r="115" fill="#9DD7E6"/>
              </svg>
              <span className="text-lg font-bold text-[#414042] tracking-tight">LIQUID MERCURY</span>
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
