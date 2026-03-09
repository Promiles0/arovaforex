import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

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
        background: { color: '#09090b' },
        textColor: '#71717a',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#18181b' },
        horzLines: { color: '#18181b' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#22c55e', width: 1, labelBackgroundColor: '#22c55e' },
        horzLine: { color: '#22c55e', width: 1, labelBackgroundColor: '#22c55e' },
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#27272a',
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#4ade80',
      wickDownColor: '#f87171',
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

  useEffect(() => {
    if (!seriesRef.current) return;
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

  useEffect(() => {
    if (!seriesRef.current || markers.length === 0) return;
    seriesRef.current.setMarkers(markers as any);
  }, [markers]);

  if (isLoading) {
    return (
      <div className="w-full h-[500px] lg:h-full rounded-xl border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-[var(--shadow-card)]">
        <div className="space-y-3 w-full p-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[500px] lg:h-full rounded-xl border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-[var(--shadow-card)]">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary/60" />
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">Configure your strategy and run a backtest</p>
            <p className="text-muted-foreground/50 text-xs">Historical candlestick data will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] lg:h-full min-h-[500px] rounded-xl border border-border overflow-hidden shadow-[var(--shadow-card)]"
    />
  );
}
