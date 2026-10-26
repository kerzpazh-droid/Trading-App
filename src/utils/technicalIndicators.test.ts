import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateVWAP,
  convertToHeikinAshi,
  calculateFibonacciLevels,
} from './technicalIndicators';
import { Candle } from '../types/market';

test('calculateSMA computes correct moving average', () => {
  const prices = [10, 20, 30, 40, 50];
  const sma3 = calculateSMA(prices, 3);
  assert.equal(sma3[0], null);
  assert.equal(sma3[1], null);
  assert.equal(sma3[2], 20); // (10+20+30)/3
  assert.equal(sma3[3], 30); // (20+30+40)/3
  assert.equal(sma3[4], 40); // (30+40+50)/3
});

test('calculateEMA responds faster to recent prices', () => {
  const prices = [10, 10, 10, 20, 20];
  const ema3 = calculateEMA(prices, 3);
  assert.equal(ema3[0], null);
  assert.equal(ema3[1], null);
  assert.equal(ema3[2], 10);
  // Period 3 multiplier = 2 / (3 + 1) = 0.5
  // ema[3] = (20 - 10) * 0.5 + 10 = 15
  assert.equal(ema3[3], 15);
});

test('calculateBollingerBands returns upper, middle, and lower bands', () => {
  const prices = [10, 12, 11, 13, 12, 14, 15, 13, 14, 16];
  const bb = calculateBollingerBands(prices, 5, 2);
  assert.equal(bb.middle.length, prices.length);
  assert.equal(bb.upper.length, prices.length);
  assert.equal(bb.lower.length, prices.length);
  // At index 4 (5th element), middle should equal SMA
  const validIdx = 5;
  assert(bb.upper[validIdx]! > bb.middle[validIdx]!);
  assert(bb.lower[validIdx]! < bb.middle[validIdx]!);
});

test('calculateRSI generates normalized oscillator values between 0 and 100', () => {
  const prices = [
    44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08,
    45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64,
  ];
  const rsi = calculateRSI(prices, 14);
  assert.equal(rsi[13], null);
  const rsiVal = rsi[14];
  assert(rsiVal !== null);
  assert(rsiVal! >= 0 && rsiVal! <= 100);
});

test('calculateMACD creates macd, signal, and histogram', () => {
  const prices = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i * 0.5) * 10);
  const macd = calculateMACD(prices, 12, 26, 9);
  assert.equal(macd.macd.length, 40);
  assert.equal(macd.signal.length, 40);
  assert.equal(macd.histogram.length, 40);
  // Later values should not be null
  assert.notEqual(macd.macd[35], null);
});

test('calculateVWAP accurately weighs by volume', () => {
  const candles: Candle[] = [
    { time: 100, open: 10, high: 12, low: 8, close: 10, volume: 100 }, // TP = 10, cumVol = 100, cumVal = 1000 => VWAP = 10
    { time: 200, open: 20, high: 22, low: 18, close: 20, volume: 300 }, // TP = 20, cumVol = 400, cumVal = 1000 + 6000 = 7000 => VWAP = 17.5
  ];
  const vwap = calculateVWAP(candles);
  assert.equal(vwap[0], 10);
  assert.equal(vwap[1], 17.5);
});

test('convertToHeikinAshi calculates smoothed candles', () => {
  const candles: Candle[] = [
    { time: 100, open: 100, high: 105, low: 95, close: 102, volume: 50 },
    { time: 200, open: 102, high: 108, low: 101, close: 107, volume: 60 },
  ];
  const ha = convertToHeikinAshi(candles);
  assert.equal(ha.length, 2);
  assert.equal(ha[0].close, (100 + 105 + 95 + 102) / 4);
  assert.equal(ha[1].open, (ha[0].open + ha[0].close) / 2);
});

test('calculateFibonacciLevels produces expected golden ratio and boundaries', () => {
  const levels = calculateFibonacciLevels(100, 200);
  assert.equal(levels[0].price, 100); // 0%
  assert.equal(levels[3].price, 150); // 50%
  assert.equal(levels[4].price, 161.8); // 61.8%
  assert.equal(levels[6].price, 200); // 100%
});
