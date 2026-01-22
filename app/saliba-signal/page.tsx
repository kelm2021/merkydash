
'use client';

import DashboardHeader from '@/components/dashboard-header';
import { motion } from 'framer-motion';

export default function SalibaSignalPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <DashboardHeader />

      <main className="flex-1 flex flex-col bg-black overflow-hidden p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 w-full glass-dark rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"
        >
          <iframe
            src="https://beehiiv-dashboard.vercel.app/"
            className="w-full h-full border-0"
            title="The Saliba Signal Metrics"
            style={{ minHeight: 'calc(100vh - 160px)' }}
          />
          <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-3xl" />
        </motion.div>
      </main>
    </div>
  );
}
