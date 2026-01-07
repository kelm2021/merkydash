
import { NextResponse } from 'next/server';

// Contract addresses
const BASE_CONTRACT = '0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058';
const ETH_CONTRACT = '0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810';

// Alchemy API endpoints
const ALCHEMY_ETH_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

// Known DEX contract addresses (pools and routers)
const DEX_ADDRESSES = new Set([
  '0x52cee6aa2d53882ac1f3497c563f0439fc178744',
  '0x99543a3dcf169c8e442cc5ba1cb978ff1df2a8be',
  '0x9c80da2f970df28d833f5349aeb68301cdf3ecf9',
  '0xe592427a0aece92de3edee1f18e0157c05861564',
  '0x2626664c2603336e57b271c5c0b26f421741e481',
  '0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43',
].map(addr => addr.toLowerCase()));

interface HolderTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  timestamp: number;
  type: 'Buy' | 'Sell' | 'Transfer_In' | 'Transfer_Out';
  chain: string;
}

interface HolderBehavior {
  address: string;
  shortAddress: string;
  chain: string;
  currentBalance: number;
  balanceFormatted: string;
  firstAcquisitionDate: string;
  firstAcquisitionTimestamp: number;
  holdingDurationDays: number;
  holdingDurationLabel: string;
  acquisitionMethod: 'Bought' | 'Received' | 'Mixed';
  totalBought: number;
  totalReceived: number;
  totalSold: number;
  totalSent: number;
  netPosition: number;
  behaviorType: 'Diamond Hands' | 'Accumulator' | 'Active Trader' | 'Partial Seller' | 'Immediate Liquidator' | 'New Holder';
  behaviorDescription: string;
  recentTransactions: {
    date: string;
    type: string;
    amount: string;
  }[];
  explorerUrl: string;
}

function getTransactionType(from: string, to: string, holderAddress: string): 'Buy' | 'Sell' | 'Transfer_In' | 'Transfer_Out' {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();
  const holderLower = holderAddress.toLowerCase();
  const fromIsDex = DEX_ADDRESSES.has(fromLower);
  const toIsDex = DEX_ADDRESSES.has(toLower);

  // If holder is receiving
  if (toLower === holderLower) {
    if (fromIsDex) return 'Buy';
    return 'Transfer_In';
  }
  // If holder is sending
  if (fromLower === holderLower) {
    if (toIsDex) return 'Sell';
    return 'Transfer_Out';
  }
  return 'Transfer_In';
}

function classifyBehavior(
  holdingDays: number,
  totalBought: number,
  totalReceived: number,
  totalSold: number,
  totalSent: number,
  currentBalance: number
): { type: HolderBehavior['behaviorType']; description: string } {
  const totalAcquired = totalBought + totalReceived;
  const totalDisposed = totalSold + totalSent;
  const retentionRate = totalAcquired > 0 ? (currentBalance / totalAcquired) * 100 : 100;
  const sellRate = totalAcquired > 0 ? (totalSold / totalAcquired) * 100 : 0;

  // New holder - less than 7 days
  if (holdingDays < 7) {
    if (sellRate > 80) {
      return { type: 'Immediate Liquidator', description: 'Sold most tokens within days of acquisition' };
    }
    return { type: 'New Holder', description: `Acquired ${holdingDays} day${holdingDays === 1 ? '' : 's'} ago, watching behavior` };
  }

  // Immediate liquidator - sold most within short period
  if (sellRate > 80 && holdingDays < 14) {
    return { type: 'Immediate Liquidator', description: 'Quickly sold majority of acquired tokens' };
  }

  // Diamond hands - held for 30+ days with minimal selling
  if (holdingDays >= 30 && retentionRate >= 90) {
    return { type: 'Diamond Hands', description: `Holding strong for ${holdingDays} days with ${retentionRate.toFixed(0)}% retention` };
  }

  // Accumulator - still buying, minimal sells
  if (totalBought > totalSold * 2 && holdingDays >= 14) {
    return { type: 'Accumulator', description: 'Consistently adding to position over time' };
  }

  // Active trader - frequent buys and sells
  if (totalSold > 0 && totalBought > 0 && sellRate >= 30 && sellRate <= 70) {
    return { type: 'Active Trader', description: 'Regularly trading in and out of position' };
  }

  // Partial seller - sold some but still holding
  if (sellRate > 20 && sellRate < 80 && currentBalance > 0) {
    return { type: 'Partial Seller', description: `Sold ${sellRate.toFixed(0)}% of acquired tokens, still holding` };
  }

  // Default to diamond hands if still holding significant amount
  if (retentionRate >= 70) {
    return { type: 'Diamond Hands', description: `Long-term holder with ${retentionRate.toFixed(0)}% retention` };
  }

  return { type: 'Active Trader', description: 'Mixed trading activity' };
}

