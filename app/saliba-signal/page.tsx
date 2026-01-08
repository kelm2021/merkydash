
'use client';

export default function SalibaSignalPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 py-4 border-b border-border/40">
        <h1 className="text-2xl font-bold text-foreground">The Saliba Signal</h1>
        <p className="text-sm text-muted-foreground">Newsletter metrics and analytics</p>
      </div>

      <div className="flex-1 flex flex-col">
        <iframe
          src="https://beehiiv-dashboard.vercel.app/"
          className="flex-1 w-full border-0"
          title="The Saliba Signal Metrics"
          style={{ minHeight: 'calc(100vh - 80px)' }}
        />
      </div>
    </div>
  );
}
