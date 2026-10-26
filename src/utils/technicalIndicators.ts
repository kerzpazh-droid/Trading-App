/**
 * Pure Mathematical Technical Indicators for Charting
 */

import { Candle } from '../types/market.js';

export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (data.length === 0 || period <= 0) return result;

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result.push(sum / period);
    } else {
      result.push(null);
    }
  }
  return result;
}

export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (data.length === 0 || period <= 0) return result;

  const multiplier = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    if (i === period - 1) {
      // First EMA is the SMA of the initial period
      let initialSum = 0;
      for (let j = 0; j <= i; j++) {
        initialSum += data[j];
      }
      prevEma = initialSum / period;
      result.push(prevEma);
    } else if (prevEma !== null) {
      const currentEma: number = (data[i] - prevEma) * multiplier + prevEma;
      result.push(currentEma);
      prevEma = currentEma;
    }
  }

  return result;
}

export interface BollingerBandsResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsResult {
  const middle = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    const mid = middle[i];
    if (mid === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }

    // Standard deviation over last 'period' elements
    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j] - mid;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper.push(mid + stdDevMultiplier * stdDev);
    lower.push(mid - stdDevMultiplier * stdDev);
  }

  return { upper, middle, lower };
}

export function calculateRSI(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length <= period) {
    return new Array(closes.length).fill(null);
  }

  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // First values up to period - 1 are null
  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  // First RSI value at index 'period'
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  result.push(rsi);

  // Subsequent values using Wilder's smoothing
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    result.push(rsi);
  }

  return result;
}

export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: (number | null)[] = [];
  const validMacdValues: number[] = [];
  const validMacdIndices: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    const fast = fastEMA[i];
    const slow = slowEMA[i];
    if (fast !== null && slow !== null) {
      const val = fast - slow;
      macdLine.push(val);
      validMacdValues.push(val);
      validMacdIndices.push(i);
    } else {
      macdLine.push(null);
    }
  }

  // Calculate Signal line: EMA of MACD
  const signalOnValid = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | null)[] = new Array(closes.length).fill(null);
  const histogram: (number | null)[] = new Array(closes.length).fill(null);

  for (let k = 0; k < validMacdIndices.length; k++) {
    const originalIndex = validMacdIndices[k];
    const sig = signalOnValid[k];
    signalLine[originalIndex] = sig;

    const macdVal = macdLine[originalIndex];
    if (macdVal !== null && sig !== null) {
      histogram[originalIndex] = macdVal - sig;
    }
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}

export function calculateVWAP(candles: Candle[]): (number | null)[] {
  const result: (number | null)[] = [];
  let cumulativeTypicalVolume = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTypicalVolume += typicalPrice * c.volume;
    cumulativeVolume += c.volume;

    if (cumulativeVolume === 0) {
      result.push(typicalPrice);
    } else {
      result.push(cumulativeTypicalVolume / cumulativeVolume);
    }
  }

  return result;
}

export function convertToHeikinAshi(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];
  const haCandles: Candle[] = [];

  // First candle
  const first = candles[0];
  const firstHaClose = (first.open + first.high + first.low + first.close) / 4;
  const firstHaOpen = (first.open + first.close) / 2;
  const firstHaHigh = Math.max(first.high, firstHaOpen, firstHaClose);
  const firstHaLow = Math.min(first.low, firstHaOpen, firstHaClose);

  haCandles.push({
    time: first.time,
    open: firstHaOpen,
    high: firstHaHigh,
    low: firstHaLow,
    close: firstHaClose,
    volume: first.volume,
  });

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prevHa = haCandles[i - 1];

    const haClose = (curr.open + curr.high + curr.low + curr.close) / 4;
    const haOpen = (prevHa.open + prevHa.close) / 2;
    const haHigh = Math.max(curr.high, haOpen, haClose);
    const haLow = Math.min(curr.low, haOpen, haClose);

    haCandles.push({
      time: curr.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: curr.volume,
    });
  }

  return haCandles;
}

export interface FibLevel {
  level: number;
  label: string;
  price: number;
  color: string;
}

export function calculateFibonacciLevels(p1: number, p2: number): FibLevel[] {
  const diff = p2 - p1;
  const ratios = [
    { level: 0.0, label: '0.0%', color: '#787b86' },
    { level: 0.236, label: '23.6%', color: '#f23645' },
    { level: 0.382, label: '38.2%', color: '#ff9800' },
    { level: 0.5, label: '50.0%', color: '#089981' },
    { level: 0.618, label: '61.8%', color: '#00bcd4' },
    { level: 0.786, label: '78.6%', color: '#2962ff' },
    { level: 1.0, label: '100.0%', color: '#787b86' },
  ];

  return ratios.map((r) => ({
    level: r.level,
    label: r.label,
    price: p1 + diff * r.level,
    color: r.color,
  }));
}
