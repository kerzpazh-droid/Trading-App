import React, { useState, useMemo } from 'react';
import { Search, X, TrendingUp, Check } from 'lucide-react';
import { SymbolInfo } from '../types/market';
import { POPULAR_SYMBOLS } from '../utils/marketData';

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: SymbolInfo) => void;
  currentSymbol: string;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSymbol,
  currentSymbol,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Stocks', 'Crypto', 'Indices', 'Forex', 'Commodities'];

  const filteredSymbols = useMemo(() => {
    return POPULAR_SYMBOLS.filter((sym) => {
      const matchesCategory =
        activeCategory === 'All' || sym.category === activeCategory;
      const matchesQuery =
        sym.symbol.toLowerCase().includes(query.toLowerCase()) ||
        sym.name.toLowerCase().includes(query.toLowerCase()) ||
        sym.exchange.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-xl bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-[#2a2e39] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#787b86]" />
          <input
            type="text"
            placeholder="Search symbol, company, or exchange (e.g. AAPL, BTC, NVDA)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none text-[#d1d4dc] placeholder-[#787b86] text-sm focus:outline-hidden font-medium"
          />
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#131722] border-b border-[#2a2e39] overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/50">
          {filteredSymbols.length === 0 ? (
            <div className="py-12 text-center text-[#787b86] text-sm">
              No matching symbols found for "{query}"
            </div>
          ) : (
            filteredSymbols.map((sym) => {
              const isSelected = sym.symbol === currentSymbol;
              const isPositive = sym.change24h >= 0;

              return (
                <div
                  key={sym.symbol}
                  onClick={() => {
                    onSelectSymbol(sym);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#2962ff]/10 hover:bg-[#2962ff]/20'
                      : 'hover:bg-[#2a2e39]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2a2e39] flex items-center justify-center font-bold text-xs text-[#2962ff]">
                      {sym.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#d1d4dc]">
                          {sym.symbol}
                        </span>
                        <span className="text-[11px] text-[#787b86] bg-[#131722] px-1.5 py-0.5 rounded">
                          {sym.exchange}
                        </span>
                      </div>
                      <div className="text-xs text-[#787b86] truncate max-w-[200px] sm:max-w-xs">
                        {sym.name} · {sym.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-[#d1d4dc] tabular-nums">
                      ${sym.currentPrice.toLocaleString(undefined, { minimumFractionDigits: sym.precision })}
                    </div>
                    <div
                      className={`font-mono text-xs font-medium tabular-nums ${
                        isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {sym.change24hPct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#131722] border-t border-[#2a2e39] flex items-center justify-between text-xs text-[#787b86]">
          <span>Showing {filteredSymbols.length} instruments</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#089981]" /> Real-time market feed
          </span>
        </div>
      </div>
    </div>
  );
};
