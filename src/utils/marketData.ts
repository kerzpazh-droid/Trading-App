/**
 * Market Data, Symbol Database, and Real-Time Tick Generation
 */

import { SymbolInfo, Candle, Timeframe, OrderBookData, TechnicalSummary } from '../types/market.js';
import { calculateRSI, calculateSMA, calculateMACD } from './technicalIndicators.js';

export const POPULAR_SYMBOLS: SymbolInfo[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'Stocks',
    exchange: 'NASDAQ',
    basePrice: 228.45,
    currentPrice: 228.45,
    change24h: 3.25,
    change24hPct: 1.44,
    high24h: 230.12,
    low24h: 226.5,
    volume24h: 48920100,
    marketCap: '3.49T',
    peRatio: 34.2,
    precision: 2,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'Stocks',
    exchange: 'NASDAQ',
    basePrice: 141.25,
    currentPrice: 141.25,
    change24h: 4.8,
    change24hPct: 3.52,
    high24h: 143.5,
    low24h: 138.8,
    volume24h: 72450300,
    marketCap: '3.47T',
    peRatio: 52.8,
    precision: 2,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    category: 'Stocks',
    exchange: 'NASDAQ',
    basePrice: 249.8,
    currentPrice: 249.8,
    change24h: -3.15,
    change24hPct: -1.25,
    high24h: 255.4,
    low24h: 247.9,
    volume24h: 62100400,
    marketCap: '798B',
    peRatio: 64.1,
    precision: 2,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    category: 'Stocks',
    exchange: 'NASDAQ',
    basePrice: 429.1,
    currentPrice: 429.1,
    change24h: 2.1,
    change24hPct: 0.49,
    high24h: 432.0,
    low24h: 427.3,
    volume24h: 21300000,
    marketCap: '3.19T',
    peRatio: 35.6,
    precision: 2,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    category: 'Stocks',
    exchange: 'NASDAQ',
    basePrice: 188.75,
    currentPrice: 188.75,
    change24h: 1.65,
    change24hPct: 0.88,
    high24h: 190.2,
    low24h: 187.1,
    volume24h: 38200000,
    marketCap: '1.98T',
    peRatio: 42.1,
    precision: 2,
  },
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    category: 'Crypto',
    exchange: 'BINANCE',
    basePrice: 68450.0,
    currentPrice: 68450.0,
    change24h: 1420.0,
    change24hPct: 2.12,
    high24h: 69200.0,
    low24h: 67100.0,
    volume24h: 3410050000,
    marketCap: '1.35T',
    precision: 1,
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    category: 'Crypto',
    exchange: 'BINANCE',
    basePrice: 2640.5,
    currentPrice: 2640.5,
    change24h: -35.2,
    change24hPct: -1.32,
    high24h: 2710.0,
    low24h: 2615.0,
    volume24h: 1820400000,
    marketCap: '318B',
    precision: 2,
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    category: 'Indices',
    exchange: 'AMEX',
    basePrice: 582.4,
    currentPrice: 582.4,
    change24h: 2.9,
    change24hPct: 0.5,
    high24h: 584.1,
    low24h: 580.2,
    volume24h: 52400000,
    precision: 2,
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    category: 'Indices',
    exchange: 'NASDAQ',
    basePrice: 494.6,
    currentPrice: 494.6,
    change24h: 5.2,
    change24hPct: 1.06,
    high24h: 497.0,
    low24h: 491.3,
    volume24h: 41200000,
    precision: 2,
  },
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'Forex',
    exchange: 'FXCM',
    basePrice: 1.0824,
    currentPrice: 1.0824,
    change24h: -0.0018,
    change24hPct: -0.17,
    high24h: 1.0855,
    low24h: 1.081,
    volume24h: 104500000,
    precision: 4,
  },
  {
    symbol: 'GOLD',
    name: 'Gold (XAU/USD)',
    category: 'Commodities',
    exchange: 'COMEX',
    basePrice: 2735.8,
    currentPrice: 2735.8,
    change24h: 18.4,
    change24hPct: 0.68,
    high24h: 2744.0,
    low24h: 2721.5,
    volume24h: 14200000,
    precision: 2,
  },
];

// Returns interval step in seconds for a timeframe
export function getTimeframeSeconds(tf: Timeframe): number {
  switch (tf) {
    case '1m':
      return 60;
    case '5m':
      return 300;
    case '15m':
      return 900;
    case '1h':
      return 3600;
    case '4h':
      return 14400;
    case '1D':
      return 86400;
    case '1W':
      return 604800;
  }
}

