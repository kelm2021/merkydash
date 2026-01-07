
import { NextResponse } from 'next/server';

// Contract addresses
const BASE_CONTRACT = '0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058';
const ETH_CONTRACT = '0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810';

// Fetch top Ethereum holders using Ethplorer (free API with direct top holders endpoint)
async function fetchEthereumHolders() {
  try {
    const url = `https://api.ethplorer.io/getTopTokenHolders/${ETH_CONTRACT}?apiKey=freekey&limit=20`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      console.error('Ethplorer API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.holders || !Array.isArray(data.holders)) {
      console.error('Ethplorer API response error:', data);
      return [];
    }

    return data.holders.map((holder: any) => {
      // Use rawBalance string for precision, convert from wei (18 decimals)
      const rawBalance = holder.rawBalance || '0';
      const balanceBigInt = BigInt(rawBalance);
      const balanceNum = Number(balanceBigInt / BigInt(1e18));
      return {
        address: holder.address,
        shortAddress: `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`,
        balance: rawBalance,
        balanceFormatted: balanceNum.toLocaleString(),
        percentage: holder.share ? holder.share.toFixed(2) : '0',
        chain: 'ETH',
        explorerUrl: 'https://etherscan.io'
      };
    });
  } catch (error) {
    console.error('Error fetching Ethereum holders:', error);
    return [];
  }
}

// Fetch top Base holders using Moralis API (free tier)
async function fetchBaseHolders() {
  try {
    const moralisApiKey = process.env.MORALIS_API_KEY;

    // If no Moralis key, try Basescan API
    if (!moralisApiKey) {
      return await fetchBaseHoldersFromBasescan();
    }

    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${BASE_CONTRACT}/owners?chain=base&order=DESC&limit=20`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': moralisApiKey
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      console.error('Moralis API error:', response.status);
      return await fetchBaseHoldersFromBasescan();
    }

    const data = await response.json();

    if (!data.result || !Array.isArray(data.result)) {
      console.error('Moralis API response error:', data);
      return await fetchBaseHoldersFromBasescan();
    }

    return data.result.map((holder: any) => {
      // balance_formatted is already in token units (not wei)
      const balanceNum = Math.floor(parseFloat(holder.balance_formatted || '0'));
      return {
        address: holder.owner_address,
        shortAddress: `${holder.owner_address.slice(0, 6)}...${holder.owner_address.slice(-4)}`,
        balance: holder.balance,
        balanceFormatted: balanceNum.toLocaleString(),
        percentage: holder.percentage_relative_to_total_supply?.toFixed(2) || '0',
        chain: 'BASE',
        explorerUrl: 'https://basescan.org'
      };
    });
  } catch (error) {
    console.error('Error fetching Base holders:', error);
    return await fetchBaseHoldersFromBasescan();
  }
}

// Fallback: fetch Base holders from Basescan API
async function fetchBaseHoldersFromBasescan() {
  try {
    const url = `https://api.basescan.org/api?module=token&action=tokenholderlist&contractaddress=${BASE_CONTRACT}&page=1&offset=20`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      console.error('Basescan API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.status !== '1' || !data.result) {
      console.error('Basescan API response error:', data.message);
      return [];
    }

    return data.result.map((holder: any) => {
      const balanceNum = parseFloat(holder.TokenHolderQuantity) / 1e18;
      return {
        address: holder.TokenHolderAddress,
        shortAddress: `${holder.TokenHolderAddress.slice(0, 6)}...${holder.TokenHolderAddress.slice(-4)}`,
        balance: holder.TokenHolderQuantity,
        balanceFormatted: balanceNum.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        chain: 'BASE',
        explorerUrl: 'https://basescan.org'
      };
    });
  } catch (error) {
    console.error('Error fetching Base holders from Basescan:', error);
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
