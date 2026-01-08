'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellRing, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PriceAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPrice: number;
    onAddAlert: (targetPrice: number, condition: 'above' | 'below', repeating: boolean) => void;
}

export function PriceAlertModal({ isOpen, onClose, currentPrice, onAddAlert }: PriceAlertModalProps) {
    const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
    const [condition, setCondition] = useState<'above' | 'below'>('above');
    const [repeating, setRepeating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(targetPrice);
        if (isNaN(price) || price <= 0) return;

        onAddAlert(price, condition, repeating);
        onClose();
    };

    const presetPrices = [
        { label: '+10%', value: currentPrice * 1.1 },
        { label: '+25%', value: currentPrice * 1.25 },
        { label: '-10%', value: currentPrice * 0.9 },
        { label: '-25%', value: currentPrice * 0.75 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="glass-dark border border-white/10 rounded-2xl p-6 shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-accent/10">
                                        <Bell className="h-5 w-5 text-accent" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Set Price Alert</h2>
                                        <p className="text-xs text-muted-foreground">Get notified when MERC hits your target</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <X className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Current Price Display */}
                            <div className="text-center mb-6 p-4 glass rounded-xl border border-white/5">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Price</p>
                                <p className="text-2xl font-mono font-bold text-white">${currentPrice.toFixed(6)}</p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Condition Toggle */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setCondition('above')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                                            condition === 'above'
                                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                                : "border-white/10 text-muted-foreground hover:bg-white/5"
                                        )}
                                    >
                                        <TrendingUp className="h-4 w-4" />
                                        <span className="font-semibold">Above</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCondition('below')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                                            condition === 'below'
                                                ? "bg-red-500/10 border-red-500/30 text-red-400"
                                                : "border-white/10 text-muted-foreground hover:bg-white/5"
                                        )}
                                    >
                                        <TrendingDown className="h-4 w-4" />
                                        <span className="font-semibold">Below</span>
                                    </button>
                                </div>

                                {/* Target Price Input */}
                                <div className="mb-4">
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                                        Target Price (USD)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={targetPrice}
                                        onChange={(e) => setTargetPrice(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-lg focus:outline-none focus:border-accent/50 transition-colors"
                                        placeholder="0.000000"
                                    />
                                </div>

                                {/* Preset Buttons */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {presetPrices.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => {
                                                setTargetPrice(preset.value.toFixed(6));
                                                setCondition(preset.label.startsWith('+') ? 'above' : 'below');
                                            }}
                                            className={cn(
                                                "p-2 rounded-lg border border-white/10 text-xs font-bold transition-all hover:bg-white/5",
                                                preset.label.startsWith('+') ? "text-green-400" : "text-red-400"
                                            )}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Repeating Toggle */}
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 mb-6 cursor-pointer hover:bg-white/5 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={repeating}
                                        onChange={(e) => setRepeating(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-accent focus:ring-accent"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-white">Repeat Alert</p>
                                        <p className="text-xs text-muted-foreground">Notify every time price crosses this level</p>
                                    </div>
                                    <BellRing className={cn("h-4 w-4 ml-auto", repeating ? "text-accent" : "text-muted-foreground")} />
                                </label>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-bold py-6"
                                >
                                    <Bell className="h-4 w-4 mr-2" />
                                    Create Alert
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default PriceAlertModal;
