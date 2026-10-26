/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  SymbolInfo,
  Candle,
  Timeframe,
  ChartType,
  IndicatorConfig,
  DrawingToolType,
  DrawingItem,
  Position,
  OrderBookData,
  TechnicalSummary,
} from './types/market';
import {
  POPULAR_SYMBOLS,
  generateHistoricalCandles,
  processLiveTick,
  generateOrderBook,
  analyzeTechnicalSummary,
} from './utils/marketData';
import { HeaderBar } from './components/HeaderBar';
import { DrawingToolbar } from './components/DrawingToolbar';
import { TradingChart } from './components/TradingChart';
import { WatchlistPanel } from './components/WatchlistPanel';
import { OrderBookPanel } from './components/OrderBookPanel';
import { PaperTradingPanel } from './components/PaperTradingPanel';
import { AIAnalystPanel } from './components/AIAnalystPanel';
import { NewsPanel } from './components/NewsPanel';
import { BottomPanel } from './components/BottomPanel';
import { SymbolSearchModal } from './components/SymbolSearchModal';
import { IndicatorsModal } from './components/IndicatorsModal';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Symbols list state with live prices
  const [symbols, setSymbols] = useState<SymbolInfo[]>(POPULAR_SYMBOLS);
  const [currentSymbol, setCurrentSymbol] = useState<SymbolInfo>(POPULAR_SYMBOLS[0]);

  // Chart configuration
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [resetViewTrigger, setResetViewTrigger] = useState<number>(0);

  // Indicators configuration (defaults: SMA 20, EMA 9, RSI enabled)
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    sma20: true,
    sma50: false,
    sma200: false,
    ema9: true,
    ema21: false,
    bollinger: false,
    vwap: false,
    rsi: true,
    macd: false,
  });

  // Drawings state
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('crosshair');
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);

  // Right sidebar state
  const [activeRightTab, setActiveRightTab] = useState<'watchlist' | 'orderbook' | 'trading' | 'ai' | 'news'>('watchlist');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Bottom panel state
  const [isBottomPanelExpanded, setIsBottomPanelExpanded] = useState(true);

  // Real-time live simulation engine
  const [isLive, setIsLive] = useState(true);
  const [tickSpeed, setTickSpeed] = useState<number>(1);
  const [flashSymbol, setFlashSymbol] = useState<string | null>(null);
  const [flashDirection, setFlashDirection] = useState<'up' | 'down' | null>(null);

  // Paper Trading state
  const [balance, setBalance] = useState<number>(100000.0);
  const [positions, setPositions] = useState<Position[]>([
    {
      id: 'pos_init_1',
      symbol: 'AAPL',
      type: 'BUY',
      shares: 25,
      entryPrice: 225.5,
      currentPrice: 228.45,
      pnl: 73.75,
      pnlPct: 1.31,
      timestamp: Date.now() - 3600000 * 4,
    },
  ]);
  const [tradeHistory, setTradeHistory] = useState<
    { id: string; symbol: string; type: 'BUY' | 'SELL'; shares: number; price: number; timestamp: number }[]
  >([
    {
      id: 'trade_1',
      symbol: 'AAPL',
      type: 'BUY',
      shares: 25,
      price: 225.5,
      timestamp: Date.now() - 3600000 * 4,
    },
  ]);

  // Candle data for current active symbol & timeframe
  const [candles, setCandles] = useState<Candle[]>(() =>
    generateHistoricalCandles(POPULAR_SYMBOLS[0], '15m', 180)
  );

  // Generate new historical candles when symbol or timeframe changes
  useEffect(() => {
    const newCandles = generateHistoricalCandles(currentSymbol, timeframe, 180);
    setCandles(newCandles);
  }, [currentSymbol.symbol, timeframe]);

  // Live Tick Simulation Loop
  useEffect(() => {
    if (!isLive) return;

    const intervalMs = Math.max(400, Math.floor(1500 / tickSpeed));
    const timer = setInterval(() => {
      // 1. Process tick for active symbol
      setCandles((prevCandles) => {
        const { updatedSymbol, updatedCandles, newTickPrice } = processLiveTick(
          currentSymbol,
          prevCandles,
          timeframe
        );

        const isTickUp = newTickPrice >= currentSymbol.currentPrice;
        setFlashSymbol(currentSymbol.symbol);
        setFlashDirection(isTickUp ? 'up' : 'down');
        setTimeout(() => setFlashSymbol(null), 500);

        // Update active symbol in state
        setCurrentSymbol(updatedSymbol);

        // Update active symbol in symbols list
        setSymbols((prevSymbols) =>
          prevSymbols.map((s) => (s.symbol === updatedSymbol.symbol ? updatedSymbol : s))
        );

        // Update active positions P&L for this symbol
        setPositions((prevPositions) =>
          prevPositions.map((p) => {
            if (p.symbol !== updatedSymbol.symbol) return p;
            const diff =
              p.type === 'BUY'
                ? newTickPrice - p.entryPrice
                : p.entryPrice - newTickPrice;
            const pnl = diff * p.shares;
            const pnlPct = (diff / p.entryPrice) * 100;
            return {
              ...p,
              currentPrice: newTickPrice,
              pnl: Number(pnl.toFixed(2)),
              pnlPct: Number(pnlPct.toFixed(2)),
            };
          })
        );

        return updatedCandles;
      });

      // 2. Randomly jitter another symbol in the watchlist to make entire market feel vibrant
      setSymbols((prevSymbols) => {
        const otherSymbols = prevSymbols.filter((s) => s.symbol !== currentSymbol.symbol);
        if (otherSymbols.length === 0) return prevSymbols;
        const randomTarget = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
        const deltaPct = (Math.random() - 0.49) * 0.0008;
        const newP = Number(
          (randomTarget.currentPrice * (1 + deltaPct)).toFixed(randomTarget.precision)
        );
        const chg = Number((newP - randomTarget.basePrice).toFixed(randomTarget.precision));
        const chgPct = Number(((chg / randomTarget.basePrice) * 100).toFixed(2));

        return prevSymbols.map((s) =>
          s.symbol === randomTarget.symbol
            ? { ...s, currentPrice: newP, change24h: chg, change24hPct: chgPct }
            : s
        );
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isLive, tickSpeed, currentSymbol, timeframe]);

  // Dynamic Level 2 Order Book for current symbol
  const orderBook: OrderBookData = useMemo(() => {
    return generateOrderBook(currentSymbol.currentPrice, currentSymbol.precision);
  }, [currentSymbol.currentPrice, currentSymbol.precision]);

  // Technical analysis consensus summary
  const technicalSummary: TechnicalSummary = useMemo(() => {
    return analyzeTechnicalSummary(candles);
  }, [candles]);

  // Handlers
  const handleSelectSymbol = (sym: SymbolInfo) => {
    // Sync current price from latest symbols list
    const found = symbols.find((s) => s.symbol === sym.symbol) || sym;
    setCurrentSymbol(found);
    setResetViewTrigger((prev) => prev + 1);
  };

  const handleToggleIndicator = (key: keyof IndicatorConfig) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddDrawing = (drawing: DrawingItem) => {
    setDrawings((prev) => [...prev, drawing]);
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    setActiveDrawingTool('crosshair');
  };

  const handleToggleSpeed = () => {
    setTickSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 5 : 1));
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handlePlaceOrder = (order: {
    symbol: string;
    type: 'BUY' | 'SELL';
    shares: number;
    price: number;
  }) => {
    const totalCost = order.shares * order.price;
    if (order.type === 'BUY') {
      setBalance((b) => b - totalCost);
    } else {
      setBalance((b) => b + totalCost);
    }

    const newPosition: Position = {
      id: `pos_${Date.now()}`,
      symbol: order.symbol,
      type: order.type,
      shares: order.shares,
      entryPrice: order.price,
      currentPrice: order.price,
      pnl: 0,
      pnlPct: 0,
      timestamp: Date.now(),
    };

    setPositions((prev) => [newPosition, ...prev]);
    setTradeHistory((prev) => [
      {
        id: `trade_${Date.now()}`,
        symbol: order.symbol,
        type: order.type,
        shares: order.shares,
        price: order.price,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleClosePosition = (id: string) => {
    const pos = positions.find((p) => p.id === id);
    if (!pos) return;

    // Realize P&L and return margin/funds
    const proceeds = pos.shares * pos.currentPrice;
    setBalance((b) => b + proceeds);
    setPositions((prev) => prev.filter((p) => p.id !== id));

    setTradeHistory((prev) => [
      {
        id: `trade_close_${Date.now()}`,
        symbol: pos.symbol,
        type: pos.type === 'BUY' ? 'SELL' : 'BUY',
        shares: pos.shares,
        price: pos.currentPrice,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden ${
        theme === 'dark' ? 'bg-[#131722] text-[#d1d4dc]' : 'bg-[#f0f3fa] text-[#1e293b]'
      }`}
    >
      {/* Top Navigation Bar */}
      <HeaderBar
        currentSymbol={currentSymbol}
        onOpenSearch={() => setIsSearchOpen(true)}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        chartType={chartType}
        onSelectChartType={setChartType}
        indicators={indicators}
        onOpenIndicators={() => setIsIndicatorsOpen(true)}
        isLive={isLive}
        onToggleLive={() => setIsLive((prev) => !prev)}
        tickSpeed={tickSpeed}
        onToggleSpeed={handleToggleSpeed}
        onResetView={() => setResetViewTrigger((prev) => prev + 1)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeRightTab={activeRightTab}
        onSelectRightTab={setActiveRightTab}
        isRightPanelOpen={isRightPanelOpen}
        onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
      />

      {/* Main Center Area: Left Toolbar + Chart Area + Right Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Drawing Toolbar */}
        <DrawingToolbar
          activeTool={activeDrawingTool}
          onSelectTool={setActiveDrawingTool}
          onClearDrawings={handleClearDrawings}
          drawingsCount={drawings.length}
        />

        {/* Central Chart Viewport */}
        <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
          <TradingChart
            symbol={currentSymbol}
            candles={candles}
            timeframe={timeframe}
            chartType={chartType}
            indicators={indicators}
            activeDrawingTool={activeDrawingTool}
            onFinishDrawing={setActiveDrawingTool}
            drawings={drawings}
            onAddDrawing={handleAddDrawing}
            theme={theme}
            resetViewTrigger={resetViewTrigger}
          />

          {/* Bottom Panel (Collapsible) */}
          <BottomPanel
            positions={positions}
            tradeHistory={tradeHistory}
            balance={balance}
            indicators={indicators}
            onToggleIndicator={handleToggleIndicator}
            onClosePosition={handleClosePosition}
            currentSymbol={currentSymbol}
            isExpanded={isBottomPanelExpanded}
            onToggleExpand={() => setIsBottomPanelExpanded((prev) => !prev)}
          />
        </main>

        {/* Right Sidebar */}
        {isRightPanelOpen && (
          <aside
            aria-label="Market Data & Tools"
            className="w-80 border-l border-[#2a2e39] bg-[#1e222d] flex flex-col h-full shrink-0 z-10"
          >
            {activeRightTab === 'watchlist' && (
              <WatchlistPanel
                currentSymbol={currentSymbol}
                onSelectSymbol={handleSelectSymbol}
                symbols={symbols}
                technicalSummary={technicalSummary}
                flashSymbol={flashSymbol}
                flashDirection={flashDirection}
              />
            )}
            {activeRightTab === 'orderbook' && (
              <OrderBookPanel symbol={currentSymbol} orderBook={orderBook} />
            )}
            {activeRightTab === 'trading' && (
              <PaperTradingPanel
                symbol={currentSymbol}
                balance={balance}
                positions={positions}
                onPlaceOrder={handlePlaceOrder}
                onClosePosition={handleClosePosition}
              />
            )}
            {activeRightTab === 'ai' && (
              <AIAnalystPanel
                symbol={currentSymbol}
                technicalSummary={technicalSummary}
                candles={candles}
              />
            )}
            {activeRightTab === 'news' && <NewsPanel symbol={currentSymbol} />}
          </aside>
        )}
      </div>

      {/* Symbol Search Modal */}
      <SymbolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={handleSelectSymbol}
        currentSymbol={currentSymbol.symbol}
      />

      {/* Indicators Configuration Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsOpen}
        onClose={() => setIsIndicatorsOpen(false)}
        indicators={indicators}
        onToggleIndicator={handleToggleIndicator}
      />
    </div>
  );
}
