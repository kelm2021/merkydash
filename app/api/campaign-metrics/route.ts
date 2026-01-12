
import { NextResponse } from 'next/server';

// Campaign start date: October 20, 2025
const CAMPAIGN_START = new Date('2025-10-20T00:00:00Z');
const CAMPAIGN_START_TIMESTAMP = Math.floor(CAMPAIGN_START.getTime() / 1000);

// Contract addresses
const ETH_CONTRACT = '0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810';
const BASE_CONTRACT = '0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058';

// Alchemy API endpoints
const ALCHEMY_ETH_URL = 'https://eth-mainnet.g.alchemy.com/v2/LTmMDP4PPx-RyoB76oYUH';
const ALCHEMY_BASE_URL = 'https://base-mainnet.g.alchemy.com/v2/LTmMDP4PPx-RyoB76oYUH';

// Dune Analytics API for baseline holder snapshots
const DUNE_API_KEY = process.env.DUNE_API_KEY;
const DUNE_ETH_QUERY_ID = '6513390';
const DUNE_BASE_QUERY_ID = '6513410';

// Known DEX contract addresses
const DEX_ADDRESSES = new Set([
  '0x52cee6aa2d53882ac1f3497c563f0439fc178744',
  '0x99543a3dcf169c8e442cc5ba1cb978ff1df2a8be',
  '0x9c80da2f970df28d833f5349aeb68301cdf3ecf9',
  '0xe592427a0aece92de3edee1f18e0157c05861564',
  '0x2626664c2603336e57b271c5c0b26f421741e481',
  '0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43',
  '0x0000000000000000000000000000000000000000',
].map(addr => addr.toLowerCase()));

interface NewWallet {
  address: string;
  shortAddress: string;
  chain: string;
  firstAcquisitionDate: string;
  firstAcquisitionTimestamp: number;
  daysSinceAcquisition: number;
  acquisitionMethod: 'Bought' | 'Received' | 'Mixed';
  totalAcquired: number;
  currentBalance: number;
  totalSold: number;
  retentionRate: number;
  status: 'Holding' | 'Partial Exit' | 'Full Exit';
  heldOver20Days: boolean;
  explorerUrl: string;
}

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  newWallets: number;
  totalAcquired: number;
  avgAcquired: number;
}

interface HolderSnapshot {
  baseline: { eth: number; base: number; total: number };
  current: { eth: number; base: number; total: number };
  growth: { absolute: number; percentage: number; dailyRate: number };
}

// Fetch baseline holder count from a Dune query
async function fetchDuneQueryResult(queryId: string): Promise<number> {
  if (!DUNE_API_KEY) return 0;
  try {
    const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, {
      headers: { 'X-Dune-API-Key': DUNE_API_KEY },
      next: { revalidate: 3600 }
    });
    if (!response.ok) return 0;
    const data = await response.json();
    if (data.result?.rows?.[0]) {
      const row = data.result.rows[0];
      return row.eth_holder_count || row.base_holder_count || row.holder_count || row.holders || row.count || Object.values(row)[0] || 0;
    }
    return 0;
  } catch { return 0; }
}

// Fetch baseline holder counts from both Dune queries
async function fetchBaselineFromDune(): Promise<{ eth: number; base: number }> {
  const [eth, base] = await Promise.all([
    fetchDuneQueryResult(DUNE_ETH_QUERY_ID),
    fetchDuneQueryResult(DUNE_BASE_QUERY_ID)
  ]);
  return { eth, base };
}

// Fetch current total holder counts
async function fetchCurrentTotalHolders(): Promise<{ eth: number; base: number }> {
  let ethHolders = 0, baseHolders = 0;
  try {
    const r = await fetch(`https://api.ethplorer.io/getTokenInfo/${ETH_CONTRACT}?apiKey=freekey`, { next: { revalidate: 300 } });
    if (r.ok) ethHolders = (await r.json()).holdersCount || 0;
  } catch {}
  // Fetch BASE holders from Moralis API
  try {
    const moralisKey = process.env.MORALIS_API_KEY;
    if (moralisKey) {
      // Use cursor-based pagination to count all holders
      let cursor: string | null = null; let pages = 0;
      let totalHolders = 0;
      do { if (++pages > 20) break;
        const url = `https://deep-index.moralis.io/api/v2.2/erc20/${BASE_CONTRACT}/owners?chain=base&limit=100${cursor ? `&cursor=${cursor}` : ''}`;
        const r = await fetch(url, {
          headers: { 'X-API-Key': moralisKey },
          next: { revalidate: 300 }
        });
        if (r.ok) {
          const d = await r.json();
          totalHolders += d.result?.length || 0;
          cursor = d.cursor;
        } else {
          break;
        }
      } while (cursor);
      baseHolders = totalHolders;
    }
  } catch (e) { console.error('Moralis BASE holders error:', e); }
  return { eth: ethHolders, base: baseHolders };
}

