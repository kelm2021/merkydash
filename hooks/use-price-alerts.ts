'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PriceAlert {
    id: string;
    targetPrice: number;
    condition: 'above' | 'below';
    createdAt: number;
    triggered: boolean;
    repeating: boolean;
}

const STORAGE_KEY = 'merc-price-alerts';

export function usePriceAlerts(currentPrice: number) {
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);

    // Load alerts from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setAlerts(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading price alerts:', error);
        }
    }, []);

    // Save alerts to localStorage whenever they change
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
        } catch (error) {
            console.error('Error saving price alerts:', error);
        }
    }, [alerts]);

    // Check alerts against current price
    useEffect(() => {
        if (!currentPrice || currentPrice === 0) return;

        alerts.forEach(alert => {
            if (alert.triggered && !alert.repeating) return;

            const shouldTrigger =
                (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
                (alert.condition === 'below' && currentPrice <= alert.targetPrice);

            if (shouldTrigger && alert.id !== lastNotifiedId) {
                // Trigger browser notification
                triggerNotification(alert, currentPrice);
                setLastNotifiedId(alert.id);

                // Mark as triggered if not repeating
                if (!alert.repeating) {
                    setAlerts(prev =>
                        prev.map(a => a.id === alert.id ? { ...a, triggered: true } : a)
                    );
                }
            }
        });
    }, [currentPrice, alerts, lastNotifiedId]);

    const triggerNotification = (alert: PriceAlert, price: number) => {
        if (typeof window === 'undefined') return;

        // Request notification permission if needed
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('🚨 MERC Price Alert', {
                    body: `MERC is now $${price.toFixed(6)} (${alert.condition} $${alert.targetPrice.toFixed(6)})`,
                    icon: '/LiquidMercury-Icon-500px.png',
                    tag: alert.id,
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }

        // Also show a console log for debugging
        console.log(`🚨 Price Alert Triggered: MERC at $${price.toFixed(6)} (${alert.condition} $${alert.targetPrice.toFixed(6)})`);
    };

    const addAlert = useCallback((targetPrice: number, condition: 'above' | 'below', repeating: boolean = false) => {
        const newAlert: PriceAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            targetPrice,
            condition,
            createdAt: Date.now(),
            triggered: false,
            repeating,
        };

        setAlerts(prev => [...prev, newAlert]);

        // Request notification permission
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return newAlert;
    }, []);

    const removeAlert = useCallback((id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    }, []);

    const clearAllAlerts = useCallback(() => {
        setAlerts([]);
    }, []);

    return {
        alerts,
        addAlert,
        removeAlert,
        clearAllAlerts,
        activeAlerts: alerts.filter(a => !a.triggered || a.repeating),
        triggeredAlerts: alerts.filter(a => a.triggered && !a.repeating),
    };
}

export default usePriceAlerts;
