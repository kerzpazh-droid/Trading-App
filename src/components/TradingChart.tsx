import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Candle,
  ChartType,
  Timeframe,
  IndicatorConfig,
  DrawingToolType,
  DrawingItem,
  SymbolInfo,
} from '../types/market';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateVWAP,
  convertToHeikinAshi,
  calculateFibonacciLevels,
} from '../utils/technicalIndicators';

interface TradingChartProps {
  symbol: SymbolInfo;
  candles: Candle[];
  timeframe: Timeframe;
  chartType: ChartType;
  indicators: IndicatorConfig;
  activeDrawingTool: DrawingToolType;
  onFinishDrawing: (tool: DrawingToolType) => void;
  drawings: DrawingItem[];
  onAddDrawing: (drawing: DrawingItem) => void;
  theme: 'dark' | 'light';
  resetViewTrigger: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  candles,
  timeframe,
  chartType,
  indicators,
  activeDrawingTool,
  onFinishDrawing,
  drawings,
  onAddDrawing,
  theme,
  resetViewTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport / zoom / pan state
  // candleWidth in pixels
  const [candleWidth, setCandleWidth] = useState<number>(9);
  // visibleOffset: index of the rightmost visible candle from end of array (0 means latest candle is rightmost)
  const [visibleOffset, setVisibleOffset] = useState<number>(5);
  // priceScaleFactor: for dragging the Y-axis to stretch/compress
  const [priceScaleFactor, setPriceScaleFactor] = useState<number>(1.0);

