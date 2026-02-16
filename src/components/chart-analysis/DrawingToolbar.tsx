import {
  Crosshair,
  TrendingUp,
  Minus,
  Pencil,
  Type,
  Ruler,
  ZoomIn,
  Lock,
  Eye,
  Trash2,
  Square,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface DrawingToolbarProps {
  activeTool: string;
  onSelectTool: (tool: string) => void;
  onClearDrawings: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const drawingTools = [
  { id: 'cursor', name: 'Cursor', icon: Crosshair, desc: 'Select & move' },
  { id: 'trendline', name: 'Trend Line', icon: TrendingUp, desc: 'Draw trend lines' },
  { id: 'horizontal', name: 'Horizontal Line', icon: Minus, desc: 'Support / Resistance' },
  { id: 'rectangle', name: 'Rectangle', icon: Square, desc: 'Draw rectangles' },
  { id: 'path', name: 'Free Draw', icon: Pencil, desc: 'Free-hand drawing' },
  { id: 'text', name: 'Text', icon: Type, desc: 'Add text labels' },
  { id: 'measure', name: 'Measure', icon: Ruler, desc: 'Measure distance' },
  { id: 'zoom', name: 'Zoom', icon: ZoomIn, desc: 'Zoom in' },
];

export function DrawingToolbar({
  activeTool,
  onSelectTool,
  onClearDrawings,
  isLocked,
  onToggleLock,
  isVisible,
  onToggleVisibility,
}: DrawingToolbarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-0.5 rounded-lg border border-border bg-card/90 backdrop-blur-md p-1 shadow-lg">
        {drawingTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelectTool(tool.id)}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <p className="font-medium">{tool.name}</p>
                <p className="text-muted-foreground">{tool.desc}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Separator className="my-0.5" />

        {/* Lock */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleLock}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                isLocked
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Lock className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Lock drawings</TooltipContent>
        </Tooltip>

        {/* Visibility */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleVisibility}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                !isVisible
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Toggle visibility</TooltipContent>
        </Tooltip>

        {/* Delete All */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (confirm('Delete all drawings?')) onClearDrawings();
              }}
              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Clear all drawings</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
