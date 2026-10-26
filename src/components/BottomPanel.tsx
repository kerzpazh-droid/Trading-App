import React, { useState } from 'react';
import {
  Briefcase,
  History,
  TrendingUp,
  Sliders,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';
import { Position, IndicatorConfig, SymbolInfo } from '../types/market';

interface BottomPanelProps {
  positions: Position[];
  tradeHistory: {
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    shares: number;
    price: number;
    timestamp: number;
  }[];
  balance: number;
  indicators: IndicatorConfig;
  onToggleIndicator: (key: keyof IndicatorConfig) => void;
  onClosePosition: (id: string) => void;
  currentSymbol: SymbolInfo;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  positions,
  tradeHistory,
  balance,
  indicators,
  onToggleIndicator,
  onClosePosition,
  currentSymbol,
  isExpanded,
  onToggleExpand,
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'strategy' | 'indicators'>(
    'positions'
  );

  const totalPositionsValue = positions.reduce(
    (sum, pos) => sum + pos.shares * pos.currentPrice,
    0
  );
  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalEquity = balance + totalPositionsValue;
  const isNetProfit = totalUnrealizedPnL >= 0;

  return (
    <div
      className={`border-t border-[#2a2e39] bg-[#1e222d] text-[#d1d4dc] flex flex-col shrink-0 select-none transition-all duration-200 ${
        isExpanded ? 'h-52' : 'h-8'
      }`}
    >
      {/* Tab Navigation Header Bar */}
      <div className="h-8 bg-[#131722] border-b border-[#2a2e39] flex items-center justify-between px-3 text-xs shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('positions');
              if (!isExpanded) onToggleExpand();
            }}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'positions' && isExpanded
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Positions ({positions.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              if (!isExpanded) onToggleExpand();
            }}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'history' && isExpanded
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Order History ({tradeHistory.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('strategy');
              if (!isExpanded) onToggleExpand();
            }}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'strategy' && isExpanded
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Account Performance</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('indicators');
              if (!isExpanded) onToggleExpand();
            }}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'indicators' && isExpanded
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Active Indicators</span>
          </button>
        </div>

        {/* Quick Portfolio Stats and Expand/Collapse Button */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-[#787b86]">
              Equity: <strong className="text-white">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </span>
            <span className="text-[#787b86]">
              Unrealized P&L:{' '}
              <strong className={isNetProfit ? 'text-[#089981]' : 'text-[#f23645]'}>
                {isNetProfit ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
              </strong>
            </span>
          </div>

          <button
            onClick={onToggleExpand}
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#2a2e39] transition-colors"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Viewport */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto bg-[#1e222d] text-xs">
          {activeTab === 'positions' && (
            <div className="w-full">
              {positions.length === 0 ? (
                <div className="py-8 text-center text-[#787b86] text-xs">
                  No open positions. Use the Paper Trading tab on the right to execute market or limit orders.
                </div>
              ) : (
                <table className="w-full text-left font-mono text-[11px] divide-y divide-[#2a2e39]">
                  <thead className="bg-[#131722] text-[#787b86] uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-1.5 px-3">Symbol</th>
                      <th className="py-1.5 px-3">Side</th>
                      <th className="py-1.5 px-3 text-right">Shares</th>
                      <th className="py-1.5 px-3 text-right">Avg Entry</th>
                      <th className="py-1.5 px-3 text-right">Current Price</th>
                      <th className="py-1.5 px-3 text-right">Unrealized P&L</th>
                      <th className="py-1.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]/50">
                    {positions.map((pos) => {
                      const isProfit = pos.pnl >= 0;
                      return (
                        <tr key={pos.id} className="hover:bg-[#2a2e39]/30 transition-colors">
                          <td className="py-2 px-3 font-bold text-white">{pos.symbol}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                pos.type === 'BUY'
                                  ? 'bg-[#089981]/15 text-[#089981]'
                                  : 'bg-[#f23645]/15 text-[#f23645]'
                              }`}
                            >
                              {pos.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-white tabular-nums">
                            {pos.shares}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            ${pos.entryPrice.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-white tabular-nums">
                            ${pos.currentPrice.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            <span className={`font-semibold ${isProfit ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                              {isProfit ? '+' : ''}${pos.pnl.toFixed(2)} ({isProfit ? '+' : ''}
                              {pos.pnlPct.toFixed(2)}%)
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => onClosePosition(pos.id)}
                              className="px-2.5 py-1 rounded bg-[#2a2e39] hover:bg-[#f23645] hover:text-white text-[#d1d4dc] text-[10px] font-sans font-medium transition-colors"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="w-full">
              {tradeHistory.length === 0 ? (
                <div className="py-8 text-center text-[#787b86]">No executed trade orders yet.</div>
              ) : (
                <table className="w-full text-left font-mono text-[11px] divide-y divide-[#2a2e39]">
                  <thead className="bg-[#131722] text-[#787b86] uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-1.5 px-3">Time</th>
                      <th className="py-1.5 px-3">Symbol</th>
                      <th className="py-1.5 px-3">Type</th>
                      <th className="py-1.5 px-3 text-right">Shares</th>
                      <th className="py-1.5 px-3 text-right">Execution Price</th>
                      <th className="py-1.5 px-3 text-right">Total Transacted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]/50">
                    {tradeHistory.map((order) => {
                      const total = order.shares * order.price;
                      return (
                        <tr key={order.id} className="hover:bg-[#2a2e39]/30">
                          <td className="py-2 px-3 text-[#787b86]">
                            {new Date(order.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3 font-bold text-white">{order.symbol}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                order.type === 'BUY'
                                  ? 'bg-[#089981]/15 text-[#089981]'
                                  : 'bg-[#f23645]/15 text-[#f23645]'
                              }`}
                            >
                              {order.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-white">{order.shares}</td>
                          <td className="py-2 px-3 text-right">${order.price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-white font-semibold">
                            ${total.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#131722] border border-[#2a2e39]">
                <span className="text-[#787b86] text-[10px] uppercase font-mono block">
                  Total Paper Equity
                </span>
                <span className="font-mono text-base font-bold text-white">
                  ${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#131722] border border-[#2a2e39]">
                <span className="text-[#787b86] text-[10px] uppercase font-mono block">
                  Cash Balance
                </span>
                <span className="font-mono text-base font-bold text-white">
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#131722] border border-[#2a2e39]">
                <span className="text-[#787b86] text-[10px] uppercase font-mono block">
                  Total Orders Placed
                </span>
                <span className="font-mono text-base font-bold text-[#2962ff]">
                  {tradeHistory.length}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#131722] border border-[#2a2e39]">
                <span className="text-[#787b86] text-[10px] uppercase font-mono block">
                  Total Positions Value
                </span>
                <span className="font-mono text-base font-bold text-white">
                  ${totalPositionsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'indicators' && (
            <div className="p-4 flex flex-wrap gap-2">
              {(Object.keys(indicators) as (keyof IndicatorConfig)[]).map((key) => {
                const isEnabled = indicators[key];
                return (
                  <button
                    key={key}
                    onClick={() => onToggleIndicator(key)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                      isEnabled
                        ? 'bg-[#2962ff]/15 border-[#2962ff] text-white'
                        : 'bg-[#131722] border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isEnabled ? 'bg-[#2962ff]' : 'bg-[#787b86]'
                      }`}
                    />
                    <span className="uppercase">{key}</span>
                    <span className="text-[10px] text-[#787b86]">
                      {isEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
