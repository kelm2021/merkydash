
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

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function getTransactionType(from: string, to: string): 'Buy' | 'Sell' | 'Transfer' {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();
  const fromIsDex = DEX_ADDRESSES.has(fromLower);
  const toIsDex = DEX_ADDRESSES.has(toLower);

  if (fromIsDex && !toIsDex) return 'Buy';
  if (!fromIsDex && toIsDex) return 'Sell';
  return 'Transfer';
}

// Fetch transactions using Alchemy API
async function fetchAlchemyTransactions(alchemyUrl: string, contractAddress: string, chain: string) {
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
          maxCount: '0x32',
          withMetadata: true
        }]
      }),
      next: { revalidate: 60 }
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

    return data.result.transfers.slice(0, 25).map((tx: any) => ({
      hash: tx.hash,
      shortHash: `${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`,
      from: tx.from,
      shortFrom: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
      to: tx.to,
      shortTo: `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`,
      value: (tx.value || 0).toFixed(2),
      timestamp: Math.floor(new Date(tx.metadata?.blockTimestamp).getTime() / 1000),
      timeAgo: timeAgo(Math.floor(new Date(tx.metadata?.blockTimestamp).getTime() / 1000)),
      type: getTransactionType(tx.from, tx.to),
      chain: chain,
      explorerUrl: chain === 'ETH' ? 'https://etherscan.io' : 'https://basescan.org'
    }));
  } catch (error) {
    console.error(`Error fetching Alchemy ${chain} transactions:`, error);
    return [];
  }
}

async function fetchEthereumTransactions() {
  return fetchAlchemyTransactions(ALCHEMY_ETH_URL, ETH_CONTRACT, 'ETH');
}

async function fetchBaseTransactions() {
  return fetchAlchemyTransactions(ALCHEMY_BASE_URL, BASE_CONTRACT, 'BASE');
}

export async function GET() {
  try {
    // Fetch from both chains in parallel using Alchemy
    const [ethTransactions, baseTransactions] = await Promise.all([
      fetchEthereumTransactions(),
      fetchBaseTransactions()
    ]);
    
    // Combine and sort by timestamp
    const allTransactions = [...ethTransactions, ...baseTransactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50); // Return top 50 most recent
    
    return NextResponse.json({
      success: true,
      transactions: allTransactions,
      count: allTransactions.length
    });
  } catch (error) {
    console.error('Error in blockchain-transactions API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions', transactions: [] },
      { status: 500 }
    );
  }
}
