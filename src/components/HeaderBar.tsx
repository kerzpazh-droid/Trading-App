import React from 'react';
import {
  TrendingUp,
  Search,
  Activity,
  BarChart2,
  Play,
  Pause,
  RotateCcw,
  Sun,
  Moon,
  Maximize2,
  Layers,
  ChevronDown,
  BookOpen,
  DollarSign,
  Sparkles,
  Newspaper,
  List,
} from 'lucide-react';
import { SymbolInfo, Timeframe, ChartType, IndicatorConfig } from '../types/market';

interface HeaderBarProps {
  currentSymbol: SymbolInfo;
  onOpenSearch: () => void;
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  chartType: ChartType;
  onSelectChartType: (ct: ChartType) => void;
  indicators: IndicatorConfig;
  onOpenIndicators: () => void;
  isLive: boolean;
  onToggleLive: () => void;
  tickSpeed: number;
  onToggleSpeed: () => void;
  onResetView: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeRightTab: 'watchlist' | 'orderbook' | 'trading' | 'ai' | 'news';
  onSelectRightTab: (tab: 'watchlist' | 'orderbook' | 'trading' | 'ai' | 'news') => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentSymbol,
  onOpenSearch,
  timeframe,
  onSelectTimeframe,
  chartType,
  onSelectChartType,
  indicators,
  onOpenIndicators,
  isLive,
  onToggleLive,
  tickSpeed,
  onToggleSpeed,
  onResetView,
  theme,
  onToggleTheme,
  activeRightTab,
  onSelectRightTab,
  isRightPanelOpen,
  onToggleRightPanel,
}) => {
  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];
  const activeIndicatorsCount = Object.values(indicators).filter(Boolean).length;
  const isPositive = currentSymbol.change24h >= 0;

  const chartTypes: { id: ChartType; label: string }[] = [
    { id: 'candlestick', label: 'Candles' },
    { id: 'heikin-ashi', label: 'Heikin-Ashi' },
    { id: 'line', label: 'Line' },
    { id: 'area', label: 'Area' },
    { id: 'bars', label: 'Bars' },
  ];

  return (
    <header className="h-12 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between px-3 select-none z-30 shrink-0 gap-2 overflow-x-auto">
      {/* Left Zone: Brand & Symbol Selector */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-sm tracking-wider text-white">
          <div className="w-6 h-6 rounded bg-[#2962ff] flex items-center justify-center text-white">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline">APEXVIEW</span>
        </div>

        <div className="w-[1px] h-5 bg-[#2a2e39] hidden sm:block" />

        {/* Symbol Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#2a2e39] transition-colors border border-transparent hover:border-[#363a45]"
          title="Search ticker (e.g. AAPL, NVDA, BTC/USD)"
        >
          <Search className="w-3.5 h-3.5 text-[#787b86]" />
          <span className="font-bold text-sm text-[#d1d4dc]">{currentSymbol.symbol}</span>
          <span className="text-[11px] text-[#787b86] hidden md:inline">
            {currentSymbol.exchange}
          </span>
          <ChevronDown className="w-3 h-3 text-[#787b86]" />
        </button>

        {/* Current Live Price & Change */}
        <div className="flex items-center gap-2 pl-1">
          <span className="font-mono font-semibold text-sm text-white tabular-nums">
            ${currentSymbol.currentPrice.toLocaleString(undefined, {
              minimumFractionDigits: currentSymbol.precision,
            })}
          </span>
          <span
            className={`font-mono text-xs font-semibold tabular-nums hidden sm:inline ${
              isPositive ? 'text-[#089981]' : 'text-[#f23645]'
            }`}
          >
            {isPositive ? '+' : ''}
            {currentSymbol.change24h.toFixed(currentSymbol.precision)} ({isPositive ? '+' : ''}
            {currentSymbol.change24hPct.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="w-[1px] h-5 bg-[#2a2e39] shrink-0" />

      {/* Middle Zone: Timeframes, Chart Styles, Indicators */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Timeframes */}
        <div className="flex items-center gap-0.5 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-[#2962ff] text-white shadow-xs'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Types */}
        <div className="hidden lg:flex items-center gap-0.5 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          {chartTypes.map((ct) => (
            <button
              key={ct.id}
              onClick={() => onSelectChartType(ct.id)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                chartType === ct.id
                  ? 'bg-[#2a2e39] text-[#2962ff]'
                  : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>

        {/* Indicators Button */}
        <button
          onClick={onOpenIndicators}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded text-xs font-medium text-[#d1d4dc] transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-[#2962ff]" />
          <span>Indicators</span>
          {activeIndicatorsCount > 0 && (
            <span className="bg-[#2962ff] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {activeIndicatorsCount}
            </span>
          )}
        </button>
      </div>

      <div className="w-[1px] h-5 bg-[#2a2e39] shrink-0" />

      {/* Right Controls: Real-time simulation toggle, Reset View, Theme, Panel Toggles */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Real-Time Live Tick Stream Button */}
        <div className="flex items-center bg-[#131722] rounded border border-[#2a2e39] p-0.5">
          <button
            onClick={onToggleLive}
            title={isLive ? 'Pause real-time market stream' : 'Resume real-time market stream'}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              isLive
                ? 'text-[#089981] bg-[#089981]/15 font-semibold'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#089981] animate-ping" />
                <span className="hidden sm:inline">LIVE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#787b86]" />
                <span className="hidden sm:inline">PAUSED</span>
              </>
            )}
          </button>
          <button
            onClick={onToggleSpeed}
            title="Tick frequency speed"
            className="px-1.5 py-1 text-[11px] font-mono font-bold text-[#787b86] hover:text-[#d1d4dc]"
          >
            {tickSpeed}x
          </button>
        </div>

        {/* Reset View Button */}
        <button
          onClick={onResetView}
          title="Reset chart zoom & pan"
          aria-label="Reset chart view"
          className="p-1.5 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
          className="p-1.5 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] rounded transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Right Sidebar Quick Tabs */}
        <div className="flex items-center gap-0.5 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          <button
            onClick={() => {
              if (activeRightTab === 'watchlist' && isRightPanelOpen) {
                onToggleRightPanel();
              } else {
                onSelectRightTab('watchlist');
                if (!isRightPanelOpen) onToggleRightPanel();
              }
            }}
            title="Watchlist & Quotes"
            aria-label="Watchlist"
            className={`p-1.5 rounded transition-colors ${
              activeRightTab === 'watchlist' && isRightPanelOpen
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (activeRightTab === 'orderbook' && isRightPanelOpen) {
                onToggleRightPanel();
              } else {
                onSelectRightTab('orderbook');
                if (!isRightPanelOpen) onToggleRightPanel();
              }
            }}
            title="Order Book & Depth of Market"
            aria-label="Order Book"
            className={`p-1.5 rounded transition-colors ${
              activeRightTab === 'orderbook' && isRightPanelOpen
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (activeRightTab === 'trading' && isRightPanelOpen) {
                onToggleRightPanel();
              } else {
                onSelectRightTab('trading');
                if (!isRightPanelOpen) onToggleRightPanel();
              }
            }}
            title="Paper Trading Order Entry"
            aria-label="Paper Trading"
            className={`p-1.5 rounded transition-colors ${
              activeRightTab === 'trading' && isRightPanelOpen
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (activeRightTab === 'ai' && isRightPanelOpen) {
                onToggleRightPanel();
              } else {
                onSelectRightTab('ai');
                if (!isRightPanelOpen) onToggleRightPanel();
              }
            }}
            title="AI Technical Market Analyst"
            aria-label="AI Technical Analyst"
            className={`p-1.5 rounded transition-colors ${
              activeRightTab === 'ai' && isRightPanelOpen
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (activeRightTab === 'news' && isRightPanelOpen) {
                onToggleRightPanel();
              } else {
                onSelectRightTab('news');
                if (!isRightPanelOpen) onToggleRightPanel();
              }
            }}
            title="Macro Headlines & Calendar"
            aria-label="Macro Headlines"
            className={`p-1.5 rounded transition-colors ${
              activeRightTab === 'news' && isRightPanelOpen
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
