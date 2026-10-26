import React from 'react';
import { X, Sliders, Check, Activity, BarChart2 } from 'lucide-react';
import { IndicatorConfig } from '../types/market';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorConfig;
  onToggleIndicator: (key: keyof IndicatorConfig) => void;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onToggleIndicator,
}) => {
  if (!isOpen) return null;

  const indicatorList: {
    key: keyof IndicatorConfig;
    name: string;
    category: 'Overlay' | 'Oscillator';
    description: string;
    color: string;
  }[] = [
    {
      key: 'sma20',
      name: 'SMA 20 (Simple Moving Average)',
      category: 'Overlay',
      description: 'Short-term trend direction and dynamic support/resistance.',
      color: '#e0a612',
    },
    {
      key: 'sma50',
      name: 'SMA 50 (Simple Moving Average)',
      category: 'Overlay',
      description: 'Intermediate trend filter used widely by institutional desks.',
      color: '#2962ff',
    },
    {
      key: 'sma200',
      name: 'SMA 200 (Simple Moving Average)',
      category: 'Overlay',
      description: 'Macro bull/bear baseline. Golden and Death Cross benchmark.',
      color: '#ab47bc',
    },
    {
      key: 'ema9',
      name: 'EMA 9 (Exponential Moving Average)',
      category: 'Overlay',
      description: 'Ultra-fast momentum guide for momentum breakout traders.',
      color: '#00bcd4',
    },
    {
      key: 'ema21',
      name: 'EMA 21 (Exponential Moving Average)',
      category: 'Overlay',
      description: 'Trend pullback bounce zone for swing positioning.',
      color: '#ff9800',
    },
    {
      key: 'bollinger',
      name: 'Bollinger Bands (20, 2)',
      category: 'Overlay',
      description: 'Volatility envelope showing expansions, squeezes, and extremes.',
      color: '#089981',
    },
    {
      key: 'vwap',
      name: 'VWAP (Volume Weighted Avg Price)',
      category: 'Overlay',
      description: 'Benchmark intraday value level weighted by volume transacted.',
      color: '#e91e63',
    },
    {
      key: 'rsi',
      name: 'RSI (Relative Strength Index 14)',
      category: 'Oscillator',
      description: 'Oscillator measuring speed and change of price (0-100).',
      color: '#9c27b0',
    },
    {
      key: 'macd',
      name: 'MACD (12, 26, 9)',
      category: 'Oscillator',
      description: 'Moving Average Convergence Divergence trend & momentum histogram.',
      color: '#2962ff',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-lg bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#2a2e39] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2962ff]" />
            <h2 className="font-semibold text-sm text-[#d1d4dc]">Technical Indicators & Overlays</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close indicators dialog"
            className="p-1 rounded text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Indicators */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {indicatorList.map((item) => {
            const isEnabled = indicators[item.key];
            return (
              <div
                key={item.key}
                onClick={() => onToggleIndicator(item.key)}
                className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  isEnabled
                    ? 'bg-[#2962ff]/10 border-[#2962ff]/40 shadow-xs'
                    : 'bg-[#131722]/60 border-[#2a2e39] hover:bg-[#2a2e39]/50 hover:border-[#363a45]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 border border-black/20"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#d1d4dc]">
                        {item.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#2a2e39] text-[#787b86]">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#787b86] mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isEnabled
                      ? 'bg-[#2962ff] text-white'
                      : 'border border-[#787b86] text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#131722] border-t border-[#2a2e39] flex items-center justify-between text-xs text-[#787b86]">
          <span>
            {Object.values(indicators).filter(Boolean).length} indicators active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2962ff] hover:bg-[#1e53e5] text-white font-medium rounded text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