/**
 * Deterministically generates high-quality realistic historical candlestick bars
 */
export function generateHistoricalCandles(
  symbol: SymbolInfo,
  timeframe: Timeframe,
  count: number = 200
): Candle[] {
  const step = getTimeframeSeconds(timeframe);
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * step;

  // Asset specific volatility multiplier
  let volatility = 0.0035;
  if (symbol.category === 'Crypto') volatility = 0.009;
  if (symbol.category === 'Forex') volatility = 0.0008;

  const candles: Candle[] = [];
  let price = symbol.basePrice * (1 - (symbol.change24hPct / 100) * 0.5);

  // Use a pseudo-random seed based on symbol name to make initial bars stable
  let seed = 0;
  for (let i = 0; i < symbol.symbol.length; i++) {
    seed = (seed * 31 + symbol.symbol.charCodeAt(i)) % 1000000;
  }
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const time = startTime + i * step;
    const progress = i / count;
    // Introduce micro-trend and oscillation
    const cycle = Math.sin(progress * Math.PI * 4) * 0.015;
    const delta = (random() - 0.495) * volatility + cycle * 0.002;

    const open = price;
    let close = price * (1 + delta);
    if (i === count - 1) {
      // Pin last candle to the symbol's current price
      close = symbol.currentPrice;
    }

    const high = Math.max(open, close) * (1 + random() * volatility * 0.8);
    const low = Math.min(open, close) * (1 - random() * volatility * 0.8);
    const baseVol = symbol.volume24h / (24 * (3600 / step));
    const volume = Math.floor(baseVol * (0.6 + random() * 0.9));

    candles.push({
      time,
      open: Number(open.toFixed(symbol.precision)),
      high: Number(high.toFixed(symbol.precision)),
      low: Number(low.toFixed(symbol.precision)),
      close: Number(close.toFixed(symbol.precision)),
      volume,
    });

    price = close;
  }

  return candles;
}

/**
 * Computes next simulated real-time tick for active symbol and updates candles
 */
export function processLiveTick(
  symbol: SymbolInfo,
  candles: Candle[],
  timeframe: Timeframe
): { updatedSymbol: SymbolInfo; updatedCandles: Candle[]; newTickPrice: number } {
  if (candles.length === 0) {
    return { updatedSymbol: symbol, updatedCandles: candles, newTickPrice: symbol.currentPrice };
  }

  const step = getTimeframeSeconds(timeframe);
  const now = Math.floor(Date.now() / 1000);
  const lastCandle = { ...candles[candles.length - 1] };

  // Generate realistic Brownian price jump
  let volPct = 0.0006;
  if (symbol.category === 'Crypto') volPct = 0.0015;
  if (symbol.category === 'Forex') volPct = 0.0001;

  const pctChange = (Math.random() - 0.49) * volPct;
  const newPrice = Number((symbol.currentPrice * (1 + pctChange)).toFixed(symbol.precision));

  // Determine if we need to advance to a new candle or mutate current candle
  const isNewBar = now >= lastCandle.time + step;
  let newCandles: Candle[];

  if (isNewBar) {
    const newBar: Candle = {
      time: Math.floor(now / step) * step,
      open: newPrice,
      high: newPrice,
      low: newPrice,
      close: newPrice,
      volume: Math.floor(10 + Math.random() * 50),
    };
    newCandles = [...candles.slice(1), newBar];
  } else {
    lastCandle.close = newPrice;
    lastCandle.high = Math.max(lastCandle.high, newPrice);
    lastCandle.low = Math.min(lastCandle.low, newPrice);
    lastCandle.volume += Math.floor(5 + Math.random() * 20);
    newCandles = [...candles.slice(0, -1), lastCandle];
  }

  const change24h = Number((newPrice - symbol.basePrice).toFixed(symbol.precision));
  const change24hPct = Number(((change24h / symbol.basePrice) * 100).toFixed(2));
  const high24h = Math.max(symbol.high24h, newPrice);
  const low24h = Math.min(symbol.low24h, newPrice);

  const updatedSymbol: SymbolInfo = {
    ...symbol,
    currentPrice: newPrice,
    change24h,
    change24hPct,
    high24h,
    low24h,
  };

  return { updatedSymbol, updatedCandles: newCandles, newTickPrice: newPrice };
}

