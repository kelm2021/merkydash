'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { PieChart, Users, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Holder {
    rank: number;
    address: string;
    shortAddress: string;
    balanceFormatted: string;
    percentage: string;
    chain: string;
    explorerUrl: string;
}

interface HolderDistributionChartProps {
    className?: string;
}

export function HolderDistributionChart({ className }: HolderDistributionChartProps) {
    const [holders, setHolders] = useState<Holder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHolders = async () => {
            try {
                const res = await fetch('/api/blockchain-holders');
                const data = await res.json();
                if (data.success && data.holders) {
                    setHolders(data.holders.slice(0, 10));
                } else {
                    setError('Failed to load holder data');
                }
            } catch (err) {
                setError('Failed to fetch holder data');
                console.error('Error fetching holders:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHolders();
        const interval = setInterval(fetchHolders, 300000); // Refresh every 5 minutes
        return () => clearInterval(interval);
    }, []);

    // Calculate concentration metrics
    const top10Percentage = holders.reduce((sum, h) => sum + parseFloat(h.percentage || '0'), 0);
    const concentrationRisk = top10Percentage > 50 ? 'HIGH' : top10Percentage > 30 ? 'MEDIUM' : 'LOW';
    const riskColor = concentrationRisk === 'HIGH' ? 'text-red-400' : concentrationRisk === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400';

    // Colors for the pie chart segments
    const colors = [
        '#9DD7E6', // Accent teal
        '#7C3AED', // Purple
        '#10B981', // Green
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#6366F1', // Indigo
        '#EC4899', // Pink
        '#14B8A6', // Teal
        '#84CC16', // Lime
        '#8B5CF6', // Violet
    ];

    // Generate SVG pie chart
    const generatePieChart = () => {
        if (holders.length === 0) return null;

        const total = 100; // Total percentage
        let cumulativePercentage = 0;

        return holders.map((holder, index) => {
            const percentage = parseFloat(holder.percentage || '0');
            const startAngle = (cumulativePercentage / total) * 360;
            cumulativePercentage += percentage;
            const endAngle = (cumulativePercentage / total) * 360;

            // Calculate arc path
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);

            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const largeArcFlag = percentage > 50 ? 1 : 0;

            const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            return (
                <path
                    key={index}
                    d={pathData}
                    fill={colors[index % colors.length]}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="0.5"
                    className="transition-all duration-300 hover:opacity-80"
                />
            );
        });
    };

    if (isLoading) {
        return (
            <Card className={cn("p-6 glass-dark", className)}>
                <div className="flex items-center justify-center h-48">
                    <div className="animate-pulse text-muted-foreground">Loading holder data...</div>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={cn("p-6 glass-dark", className)}>
                <div className="flex items-center justify-center h-48 text-red-400">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {error}
                </div>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className={cn("p-6 glass-dark overflow-hidden", className)}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                            <PieChart className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Holder Distribution</h3>
                            <p className="text-xs text-muted-foreground">Top 10 wallets by holdings</p>
                        </div>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", riskColor,
                        concentrationRisk === 'HIGH' ? 'border-red-400/30 bg-red-400/10' :
                            concentrationRisk === 'MEDIUM' ? 'border-yellow-400/30 bg-yellow-400/10' :
                                'border-green-400/30 bg-green-400/10'
                    )}>
                        {concentrationRisk} CONCENTRATION
                    </div>
                </div>

                {/* Chart and Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="flex items-center justify-center">
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                {generatePieChart()}
                                {/* Center hole for donut effect */}
                                <circle cx="50" cy="50" r="25" fill="rgba(0,0,0,0.8)" />
                            </svg>
                            {/* Center text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-white">{top10Percentage.toFixed(1)}%</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Top 10</span>
                            </div>
                        </div>
                    </div>

                    {/* Holder List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                        {holders.map((holder, index) => (
                            <a
                                key={holder.address}
                                href={`${holder.explorerUrl}/address/${holder.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    />
                                    <div>
                                        <span className="text-xs font-mono text-white group-hover:text-accent transition-colors">
                                            {holder.shortAddress}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground ml-2">
                                            {holder.chain}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-white">{holder.percentage}%</div>
                                    <div className="text-[10px] text-muted-foreground">{holder.balanceFormatted}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-lg font-black text-white">{holders.length}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Holders</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-black text-white">{(100 - top10Percentage).toFixed(1)}%</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Retail</div>
                    </div>
                    <div className="text-center">
                        <div className={cn("text-lg font-black", riskColor)}>{concentrationRisk}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Level</div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

export default HolderDistributionChart;
