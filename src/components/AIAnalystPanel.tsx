import React, { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Target, Shield, RefreshCw } from 'lucide-react';
import { SymbolInfo, TechnicalSummary, Candle } from '../types/market';

interface AIAnalystPanelProps {
  symbol: SymbolInfo;
  technicalSummary: TechnicalSummary;
  candles: Candle[];
}

export const AIAnalystPanel: React.FC<AIAnalystPanelProps> = ({
  symbol,
  technicalSummary,
  candles,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const isBullish = technicalSummary.score > 15;
  const isBearish = technicalSummary.score < -15;

  interface ThesisData {
    direction: string;
    confidence: number;
    rsiSummary: string;
    macdSummary: string;
    trendSummary: string;
    entry: string;
    target: string;
    stop: string;
    rr: string;
  }

  const [thesisData, setThesisData] = useState<ThesisData | null>(null);

  const handleGenerateThesis = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const direction = isBullish ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';
      const stopLevel = isBullish
        ? technicalSummary.supportLevels[0] || (symbol.currentPrice * 0.98).toFixed(2)
        : technicalSummary.resistanceLevels[0] || (symbol.currentPrice * 1.02).toFixed(2);
      const targetLevel = isBullish
        ? technicalSummary.resistanceLevels[1] || (symbol.currentPrice * 1.05).toFixed(2)
        : technicalSummary.supportLevels[0] || (symbol.currentPrice * 0.95).toFixed(2);

      setThesisData({
        direction,
        confidence: Math.abs(technicalSummary.score),
        rsiSummary: `RSI is at ${technicalSummary.rsiValue} (${technicalSummary.rsiStatus})`,
        macdSummary: `MACD histogram indicates ${technicalSummary.macdSignal.toLowerCase()} momentum continuation`,
        trendSummary: `Price maintaining ${technicalSummary.trend.toLowerCase()} structure relative to key MAs`,
        entry: `$${symbol.currentPrice.toFixed(symbol.precision)}`,
        target: `$${targetLevel}`,
        stop: `$${stopLevel}`,
        rr: '2.2 : 1',
      });
      setIsGenerating(false);
    }, 400);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e222d] text-[#d1d4dc] select-none text-xs">
      {/* Header */}
      <div className="p-3 border-b border-[#2a2e39] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2962ff]" />
          <span className="font-bold text-sm text-white">AI Technical Analyst</span>
        </div>
        <button
          onClick={handleGenerateThesis}
          disabled={isGenerating}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#2962ff] hover:bg-[#1e53e5] text-white rounded text-[11px] font-medium transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>Analyze</span>
        </button>
      </div>

      <div className="p-3 space-y-3.5 flex-1 overflow-y-auto">
        {/* Consensus Meter */}
        <div className="p-3 bg-[#131722] rounded-lg border border-[#2a2e39] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#787b86] text-[11px]">Consensus Technical Rating</span>
            <span
              className={`font-bold text-xs uppercase px-2 py-0.5 rounded ${
                isBullish
                  ? 'bg-[#089981]/15 text-[#089981]'
                  : isBearish
                  ? 'bg-[#f23645]/15 text-[#f23645]'
                  : 'bg-[#787b86]/15 text-[#787b86]'
              }`}
            >
              {technicalSummary.rating}
            </span>
          </div>

          {/* Score Slider Bar */}
          <div className="relative pt-1">
            <div className="w-full h-2 bg-[#2a2e39] rounded-full overflow-hidden flex">
              <div className="w-1/2 bg-linear-to-r from-[#f23645] to-[#787b86]" />
              <div className="w-1/2 bg-linear-to-r from-[#787b86] to-[#089981]" />
            </div>
            {/* Position Marker */}
            <div
              className="w-3 h-3 bg-white border-2 border-[#131722] rounded-full absolute top-0.5 -ml-1.5 shadow-md transition-all duration-300"
              style={{ left: `${Math.max(5, Math.min(95, (technicalSummary.score + 100) / 2))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#787b86] font-mono">
            <span>Strong Sell</span>
            <span>Neutral (0)</span>
            <span>Strong Buy</span>
          </div>
        </div>

        {/* Indicator Multi-Factor Breakdown */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-white block">Indicator Confluence</span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
              <span className="text-[#787b86] block text-[10px]">RSI (14)</span>
              <span className="font-mono font-semibold text-white">
                {technicalSummary.rsiValue}
              </span>
              <span className="text-[10px] text-[#787b86] block mt-0.5">
                {technicalSummary.rsiStatus}
              </span>
            </div>

            <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
              <span className="text-[#787b86] block text-[10px]">MACD Momentum</span>
              <span
                className={`font-semibold ${
                  technicalSummary.macdSignal === 'Bullish' ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {technicalSummary.macdSignal}
              </span>
              <span className="text-[10px] text-[#787b86] block mt-0.5">Histogram bias</span>
            </div>

            <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
              <span className="text-[#787b86] block text-[10px]">Trend Filter (MA)</span>
              <span className="font-semibold text-white">{technicalSummary.trend}</span>
              <span className="text-[10px] text-[#787b86] block mt-0.5">SMA 20 vs 50</span>
            </div>

            <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
              <span className="text-[#787b86] block text-[10px]">Composite Score</span>
              <span className="font-mono font-semibold text-[#2962ff]">
                {technicalSummary.score > 0 ? `+${technicalSummary.score}` : technicalSummary.score}
              </span>
              <span className="text-[10px] text-[#787b86] block mt-0.5">Scale -100 to 100</span>
            </div>
          </div>
        </div>

        {/* Pivot Levels */}
        <div className="p-2.5 bg-[#131722] rounded-lg border border-[#2a2e39] space-y-2 font-mono">
          <span className="text-[11px] font-sans font-bold text-white block">
            Key Institutional Pivot Zones
          </span>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-center text-[#f23645]">
              <span className="flex items-center gap-1 text-[10px]">
                <Shield className="w-3 h-3" /> Major Resistance
              </span>
              <span>${technicalSummary.resistanceLevels[1] ?? '---'}</span>
            </div>
            <div className="flex justify-between items-center text-[#ff9800]">
              <span className="flex items-center gap-1 text-[10px]">
                <Target className="w-3 h-3" /> Intermediate Pivot
              </span>
              <span>${technicalSummary.resistanceLevels[0] ?? '---'}</span>
            </div>
            <div className="flex justify-between items-center text-[#089981]">
              <span className="flex items-center gap-1 text-[10px]">
                <Shield className="w-3 h-3" /> Key Support
              </span>
              <span>${technicalSummary.supportLevels[0] ?? '---'}</span>
            </div>
          </div>
        </div>

        {/* Detailed AI Report */}
        {thesisData && (
          <div className="p-3 bg-[#131722] rounded-lg border border-[#2962ff]/40 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">AI Quantitative Thesis</span>
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  thesisData.direction === 'BULLISH'
                    ? 'bg-[#089981]/20 text-[#089981]'
                    : thesisData.direction === 'BEARISH'
                    ? 'bg-[#f23645]/20 text-[#f23645]'
                    : 'bg-[#787b86]/20 text-[#787b86]'
                }`}
              >
                {thesisData.direction} ({thesisData.confidence}%)
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-[#787b86]">
              <div className="flex items-start gap-1.5">
                <span className="text-[#2962ff] font-bold">•</span>
                <span>{thesisData.rsiSummary}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[#2962ff] font-bold">•</span>
                <span>{thesisData.macdSummary}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[#2962ff] font-bold">•</span>
                <span>{thesisData.trendSummary}</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-[#2a2e39] grid grid-cols-2 gap-1.5 font-mono text-[11px]">
              <div className="bg-[#1e222d] p-1.5 rounded">
                <span className="text-[10px] text-[#787b86] block">Entry Level</span>
                <span className="text-white font-semibold">{thesisData.entry}</span>
              </div>
              <div className="bg-[#1e222d] p-1.5 rounded">
                <span className="text-[10px] text-[#787b86] block">Target Profit</span>
                <span className="text-[#089981] font-semibold">{thesisData.target}</span>
              </div>
              <div className="bg-[#1e222d] p-1.5 rounded">
                <span className="text-[10px] text-[#787b86] block">Invalidation Stop</span>
                <span className="text-[#f23645] font-semibold">{thesisData.stop}</span>
              </div>
              <div className="bg-[#1e222d] p-1.5 rounded">
                <span className="text-[10px] text-[#787b86] block">Risk / Reward</span>
                <span className="text-[#2962ff] font-semibold">{thesisData.rr}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
