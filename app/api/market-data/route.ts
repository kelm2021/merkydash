
import { NextResponse } from 'next/server';

// Pool configurations with correct token pairs
const POOLS = {
  uniswapBase: {
    address: '0x52cee6aa2d53882ac1f3497c563f0439fc178744',
    chain: 'base',
    chainId: 8453,
    dex: 'Uniswap V3',
    explorerUrl: 'https://basescan.org/address/0x52cee6aa2d53882ac1f3497c563f0439fc178744',
    dexUrl: 'https://dexscreener.com/base/0x52cee6aa2d53882ac1f3497c563f0439fc178744',
    tokenPair: ['MERC', 'USDC'] // Correct pair for Base
  },
  uniswapEth: {
    address: '0x99543A3DcF169C8E442cC5ba1CB978FF1dF2a8Be',
    chain: 'ethereum',
    chainId: 1,
    dex: 'Uniswap V3',
    explorerUrl: 'https://etherscan.io/address/0x99543A3DcF169C8E442cC5ba1CB978FF1dF2a8Be',
    dexUrl: 'https://dexscreener.com/ethereum/0x99543A3DcF169C8E442cC5ba1CB978FF1dF2a8Be',
    tokenPair: ['MERC', 'USDT'] // Correct pair for Ethereum
  },
  aerodromeBase: {
    address: '0x9C80da2f970df28d833f5349aEB68301cdF3eCF9',
    chain: 'base',
    chainId: 8453,
    dex: 'Aerodrome',
    explorerUrl: 'https://basescan.org/address/0x9C80da2f970df28d833f5349aEB68301cdF3eCF9',
    dexUrl: 'https://aerodrome.finance/deposit?token0=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&token1=0x8923947eafaf4ad68f1f0c9eb5463ec876d79058&type=2000',
    tokenPair: ['MERC', 'USDC']
  }
};

// Fetch pool data using DexScreener API (free, no API key required)
async function fetchPoolData(poolConfig: any) {
  const { address, chain, chainId, dex, tokenPair } = poolConfig;
  
  try {
    // DexScreener API endpoint for specific pool
    const dexscreenerChain = chain === 'ethereum' ? 'ethereum' : 'base';
    const url = `https://api.dexscreener.com/latest/dex/pairs/${dexscreenerChain}/${address}`;
    
    console.log(`Fetching ${dex} ${chain} pool data from:`, url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error(`DexScreener API error for ${dex} ${chain}:`, response.status, response.statusText);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      console.log(`✓ Successfully fetched ${dex} ${chain} data from DexScreener`);
      
      const buys = pair.txns?.h24?.buys || 0;
      const sells = pair.txns?.h24?.sells || 0;
      
      return {
        ...poolConfig,
        token0: tokenPair[0],
        token1: tokenPair[1],
        price: pair.priceUsd || '0',
        tvl: pair.liquidity?.usd ? parseFloat(pair.liquidity.usd).toFixed(2) : '0',
        volume24h: pair.volume?.h24 ? parseFloat(pair.volume.h24).toFixed(2) : '0',
        transactions: buys + sells,
        buys: buys,
        sells: sells,
        feeTier: pair.labels?.includes('v3') ? '1.00%' : '0.20%',
        priceChange24h: pair.priceChange?.h24 || 0
      };
    } else {
      // No data from DexScreener, try fallback
      throw new Error('No pairs data');
    }
  } catch (error) {
    // DexScreener failed, trying GeckoTerminal fallback
    
    // Try GeckoTerminal as fallback
    try {
      const geckoChain = chain === 'ethereum' ? 'eth' : 'base';
      const geckoUrl = `https://api.geckoterminal.com/api/v2/networks/${geckoChain}/pools/${address}`;
      
      console.log(`Trying GeckoTerminal fallback for ${dex} ${chain}:`, geckoUrl);
      
      const geckoResponse = await fetch(geckoUrl, {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }
      });

      if (geckoResponse.ok) {
        const geckoData = await geckoResponse.json();
        
        if (geckoData && geckoData.data && geckoData.data.attributes) {
          const attrs = geckoData.data.attributes;
          console.log(`✓ Successfully fetched ${dex} ${chain} data from GeckoTerminal`);
          
          const buys = attrs.transactions?.h24?.buys ? parseInt(attrs.transactions.h24.buys) : 0;
          const sells = attrs.transactions?.h24?.sells ? parseInt(attrs.transactions.h24.sells) : 0;
          
          return {
            ...poolConfig,
            token0: tokenPair[0],
            token1: tokenPair[1],
            price: attrs.base_token_price_usd || '0',
            tvl: attrs.reserve_in_usd ? parseFloat(attrs.reserve_in_usd).toFixed(2) : '0',
            volume24h: attrs.volume_usd?.h24 ? parseFloat(attrs.volume_usd.h24).toFixed(2) : '0',
            transactions: buys + sells,
            buys: buys,
            sells: sells,
            feeTier: '1.00%',
            priceChange24h: attrs.price_change_percentage?.h24 || 0
          };
        }
      }
    } catch (geckoError) {
      // GeckoTerminal also failed, will return fallback data
    }
    
    // Return fallback data with zero values instead of null
    console.log(`⚠ ${dex} ${chain}: Using fallback data (APIs temporarily unavailable)`);
    return {
      ...poolConfig,
      token0: tokenPair[0],
      token1: tokenPair[1],
      price: '0',
      tvl: '0',
      volume24h: '0',
      transactions: 0,
      buys: 0,
      sells: 0,
      feeTier: dex.includes('Uniswap') ? '1.00%' : '0.20%',
      priceChange24h: 0,
      unavailable: true // Mark as unavailable for UI display
    };
  }
}

