
import { NextResponse } from 'next/server';

const BASE_CONTRACT = '0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058';
const ETH_CONTRACT = '0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810';

// Fetch top holders from Ethereum using Blockscout API (free, no API key required)
async function fetchEthereumHolders() {
  try {
    const url = `https://eth.blockscout.com/api/v2/tokens/${ETH_CONTRACT}/holders?limit=50`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      console.error('Blockscout Ethereum holders API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      console.error('Blockscout Ethereum API response error:', data);
      return [];
    }
    
    // Format and return holder data
    return data.items.map((holder: any) => ({
      address: holder.address?.hash || holder.address,
      shortAddress: `${(holder.address?.hash || holder.address).slice(0, 6)}...${(holder.address?.hash || holder.address).slice(-4)}`,
      balance: holder.value || '0',
      balanceFormatted: (parseFloat(holder.value || '0') / 1e18).toFixed(0),
      chain: 'ETH',
      explorerUrl: 'https://etherscan.io'
    }));
  } catch (error) {
    console.error('Error fetching Blockscout Ethereum holders:', error);
    return [];
  }
}

// Fetch top holders from Base using Blockscout API (free, no API key required)
async function fetchBaseHolders() {
  try {
    const url = `https://base.blockscout.com/api/v2/tokens/${BASE_CONTRACT}/holders?limit=50`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      console.error('Blockscout Base holders API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      console.error('Blockscout Base API response error:', data);
      return [];
    }
    
    // Format and return holder data
    return data.items.map((holder: any) => ({
      address: holder.address?.hash || holder.address,
      shortAddress: `${(holder.address?.hash || holder.address).slice(0, 6)}...${(holder.address?.hash || holder.address).slice(-4)}`,
      balance: holder.value || '0',
      balanceFormatted: (parseFloat(holder.value || '0') / 1e18).toFixed(0),
      chain: 'BASE',
      explorerUrl: 'https://basescan.org'
    }));
  } catch (error) {
    console.error('Error fetching Blockscout Base holders:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch from both chains in parallel
    const [ethHolders, baseHolders] = await Promise.all([
      fetchEthereumHolders(),
      fetchBaseHolders()
    ]);
    
    // Combine all holders
    const allHolders = [...ethHolders, ...baseHolders];
    
    // Sort by balance (descending) and take top 20
    const topHolders = allHolders
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
      .slice(0, 20)
      .map((holder, index) => ({
        ...holder,
        rank: index + 1,
        percentage: ((parseFloat(holder.balance) / 6e27) * 100).toFixed(2) // Total supply is 6B with 18 decimals
      }));
    
    return NextResponse.json({
      success: true,
      holders: topHolders,
      count: topHolders.length
    });
  } catch (error) {
    console.error('Error in blockchain-holders API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch holders', holders: [] },
      { status: 500 }
    );
  }
}
