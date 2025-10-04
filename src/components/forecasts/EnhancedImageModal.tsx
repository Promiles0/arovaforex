import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ZoomIn, ZoomOut, Download, Share2, RotateCcw, TrendingUp, TrendingDown, Minus, Maximize, Minimize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

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
  hidden: boolean;
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const { toast } = useToast();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setImageLoaded(false);
      setIsFullscreen(false);
      setCurrentZoom(1);
    }
  }, [open]);

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

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[100vw] max-h-[100vh] w-full h-full' : 'max-w-6xl max-h-[95vh]'} p-0 bg-background/95 backdrop-blur-sm border border-border/50 transition-all duration-300`}>
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
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs md:text-sm">
            <span className="hidden md:inline">Pan and zoom to explore the chart in detail. Use mouse wheel to zoom or click the controls.</span>
            <span className="md:hidden">Pinch to zoom, drag to pan. Use controls for precise adjustment.</span>
          </DialogDescription>
        </DialogHeader>
        
        {/* Image Container with react-zoom-pan-pinch */}
        <div className="flex-1 overflow-hidden relative bg-muted/5">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={3}
            centerOnInit
            wheel={{ step: 0.1 }}
            doubleClick={{ mode: "reset" }}
            onTransformed={(ref) => setCurrentZoom(ref.state.scale)}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Control Buttons */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 md:gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => zoomIn()}
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => zoomOut()}
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetTransform()}
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                    title="Reset"
                  >
                    <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? <Minimize className="w-3 h-3 md:w-4 md:h-4" /> : <Maximize className="w-3 h-3 md:w-4 md:h-4" />}
                  </Button>
                  <div className="w-px h-6 bg-border/50 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 w-8 p-0 hover:bg-success/10"
                    title="Download"
                  >
                    <Download className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                    title="Share"
                  >
                    <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose} 
                    className="h-8 w-8 p-0 hover:bg-destructive/10"
                    title="Close"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>

                <TransformComponent
                  wrapperClass={`w-full ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-[50vh] md:h-[60vh]'} flex items-center justify-center`}
                  contentClass="flex items-center justify-center w-full h-full"
                >
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                  <img 
                    src={forecast.image_url} 
                    alt={forecast.title || "Forecast"} 
                    className={`max-w-full max-h-full object-contain select-none transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    draggable={false}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageLoaded(true);
                      toast({
                        title: "Image load error",
                        description: "Failed to load the chart image",
                        variant: "destructive"
                      });
                    }}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
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
          
          <div className="text-xs text-muted-foreground flex items-center gap-3">
            <span>Zoom: {Math.round(currentZoom * 100)}%</span>
            {currentZoom > 1 && <span className="text-primary">• Pan enabled</span>}
            {isFullscreen && <span className="text-success">• Fullscreen</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
