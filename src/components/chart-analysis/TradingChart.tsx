import { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineStyle, CrosshairMode } from 'lightweight-charts';
import { DrawingToolbar } from './DrawingToolbar';
import { useDrawingTools } from '@/hooks/useDrawingTools';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingChartProps {
  chartData: CandleData[];
  currentIndex: number;
  symbol: string;
  timeframe: string;
  onChartReady?: (chart: IChartApi) => void;
  indicators: string[];
}

function calculateSMA(data: CandleData[], period: number) {
  const result: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

function calculateEMA(data: CandleData[], period: number) {
  const result: { time: number; value: number }[] = [];
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((s, d) => s + d.close, 0) / period;
  result.push({ time: data[period - 1].time, value: ema });
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({ time: data[i].time, value: ema });
  }
  return result;
}

export function TradingChart({ chartData, currentIndex, symbol, timeframe, onChartReady, indicators }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const indicatorSeriesRef = useRef<Record<string, ISeriesApi<'Line'>>>({});

  const {
    activeTool,
    setActiveTool,
    isLocked,
    isVisible,
    initCanvas,
    renderAll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearDrawings,
    toggleLock,
    toggleVisibility,
  } = useDrawingTools();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#0f1419' },
        textColor: '#9ca3af',
        fontFamily: 'inherit',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Solid },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(255,255,255,0.2)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(255,255,255,0.2)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    if (onChartReady) onChartReady(chart);

    // Initialize drawing canvas
    initCanvas(chartContainerRef.current);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        initCanvas(chartContainerRef.current);
        renderAll();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update data on index change
  useEffect(() => {
    if (!candleSeriesRef.current || !chartData.length) return;
    const visibleData = chartData.slice(0, currentIndex + 1);
    candleSeriesRef.current.setData(visibleData as CandlestickData[]);

    const chart = chartRef.current;
    if (!chart) return;

    // Remove old indicator series
    Object.values(indicatorSeriesRef.current).forEach(s => {
      try { chart.removeSeries(s); } catch { }
    });
    indicatorSeriesRef.current = {};

    if (indicators.includes('SMA') && visibleData.length > 20) {
      const smaData = calculateSMA(visibleData, 20);
      const smaSeries = chart.addLineSeries({ color: '#2962FF', lineWidth: 1, title: 'SMA 20' });
      smaSeries.setData(smaData as any);
      indicatorSeriesRef.current['SMA'] = smaSeries;
    }
    if (indicators.includes('EMA') && visibleData.length > 20) {
      const emaData = calculateEMA(visibleData, 20);
      const emaSeries = chart.addLineSeries({ color: '#FF6D00', lineWidth: 1, title: 'EMA 20' });
      emaSeries.setData(emaData as any);
      indicatorSeriesRef.current['EMA'] = emaSeries;
    }

    if (chartRef.current) {
      chartRef.current.timeScale().scrollToPosition(2, false);
    }

    // Re-render drawings after chart update
    renderAll();
  }, [currentIndex, chartData, indicators, renderAll]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!chartContainerRef.current) return;
    handleMouseDown(e, chartContainerRef.current);
  }, [handleMouseDown]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!chartContainerRef.current) return;
    handleMouseMove(e, chartContainerRef.current);
  }, [handleMouseMove]);

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-border bg-card ${
        activeTool !== 'cursor' ? 'cursor-crosshair' : ''
      }`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={handleMouseUp}
    >
      <DrawingToolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onClearDrawings={clearDrawings}
        isLocked={isLocked}
        onToggleLock={toggleLock}
        isVisible={isVisible}
        onToggleVisibility={toggleVisibility}
      />
      <div ref={chartContainerRef} className="w-full" />
      <div className="absolute top-3 left-14 text-xs text-muted-foreground/60 font-medium pointer-events-none select-none">
        {symbol} · {timeframe} · Practice Mode
      </div>
    </div>
  );
}
