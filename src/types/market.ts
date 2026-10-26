/**
 * Market & Charting Type Definitions
 */

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W';

export type ChartType = 'candlestick' | 'hollow' | 'heikin-ashi' | 'line' | 'area' | 'bars';

export interface SymbolInfo {
  symbol: string;
  name: string;
  category: 'Stocks' | 'Crypto' | 'Indices' | 'Forex' | 'Commodities';
  exchange: string;
  basePrice: number;
  currentPrice: number;
  change24h: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: string;
  peRatio?: number;
  precision: number;
}

export interface IndicatorConfig {
  sma20: boolean;
  sma50: boolean;
  sma200: boolean;
  ema9: boolean;
  ema21: boolean;
  bollinger: boolean;
  vwap: boolean;
  rsi: boolean;
  macd: boolean;
}

export type DrawingToolType =
  | 'cursor'
  | 'crosshair'
  | 'trendline'
  | 'horizontal'
  | 'fibonacci'
  | 'rect'
  | 'longPosition'
  | 'shortPosition'
  | 'measure';

export interface DrawingItem {
  id: string;
  type: DrawingToolType;
  points: { time: number; price: number }[];
  color?: string;
  completed: boolean;
  label?: string;
  data?: Record<string, unknown>;
}

export interface Position {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  timestamp: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPct: number;
}

export interface TechnicalSummary {
  rating: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  score: number; // -100 to 100
  rsiValue: number;
  rsiStatus: 'Oversold' | 'Neutral' | 'Overbought';
  macdSignal: 'Bullish' | 'Bearish' | 'Neutral';
  trend: 'Uptrend' | 'Downtrend' | 'Ranging';
  supportLevels: number[];
  resistanceLevels: number[];
}