  // Crosshair state
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandleIndex, setHoveredCandleIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDraggingPriceScale, setIsDraggingPriceScale] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; offset: number; scale: number }>({
    x: 0,
    y: 0,
    offset: 0,
    scale: 1,
  });

  // Active drawing in-progress
  const [currentDrawing, setCurrentDrawing] = useState<DrawingItem | null>(null);

  // Reset view on trigger
  useEffect(() => {
    setCandleWidth(9);
    setVisibleOffset(5);
    setPriceScaleFactor(1.0);
  }, [resetViewTrigger, symbol.symbol, timeframe]);

  // Transform candles if Heikin-Ashi is selected
  const displayCandles = useMemo(() => {
    if (chartType === 'heikin-ashi') {
      return convertToHeikinAshi(candles);
    }
    return candles;
  }, [candles, chartType]);

  // Indicator Calculations
  const closes = useMemo(() => displayCandles.map((c) => c.close), [displayCandles]);
  const sma20 = useMemo(() => (indicators.sma20 ? calculateSMA(closes, 20) : []), [closes, indicators.sma20]);
  const sma50 = useMemo(() => (indicators.sma50 ? calculateSMA(closes, 50) : []), [closes, indicators.sma50]);
  const sma200 = useMemo(() => (indicators.sma200 ? calculateSMA(closes, 200) : []), [closes, indicators.sma200]);
  const ema9 = useMemo(() => (indicators.ema9 ? calculateEMA(closes, 9) : []), [closes, indicators.ema9]);
  const ema21 = useMemo(() => (indicators.ema21 ? calculateEMA(closes, 21) : []), [closes, indicators.ema21]);
  const bollinger = useMemo(
    () => (indicators.bollinger ? calculateBollingerBands(closes, 20, 2) : { upper: [], middle: [], lower: [] }),
    [closes, indicators.bollinger]
  );
  const vwap = useMemo(() => (indicators.vwap ? calculateVWAP(displayCandles) : []), [displayCandles, indicators.vwap]);
  const rsi = useMemo(() => (indicators.rsi ? calculateRSI(closes, 14) : []), [closes, indicators.rsi]);
  const macd = useMemo(
    () => (indicators.macd ? calculateMACD(closes, 12, 26, 9) : { macd: [], signal: [], histogram: [] }),
    [closes, indicators.macd]
  );

  // Coordinate Conversion Helpers
  // Price to Y pixel coordinate
  const priceToY = useCallback(
    (price: number, minP: number, maxP: number, top: number, height: number) => {
      if (maxP === minP) return top + height / 2;
      return top + height - ((price - minP) / (maxP - minP)) * height;
    },
    []
  );

  // Y pixel coordinate to price
  const yToPrice = useCallback(
    (y: number, minP: number, maxP: number, top: number, height: number) => {
      if (height === 0) return minP;
      return maxP - ((y - top) / height) * (maxP - minP);
    },
    []
  );

  // Time to X pixel coordinate
  const indexToX = useCallback(
    (index: number, startCandleIndex: number, chartLeft: number, cWidth: number) => {
      return chartLeft + (index - startCandleIndex) * cWidth + cWidth / 2;
    },
    []
  );

  // X pixel to Candle Index
  const xToIndex = useCallback(
    (x: number, startCandleIndex: number, chartLeft: number, cWidth: number) => {
      return Math.floor((x - chartLeft) / cWidth) + startCandleIndex;
    },
    []
  );

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle HiDPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Color definitions based on theme
    const isDark = theme === 'dark';
    const bg = isDark ? '#131722' : '#ffffff';
    const gridLine = isDark ? '#1e222d' : '#f0f3fa';
    const axisBg = isDark ? '#1e222d' : '#f8f9fd';
    const axisText = isDark ? '#787b86' : '#64748b';
    const border = isDark ? '#2a2e39' : '#e2e8f0';
    const green = '#089981';
    const red = '#f23645';

    // Layout configuration
    const yAxisWidth = 65;
    const xAxisHeight = 26;
    const chartLeft = 0;
    const chartRight = width - yAxisWidth;

    // Calculate sub-panel heights
    const subPanelsCount = (indicators.rsi ? 1 : 0) + (indicators.macd ? 1 : 0);
    const subPanelHeight = subPanelsCount > 0 ? Math.min(110, (height - 100) / (subPanelsCount + 2.5)) : 0;
    const totalSubPanelsHeight = subPanelsCount * subPanelHeight;

    const mainChartTop = 10;
    const mainChartHeight = height - xAxisHeight - totalSubPanelsHeight - mainChartTop;

    // Clear canvas
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Number of candles that fit in viewport
    const chartWidth = chartRight - chartLeft;
    const visibleCount = Math.max(10, Math.floor(chartWidth / candleWidth));

    // Calculate slice of visible candles
    const totalCandles = displayCandles.length;
    const endIndex = Math.min(totalCandles, totalCandles - visibleOffset);
    const startIndex = Math.max(0, endIndex - visibleCount);
    const visibleSlice = displayCandles.slice(startIndex, endIndex);

    if (visibleSlice.length === 0) {
      ctx.restore();
      return;
    }

    // Min and Max price in visible slice
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    for (const c of visibleSlice) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    }

    // Add vertical padding to price
    const priceRange = maxPrice - minPrice || 1;
    const basePadding = priceRange * 0.08;
    const midPrice = (minPrice + maxPrice) / 2;
    const scaledRange = (priceRange / 2 + basePadding) / priceScaleFactor;

    const effectiveMinPrice = midPrice - scaledRange;
    const effectiveMaxPrice = midPrice + scaledRange;

    // Draw Grid Lines (Horizontal Price Lines)
    const priceSteps = 6;
    const priceStepVal = (effectiveMaxPrice - effectiveMinPrice) / priceSteps;

    ctx.strokeStyle = gridLine;
    ctx.lineWidth = 1;

    for (let i = 0; i <= priceSteps; i++) {
      const p = effectiveMinPrice + i * priceStepVal;
      const y = priceToY(p, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);

      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();

      // Price label on right axis
      ctx.fillStyle = axisText;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(symbol.precision), chartRight + 6, y + 3);
    }

    // Draw Vertical Time Grid Lines
    const timeStepInterval = Math.max(1, Math.floor(visibleCount / 7));
    for (let i = startIndex; i < endIndex; i += timeStepInterval) {
      const x = indexToX(i, startIndex, chartLeft, candleWidth);
      ctx.beginPath();
      ctx.moveTo(x, mainChartTop);
      ctx.lineTo(x, height - xAxisHeight);
      ctx.stroke();

      // Date/Time label on bottom axis
      const c = displayCandles[i];
      if (c) {
        const date = new Date(c.time * 1000);
        let label = '';
        if (timeframe === '1m' || timeframe === '5m' || timeframe === '15m') {
          label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (timeframe === '1h' || timeframe === '4h') {
          label = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
        } else {
          label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        ctx.fillStyle = axisText;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, height - 8);
      }
    }

    // Draw Volume Bars on Bottom of Main Chart
    const volumeHeight = mainChartHeight * 0.18;
    const volumeBottom = mainChartTop + mainChartHeight;

    for (let i = startIndex; i < endIndex; i++) {
      const c = displayCandles[i];
      const x = indexToX(i, startIndex, chartLeft, candleWidth);
      const isUp = c.close >= c.open;
      const vHeight = maxVolume > 0 ? (c.volume / maxVolume) * volumeHeight : 0;
      const y = volumeBottom - vHeight;

      ctx.fillStyle = isUp ? (isDark ? 'rgba(8, 153, 129, 0.25)' : 'rgba(8, 153, 129, 0.35)') : (isDark ? 'rgba(242, 54, 69, 0.25)' : 'rgba(242, 54, 69, 0.35)');
      ctx.fillRect(x - candleWidth * 0.4, y, candleWidth * 0.8, vHeight);
    }

    // Draw Candlesticks / Line / Area / Bars
    if (chartType === 'line' || chartType === 'area') {
      ctx.beginPath();
      let firstX = 0;
      let firstY = 0;
      for (let i = startIndex; i < endIndex; i++) {
        const c = displayCandles[i];
        const x = indexToX(i, startIndex, chartLeft, candleWidth);
        const y = priceToY(c.close, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);

        if (i === startIndex) {
          ctx.moveTo(x, y);
          firstX = x;
          firstY = y;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (chartType === 'area') {
        const lastCandleX = indexToX(endIndex - 1, startIndex, chartLeft, candleWidth);
        ctx.lineTo(lastCandleX, mainChartTop + mainChartHeight);
        ctx.lineTo(firstX, mainChartTop + mainChartHeight);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, mainChartTop, 0, mainChartTop + mainChartHeight);
        grad.addColorStop(0, 'rgba(41, 98, 255, 0.35)');
        grad.addColorStop(1, 'rgba(41, 98, 255, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }
    } else {
      // Draw Candlesticks or Bars
      for (let i = startIndex; i < endIndex; i++) {
        const c = displayCandles[i];
        const x = indexToX(i, startIndex, chartLeft, candleWidth);
        const isUp = c.close >= c.open;
        const color = isUp ? green : red;

        const openY = priceToY(c.open, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
        const closeY = priceToY(c.close, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
        const highY = priceToY(c.high, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
        const lowY = priceToY(c.low, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        if (chartType === 'bars') {
          // OHLC Bar
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, highY);
          ctx.lineTo(x, lowY);
          // Open tick on left
          ctx.moveTo(x, openY);
          ctx.lineTo(x - candleWidth * 0.4, openY);
          // Close tick on right
          ctx.moveTo(x, closeY);
          ctx.lineTo(x + candleWidth * 0.4, closeY);
          ctx.stroke();
        } else {
          // Candlestick / Hollow
          // Wick
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, highY);
          ctx.lineTo(x, lowY);
          ctx.stroke();

          // Body
          const bodyY = Math.min(openY, closeY);
          const bodyH = Math.max(1.5, Math.abs(closeY - openY));
          const bodyW = Math.max(2, candleWidth * 0.76);

          if (chartType === 'hollow' && isUp) {
            ctx.strokeRect(x - bodyW / 2, bodyY, bodyW, bodyH);
          } else {
            ctx.fillRect(x - bodyW / 2, bodyY, bodyW, bodyH);
          }
        }
      }
    }

    // Helper to draw indicator line
    const drawIndicatorLine = (values: (number | null)[], strokeColor: string, lineW: number = 1.5) => {
      ctx.beginPath();
      let hasStarted = false;

      for (let i = startIndex; i < endIndex; i++) {
        const val = values[i];
        if (val === null || val === undefined) continue;

        const x = indexToX(i, startIndex, chartLeft, candleWidth);
        const y = priceToY(val, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);

        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineW;
      ctx.stroke();
    };

    // Draw Overlays
    if (indicators.sma20 && sma20.length > 0) drawIndicatorLine(sma20, '#e0a612', 1.5);
    if (indicators.sma50 && sma50.length > 0) drawIndicatorLine(sma50, '#2962ff', 1.5);
    if (indicators.sma200 && sma200.length > 0) drawIndicatorLine(sma200, '#ab47bc', 2);
    if (indicators.ema9 && ema9.length > 0) drawIndicatorLine(ema9, '#00bcd4', 1.5);
    if (indicators.ema21 && ema21.length > 0) drawIndicatorLine(ema21, '#ff9800', 1.5);
    if (indicators.vwap && vwap.length > 0) drawIndicatorLine(vwap, '#e91e63', 1.5);

    // Draw Bollinger Bands (Upper, Middle, Lower + Channel fill)
    if (indicators.bollinger && bollinger.middle.length > 0) {
      drawIndicatorLine(bollinger.middle, '#787b86', 1);
      drawIndicatorLine(bollinger.upper, 'rgba(8, 153, 129, 0.8)', 1);
      drawIndicatorLine(bollinger.lower, 'rgba(242, 54, 69, 0.8)', 1);

      // Fill band channel
      ctx.beginPath();
      let started = false;
      for (let i = startIndex; i < endIndex; i++) {
        const u = bollinger.upper[i];
        if (u === null) continue;
        const x = indexToX(i, startIndex, chartLeft, candleWidth);
        const y = priceToY(u, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      for (let i = endIndex - 1; i >= startIndex; i--) {
        const l = bollinger.lower[i];
        if (l === null) continue;
        const x = indexToX(i, startIndex, chartLeft, candleWidth);
        const y = priceToY(l, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(41, 98, 255, 0.05)';
      ctx.fill();
    }

    // Draw Drawings (Trendlines, Horizontals, Fib, Positions, Measure)
    const allDrawings = [...drawings];
    if (currentDrawing) allDrawings.push(currentDrawing);

    allDrawings.forEach((d) => {
      if (d.points.length === 0) return;

      if (d.type === 'horizontal') {
        const p = d.points[0].price;
        const y = priceToY(p, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);

        ctx.strokeStyle = '#2962ff';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(chartLeft, y);
        ctx.lineTo(chartRight, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Tag on right axis
        ctx.fillStyle = '#2962ff';
        ctx.fillRect(chartRight + 1, y - 9, yAxisWidth - 2, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.toFixed(symbol.precision), chartRight + yAxisWidth / 2, y + 3);
      } else if (d.type === 'trendline' && d.points.length >= 2) {
        const p1 = d.points[0];
        const p2 = d.points[1];

        // Find candle index matching time or closest
        const i1 = displayCandles.findIndex((c) => c.time >= p1.time);
        const i2 = displayCandles.findIndex((c) => c.time >= p2.time);
        const x1 = indexToX(i1 >= 0 ? i1 : 0, startIndex, chartLeft, candleWidth);
        const x2 = indexToX(i2 >= 0 ? i2 : endIndex - 1, startIndex, chartLeft, candleWidth);
        const y1 = priceToY(p1.price, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
        const y2 = priceToY(p2.price, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);

        ctx.strokeStyle = '#e0a612';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Control nodes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
        ctx.arc(x2, y2, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'fibonacci' && d.points.length >= 2) {
        const p1 = d.points[0].price;
        const p2 = d.points[1].price;
        const levels = calculateFibonacciLevels(p1, p2);

        levels.forEach((lvl) => {
          const y = priceToY(lvl.price, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
          ctx.strokeStyle = lvl.color;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(chartLeft, y);
          ctx.lineTo(chartRight, y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = lvl.color;
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${lvl.label} ($${lvl.price.toFixed(symbol.precision)})`, chartLeft + 10, y - 3);
        });
      } else if ((d.type === 'longPosition' || d.type === 'shortPosition') && d.points.length >= 1) {
        const entryP = d.points[0].price;
        const isLong = d.type === 'longPosition';
        const targetP = isLong ? entryP * 1.04 : entryP * 0.96;
        const stopP = isLong ? entryP * 0.98 : entryP * 1.02;

        const entryY = priceToY(entryP, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
        const targetY = priceToY(targetP, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
        const stopY = priceToY(stopP, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);

        const boxX = mousePos?.x ? Math.max(chartLeft + 40, mousePos.x - 70) : chartRight - 180;
        const boxW = 140;

        // Target zone (green)
        ctx.fillStyle = 'rgba(8, 153, 129, 0.2)';
        ctx.strokeStyle = '#089981';
        ctx.lineWidth = 1;
        const greenTop = Math.min(entryY, targetY);
        const greenHeight = Math.abs(targetY - entryY);
        ctx.fillRect(boxX, greenTop, boxW, greenHeight);
        ctx.strokeRect(boxX, greenTop, boxW, greenHeight);

        // Stop zone (red)
        ctx.fillStyle = 'rgba(242, 54, 69, 0.2)';
        ctx.strokeStyle = '#f23645';
        const redTop = Math.min(entryY, stopY);
        const redHeight = Math.abs(stopY - entryY);
        ctx.fillRect(boxX, redTop, boxW, redHeight);
        ctx.strokeRect(boxX, redTop, boxW, redHeight);

        // Labels
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Target: $${targetP.toFixed(symbol.precision)}`, boxX + boxW / 2, greenTop + 14);
        ctx.fillText(`Entry: $${entryP.toFixed(symbol.precision)}`, boxX + boxW / 2, entryY + 4);
        ctx.fillText(`Stop: $${stopP.toFixed(symbol.precision)}`, boxX + boxW / 2, redTop + redHeight - 6);
        ctx.fillText('R:R 2.00', boxX + boxW / 2, entryY - 8);
      } else if (d.type === 'measure' && d.points.length >= 2) {
        const p1 = d.points[0];
        const p2 = d.points[1];
        const i1 = displayCandles.findIndex((c) => c.time >= p1.time);
        const i2 = displayCandles.findIndex((c) => c.time >= p2.time);
        const x1 = indexToX(i1 >= 0 ? i1 : 0, startIndex, chartLeft, candleWidth);
        const x2 = indexToX(i2 >= 0 ? i2 : endIndex - 1, startIndex, chartLeft, candleWidth);
        const y1 = priceToY(p1.price, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);
        const y2 = priceToY(p2.price, effectiveMinPrice, effectiveMaxPrice, mainChartTop, mainChartHeight);

        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);

        ctx.fillStyle = 'rgba(41, 98, 255, 0.15)';
        ctx.strokeStyle = '#2962ff';
        ctx.lineWidth = 1;
        ctx.fillRect(left, top, w, h);
        ctx.strokeRect(left, top, w, h);

        const barCount = Math.abs(i2 - i1);
        const priceDelta = p2.price - p1.price;
        const pctDelta = (priceDelta / p1.price) * 100;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${priceDelta >= 0 ? '+' : ''}${priceDelta.toFixed(symbol.precision)} (${pctDelta >= 0 ? '+' : ''}${pctDelta.toFixed(2)}%) · ${barCount} bars`,
          left + w / 2,
          top + h / 2
        );
      }
    });

    // Sub-Panel 1: RSI Oscillator (if enabled)
    let currentSubPanelY = mainChartTop + mainChartHeight;
    if (indicators.rsi) {
      // Divider line
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartLeft, currentSubPanelY);
      ctx.lineTo(width, currentSubPanelY);
      ctx.stroke();

      // RSI background
      ctx.fillStyle = isDark ? '#11141c' : '#f8fafd';
      ctx.fillRect(chartLeft, currentSubPanelY, chartRight, subPanelHeight);

      // Overbought / Oversold 70 / 30 guide bands
      const rsiToY = (rVal: number) => currentSubPanelY + subPanelHeight - (rVal / 100) * subPanelHeight;
      const y70 = rsiToY(70);
      const y30 = rsiToY(30);

      // Zone between 30 and 70
      ctx.fillStyle = isDark ? 'rgba(156, 39, 176, 0.08)' : 'rgba(156, 39, 176, 0.05)';
      ctx.fillRect(chartLeft, y70, chartRight, y30 - y70);

      ctx.strokeStyle = 'rgba(156, 39, 176, 0.35)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(chartLeft, y70);
      ctx.lineTo(chartRight, y70);
      ctx.moveTo(chartLeft, y30);
      ctx.lineTo(chartRight, y30);
      ctx.stroke();
      ctx.setLineDash([]);

      // RSI curve
      ctx.beginPath();
      let rsiStarted = false;
      for (let i = startIndex; i < endIndex; i++) {
        const val = rsi[i];
        if (val === null) continue;
        const x = indexToX(i, startIndex, chartLeft, candleWidth);
        const y = rsiToY(val);
        if (!rsiStarted) {
          ctx.moveTo(x, y);
          rsiStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = '#ab47bc';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sub-panel label & current value
      const latestRsiVal = rsi[rsi.length - 1];
      ctx.fillStyle = axisText;
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `RSI 14  ${latestRsiVal !== null && latestRsiVal !== undefined ? latestRsiVal.toFixed(1) : ''}`,
        chartLeft + 8,
        currentSubPanelY + 14
      );

      // Axis label
      ctx.fillText('70', chartRight + 6, y70 + 3);
      ctx.fillText('30', chartRight + 6, y30 + 3);

      currentSubPanelY += subPanelHeight;
    }

    // Sub-Panel 2: MACD (if enabled)
    if (indicators.macd) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartLeft, currentSubPanelY);
      ctx.lineTo(width, currentSubPanelY);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#11141c' : '#f8fafd';
      ctx.fillRect(chartLeft, currentSubPanelY, chartRight, subPanelHeight);

      // Find max histogram magnitude for scaling
      let maxAbsMacd = 0.01;
      for (let i = startIndex; i < endIndex; i++) {
        const h = Math.abs(macd.histogram[i] ?? 0);
        const m = Math.abs(macd.macd[i] ?? 0);
        if (h > maxAbsMacd) maxAbsMacd = h;
        if (m > maxAbsMacd) maxAbsMacd = m;
      }

      const zeroY = currentSubPanelY + subPanelHeight / 2;
      const macdScaleY = (subPanelHeight * 0.42) / maxAbsMacd;

      // Zero line
      ctx.strokeStyle = gridLine;
      ctx.beginPath();
      ctx.moveTo(chartLeft, zeroY);
      ctx.lineTo(chartRight, zeroY);
      ctx.stroke();

      // Draw Histogram Bars
      for (let i = startIndex; i < endIndex; i++) {
        const hist = macd.histogram[i];
        if (hist === null) continue;
        const x = indexToX(i, startIndex, chartLeft, candleWidth);
        const barH = hist * macdScaleY;
        const isBull = hist >= 0;

        ctx.fillStyle = isBull ? 'rgba(8, 153, 129, 0.7)' : 'rgba(242, 54, 69, 0.7)';
        ctx.fillRect(x - candleWidth * 0.35, zeroY - barH, candleWidth * 0.7, barH);
      }

      // Draw MACD Line
      ctx.beginPath();
      let mStarted = false;
      for (let i = startIndex; i < endIndex; i++) {
        const mVal = macd.macd[i];
        if (mVal === null) continue;
        const x = indexToX(i, startIndex, chartLeft, candleWidth);
        const y = zeroY - mVal * macdScaleY;
        if (!mStarted) {
          ctx.moveTo(x, y);
          mStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Draw Signal Line
      ctx.beginPath();
      let sStarted = false;
      for (let i = startIndex; i < endIndex; i++) {
        const sVal = macd.signal[i];
        if (sVal === null) continue;
        const x = indexToX(i, startIndex, chartLeft, candleWidth);
        const y = zeroY - sVal * macdScaleY;
        if (!sStarted) {
          ctx.moveTo(x, y);
          sStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Label
      ctx.fillStyle = axisText;
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MACD (12, 26, 9)', chartLeft + 8, currentSubPanelY + 14);

      currentSubPanelY += subPanelHeight;
    }

    // Draw Price & Time Axis Backgrounds & Borders
    ctx.fillStyle = axisBg;
    ctx.fillRect(chartRight, 0, yAxisWidth, height);
    ctx.fillRect(0, height - xAxisHeight, width, xAxisHeight);

    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    // Y-Axis Divider
    ctx.beginPath();
    ctx.moveTo(chartRight, 0);
    ctx.lineTo(chartRight, height);
    // X-Axis Divider
    ctx.moveTo(0, height - xAxisHeight);
    ctx.lineTo(width, height - xAxisHeight);
    ctx.stroke();

    // Draw Current Market Live Price Tag on Right Axis
    const currentPriceY = priceToY(
      symbol.currentPrice,
      effectiveMinPrice,
      effectiveMaxPrice,
      mainChartTop,
      mainChartHeight
    );
    const isCurrentUp = symbol.change24h >= 0;
    const tagBg = isCurrentUp ? green : red;

    ctx.fillStyle = tagBg;
    ctx.fillRect(chartRight, currentPriceY - 10, yAxisWidth, 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      symbol.currentPrice.toFixed(symbol.precision),
      chartRight + yAxisWidth / 2,
      currentPriceY + 3.5
    );

    // Draw Crosshair (if active)
    if (mousePos && mousePos.x <= chartRight && mousePos.y <= height - xAxisHeight) {
      ctx.strokeStyle = isDark ? '#787b86' : '#94a3b8';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, height - xAxisHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartRight, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price Tag on Right Axis for Crosshair
      const crosshairPrice = yToPrice(
        mousePos.y,
        effectiveMinPrice,
        effectiveMaxPrice,
        mainChartTop,
        mainChartHeight
      );

      ctx.fillStyle = isDark ? '#363a45' : '#334155';
      ctx.fillRect(chartRight, mousePos.y - 9, yAxisWidth, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        crosshairPrice.toFixed(symbol.precision),
        chartRight + yAxisWidth / 2,
        mousePos.y + 3.5
      );

      // Time Tag on Bottom Axis for Crosshair
      const candleIdx = xToIndex(mousePos.x, startIndex, chartLeft, candleWidth);
      if (candleIdx >= 0 && candleIdx < displayCandles.length) {
        const c = displayCandles[candleIdx];
        const date = new Date(c.time * 1000);
        const timeLabel = `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        ctx.fillStyle = isDark ? '#363a45' : '#334155';
        ctx.fillRect(mousePos.x - 55, height - xAxisHeight, 110, xAxisHeight);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeLabel, mousePos.x, height - 8);
      }
    }

    ctx.restore();
  }, [
    displayCandles,
    candleWidth,
    visibleOffset,
    priceScaleFactor,
    mousePos,
    theme,
    indicators,
    chartType,
    symbol,
    timeframe,
    drawings,
    currentDrawing,
    sma20,
    sma50,
    sma200,
    ema9,
    ema21,
    bollinger,
    vwap,
    rsi,
    macd,
    priceToY,
    yToPrice,
    indexToX,
    xToIndex,
  ]);

  // Mouse Interactivity Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.8 : 0.8;
    setCandleWidth((prev) => Math.max(3, Math.min(35, prev + zoomDelta)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const yAxisWidth = 65;
    const chartRight = rect.width - yAxisWidth;

    // Check if clicked on Y-axis for price scaling
    if (x >= chartRight) {
      setIsDraggingPriceScale(true);
      dragStartRef.current = { x, y, offset: visibleOffset, scale: priceScaleFactor };
      return;
    }

    // Handle Active Drawing Tool Click
    if (activeDrawingTool !== 'cursor' && activeDrawingTool !== 'crosshair') {
      const visibleCount = Math.max(10, Math.floor(chartRight / candleWidth));
      const totalCandles = displayCandles.length;
      const endIndex = Math.min(totalCandles, totalCandles - visibleOffset);
      const startIndex = Math.max(0, endIndex - visibleCount);

      const candleIdx = Math.max(
        0,
        Math.min(totalCandles - 1, xToIndex(x, startIndex, 0, candleWidth))
      );
      const matchedCandle = displayCandles[candleIdx];
      if (!matchedCandle) return;

      const yAxisHeight = 26;
      const mainChartTop = 10;
      const subPanelsCount = (indicators.rsi ? 1 : 0) + (indicators.macd ? 1 : 0);
      const subPanelH = subPanelsCount > 0 ? Math.min(110, (rect.height - 100) / (subPanelsCount + 2.5)) : 0;
      const mainChartHeight = rect.height - yAxisHeight - subPanelsCount * subPanelH - mainChartTop;

      // Visible min and max prices
      const visibleSlice = displayCandles.slice(startIndex, endIndex);
      let minP = Math.min(...visibleSlice.map((c) => c.low));
      let maxP = Math.max(...visibleSlice.map((c) => c.high));
      const range = maxP - minP || 1;
      const midP = (minP + maxP) / 2;
      const scaledRange = (range / 2 + range * 0.08) / priceScaleFactor;
      const effMinP = midP - scaledRange;
      const effMaxP = midP + scaledRange;

      const clickPrice = yToPrice(y, effMinP, effMaxP, mainChartTop, mainChartHeight);

      if (activeDrawingTool === 'horizontal') {
        onAddDrawing({
          id: `draw_${Date.now()}`,
          type: 'horizontal',
          points: [{ time: matchedCandle.time, price: clickPrice }],
          completed: true,
        });
        onFinishDrawing('crosshair');
        return;
      }

      if (activeDrawingTool === 'longPosition' || activeDrawingTool === 'shortPosition') {
        onAddDrawing({
          id: `draw_${Date.now()}`,
          type: activeDrawingTool,
          points: [{ time: matchedCandle.time, price: clickPrice }],
          completed: true,
        });
        onFinishDrawing('crosshair');
        return;
      }

      // Multi-point tools: trendline, fibonacci, measure
      if (!currentDrawing) {
        // First point
        setCurrentDrawing({
          id: `draw_${Date.now()}`,
          type: activeDrawingTool,
          points: [{ time: matchedCandle.time, price: clickPrice }],
          completed: false,
        });
      } else {
        // Second point: complete drawing
        const completed: DrawingItem = {
          ...currentDrawing,
          points: [...currentDrawing.points, { time: matchedCandle.time, price: clickPrice }],
          completed: true,
        };
        onAddDrawing(completed);
        setCurrentDrawing(null);
        onFinishDrawing('crosshair');
      }
      return;
    }

    // Standard chart canvas drag/pan
    setIsDragging(true);
    dragStartRef.current = { x, y, offset: visibleOffset, scale: priceScaleFactor };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Handle Price Axis Vertical Scaling Drag
    if (isDraggingPriceScale) {
      const deltaY = dragStartRef.current.y - y;
      const scaleMultiplier = Math.exp(deltaY * 0.005);
      setPriceScaleFactor(Math.max(0.2, Math.min(6.0, dragStartRef.current.scale * scaleMultiplier)));
      return;
    }

    // Handle Horizontal Time Pan Drag
    if (isDragging) {
      const deltaX = x - dragStartRef.current.x;
      const candlesShift = Math.round(deltaX / candleWidth);
      const newOffset = Math.max(0, dragStartRef.current.offset - candlesShift);
      setVisibleOffset(newOffset);
      return;
    }

    // Hovered candle calculation
    const yAxisWidth = 65;
    const chartRight = rect.width - yAxisWidth;
    if (x <= chartRight) {
      const visibleCount = Math.max(10, Math.floor(chartRight / candleWidth));
      const totalCandles = displayCandles.length;
      const endIndex = Math.min(totalCandles, totalCandles - visibleOffset);
      const startIndex = Math.max(0, endIndex - visibleCount);
      const idx = xToIndex(x, startIndex, 0, candleWidth);
      if (idx >= 0 && idx < totalCandles) {
        setHoveredCandleIndex(idx);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingPriceScale(false);
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setIsDragging(false);
    setIsDraggingPriceScale(false);
  };

  const handleDoubleClick = () => {
    // Reset Zoom & Scale
    setCandleWidth(9);
    setVisibleOffset(5);
    setPriceScaleFactor(1.0);
  };

  // Target candle for OHLC legend
  const legendCandle =
    hoveredCandleIndex !== null && displayCandles[hoveredCandleIndex]
      ? displayCandles[hoveredCandleIndex]
      : displayCandles[displayCandles.length - 1];

  const legendChange = legendCandle ? legendCandle.close - legendCandle.open : 0;
  const legendChangePct = legendCandle ? (legendChange / legendCandle.open) * 100 : 0;
  const isLegendPositive = legendChange >= 0;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full overflow-hidden bg-[#131722] select-none"
    >
      {/* Floating OHLCV Legend in Top-Left */}
      <div className="absolute top-3 left-4 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono pointer-events-none bg-[#131722]/85 backdrop-blur-xs px-2.5 py-1.5 rounded border border-[#2a2e39]/60">
        <span className="font-bold text-[#d1d4dc]">{symbol.symbol}</span>
        <span className="text-[#787b86]">·</span>
        <span className="text-[#787b86]">{timeframe}</span>

        {legendCandle && (
          <>
            <span className="text-[#787b86]">
              O <span className="text-[#d1d4dc] font-semibold">{legendCandle.open.toFixed(symbol.precision)}</span>
            </span>
            <span className="text-[#787b86]">
              H <span className="text-[#d1d4dc] font-semibold">{legendCandle.high.toFixed(symbol.precision)}</span>
            </span>
            <span className="text-[#787b86]">
              L <span className="text-[#d1d4dc] font-semibold">{legendCandle.low.toFixed(symbol.precision)}</span>
            </span>
            <span className="text-[#787b86]">
              C <span className="text-[#d1d4dc] font-semibold">{legendCandle.close.toFixed(symbol.precision)}</span>
            </span>
            <span className={`font-semibold ${isLegendPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
              {isLegendPositive ? '+' : ''}
              {legendChange.toFixed(symbol.precision)} ({isLegendPositive ? '+' : ''}
              {legendChangePct.toFixed(2)}%)
            </span>
            <span className="text-[#787b86]">
              Vol <span className="text-[#d1d4dc] font-semibold">{legendCandle.volume.toLocaleString()}</span>
            </span>
          </>
        )}
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        className={`w-full h-full block ${
          activeDrawingTool !== 'cursor' && activeDrawingTool !== 'crosshair'
            ? 'cursor-crosshair'
            : isDraggingPriceScale
            ? 'cursor-ns-resize'
            : isDragging
            ? 'cursor-grabbing'
            : 'cursor-crosshair'
        }`}
      />
    </div>
  );
};
