import React, { useMemo } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { SymbolInfo, OrderBookData } from '../types/market';
import { generateOrderBook } from '../utils/marketData';

interface OrderBookPanelProps {
  symbol: SymbolInfo;
  orderBook: OrderBookData;
}

export const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ symbol, orderBook }) => {
  const maxAskTotal = useMemo(() => {
    return Math.max(...orderBook.asks.map((a) => a.total), 1);
  }, [orderBook.asks]);

  const maxBidTotal = useMemo(() => {
    return Math.max(...orderBook.bids.map((b) => b.total), 1);
  }, [orderBook.bids]);

  const maxTotal = Math.max(maxAskTotal, maxBidTotal);

  return (
    <div className="flex flex-col h-full bg-[#1e222d] text-[#d1d4dc] select-none text-xs">
      {/* Title */}
      <div className="p-3 border-b border-[#2a2e39] flex items-center justify-between shrink-0">
        <div>
          <span className="font-bold text-sm text-white">Order Book</span>
          <span className="text-[11px] text-[#787b86] ml-2">Level 2 DOM</span>
        </div>
        <span className="text-[10px] bg-[#131722] px-2 py-0.5 rounded text-[#787b86] font-mono">
          {symbol.exchange}
        </span>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-3 py-1.5 bg-[#131722] text-[#787b86] text-[10px] font-semibold uppercase tracking-wider border-b border-[#2a2e39]">
        <div>Price ({symbol.symbol.split('/')[1] || 'USD'})</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sells) - Reversed so lowest ask is near the spread */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-end divide-y divide-[#2a2e39]/20">
        {[...orderBook.asks].reverse().map((ask, idx) => {
          const depthPct = (ask.total / maxTotal) * 100;
          return (
            <div
              key={`ask_${idx}`}
              className="grid grid-cols-3 px-3 py-1 font-mono text-[11px] relative items-center hover:bg-[#2a2e39]/40 cursor-pointer"
            >
              {/* Depth bar visual */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#f23645]/15 pointer-events-none"
                style={{ width: `${depthPct}%` }}
              />
              <div className="text-[#f23645] font-semibold z-10 tabular-nums">
                {ask.price.toFixed(symbol.precision)}
              </div>
              <div className="text-right text-[#d1d4dc] z-10 tabular-nums">{ask.amount}</div>
              <div className="text-right text-[#787b86] z-10 tabular-nums">{ask.total}</div>
            </div>
          );
        })}
      </div>

      {/* Middle Spread Banner */}
      <div className="px-3 py-2 bg-[#131722] border-y border-[#2a2e39] flex items-center justify-between font-mono shrink-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold text-sm tabular-nums ${
              symbol.change24h >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
            }`}
          >
            ${symbol.currentPrice.toFixed(symbol.precision)}
          </span>
          {symbol.change24h >= 0 ? (
            <ArrowUp className="w-3.5 h-3.5 text-[#089981]" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-[#f23645]" />
          )}
        </div>
        <div className="text-[10px] text-[#787b86]">
          Spread: <span className="text-[#d1d4dc]">${orderBook.spread.toFixed(symbol.precision)}</span> (
          {orderBook.spreadPct.toFixed(2)}%)
        </div>
      </div>

      {/* Bids (Buys) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/20">
        {orderBook.bids.map((bid, idx) => {
          const depthPct = (bid.total / maxTotal) * 100;
          return (
            <div
              key={`bid_${idx}`}
              className="grid grid-cols-3 px-3 py-1 font-mono text-[11px] relative items-center hover:bg-[#2a2e39]/40 cursor-pointer"
            >
              {/* Depth bar visual */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#089981]/15 pointer-events-none"
                style={{ width: `${depthPct}%` }}
              />
              <div className="text-[#089981] font-semibold z-10 tabular-nums">
                {bid.price.toFixed(symbol.precision)}
              </div>
              <div className="text-right text-[#d1d4dc] z-10 tabular-nums">{bid.amount}</div>
              <div className="text-right text-[#787b86] z-10 tabular-nums">{bid.total}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