/**
 * Generates dynamic order book ladder based on current price
 */
export function generateOrderBook(currentPrice: number, precision: number): OrderBookData {
  const step = Math.max(0.01, Math.pow(10, -precision) * 2);
  const levels = 8;
  const bids = [];
  const asks = [];

  let cumBidTotal = 0;
  for (let i = 1; i <= levels; i++) {
    const price = Number((currentPrice - i * step).toFixed(precision));
    const amount = Number((10 + Math.random() * 80).toFixed(1));
    cumBidTotal += amount;
    bids.push({ price, amount, total: Number(cumBidTotal.toFixed(1)) });
  }

  let cumAskTotal = 0;
  for (let i = 1; i <= levels; i++) {
    const price = Number((currentPrice + i * step).toFixed(precision));
    const amount = Number((10 + Math.random() * 80).toFixed(1));
    cumAskTotal += amount;
    asks.push({ price, amount, total: Number(cumAskTotal.toFixed(1)) });
  }

  const spread = Number((asks[0].price - bids[0].price).toFixed(precision));
  const spreadPct = Number(((spread / currentPrice) * 100).toFixed(3));

  return { bids, asks, spread, spreadPct };
}

/**
 * Calculates algorithmic technical indicator consensus
 */
export function analyzeTechnicalSummary(candles: Candle[]): TechnicalSummary {
  if (candles.length < 30) {
    return {
      rating: 'Neutral',
      score: 0,
      rsiValue: 50,
      rsiStatus: 'Neutral',
      macdSignal: 'Neutral',
      trend: 'Ranging',
      supportLevels: [],
      resistanceLevels: [],
    };
  }

  const closes = candles.map((c) => c.close);
  const rsis = calculateRSI(closes, 14);
  const latestRsi = rsis[rsis.length - 1] ?? 50;

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const latestSma20 = sma20[sma20.length - 1] ?? closes[closes.length - 1];
  const latestSma50 = sma50[sma50.length - 1] ?? closes[closes.length - 1];
  const currentPrice = closes[closes.length - 1];

  const macd = calculateMACD(closes, 12, 26, 9);
  const latestHist = macd.histogram[macd.histogram.length - 1] ?? 0;

  let score = 0;

  // RSI score contribution
  let rsiStatus: 'Oversold' | 'Neutral' | 'Overbought' = 'Neutral';
  if (latestRsi < 30) {
    rsiStatus = 'Oversold';
    score += 35; // Bullish reversal potential
  } else if (latestRsi > 70) {
    rsiStatus = 'Overbought';
    score -= 35; // Bearish correction risk
  } else if (latestRsi > 50) {
    score += 15;
  } else {
    score -= 15;
  }

  // Moving average trend
  let trend: 'Uptrend' | 'Downtrend' | 'Ranging' = 'Ranging';
  if (currentPrice > latestSma20 && latestSma20 > latestSma50) {
    trend = 'Uptrend';
    score += 40;
  } else if (currentPrice < latestSma20 && latestSma20 < latestSma50) {
    trend = 'Downtrend';
    score -= 40;
  }

  // MACD momentum
  let macdSignal: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (latestHist > 0) {
    macdSignal = 'Bullish';
    score += 25;
  } else if (latestHist < 0) {
    macdSignal = 'Bearish';
    score -= 25;
  }

  score = Math.max(-100, Math.min(100, score));

  let rating: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell' = 'Neutral';
  if (score >= 50) rating = 'Strong Buy';
  else if (score >= 20) rating = 'Buy';
  else if (score <= -50) rating = 'Strong Sell';
  else if (score <= -20) rating = 'Sell';

  // Support & resistance calculations from recent pivots
  const recentHighs = candles.slice(-50).map((c) => c.high);
  const recentLows = candles.slice(-50).map((c) => c.low);
  const maxHigh = Math.max(...recentHighs);
  const minLow = Math.min(...recentLows);
  const midPivot = (maxHigh + minLow + currentPrice) / 3;

  return {
    rating,
    score,
    rsiValue: Number(latestRsi.toFixed(1)),
    rsiStatus,
    macdSignal,
    trend,
    supportLevels: [
      Number(minLow.toFixed(2)),
      Number((midPivot * 2 - maxHigh).toFixed(2)),
    ],
    resistanceLevels: [
      Number((midPivot * 2 - minLow).toFixed(2)),
      Number(maxHigh.toFixed(2)),
    ],
  };
}
