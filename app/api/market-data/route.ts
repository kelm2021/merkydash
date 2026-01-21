
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

// Calculate VWAP for a given period of OHLCV data
// VWAP = Sum(Typical Price * Volume) / Sum(Volume)
// Typical Price = (High + Low + Close) / 3
function calculateVWAP(ohlcvData: number[][]): number {
  if (!ohlcvData || ohlcvData.length === 0) return 0;

  let sumPriceVolume = 0;
  let sumVolume = 0;

  ohlcvData.forEach((candle: number[]) => {
    const [, , high, low, close, volume] = candle;
    const typicalPrice = (high + low + close) / 3;
    sumPriceVolume += typicalPrice * volume;
    sumVolume += volume;
  });

  return sumVolume > 0 ? sumPriceVolume / sumVolume : 0;
}

// Fetch historical OHLCV data from GeckoTerminal
async function fetchPriceHistory() {
  try {
    // Use the Base Uniswap pool for price history (most liquid)
    const url = `https://api.geckoterminal.com/api/v2/networks/base/pools/${POOLS.uniswapBase.address}/ohlcv/day?aggregate=1&limit=365`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('GeckoTerminal OHLCV API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.data?.attributes?.ohlcv_list) {
      console.error('No OHLCV data in response');
      return null;
    }

    // OHLCV format: [timestamp, open, high, low, close, volume]
    const ohlcvList = data.data.attributes.ohlcv_list;

    // Sort by timestamp descending (most recent first) for VWAP calculations
    const sortedDesc = [...ohlcvList].sort((a: number[], b: number[]) => b[0] - a[0]);

    // Calculate VWAP for different periods
    const vwap7d = calculateVWAP(sortedDesc.slice(0, 7));
    const vwap30d = calculateVWAP(sortedDesc.slice(0, 30));
    const vwap60d = calculateVWAP(sortedDesc.slice(0, 60));
    const vwap90d = calculateVWAP(sortedDesc.slice(0, 90));
    const vwap180d = calculateVWAP(sortedDesc.slice(0, 180));

    // Sort by timestamp ascending for chart data
    ohlcvList.sort((a: number[], b: number[]) => a[0] - b[0]);

    // Extract prices and calculate ATH/ATL
    let allTimeHigh = 0;
    let allTimeLow = Infinity;

    const priceHistory = ohlcvList.map((candle: number[]) => {
      const [timestamp, open, high, low, close] = candle;
      if (high > allTimeHigh) allTimeHigh = high;
      if (low < allTimeLow && low > 0) allTimeLow = low;
      return {
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        price: close,
        high,
        low
      };
    });

    // Get last 12 months of data for the chart
    const last12Months = priceHistory.slice(-365);

    // Group by month for chart labels
    const monthlyData: { [key: string]: number[] } = {};
    last12Months.forEach((item: any) => {
      const month = item.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(item.price);
    });

    // Calculate monthly averages
    const chartLabels: string[] = [];
    const chartPrices: number[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    Object.keys(monthlyData).sort().forEach(month => {
      const prices = monthlyData[month];
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const monthNum = parseInt(month.split('-')[1]) - 1;
      chartLabels.push(monthNames[monthNum]);
      chartPrices.push(avgPrice);
    });

    const currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : 0;

    return {
      chartLabels,
      chartPrices,
      allTimeHigh,
      allTimeLow: allTimeLow === Infinity ? 0 : allTimeLow,
      currentPrice,
      vwap: {
        vwap7d,
        vwap30d,
        vwap60d,
        vwap90d,
        vwap180d,
        // Calculate % difference from current price
        diff7d: currentPrice > 0 ? ((currentPrice - vwap7d) / vwap7d) * 100 : 0,
        diff30d: currentPrice > 0 ? ((currentPrice - vwap30d) / vwap30d) * 100 : 0,
        diff60d: currentPrice > 0 ? ((currentPrice - vwap60d) / vwap60d) * 100 : 0,
        diff90d: currentPrice > 0 ? ((currentPrice - vwap90d) / vwap90d) * 100 : 0,
        diff180d: currentPrice > 0 ? ((currentPrice - vwap180d) / vwap180d) * 100 : 0,
      }
    };
  } catch (error) {
    console.error('Error fetching price history:', error);
    return null;
  }
}

export async function GET() {
  try {
    // Fetch all pool data and price history in parallel
    const [uniswapBase, uniswapEth, aerodrome, priceHistory] = await Promise.all([
      fetchPoolData(POOLS.uniswapBase),
      fetchPoolData(POOLS.uniswapEth),
      fetchPoolData(POOLS.aerodromeBase),
      fetchPriceHistory()
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
      },
      priceHistory: priceHistory || {
        chartLabels: [],
        chartPrices: [],
        allTimeHigh: 0,
        allTimeLow: 0,
        currentPrice: 0,
        vwap: {
          vwap7d: 0,
          vwap30d: 0,
          vwap60d: 0,
          vwap90d: 0,
          vwap180d: 0,
          diff7d: 0,
          diff30d: 0,
          diff60d: 0,
          diff90d: 0,
          diff180d: 0
        }
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
