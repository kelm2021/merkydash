
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
      const rawBalance = holder.rawBalance || '0';
      const balanceBigInt = BigInt(rawBalance);
      const balanceNum = Number(balanceBigInt / BigInt(1e18));
      const address = holder.address;
      const knownInfo = getKnownWalletInfo(address);

      return {
        address: address.toLowerCase(),
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
        balance: rawBalance,
        balanceNum: balanceNum,
        balanceFormatted: balanceNum.toLocaleString(),
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

    if (!moralisApiKey) {
      return await fetchBaseHoldersFromBlockscout();
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
      return await fetchBaseHoldersFromBlockscout();
    }

    const data = await response.json();

    if (!data.result || !Array.isArray(data.result)) {
      console.error('Moralis API response error:', data);
      return await fetchBaseHoldersFromBlockscout();
    }

    return data.result.map((holder: any) => {
      const balanceNum = Math.floor(parseFloat(holder.balance_formatted || '0'));
      const address = holder.owner_address;
      const knownInfo = getKnownWalletInfo(address);

      return {
        address: address.toLowerCase(),
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
        balance: holder.balance,
        balanceNum: balanceNum,
        balanceFormatted: balanceNum.toLocaleString(),
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
    return await fetchBaseHoldersFromBlockscout();
  }
}

// Fallback: fetch Base holders from Blockscout API
async function fetchBaseHoldersFromBlockscout() {
  try {
    const url = `https://base.blockscout.com/api/v2/tokens/${BASE_CONTRACT}/holders?items_count=50`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      console.error('Blockscout API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      console.error('Blockscout API response error:', data);
      return [];
    }

    return data.items.map((holder: any) => {
      const balanceNum = parseFloat(holder.value) / 1e18;
      const address = holder.address?.hash || '';
      const knownInfo = getKnownWalletInfo(address);

      return {
        address: address.toLowerCase(),
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
        balance: holder.value,
        balanceNum: balanceNum,
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
    console.error('Error fetching Base holders from Blockscout:', error);
    return [];
  }
}

// Merge wallets that exist on both chains into a single entry
function mergeWalletsByAddress(holders: any[]): any[] {
  const walletMap = new Map<string, any>();

  for (const holder of holders) {
    const addressLower = holder.address.toLowerCase();
    const existing = walletMap.get(addressLower);

    if (existing) {
      // Wallet exists on both chains - merge
      if (holder.chain === 'ETH') {
        existing.ethBalance = holder.balanceNum;
        existing.ethBalanceFormatted = holder.balanceFormatted;
      } else {
        existing.baseBalance = holder.balanceNum;
        existing.baseBalanceFormatted = holder.balanceFormatted;
      }
      // Update total balance
      existing.totalBalance = (existing.ethBalance || 0) + (existing.baseBalance || 0);
      existing.totalBalanceFormatted = existing.totalBalance.toLocaleString();
      existing.chains = ['ETH', 'BASE'];
    } else {
      // New wallet
      const isEth = holder.chain === 'ETH';
      walletMap.set(addressLower, {
        address: addressLower,
        shortAddress: holder.shortAddress,
        ethBalance: isEth ? holder.balanceNum : 0,
        ethBalanceFormatted: isEth ? holder.balanceFormatted : '0',
        baseBalance: isEth ? 0 : holder.balanceNum,
        baseBalanceFormatted: isEth ? '0' : holder.balanceFormatted,
        totalBalance: holder.balanceNum,
        totalBalanceFormatted: holder.balanceFormatted,
        chains: [holder.chain],
        isKnown: holder.isKnown,
        name: holder.name,
        category: holder.category,
        includeInDashboard: holder.includeInDashboard
      });
    }
  }

  return Array.from(walletMap.values());
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

    // Merge wallets that exist on both chains
    const mergedWallets = mergeWalletsByAddress(allHolders);

    // Separate known wallets (that should be shown) from external holders
    const knownWallets = mergedWallets
      .filter(h => h.isKnown && h.includeInDashboard)
      .sort((a, b) => b.totalBalance - a.totalBalance)
      .map((holder, index) => ({
        ...holder,
        rank: index + 1,
        percentage: ((holder.totalBalance / 6e9) * 100).toFixed(2)
      }));

    // Get top 20 external holders (excluding known wallets)
    const externalHolders = mergedWallets
      .filter(h => !h.isKnown)
      .sort((a, b) => b.totalBalance - a.totalBalance)
      .slice(0, 20)
      .map((holder, index) => ({
        ...holder,
        rank: index + 1,
        percentage: ((holder.totalBalance / 6e9) * 100).toFixed(2)
      }));

    return NextResponse.json({
      success: true,
      knownWallets: knownWallets,
      externalHolders: externalHolders,
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
