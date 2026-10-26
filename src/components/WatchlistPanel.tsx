import React, { useState } from 'react';
import { Search, Plus, Trash2, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { SymbolInfo, TechnicalSummary } from '../types/market';
import { POPULAR_SYMBOLS } from '../utils/marketData';

interface WatchlistPanelProps {
  currentSymbol: SymbolInfo;
  onSelectSymbol: (symbol: SymbolInfo) => void;
  symbols: SymbolInfo[];
  technicalSummary: TechnicalSummary;
  flashSymbol: string | null;
  flashDirection: 'up' | 'down' | null;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  currentSymbol,
  onSelectSymbol,
  symbols,
  technicalSummary,
  flashSymbol,
  flashDirection,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Stocks', 'Crypto', 'Indices', 'Forex'];

  const filteredSymbols = symbols.filter((sym) => {
    const matchCat = filterCategory === 'All' || sym.category === filterCategory;
    const matchQ =
      sym.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sym.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQ;
  });

  // Rating color map
  const getRatingBadge = (rating: TechnicalSummary['rating']) => {
    switch (rating) {
      case 'Strong Buy':
        return 'text-[#089981] bg-[#089981]/15 border-[#089981]/30';
      case 'Buy':
        return 'text-[#089981] bg-[#089981]/10 border-[#089981]/20';
      case 'Strong Sell':
        return 'text-[#f23645] bg-[#f23645]/15 border-[#f23645]/30';
      case 'Sell':
        return 'text-[#f23645] bg-[#f23645]/10 border-[#f23645]/20';
      default:
        return 'text-[#787b86] bg-[#2a2e39] border-[#363a45]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e222d] text-[#d1d4dc] select-none text-xs">
      {/* Panel Title & Search */}
      <div className="p-3 border-b border-[#2a2e39] space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-white tracking-tight">Watchlist</span>
          <span className="text-[11px] text-[#787b86] font-mono">
            {filteredSymbols.length} Symbols
          </span>
        </div>

        {/* Filter input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#787b86]" />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131722] border border-[#2a2e39] rounded pl-8 pr-2 py-1 text-xs text-[#d1d4dc] placeholder-[#787b86] focus:outline-hidden focus:border-[#2962ff]"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#131722]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol Table Header */}
      <div className="grid grid-cols-12 px-3 py-1.5 bg-[#131722] text-[#787b86] text-[10px] font-semibold uppercase tracking-wider border-b border-[#2a2e39]">
        <div className="col-span-5">Symbol</div>
        <div className="col-span-4 text-right">Last</div>
        <div className="col-span-3 text-right">Chg%</div>
      </div>

      {/* Symbol Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/40">
        {filteredSymbols.map((sym) => {
          const isSelected = sym.symbol === currentSymbol.symbol;
          const isPositive = sym.change24h >= 0;
          const isFlashing = flashSymbol === sym.symbol;

          let flashBg = '';
          if (isFlashing && flashDirection === 'up') flashBg = 'bg-[#089981]/25 transition-colors duration-300';
          if (isFlashing && flashDirection === 'down') flashBg = 'bg-[#f23645]/25 transition-colors duration-300';

          return (
            <div
              key={sym.symbol}
              onClick={() => onSelectSymbol(sym)}
              className={`grid grid-cols-12 px-3 py-2.5 items-center cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-[#2962ff]/15 border-l-2 border-[#2962ff]'
                  : 'hover:bg-[#2a2e39]/50'
              } ${flashBg}`}
            >
              {/* Symbol & Name */}
              <div className="col-span-5 min-w-0 pr-1">
                <div className="font-bold text-xs text-white truncate">{sym.symbol}</div>
                <div className="text-[10px] text-[#787b86] truncate">{sym.name}</div>
              </div>

              {/* Price */}
              <div className="col-span-4 text-right font-mono font-semibold text-[#d1d4dc] tabular-nums">
                ${sym.currentPrice.toLocaleString(undefined, { minimumFractionDigits: sym.precision })}
              </div>

              {/* % Change */}
              <div className="col-span-3 text-right font-mono font-semibold tabular-nums">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                    isPositive ? 'text-[#089981] bg-[#089981]/10' : 'text-[#f23645] bg-[#f23645]/10'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {sym.change24hPct.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Symbol Stats Footer */}
      <div className="p-3 border-t border-[#2a2e39] bg-[#131722]/80 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-white">{currentSymbol.symbol}</div>
            <div className="text-[11px] text-[#787b86]">{currentSymbol.name}</div>
          </div>
          <div
            className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getRatingBadge(
              technicalSummary.rating
            )}`}
          >
            {technicalSummary.rating}
          </div>
        </div>

        {/* Day's Range Visual Bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-[#787b86] font-mono mb-1">
            <span>Low: ${currentSymbol.low24h.toFixed(currentSymbol.precision)}</span>
            <span>High: ${currentSymbol.high24h.toFixed(currentSymbol.precision)}</span>
          </div>
          <div className="w-full h-1.5 bg-[#2a2e39] rounded-full overflow-hidden relative">
            {currentSymbol.high24h > currentSymbol.low24h && (
              <div
                className="h-full bg-linear-to-r from-[#2962ff] to-[#089981] rounded-full"
                style={{
                  width: `${Math.max(
                    5,
                    Math.min(
                      100,
                      ((currentSymbol.currentPrice - currentSymbol.low24h) /
                        (currentSymbol.high24h - currentSymbol.low24h)) *
                        100
                    )
                  )}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="bg-[#1e222d] p-1.5 rounded border border-[#2a2e39]/60">
            <span className="text-[#787b86] block text-[10px]">Volume (24h)</span>
            <span className="font-mono font-semibold text-white">
              {(currentSymbol.volume24h / 1e6).toFixed(1)}M
            </span>
          </div>
          <div className="bg-[#1e222d] p-1.5 rounded border border-[#2a2e39]/60">
            <span className="text-[#787b86] block text-[10px]">Market Cap</span>
            <span className="font-mono font-semibold text-white">
              {currentSymbol.marketCap ?? 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