// Fetch token transfers from Alchemy for a specific chain
async function fetchAlchemyTransfers(
  alchemyUrl: string,
  contractAddress: string,
  chain: string
): Promise<any[]> {
  try {
    console.log(`Fetching ${chain} transfers from Alchemy since campaign start...`);
    console.log('Campaign start timestamp:', CAMPAIGN_START_TIMESTAMP, 'Date:', CAMPAIGN_START.toISOString());

    // Convert campaign start timestamp to hex block (approximate - we'll filter by timestamp after)
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
          maxCount: '0x3E8', // 1000 transfers
          withMetadata: true
        }]
      }),
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Alchemy ${chain} API error:`, response.status, text);
      return [];
    }

    const data = await response.json();

    if (data.error) {
      console.error(`Alchemy ${chain} API returned error:`, data.error);
      return [];
    }

    if (!data.result?.transfers || !Array.isArray(data.result.transfers)) {
      console.error(`Alchemy ${chain} API: no transfers found in response`);
      return [];
    }

    console.log(`Alchemy ${chain} returned ${data.result.transfers.length} total transfers`);

    // Filter to transfers after campaign start and map to common format
    const transfers = data.result.transfers
      .map((tx: any) => {
        const timestamp = tx.metadata?.blockTimestamp
          ? Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000)
          : 0;
        return {
          from: tx.from,
          to: tx.to,
          value: tx.value || 0,
          timestamp,
          transactionHash: tx.hash,
          chain
        };
      })
      .filter((tx: any) => tx.timestamp >= CAMPAIGN_START_TIMESTAMP);

    console.log(`${chain} transfers after campaign start: ${transfers.length}`);
    return transfers;
  } catch (error) {
    console.error(`Error fetching ${chain} transfers from Alchemy:`, error);
    return [];
  }
}

// Fetch all transfers from both chains
async function fetchAllTransfers(): Promise<any[]> {
  const [ethTransfers, baseTransfers] = await Promise.all([
    fetchAlchemyTransfers(ALCHEMY_ETH_URL, ETH_CONTRACT, 'ETH'),
    fetchAlchemyTransfers(ALCHEMY_BASE_URL, BASE_CONTRACT, 'BASE')
  ]);

  const allTransfers = [...ethTransfers, ...baseTransfers];
  console.log(`Total transfers from both chains: ${allTransfers.length} (ETH: ${ethTransfers.length}, BASE: ${baseTransfers.length})`);

  return allTransfers;
}

// Fetch current top holders to get balances from both chains
async function fetchCurrentHolders(): Promise<Map<string, number>> {
  const holdersMap = new Map<string, number>();

  // Fetch ETH holders from Ethplorer (still use free API for holder balances)
  try {
    const url = `https://api.ethplorer.io/getTopTokenHolders/${ETH_CONTRACT}?apiKey=freekey&limit=100`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.holders && Array.isArray(data.holders)) {
        data.holders.forEach((h: any) => {
          const balance = Number(BigInt(h.rawBalance || '0') / BigInt(1e18));
          holdersMap.set(h.address.toLowerCase(), balance);
        });
      }
    }
  } catch (error) {
    console.error('Error fetching ETH holders:', error);
  }

  // Note: BASE holder balances would need additional API calls
  // For now, we rely on transaction-based balance calculation for BASE

  return holdersMap;
}

