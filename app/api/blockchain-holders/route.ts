
import { NextResponse } from 'next/server';

// Contract addresses
const BASE_CONTRACT = '0x8923947EAfaf4aD68F1f0C9eb5463eC876D79058';
const ETH_CONTRACT = '0x6EE2f71049DDE9a93B7c0EE1091b72aCf9b46810';

// Known wallets from wallets.xlsx - addresses stored lowercase for comparison
const KNOWN_WALLETS: { [address: string]: { name: string; category: string; includeInDashboard: boolean } } = {
  '0x3ee18b2214aff97000d974cf647e7c347e8fa585': { name: 'Wormhole Bridge Escrow', category: 'Escrow', includeInDashboard: false },
  '0x52cee6aa2d53882ac1f3497c563f0439fc178744': { name: 'Uniswap (Base) MERC/USDC', category: 'Liquidity Pool', includeInDashboard: true },
  '0x9c80da2f970df28d833f5349aeb68301cdf3ecf9': { name: 'Aerodrome (Base) MERC/USDC', category: 'Liquidity Pool', includeInDashboard: true },
  '0xcc56abfb0dc9aebd4ecfa0b5462c387e1cfee156': { name: 'LM Treasury', category: 'Liquid Mercury Controlled', includeInDashboard: true },
  '0x4ebe7aa32a17c978e367d43ab2823e51ce64956c': { name: 'Old MERCs Redemption Wallet', category: 'Liquid Mercury Controlled', includeInDashboard: true },
  '0xd389d590ea5f5a40bd20424b532c187bb383d6e3': { name: 'MERC Staking (old)', category: 'Liquid Mercury Controlled', includeInDashboard: true },
  '0xb2908a1071ca6f3d6d540fb40cdc63fb858d9def': { name: 'MERC Float', category: 'Liquid Mercury Controlled', includeInDashboard: true },
  '0xc311b3b69d1356becd5530113a8ae72758679cfe': { name: 'MERC Staking', category: 'Liquid Mercury Controlled', includeInDashboard: true },
  '0x2bcaea015a7eb85c7afa7d67a970e20b4c1bbbaa': { name: 'Uniswap General', category: 'Liquidity Pool', includeInDashboard: true },
  '0x44f904d307b097970d52797edeb55752e8744413': { name: 'MERC Float 2', category: 'Liquid Mercury Controlled', includeInDashboard: true },
  '0x1cfc43e1f7104675b7e3997868230563598d39b0': { name: 'MERC Original (old)', category: 'Liquid Mercury Controlled', includeInDashboard: true },
  '0x0a3e6dea8f2603d7bbb041f8a757418d3c0ab008': { name: 'MERC Creator Address', category: 'Liquid Mercury Controlled', includeInDashboard: true },
  '0x99543a3dcf169c8e442cc5ba1cb978ff1df2a8be': { name: 'Uniswap (Ethereum) MERC/USDT', category: 'Liquidity Pool', includeInDashboard: true },
};

// Check if an address is a known wallet
function isKnownWallet(address: string): boolean {
  return address.toLowerCase() in KNOWN_WALLETS;
}

// Get known wallet info
function getKnownWalletInfo(address: string): { name: string; category: string; includeInDashboard: boolean } | null {
  return KNOWN_WALLETS[address.toLowerCase()] || null;
}

// Fetch top Ethereum holders using Ethplorer (free API with direct top holders endpoint)
async function fetchEthereumHolders() {
  try {
    const url = `https://api.ethplorer.io/getTopTokenHolders/${ETH_CONTRACT}?apiKey=freekey&limit=50`;
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
      const address = holder.address;
      const knownInfo = getKnownWalletInfo(address);

      return {
        address: address,
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
        balance: rawBalance,
        balanceFormatted: balanceNum.toLocaleString(),
        percentage: holder.share ? holder.share.toFixed(2) : '0',
        chain: 'ETH',
        explorerUrl: 'https://etherscan.io',
        isKnown: !!knownInfo,
        name: knownInfo?.name || null,
        category: knownInfo?.category || null,
        includeInDashboard: knownInfo?.includeInDashboard ?? true
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

    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${BASE_CONTRACT}/owners?chain=base&order=DESC&limit=50`;
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
      const address = holder.owner_address;
      const knownInfo = getKnownWalletInfo(address);

      return {
        address: address,
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
        balance: holder.balance,
        balanceFormatted: balanceNum.toLocaleString(),
        percentage: holder.percentage_relative_to_total_supply?.toFixed(2) || '0',
        chain: 'BASE',
        explorerUrl: 'https://basescan.org',
        isKnown: !!knownInfo,
        name: knownInfo?.name || null,
        category: knownInfo?.category || null,
        includeInDashboard: knownInfo?.includeInDashboard ?? true
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
    const url = `https://api.basescan.org/api?module=token&action=tokenholderlist&contractaddress=${BASE_CONTRACT}&page=1&offset=50`;
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
      const address = holder.TokenHolderAddress;
      const knownInfo = getKnownWalletInfo(address);

      return {
        address: address,
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
        balance: holder.TokenHolderQuantity,
        balanceFormatted: balanceNum.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        chain: 'BASE',
        explorerUrl: 'https://basescan.org',
        isKnown: !!knownInfo,
        name: knownInfo?.name || null,
        category: knownInfo?.category || null,
        includeInDashboard: knownInfo?.includeInDashboard ?? true
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

    // Separate known wallets (that should be shown) from external holders
    const knownWallets = allHolders
      .filter(h => h.isKnown && h.includeInDashboard)
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
      .map((holder, index) => ({
        ...holder,
        rank: index + 1,
        percentage: ((parseFloat(holder.balance) / 6e27) * 100).toFixed(2)
      }));

    // Get top 20 external holders (excluding known wallets)
    const externalHolders = allHolders
      .filter(h => !h.isKnown)
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
      .slice(0, 20)
      .map((holder, index) => ({
        ...holder,
        rank: index + 1,
        percentage: ((parseFloat(holder.balance) / 6e27) * 100).toFixed(2)
      }));

    return NextResponse.json({
      success: true,
      knownWallets: knownWallets,
      externalHolders: externalHolders,
      // Keep legacy holders array for backward compatibility
      holders: externalHolders,
      count: externalHolders.length,
      knownCount: knownWallets.length
    });
  } catch (error) {
    console.error('Error in blockchain-holders API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch holders', holders: [], knownWallets: [], externalHolders: [] },
      { status: 500 }
    );
  }
}