export async function GET() {
  try {
    // Fetch all pool data in parallel using DexScreener API
    const [uniswapBase, uniswapEth, aerodrome] = await Promise.all([
      fetchPoolData(POOLS.uniswapBase),
      fetchPoolData(POOLS.uniswapEth),
      fetchPoolData(POOLS.aerodromeBase)
    ]);

    // All pools will return data (either real or fallback)
    const pools = [uniswapBase, uniswapEth, aerodrome];
    
    // Check how many pools have real data
    const availablePools = pools.filter(p => !p.unavailable);
    const unavailableCount = pools.length - availablePools.length;
    
    if (unavailableCount > 0) {
      console.warn(`⚠ ${unavailableCount} of ${pools.length} pools are using fallback data`);
    }

    // Calculate aggregated metrics (only from available pools)
    const totalTVL = availablePools.reduce((sum, pool) => sum + parseFloat(pool?.tvl || '0'), 0);
    const totalVolume24h = availablePools.reduce((sum, pool) => sum + parseFloat(pool?.volume24h || '0'), 0);
    const totalTransactions = availablePools.reduce((sum, pool) => sum + parseInt(pool?.transactions || '0'), 0);
    const totalBuys = availablePools.reduce((sum, pool) => sum + parseInt(pool?.buys || '0'), 0);
    const totalSells = availablePools.reduce((sum, pool) => sum + parseInt(pool?.sells || '0'), 0);

    // Separate by chain
    const basePools = pools.filter(p => p?.chain === 'base');
    const ethereumPools = pools.filter(p => p?.chain === 'ethereum');

    return NextResponse.json({
      success: true,
      aggregate: {
        totalTVL: totalTVL.toFixed(2),
        totalVolume24h: totalVolume24h.toFixed(2),
        totalTransactions,
        totalBuys,
        totalSells,
        poolCount: pools.length,
        availablePoolCount: availablePools.length
      },
      base: {
        pools: basePools,
        tvl: basePools.filter(p => !p.unavailable).reduce((sum, pool) => sum + parseFloat(pool?.tvl || '0'), 0).toFixed(2),
        volume24h: basePools.filter(p => !p.unavailable).reduce((sum, pool) => sum + parseFloat(pool?.volume24h || '0'), 0).toFixed(2)
      },
      ethereum: {
        pools: ethereumPools,
        tvl: ethereumPools.filter(p => !p.unavailable).reduce((sum, pool) => sum + parseFloat(pool?.tvl || '0'), 0).toFixed(2),
        volume24h: ethereumPools.filter(p => !p.unavailable).reduce((sum, pool) => sum + parseFloat(pool?.volume24h || '0'), 0).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error in market-data API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
