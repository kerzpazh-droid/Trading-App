import test from 'node:test';
import assert from 'node:assert/strict';
import {
  POPULAR_SYMBOLS,
  generateHistoricalCandles,
  processLiveTick,
  generateOrderBook,
  analyzeTechnicalSummary,
} from './marketData';

test('POPULAR_SYMBOLS contains expected major equities and crypto', () => {
  assert(POPULAR_SYMBOLS.length >= 8);
  const aapl = POPULAR_SYMBOLS.find((s) => s.symbol === 'AAPL');
  assert.ok(aapl);
  assert.equal(aapl.category, 'Stocks');

  const btc = POPULAR_SYMBOLS.find((s) => s.symbol === 'BTC/USD');
  assert.ok(btc);
  assert.equal(btc.category, 'Crypto');
});

test('generateHistoricalCandles returns valid chronological OHLCV array', () => {
  const sym = POPULAR_SYMBOLS[0];
  const candles = generateHistoricalCandles(sym, '15m', 100);
  assert.equal(candles.length, 100);

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    assert(c.high >= c.low, `High must be >= Low at index ${i}`);
    assert(c.high >= c.open, `High must be >= Open at index ${i}`);
    assert(c.high >= c.close, `High must be >= Close at index ${i}`);
    assert(c.low <= c.open, `Low must be <= Open at index ${i}`);
    assert(c.low <= c.close, `Low must be <= Close at index ${i}`);
    assert(c.volume > 0, `Volume must be positive at index ${i}`);
    if (i > 0) {
      assert(c.time > candles[i - 1].time, 'Time must increase strictly');
    }
  }
});

test('processLiveTick updates symbol price and high/low ranges', () => {
  const sym = POPULAR_SYMBOLS[0];
  const candles = generateHistoricalCandles(sym, '15m', 50);
  const result = processLiveTick(sym, candles, '15m');

  assert.ok(result.updatedSymbol);
  assert.ok(result.updatedCandles);
  assert.equal(result.updatedCandles.length, candles.length);
  const last = result.updatedCandles[result.updatedCandles.length - 1];
  assert.equal(last.close, result.newTickPrice);
});

test('generateOrderBook returns sorted bids and asks with positive spread', () => {
  const dom = generateOrderBook(150.0, 2);
  assert.equal(dom.bids.length, 8);
  assert.equal(dom.asks.length, 8);
  assert(dom.spread > 0, 'Spread should be positive');
  assert(dom.asks[0].price > dom.bids[0].price, 'Lowest ask must be higher than highest bid');
  // Bids must be descending
  for (let i = 1; i < dom.bids.length; i++) {
    assert(dom.bids[i - 1].price >= dom.bids[i].price);
  }
  // Asks must be ascending
  for (let i = 1; i < dom.asks.length; i++) {
    assert(dom.asks[i].price >= dom.asks[i - 1].price);
  }
});

test('analyzeTechnicalSummary returns valid rating and levels', () => {
  const sym = POPULAR_SYMBOLS[0];
  const candles = generateHistoricalCandles(sym, '1D', 100);
  const summary = analyzeTechnicalSummary(candles);

  assert.ok(summary.rating);
  assert.ok(summary.trend);
  assert(summary.rsiValue >= 0 && summary.rsiValue <= 100);
  assert.equal(summary.supportLevels.length, 2);
  assert.equal(summary.resistanceLevels.length, 2);
});
