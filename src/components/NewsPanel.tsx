import React from 'react';
import { Newspaper, Calendar, ExternalLink, Flame } from 'lucide-react';
import { SymbolInfo } from '../types/market';

interface NewsPanelProps {
  symbol: SymbolInfo;
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ symbol }) => {
  const newsItems = [
    {
      id: '1',
      source: 'Bloomberg Terminal',
      time: '12m ago',
      title: `${symbol.symbol} Options Flow: Heavy Call Buying Spotted at Next Expiration Strike`,
      sentiment: 'Bullish',
      impact: 'High',
    },
    {
      id: '2',
      source: 'Reuters Financial',
      time: '45m ago',
      title: 'Federal Reserve Signals Measured Interest Rate Trajectory in FOMC Minutes',
      sentiment: 'Neutral',
      impact: 'High',
    },
    {
      id: '3',
      source: 'Wall Street Journal',
      time: '2h ago',
      title: `${symbol.name} Institutional Accumulation Surges Ahead of Quarterly Earnings Release`,
      sentiment: 'Bullish',
      impact: 'Medium',
    },
    {
      id: '4',
      source: 'Financial Times',
      time: '4h ago',
      title: 'Global Semiconductor and Tech Supply Chains Report Record Order Backlog',
      sentiment: 'Bullish',
      impact: 'Medium',
    },
    {
      id: '5',
      source: 'MarketWatch',
      time: '6h ago',
      title: 'Yield Curve Steepens as US Treasury Benchmark 10-Year Stabilizes at 4.22%',
      sentiment: 'Neutral',
      impact: 'Low',
    },
  ];

  const calendarEvents = [
    { date: 'Oct 28', event: 'US Consumer Confidence Index', consensus: '102.5' },
    { date: 'Oct 30', event: 'US GDP Q3 Advance Estimate', consensus: '2.8%' },
    { date: 'Nov 01', event: 'Non-Farm Payrolls (NFP) & Unemployment', consensus: '140K' },
    { date: 'Nov 07', event: 'FOMC Federal Reserve Interest Rate Decision', consensus: '4.75%' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1e222d] text-[#d1d4dc] select-none text-xs">
      <div className="p-3 border-b border-[#2a2e39] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Newspaper className="w-4 h-4 text-[#2962ff]" />
          <span className="font-bold text-sm text-white">Market News & Macro</span>
        </div>
        <span className="text-[10px] text-[#089981] bg-[#089981]/15 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
          <Flame className="w-3 h-3" /> Live Wire
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/50">
        {/* Headlines */}
        <div className="p-3 space-y-3">
          <span className="text-[11px] font-bold text-white block">Real-Time Headlines</span>
          {newsItems.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-lg bg-[#131722] hover:bg-[#2a2e39]/50 border border-[#2a2e39]/60 cursor-pointer transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-[#787b86]">{item.source}</span>
                <span className="text-[#787b86]">{item.time}</span>
              </div>
              <p className="text-xs font-medium text-[#d1d4dc] leading-snug hover:text-white">
                {item.title}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    item.sentiment === 'Bullish'
                      ? 'text-[#089981] bg-[#089981]/10'
                      : 'text-[#787b86] bg-[#2a2e39]'
                  }`}
                >
                  {item.sentiment}
                </span>
                <span className="text-[10px] text-[#787b86]">Impact: {item.impact}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Economic Calendar Section */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-white font-bold text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-[#2962ff]" />
            <span>Upcoming Economic Catalysts</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            {calendarEvents.map((ev, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded bg-[#131722] border border-[#2a2e39]/60"
              >
                <div>
                  <span className="text-[#2962ff] font-bold text-[10px] mr-2 block sm:inline">
                    {ev.date}
                  </span>
                  <span className="text-[#d1d4dc] font-sans text-xs">{ev.event}</span>
                </div>
                <div className="text-right text-[10px] text-[#787b86]">
                  Est: <span className="text-white font-semibold">{ev.consensus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