function formatDuration(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''}`;
  if (days < 365) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''}`;
  return `${(days / 365).toFixed(1)} years`;
}

// Fetch top holders from Ethplorer
async function fetchEthereumTopHolders(): Promise<{ address: string; balance: string }[]> {
  try {
    const url = `https://api.ethplorer.io/getTopTokenHolders/${ETH_CONTRACT}?apiKey=freekey&limit=20`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });

    if (!response.ok) return [];
    const data = await response.json();

    if (!data.holders) return [];

    return data.holders.map((h: any) => ({
      address: h.address,
      balance: h.rawBalance || '0'
    }));
  } catch (error) {
    console.error('Error fetching ETH holders:', error);
    return [];
  }
}

// Fetch transaction history for a specific holder
async function fetchHolderTransactions(
  holderAddress: string,
  alchemyUrl: string,
  contractAddress: string,
  chain: string
): Promise<HolderTransaction[]> {
  try {
    // Fetch incoming transfers (to holder)
    const incomingResponse = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: holderAddress,
          contractAddresses: [contractAddress],
          category: ['erc20'],
          order: 'asc',
          maxCount: '0x64',
          withMetadata: true
        }]
      }),
      next: { revalidate: 300 }
    });

    // Fetch outgoing transfers (from holder)
    const outgoingResponse = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          fromAddress: holderAddress,
          contractAddresses: [contractAddress],
          category: ['erc20'],
          order: 'asc',
          maxCount: '0x64',
          withMetadata: true
        }]
      }),
      next: { revalidate: 300 }
    });

    const transactions: HolderTransaction[] = [];

    if (incomingResponse.ok) {
      const inData = await incomingResponse.json();
      if (inData.result?.transfers) {
        inData.result.transfers.forEach((tx: any) => {
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value || 0,
            timestamp: Math.floor(new Date(tx.metadata?.blockTimestamp).getTime() / 1000),
            type: getTransactionType(tx.from, tx.to, holderAddress),
            chain
          });
        });
      }
    }

    if (outgoingResponse.ok) {
      const outData = await outgoingResponse.json();
      if (outData.result?.transfers) {
        outData.result.transfers.forEach((tx: any) => {
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value || 0,
            timestamp: Math.floor(new Date(tx.metadata?.blockTimestamp).getTime() / 1000),
            type: getTransactionType(tx.from, tx.to, holderAddress),
            chain
          });
        });
      }
    }

    // Sort by timestamp
    return transactions.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error(`Error fetching transactions for ${holderAddress}:`, error);
    return [];
  }
}

