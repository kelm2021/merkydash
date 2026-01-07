
'use client';

import DashboardHeader from '@/components/dashboard-header';

export default function SalibaSignalPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />

      <main className="flex-1 flex flex-col">
        <iframe
          src="https://beehiiv-dashboard.vercel.app/"
          className="flex-1 w-full border-0"
          title="The Saliba Signal Metrics"
          style={{ minHeight: 'calc(100vh - 64px)' }}
        />
      </main>
    </div>
  );
}
