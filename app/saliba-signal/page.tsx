'use client';

import { Newspaper, ExternalLink } from 'lucide-react';

export default function SalibaSignalPage() {
  return (
    <div className="min-h-screen bg-[#F6F6F6] flex flex-col">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#414042] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#9DD7E6]/20 rounded-lg">
              <Newspaper className="w-6 h-6 text-[#9DD7E6]" />
            </div>
            <h1 className="text-2xl font-bold">The Saliba Signal</h1>
          </div>
          <p className="text-[#B8BABC] text-sm ml-[52px]">Newsletter metrics and subscriber analytics</p>

          <div className="mt-4 ml-[52px]">
            <a
              href="https://thesalibasignal.beehiiv.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#9DD7E6]/10 hover:bg-[#9DD7E6]/20 border border-[#9DD7E6]/30 rounded-lg text-[#9DD7E6] text-sm transition-colors"
            >
              <span>Visit Newsletter</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Dashboard Embed */}
      <div className="flex-1 flex flex-col bg-white">
        <iframe
          src="https://beehiiv-dashboard.vercel.app/"
          className="flex-1 w-full border-0"
          title="The Saliba Signal Metrics"
          style={{ minHeight: 'calc(100vh - 160px)' }}
        />
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-[#000000] to-[#414042] py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
          <img
            src="https://github.com/MerkyDevelopment/merkydash/blob/main/public/Liquid%20Mercury.png?raw=true"
            alt="Liquid Mercury"
            className="h-5 w-auto"
          />
          <span className="text-[#B8BABC] text-sm">Powered by Liquid Mercury</span>
        </div>
      </div>
    </div>
  );
}