// Analyze holder behavior
async function analyzeHolder(
  holderAddress: string,
  balance: string,
  chain: string
): Promise<HolderBehavior | null> {
  const alchemyUrl = chain === 'ETH' ? ALCHEMY_ETH_URL : ALCHEMY_BASE_URL;
  const contractAddress = chain === 'ETH' ? ETH_CONTRACT : BASE_CONTRACT;

  const transactions = await fetchHolderTransactions(holderAddress, alchemyUrl, contractAddress, chain);

  if (transactions.length === 0) {
    // No transaction history available
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const firstTx = transactions[0];
  const holdingDays = Math.floor((now - firstTx.timestamp) / 86400);

  let totalBought = 0;
  let totalReceived = 0;
  let totalSold = 0;
  let totalSent = 0;

  transactions.forEach(tx => {
    switch (tx.type) {
      case 'Buy':
        totalBought += tx.value;
        break;
      case 'Transfer_In':
        totalReceived += tx.value;
        break;
      case 'Sell':
        totalSold += tx.value;
        break;
      case 'Transfer_Out':
        totalSent += tx.value;
        break;
    }
  });

  const currentBalance = Number(BigInt(balance) / BigInt(1e18));
  const acquisitionMethod: HolderBehavior['acquisitionMethod'] =
    totalBought > 0 && totalReceived > 0 ? 'Mixed' :
    totalBought > 0 ? 'Bought' : 'Received';

  const { type: behaviorType, description: behaviorDescription } = classifyBehavior(
    holdingDays,
    totalBought,
    totalReceived,
    totalSold,
    totalSent,
    currentBalance
  );

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(-5).reverse().map(tx => ({
    date: new Date(tx.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
    type: tx.type.replace('_', ' '),
    amount: tx.value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }));

  return {
    address: holderAddress,
    shortAddress: `${holderAddress.slice(0, 6)}...${holderAddress.slice(-4)}`,
    chain,
    currentBalance,
    balanceFormatted: currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    firstAcquisitionDate: new Date(firstTx.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    firstAcquisitionTimestamp: firstTx.timestamp,
    holdingDurationDays: holdingDays,
    holdingDurationLabel: formatDuration(holdingDays),
    acquisitionMethod,
    totalBought: Math.round(totalBought),
    totalReceived: Math.round(totalReceived),
    totalSold: Math.round(totalSold),
    totalSent: Math.round(totalSent),
    netPosition: Math.round(totalBought + totalReceived - totalSold - totalSent),
    behaviorType,
    behaviorDescription,
    recentTransactions,
    explorerUrl: chain === 'ETH' ? 'https://etherscan.io' : 'https://basescan.org'
  };
}

export async function GET() {
  try {
    // Fetch top Ethereum holders
    const ethHolders = await fetchEthereumTopHolders();

    // Analyze top 10 holders (limited to avoid rate limits)
    const holderPromises = ethHolders.slice(0, 10).map(h =>
      analyzeHolder(h.address, h.balance, 'ETH')
    );

    const holderBehaviors = (await Promise.all(holderPromises)).filter(Boolean) as HolderBehavior[];

    // Calculate summary statistics
    const behaviorSummary = {
      diamondHands: holderBehaviors.filter(h => h.behaviorType === 'Diamond Hands').length,
      accumulators: holderBehaviors.filter(h => h.behaviorType === 'Accumulator').length,
      activeTraders: holderBehaviors.filter(h => h.behaviorType === 'Active Trader').length,
      partialSellers: holderBehaviors.filter(h => h.behaviorType === 'Partial Seller').length,
      immediateLiquidators: holderBehaviors.filter(h => h.behaviorType === 'Immediate Liquidator').length,
      newHolders: holderBehaviors.filter(h => h.behaviorType === 'New Holder').length
    };

    const holdingDurationSummary = {
      lessThan7Days: holderBehaviors.filter(h => h.holdingDurationDays < 7).length,
      oneToFourWeeks: holderBehaviors.filter(h => h.holdingDurationDays >= 7 && h.holdingDurationDays < 30).length,
      oneToThreeMonths: holderBehaviors.filter(h => h.holdingDurationDays >= 30 && h.holdingDurationDays < 90).length,
      threeToSixMonths: holderBehaviors.filter(h => h.holdingDurationDays >= 90 && h.holdingDurationDays < 180).length,
      sixMonthsPlus: holderBehaviors.filter(h => h.holdingDurationDays >= 180).length,
      averageDays: holderBehaviors.length > 0
        ? Math.round(holderBehaviors.reduce((sum, h) => sum + h.holdingDurationDays, 0) / holderBehaviors.length)
        : 0
    };

    const acquisitionSummary = {
      bought: holderBehaviors.filter(h => h.acquisitionMethod === 'Bought').length,
      received: holderBehaviors.filter(h => h.acquisitionMethod === 'Received').length,
      mixed: holderBehaviors.filter(h => h.acquisitionMethod === 'Mixed').length
    };

    return NextResponse.json({
      success: true,
      holders: holderBehaviors,
      summary: {
        behavior: behaviorSummary,
        holdingDuration: holdingDurationSummary,
        acquisition: acquisitionSummary
      },
      analyzedCount: holderBehaviors.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in holder-behavior API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze holder behavior' },
      { status: 500 }
    );
  }
}
