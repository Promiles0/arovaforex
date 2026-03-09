import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Skeleton } from '@/components/ui/skeleton';

interface PriceLine {
  price: number;
  color: string;
  title: string;
  lineStyle?: number;
}

interface ChartMarker {
  time: Time;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'arrowDown' | 'arrowUp' | 'circle';
  text: string;
}

interface BacktestChartProps {
  data: CandlestickData<Time>[];
  priceLines?: PriceLine[];
  markers?: ChartMarker[];
  isLoading?: boolean;
}

export function BacktestChart({ data, priceLines = [], markers = [], isLoading }: BacktestChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!containerRef.current || isLoading) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0a0a0f' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#6366f1', labelBackgroundColor: '#6366f1' },
        horzLine: { color: '#6366f1', labelBackgroundColor: '#6366f1' },
      },
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1f2937',
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    if (data.length > 0) {
      series.setData(data);
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [data, isLoading]);

  // Update price lines
  useEffect(() => {
    if (!seriesRef.current) return;

    // Remove existing price lines by re-setting data (lightweight-charts limitation)
    // Price lines are added fresh each time
    priceLines.forEach((pl) => {
      seriesRef.current?.createPriceLine({
        price: pl.price,
        color: pl.color,
        lineWidth: 2,
        lineStyle: pl.lineStyle ?? 2,
        axisLabelVisible: true,
        title: pl.title,
      });
    });
  }, [priceLines]);

  // Update markers
  useEffect(() => {
    if (!seriesRef.current || markers.length === 0) return;
    seriesRef.current.setMarkers(markers as any);
  }, [markers]);

  if (isLoading) {
    return (
      <div className="w-full h-[500px] lg:h-full rounded-xl border border-border bg-card flex items-center justify-center">
        <div className="space-y-3 w-full p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[500px] lg:h-full rounded-xl border border-border bg-card flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">Configure your strategy and run a backtest</p>
          <p className="text-muted-foreground/60 text-xs">Historical candlestick data will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] lg:h-full min-h-[500px] rounded-xl border border-border overflow-hidden"
    />
  );
}
