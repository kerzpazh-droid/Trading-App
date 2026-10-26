import React, { useState } from 'react';
import { DollarSign, ShieldAlert, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { SymbolInfo, Position } from '../types/market';

interface PaperTradingPanelProps {
  symbol: SymbolInfo;
  balance: number;
  positions: Position[];
  onPlaceOrder: (order: {
    symbol: string;
    type: 'BUY' | 'SELL';
    shares: number;
    price: number;
  }) => void;
  onClosePosition: (id: string) => void;
}

export const PaperTradingPanel: React.FC<PaperTradingPanelProps> = ({
  symbol,
  balance,
  positions,
  onPlaceOrder,
  onClosePosition,
}) => {
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [sharesInput, setSharesInput] = useState<string>('10');
  const [limitPriceInput, setLimitPriceInput] = useState<string>(symbol.currentPrice.toString());
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  const parsedShares = Math.max(1, parseInt(sharesInput) || 1);
  const executionPrice =
    orderType === 'MARKET' ? symbol.currentPrice : parseFloat(limitPriceInput) || symbol.currentPrice;
  const estimatedTotal = parsedShares * executionPrice;

  const symbolPositions = positions.filter((p) => p.symbol === symbol.symbol);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (estimatedTotal > balance && orderSide === 'BUY') {
      alert('Insufficient paper trading balance');
      return;
    }

    onPlaceOrder({
      symbol: symbol.symbol,
      type: orderSide,
      shares: parsedShares,
      price: executionPrice,
    });

    setOrderSuccessMsg(
      `Executed ${orderSide} ${parsedShares} ${symbol.symbol} @ $${executionPrice.toFixed(
        symbol.precision
      )}`
    );
    setTimeout(() => setOrderSuccessMsg(null), 3000);
  };

  const handleQuickPercent = (pct: number) => {
    const alloc = (balance * pct) / symbol.currentPrice;
    setSharesInput(Math.max(1, Math.floor(alloc)).toString());
  };

  return (
    <div className="flex flex-col h-full bg-[#1e222d] text-[#d1d4dc] select-none text-xs">
      {/* Balance Summary Header */}
      <div className="p-3 border-b border-[#2a2e39] bg-[#131722] flex items-center justify-between shrink-0">
        <div>
          <span className="text-[10px] text-[#787b86] uppercase block">Paper Trading Funds</span>
          <span className="font-mono text-base font-bold text-white tabular-nums">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="px-2 py-0.5 rounded bg-[#2962ff]/15 border border-[#2962ff]/30 text-[#2962ff] text-[10px] font-semibold">
          Simulated
        </div>
      </div>

      {/* Order Entry Form */}
      <form onSubmit={handleSubmitOrder} className="p-3 space-y-3 flex-1 overflow-y-auto">
        {/* Buy / Sell Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
          <button
            type="button"
            onClick={() => setOrderSide('BUY')}
            className={`py-1.5 rounded font-bold text-xs transition-colors flex items-center justify-center gap-1 ${
              orderSide === 'BUY'
                ? 'bg-[#089981] text-white shadow-xs'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> BUY / LONG
          </button>
          <button
            type="button"
            onClick={() => setOrderSide('SELL')}
            className={`py-1.5 rounded font-bold text-xs transition-colors flex items-center justify-center gap-1 ${
              orderSide === 'SELL'
                ? 'bg-[#f23645] text-white shadow-xs'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> SELL / SHORT
          </button>
        </div>

        {/* Order Type */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-[#787b86] w-14">Type</label>
          <div className="flex-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`py-1 rounded text-xs font-medium border transition-colors ${
                orderType === 'MARKET'
                  ? 'border-[#2962ff] bg-[#2962ff]/10 text-white'
                  : 'border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => setOrderType('LIMIT')}
              className={`py-1 rounded text-xs font-medium border transition-colors ${
                orderType === 'LIMIT'
                  ? 'border-[#2962ff] bg-[#2962ff]/10 text-white'
                  : 'border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Limit Price Input (if limit selected) */}
        {orderType === 'LIMIT' && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[#787b86] w-14">Limit Price</label>
            <input
              type="number"
              step="any"
              value={limitPriceInput}
              onChange={(e) => setLimitPriceInput(e.target.value)}
              className="flex-1 bg-[#131722] border border-[#2a2e39] rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-hidden focus:border-[#2962ff]"
            />
          </div>
        )}

        {/* Shares Quantity Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#787b86]">Quantity (Shares/Units)</span>
            <span className="text-[10px] text-[#787b86] font-mono">
              @ ${symbol.currentPrice.toFixed(symbol.precision)}
            </span>
          </div>
          <input
            type="number"
            min="1"
            value={sharesInput}
            onChange={(e) => setSharesInput(e.target.value)}
            className="w-full bg-[#131722] border border-[#2a2e39] rounded px-2.5 py-1.5 text-sm font-mono text-white focus:outline-hidden focus:border-[#2962ff]"
          />
        </div>

        {/* Quick Allocation Percentages */}
        <div className="grid grid-cols-4 gap-1">
          {[0.1, 0.25, 0.5, 0.95].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handleQuickPercent(pct)}
              className="py-1 rounded bg-[#131722] border border-[#2a2e39] text-[10px] font-mono text-[#787b86] hover:text-white hover:bg-[#2a2e39] transition-colors"
            >
              {Math.round(pct * 100)}%
            </button>
          ))}
        </div>

        {/* Order Calculation Preview */}
        <div className="p-2.5 bg-[#131722] rounded border border-[#2a2e39] space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between text-[#787b86]">
            <span>Estimated Value:</span>
            <span className="text-white font-semibold">
              ${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-[#787b86]">
            <span>Commission:</span>
            <span className="text-[#089981]">$0.00 (Zero Fee)</span>
          </div>
        </div>

        {/* Feedback message */}
        {orderSuccessMsg && (
          <div className="p-2 rounded bg-[#089981]/15 border border-[#089981]/30 text-[#089981] text-xs flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{orderSuccessMsg}</span>
          </div>
        )}

        {/* Submit Execution Button */}
        <button
          type="submit"
          className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-transform active:scale-[0.99] ${
            orderSide === 'BUY'
              ? 'bg-[#089981] hover:bg-[#078570]'
              : 'bg-[#f23645] hover:bg-[#d92a38]'
          }`}
        >
          {orderSide} {parsedShares} {symbol.symbol}
        </button>

        {/* Active Positions for this symbol */}
        {symbolPositions.length > 0 && (
          <div className="pt-2 border-t border-[#2a2e39] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-white">
              <span>Open Position ({symbolPositions.length})</span>
            </div>
            {symbolPositions.map((pos) => {
              const isProfit = pos.pnl >= 0;
              return (
                <div
                  key={pos.id}
                  className="p-2 bg-[#131722] rounded border border-[#2a2e39] flex items-center justify-between font-mono text-[11px]"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold ${
                          pos.type === 'BUY' ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {pos.type}
                      </span>
                      <span className="text-white font-semibold">{pos.shares} units</span>
                    </div>
                    <div className="text-[10px] text-[#787b86]">
                      Entry: ${pos.entryPrice.toFixed(symbol.precision)}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className={`font-semibold ${isProfit ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {isProfit ? '+' : ''}${pos.pnl.toFixed(2)}
                      </div>
                      <div className={`text-[10px] ${isProfit ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {isProfit ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onClosePosition(pos.id)}
                      className="px-2 py-1 rounded bg-[#2a2e39] hover:bg-[#f23645] hover:text-white text-[#d1d4dc] text-[10px] transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
};