// Analyze wallets that first acquired tokens after campaign start
function analyzeNewWallets(transfers: any[], currentBalances: Map<string, number>): NewWallet[] {
  const walletData = new Map<string, {
    firstTimestamp: number;
    chain: string;
    totalBought: number;
    totalReceived: number;
    totalSold: number;
    totalSent: number;
  }>();

  // Process all transfers to build wallet profiles
  transfers.forEach(tx => {
    const toLower = tx.to?.toLowerCase();
    const fromLower = tx.from?.toLowerCase();
    const value = tx.value || 0;
    const fromIsDex = DEX_ADDRESSES.has(fromLower);
    const toIsDex = DEX_ADDRESSES.has(toLower);

    // Track receiving wallet (skip DEX addresses)
    if (toLower && !DEX_ADDRESSES.has(toLower)) {
      if (!walletData.has(toLower)) {
        walletData.set(toLower, {
          firstTimestamp: tx.timestamp,
          chain: tx.chain,
          totalBought: 0,
          totalReceived: 0,
          totalSold: 0,
          totalSent: 0
        });
      }
      const wallet = walletData.get(toLower)!;

      // Update first timestamp if earlier
      if (tx.timestamp < wallet.firstTimestamp) {
        wallet.firstTimestamp = tx.timestamp;
      }

      if (fromIsDex) {
        wallet.totalBought += value;
      } else {
        wallet.totalReceived += value;
      }
    }

    // Track sending wallet sells/transfers
    if (fromLower && !DEX_ADDRESSES.has(fromLower) && walletData.has(fromLower)) {
      const wallet = walletData.get(fromLower)!;
      if (toIsDex) {
        wallet.totalSold += value;
      } else {
        wallet.totalSent += value;
      }
    }
  });

  // Convert to NewWallet objects
  const newWallets: NewWallet[] = [];
  const now = Math.floor(Date.now() / 1000);

  walletData.forEach((data, address) => {
    const totalAcquired = data.totalBought + data.totalReceived;

    // Get current balance from holder data, or estimate from transactions
    const currentBalance = currentBalances.get(address) ||
      Math.max(0, totalAcquired - data.totalSold - data.totalSent);

    const daysSince = Math.floor((now - data.firstTimestamp) / 86400);
    const retentionRate = totalAcquired > 0 ? (currentBalance / totalAcquired) * 100 : 0;

    let status: 'Holding' | 'Partial Exit' | 'Full Exit' = 'Holding';
    if (currentBalance < 1 || retentionRate < 5) {
      status = 'Full Exit';
    } else if (retentionRate < 80) {
      status = 'Partial Exit';
    }

    let acquisitionMethod: 'Bought' | 'Received' | 'Mixed' = 'Mixed';
    if (data.totalBought > 0 && data.totalReceived === 0) {
      acquisitionMethod = 'Bought';
    } else if (data.totalReceived > 0 && data.totalBought === 0) {
      acquisitionMethod = 'Received';
    }

    newWallets.push({
      address,
      shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
      chain: data.chain,
      firstAcquisitionDate: new Date(data.firstTimestamp * 1000).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      }),
      firstAcquisitionTimestamp: data.firstTimestamp,
      daysSinceAcquisition: daysSince,
      acquisitionMethod,
      totalAcquired: Math.round(totalAcquired),
      currentBalance: Math.round(currentBalance),
      totalSold: Math.round(data.totalSold),
      retentionRate: Math.min(100, Math.round(retentionRate)),
      status,
      heldOver20Days: daysSince >= 20 && status !== 'Full Exit',
      explorerUrl: data.chain === 'BASE' ? 'https://basescan.org' : 'https://etherscan.io'
    });
  });

  return newWallets;
}

// Generate weekly breakdown
function generateWeeklyBreakdown(wallets: NewWallet[]): WeeklyData[] {
  const weeks: WeeklyData[] = [];
  const now = new Date();
  let weekStart = new Date(CAMPAIGN_START);

  while (weekStart < now) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekStartTs = Math.floor(weekStart.getTime() / 1000);
    const weekEndTs = Math.floor(weekEnd.getTime() / 1000);

    const weekWallets = wallets.filter(w =>
      w.firstAcquisitionTimestamp >= weekStartTs &&
      w.firstAcquisitionTimestamp <= weekEndTs
    );

    const totalAcquired = weekWallets.reduce((sum, w) => sum + w.totalAcquired, 0);

    weeks.push({
      weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      newWallets: weekWallets.length,
      totalAcquired,
      avgAcquired: weekWallets.length > 0 ? Math.round(totalAcquired / weekWallets.length) : 0
    });

    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
  }

  return weeks;
}

