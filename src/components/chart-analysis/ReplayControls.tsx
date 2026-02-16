import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplayControlsProps {
  currentIndex: number;
  totalCandles: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (index: number) => void;
}

export function ReplayControls({
  currentIndex, totalCandles, isPlaying, speed,
  onPlay, onPause, onStepForward, onStepBackward, onReset, onSpeedChange, onSeek,
}: ReplayControlsProps) {
  const progress = totalCandles > 0 ? (currentIndex / (totalCandles - 1)) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Candle {currentIndex + 1} / {totalCandles}</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max={totalCandles - 1}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary bg-muted"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onReset} title="Reset">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onStepBackward} disabled={currentIndex <= 0} title="Previous candle">
            <SkipBack className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={isPlaying ? "destructive" : "default"}
            size="icon"
            className="h-9 w-9"
            onClick={isPlaying ? onPause : onPlay}
            disabled={currentIndex >= totalCandles - 1}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onStepForward} disabled={currentIndex >= totalCandles - 1} title="Next candle">
            <SkipForward className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Speed:</span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                speed === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
