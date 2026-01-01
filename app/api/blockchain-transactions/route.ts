
import { NextResponse } from 'next/server';

const BASE_CONTRACT = '0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058';
const ETH_CONTRACT = '0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810';

// Known DEX contract addresses (pools and routers)
const DEX_ADDRESSES = new Set([
  // Uniswap V3 Pools
  '0x52cee6aa2d53882ac1f3497c563f0439fc178744', // Uniswap Base MERC/USDC
  '0x99543a3dcf169c8e442cc5ba1cb978ff1df2a8be', // Uniswap Ethereum MERC/USDT
  // Aerodrome
  '0x9c80da2f970df28d833f5349aeb68301cdf3ecf9', // Aerodrome Base MERC/USDC
  // Common DEX Routers
  '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 Router (Ethereum)
  '0x2626664c2603336e57b271c5c0b26f421741e481', // Uniswap V3 Router (Base)
  '0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43', // Aerodrome Router (Base)
].map(addr => addr.toLowerCase()));

// Helper function to format time ago
function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Classify transaction type based on from/to addresses
function getTransactionType(from: string, to: string): 'Buy' | 'Sell' | 'Transfer' {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();
  
  const fromIsDex = DEX_ADDRESSES.has(fromLower);
  const toIsDex = DEX_ADDRESSES.has(toLower);
  
  if (fromIsDex && !toIsDex) {
    return 'Buy'; // Tokens coming from DEX to user
  } else if (!fromIsDex && toIsDex) {
    return 'Sell'; // Tokens going from user to DEX
  } else {
    return 'Transfer'; // Neither or both are DEX (wallet-to-wallet)
  }
}

// Fetch transactions from Etherscan using V2 API
async function fetchEtherscanTransactions() {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&contractaddress=${ETH_CONTRACT}&page=1&offset=50&sort=desc&apikey=${apiKey}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    if (!response.ok) {
      console.error('Etherscan V2 API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (data.status !== '1' || !data.result) {
      console.error('Etherscan V2 API response error:', data.message);
      return [];
    }
    
    return data.result.slice(0, 25).map((tx: any) => ({
      hash: tx.hash,
      shortHash: `${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`,
      from: tx.from,
      shortFrom: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
      to: tx.to,
      shortTo: `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`,
      value: (parseInt(tx.value) / 1e18).toFixed(2),
      timestamp: parseInt(tx.timeStamp),
      timeAgo: timeAgo(parseInt(tx.timeStamp)),
      type: getTransactionType(tx.from, tx.to),
      chain: 'ETH',
      explorerUrl: 'https://etherscan.io'
    }));
  } catch (error) {
    console.error('Error fetching Etherscan V2 transactions:', error);
    return [];
  }
}

// Fetch transactions from Base using V2 API with chainid
async function fetchBasescanTransactions() {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
    const url = `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=tokentx&contractaddress=${BASE_CONTRACT}&page=1&offset=50&sort=desc&apikey=${apiKey}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    if (!response.ok) {
      console.error('Base V2 API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (data.status !== '1' || !data.result) {
      console.error('Base V2 API response error:', data.message);
      return [];
    }
    
    return data.result.slice(0, 25).map((tx: any) => ({
      hash: tx.hash,
      shortHash: `${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`,
      from: tx.from,
      shortFrom: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
      to: tx.to,
      shortTo: `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`,
      value: (parseInt(tx.value) / 1e18).toFixed(2),
      timestamp: parseInt(tx.timeStamp),
      timeAgo: timeAgo(parseInt(tx.timeStamp)),
      type: getTransactionType(tx.from, tx.to),
      chain: 'BASE',
      explorerUrl: 'https://basescan.org'
    }));
  } catch (error) {
    console.error('Error fetching Base V2 transactions:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch from both chains in parallel
    const [ethTransactions, baseTransactions] = await Promise.all([
      fetchEtherscanTransactions(),
      fetchBasescanTransactions()
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