export async function GET() {
  try {
    // Fetch transfers and current holders in parallel
    const [transfers, currentBalances, baseline, currentTotalHolders] = await Promise.all([
      fetchAllTransfers(),
      fetchCurrentHolders(),
      fetchBaselineFromDune(),
      fetchCurrentTotalHolders()
    ]);

    console.log(`Fetched ${transfers.length} transfers since campaign start`);

    // Analyze new wallets
    const newWallets = analyzeNewWallets(transfers, currentBalances);
    console.log(`Analyzed ${newWallets.length} new wallets`);

    // Calculate metrics
    const now = new Date();
    const daysSinceCampaign = Math.floor((now.getTime() - CAMPAIGN_START.getTime()) / (1000 * 60 * 60 * 24));

    const acquisitionAmounts = newWallets.map(w => w.totalAcquired).filter(a => a > 0).sort((a, b) => a - b);
    const avgAcquisition = acquisitionAmounts.length > 0
      ? Math.round(acquisitionAmounts.reduce((a, b) => a + b, 0) / acquisitionAmounts.length)
      : 0;
    const medianAcquisition = acquisitionAmounts.length > 0
      ? acquisitionAmounts[Math.floor(acquisitionAmounts.length / 2)]
      : 0;

    const heldOver20Days = newWallets.filter(w => w.heldOver20Days);
    const stillHolding = newWallets.filter(w => w.status === 'Holding');
    const fullExit = newWallets.filter(w => w.status === 'Full Exit');

    const totalAcquired = newWallets.reduce((sum, w) => sum + w.totalAcquired, 0);
    const totalRetained = newWallets.reduce((sum, w) => sum + w.currentBalance, 0);

    const acquisitionByMethod = {
      bought: newWallets.filter(w => w.acquisitionMethod === 'Bought').length,
      received: newWallets.filter(w => w.acquisitionMethod === 'Received').length,
      mixed: newWallets.filter(w => w.acquisitionMethod === 'Mixed').length
    };

    const weeklyBreakdown = generateWeeklyBreakdown(newWallets);

    // Top holders by current balance
    const topNewHolders = [...newWallets]
      .filter(w => w.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, 10);

    // Most recent new wallets
    const recentNewWallets = [...newWallets]
      .sort((a, b) => b.firstAcquisitionTimestamp - a.firstAcquisitionTimestamp)
      .slice(0, 10);

    // Calculate holder snapshot growth metrics
    const baselineTotal = baseline.eth + baseline.base;
    const currentTotal = currentTotalHolders.eth + currentTotalHolders.base;
    const absoluteGrowth = currentTotal - baselineTotal;
    const percentageGrowth = baselineTotal > 0 ? Math.round((absoluteGrowth / baselineTotal) * 1000) / 10 : 0;
    const dailyRate = daysSinceCampaign > 0 ? Math.round((absoluteGrowth / daysSinceCampaign) * 10) / 10 : 0;

    const holderSnapshot: HolderSnapshot = {
      baseline: { eth: baseline.eth, base: baseline.base, total: baselineTotal },
      current: { eth: currentTotalHolders.eth, base: currentTotalHolders.base, total: currentTotal },
      growth: { absolute: absoluteGrowth, percentage: percentageGrowth, dailyRate: dailyRate }
    };

    const metrics = {
      campaignStart: CAMPAIGN_START.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      }),
      daysSinceCampaign,
      totalNewWallets: newWallets.length,
      totalNewWalletsETH: newWallets.filter(w => w.chain === 'ETH').length,
      totalNewWalletsBASE: newWallets.filter(w => w.chain === 'BASE').length,
      avgAcquisitionAmount: avgAcquisition,
      medianAcquisitionAmount: medianAcquisition,
      walletsHeldOver20Days: heldOver20Days.length,
      walletsHeldOver20DaysPercent: newWallets.length > 0
        ? Math.round((heldOver20Days.length / newWallets.length) * 100)
        : 0,
      walletsStillHolding: stillHolding.length,
      walletsStillHoldingPercent: newWallets.length > 0
        ? Math.round((stillHolding.length / newWallets.length) * 100)
        : 0,
      walletsFullExit: fullExit.length,
      walletsFullExitPercent: newWallets.length > 0
        ? Math.round((fullExit.length / newWallets.length) * 100)
        : 0,
      totalTokensAcquired: totalAcquired,
      totalTokensRetained: totalRetained,
      overallRetentionRate: totalAcquired > 0
        ? Math.round((totalRetained / totalAcquired) * 100)
        : 0,
      acquisitionByMethod,
      weeklyBreakdown,
      topNewHolders,
      recentNewWallets,
      holderSnapshot
    };

    return NextResponse.json({
      success: true,
      metrics,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in campaign-metrics API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign metrics' },
      { status: 500 }
    );
  }
}
