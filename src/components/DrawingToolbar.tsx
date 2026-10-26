import React from 'react';
import {
  Crosshair,
  MousePointer,
  Minus,
  TrendingUp,
  Percent,
  Ruler,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react';
import { DrawingToolType } from '../types/market';

interface DrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  onClearDrawings: () => void;
  drawingsCount: number;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  onClearDrawings,
  drawingsCount,
}) => {
  const tools: {
    id: DrawingToolType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    hint: string;
  }[] = [
    {
      id: 'crosshair',
      label: 'Crosshair',
      icon: Crosshair,
      hint: 'Inspect prices & time on crosshair',
    },
    {
      id: 'cursor',
      label: 'Arrow Pointer',
      icon: MousePointer,
      hint: 'Standard pointer',
    },
    {
      id: 'trendline',
      label: 'Trendline',
      icon: TrendingUp,
      hint: 'Click two points to draw a trendline',
    },
    {
      id: 'horizontal',
      label: 'Horizontal Ray / Level',
      icon: Minus,
      hint: 'Click to place horizontal support/resistance line',
    },
    {
      id: 'fibonacci',
      label: 'Fibonacci Retracement',
      icon: Percent,
      hint: 'Click swing low and swing high to project Fib ratios',
    },
    {
      id: 'longPosition',
      label: 'Long Position R:R',
      icon: ArrowUpRight,
      hint: 'Click entry point to plot Long risk/reward box',
    },
    {
      id: 'shortPosition',
      label: 'Short Position R:R',
      icon: ArrowDownRight,
      hint: 'Click entry point to plot Short risk/reward box',
    },
    {
      id: 'measure',
      label: 'Measurement Ruler',
      icon: Ruler,
      hint: 'Click start and drag to measure bars and % change',
    },
  ];

  return (
    <aside
      aria-label="Drawing and Chart Tools"
      className="w-12 bg-[#1e222d] border-r border-[#2a2e39] flex flex-col items-center py-2 shrink-0 z-20 select-none"
    >
      <div className="flex flex-col items-center gap-1 w-full px-1">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;

          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              title={`${t.label} - ${t.hint}`}
              aria-label={t.label}
              className={`w-9 h-9 rounded flex items-center justify-center transition-colors relative group ${
                isActive
                  ? 'bg-[#2962ff] text-white shadow-xs'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
              }`}
            >
              <Icon className="w-4 h-4" />

              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#131722] text-[#d1d4dc] text-[11px] rounded shadow-lg border border-[#2a2e39] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <span className="font-semibold block">{t.label}</span>
                <span className="text-[#787b86] text-[10px]">{t.hint}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-8 h-[1px] bg-[#2a2e39] my-2" />

      {/* Clear Drawings Button */}
      <div className="flex flex-col items-center gap-1 w-full px-1">
        <button
          onClick={onClearDrawings}
          disabled={drawingsCount === 0}
          title={
            drawingsCount > 0
              ? `Clear ${drawingsCount} chart drawing${drawingsCount > 1 ? 's' : ''}`
              : 'No drawings on chart'
          }
          aria-label="Clear drawings"
          className={`w-9 h-9 rounded flex items-center justify-center transition-colors relative group ${
            drawingsCount > 0
              ? 'text-[#f23645] hover:bg-[#f23645]/10'
              : 'text-[#787b86]/40 cursor-not-allowed'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {drawingsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#2962ff] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {drawingsCount}
            </span>
          )}
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#131722] text-[#d1d4dc] text-[11px] rounded shadow-lg border border-[#2a2e39] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
            Clear all drawings ({drawingsCount})
          </div>
        </button>
      </div>

      <div className="mt-auto px-1 flex flex-col items-center">
        <div
          title="Scroll to zoom in/out, Drag chart canvas to pan time. Drag price scale on right to stretch Y-axis."
          className="w-9 h-9 rounded flex items-center justify-center text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] transition-colors relative group cursor-help"
        >
          <HelpCircle className="w-4 h-4" />
          <div className="absolute left-full bottom-0 ml-2 p-2.5 bg-[#131722] text-[#d1d4dc] text-xs rounded-lg shadow-xl border border-[#2a2e39] w-56 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <span className="font-semibold block text-[#2962ff] mb-1">
              TradingView Controls
            </span>
            <ul className="text-[11px] text-[#787b86] space-y-1">
              <li>• Mouse Wheel: Zoom in / out</li>
              <li>• Click & Drag Canvas: Pan horizontally</li>
              <li>• Drag Y-Axis: Stretch or compress price</li>
              <li>• Select tool & click on chart to draw</li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
};
