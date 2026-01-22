import { NextResponse } from 'next/server';

// Contract addresses
const BASE_CONTRACT = '0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058';
const ETH_CONTRACT = '0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810';

// Alchemy API endpoints
const ALCHEMY_ETH_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

// Known whale wallets to track (top holders + known smart money)
// These are seeded from the top holders - can be expanded
const WATCHED_WALLETS = [
    // Top ETH holders (will be populated dynamically in production)
    '0x1234567890abcdef1234567890abcdef12345678', // Placeholder - replace with real addresses
];

// DEX contract addresses for Buy/Sell detection
const DEX_ADDRESSES = new Set([
    '0x52cee6aa2d53882ac1f3497c563f0439fc178744',
    '0x99543a3dcf169c8e442cc5ba1cb978ff1df2a8be',
    '0x9c80da2f970df28d833f5349aeb68301cdf3ecf9',
    '0xe592427a0aece92de3edee1f18e0157c05861564',
    '0x2626664c2603336e57b271c5c0b26f421741e481',
    '0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43',
].map(addr => addr.toLowerCase()));

function timeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000) - timestamp;
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function getTransactionType(from: string, to: string): 'BUY' | 'SELL' | 'TRANSFER' {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();
    const fromIsDex = DEX_ADDRESSES.has(fromLower);
    const toIsDex = DEX_ADDRESSES.has(toLower);

    if (fromIsDex && !toIsDex) return 'BUY';
    if (!fromIsDex && toIsDex) return 'SELL';
    return 'TRANSFER';
}

function formatValue(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
}

// Fetch large transactions (whale activity) from Alchemy
async function fetchLargeTransactions(alchemyUrl: string, contractAddress: string, chain: string) {
    try {
        const response = await fetch(alchemyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'alchemy_getAssetTransfers',
                params: [{
                    fromBlock: '0x0',
                    toBlock: 'latest',
                    contractAddresses: [contractAddress],
                    category: ['erc20'],
                    order: 'desc',
                    maxCount: '0x64', // 100 transactions
                    withMetadata: true
                }]
            }),
            next: { revalidate: 30 } // Cache for 30 seconds
        });

        if (!response.ok) {
            console.error(`Alchemy ${chain} API error:`, response.status);
            return [];
        }

        const data = await response.json();

        if (!data.result?.transfers) {
            console.error(`Alchemy ${chain} API response error:`, data);
            return [];
        }

        // Filter for large transactions (> 10,000 MERC) - whale threshold
        const WHALE_THRESHOLD = 10000;

        return data.result.transfers
            .filter((tx: any) => (tx.value || 0) >= WHALE_THRESHOLD)
            .slice(0, 10)
            .map((tx: any) => {
                const value = tx.value || 0;
                const type = getTransactionType(tx.from, tx.to);
                const timestamp = Math.floor(new Date(tx.metadata?.blockTimestamp).getTime() / 1000);

                return {
                    id: tx.hash,
                    wallet: tx.from,
                    shortWallet: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
                    type,
                    amount: formatValue(value),
                    rawAmount: value,
                    timeAgo: timeAgo(timestamp),
                    timestamp,
                    chain,
                    explorerUrl: chain === 'ETH'
                        ? `https://etherscan.io/tx/${tx.hash}`
                        : `https://basescan.org/tx/${tx.hash}`,
                    // Severity based on transaction size
                    severity: value >= 100000 ? 'critical' : value >= 50000 ? 'high' : 'medium'
                };
            });
    } catch (error) {
        console.error(`Error fetching ${chain} whale activity:`, error);
        return [];
    }
}

export async function GET() {
    try {
        // Fetch from both chains in parallel
        const [ethActivity, baseActivity] = await Promise.all([
            fetchLargeTransactions(ALCHEMY_ETH_URL, ETH_CONTRACT, 'ETH'),
            fetchLargeTransactions(ALCHEMY_BASE_URL, BASE_CONTRACT, 'BASE')
        ]);

        // Combine and sort by timestamp
        const allActivity = [...ethActivity, ...baseActivity]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 15); // Return top 15 most recent whale moves

        // Calculate summary stats
        const buyVolume = allActivity
            .filter(a => a.type === 'BUY')
            .reduce((sum, a) => sum + a.rawAmount, 0);
        const sellVolume = allActivity
            .filter(a => a.type === 'SELL')
            .reduce((sum, a) => sum + a.rawAmount, 0);

        return NextResponse.json({
            success: true,
            activity: allActivity,
            summary: {
                totalAlerts: allActivity.length,
                buyVolume: formatValue(buyVolume),
                sellVolume: formatValue(sellVolume),
                netFlow: formatValue(buyVolume - sellVolume),
                sentiment: buyVolume > sellVolume ? 'bullish' : 'bearish'
            }
        });
    } catch (error) {
        console.error('Error in whale-activity API:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch whale activity', activity: [] },
            { status: 500 }
        );
    }
}
