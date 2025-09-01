import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ZoomIn, ZoomOut, Download, Share2, RotateCcw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  full_name: string | null;
  country: string | null;
  phone_number: string | null;
}

interface ExtendedForecast {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  forecast_type: 'arova' | 'public';
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  currency_pair: string | null;
  trade_bias: 'long' | 'short' | 'neutral' | null;
  commentary: string | null;
  user_profile?: Profile;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

interface EnhancedImageModalProps {
  forecast: ExtendedForecast;
  open: boolean;
  onClose: () => void;
}

export default function EnhancedImageModal({ forecast, open, onClose }: EnhancedImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { toast } = useToast();

  const getBiasIcon = (bias: string | null) => {
    switch (bias) {
      case 'long': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'short': return <TrendingDown className="w-4 h-4 text-destructive" />;
      case 'neutral': return <Minus className="w-4 h-4 text-warning" />;
      default: return null;
    }
  };

  const getBiasStyles = (bias: string | null) => {
    switch (bias) {
      case 'long': 
        return 'bg-success/10 text-success border-success/20';
      case 'short': 
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'neutral': 
        return 'bg-warning/10 text-warning border-warning/20';
      default: 
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(forecast.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast-${forecast.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Chart image is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the image",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: forecast.title || 'Market Forecast',
        text: `Check out this ${forecast.currency_pair || 'market'} forecast`,
        url: window.location.href
      });
    } catch (error) {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Forecast link copied to clipboard",
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 bg-background/95 backdrop-blur-sm border border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {forecast.currency_pair && (
                <Badge variant="outline" className="font-mono border-primary/30 text-primary bg-primary/5">
                  {forecast.currency_pair}
                </Badge>
              )}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getBiasStyles(forecast.trade_bias)}`}>
                {getBiasIcon(forecast.trade_bias)}
                <span className="ml-1 font-semibold">
                  {forecast.trade_bias?.toUpperCase() || 'NEUTRAL'}
                </span>
              </div>
              <span className="text-lg font-semibold">{forecast.title || "Market Analysis"}</span>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 w-8 p-0"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pan and zoom to explore the chart in detail. Use mouse wheel to zoom or click the controls above.
          </DialogDescription>
        </DialogHeader>
        
        {/* Image Container */}
        <div className="flex-1 overflow-hidden relative bg-muted/5">
          <div 
            className="w-full h-[60vh] flex items-center justify-center cursor-move overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={(e) => {
              e.preventDefault();
              if (e.deltaY < 0) {
                handleZoomIn();
              } else {
                handleZoomOut();
              }
            }}
          >
            <img 
              src={forecast.image_url} 
              alt={forecast.title || "Forecast"} 
              className="max-w-none transition-transform duration-200 select-none"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Commentary Section */}
        {forecast.commentary && (
          <div className="p-6 pt-4 border-t border-border/30 bg-muted/5">
            <h4 className="font-semibold mb-3 text-foreground">Market Analysis</h4>
            <p className="text-muted-foreground leading-relaxed">{forecast.commentary}</p>
          </div>
        )}
        
        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between text-sm border-t border-border/30 pt-4 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-xs font-bold text-primary">
                {forecast.user_profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <span className="font-medium text-foreground">
                {forecast.user_profile?.full_name || "Unknown"}
              </span>
              <div className="text-muted-foreground text-xs">
                {new Date(forecast.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}