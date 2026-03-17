import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Eye, Heart, MessageCircle, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ForecastData {
  id: string;
  title: string | null;
  currency_pair: string | null;
  trade_bias: string | null;
  image_url: string;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
}

export const ForecastPreview = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecasts = async () => {
      const { data } = await supabase
        .from('forecasts')
        .select('id, title, currency_pair, trade_bias, image_url, likes_count, comments_count, created_at')
        .eq('hidden', false)
        .eq('forecast_type', 'arova')
        .order('created_at', { ascending: false })
        .limit(6);

      setForecasts(data || []);
      setLoading(false);
    };
    fetchForecasts();
  }, []);

  const getBiasIcon = (bias: string | null) => {
    if (bias === 'long') return <TrendingUp className="w-4 h-4 text-success" />;
    if (bias === 'short') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getBiasLabel = (bias: string | null) => {
    if (bias === 'long') return 'Bullish';
    if (bias === 'short') return 'Bearish';
    return 'Neutral';
  };

  const getBiasColor = (bias: string | null) => {
    if (bias === 'long') return 'text-success';
    if (bias === 'short') return 'text-destructive';
    return 'text-muted-foreground';
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="h-8 w-64 mx-auto rounded bg-muted/50 animate-pulse mb-4" />
          <div className="h-4 w-96 mx-auto rounded bg-muted/30 animate-pulse" />
        </div>
      </section>
    );
  }

  if (forecasts.length === 0) return null;

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Latest Market Forecasts</h2>
          <p className="text-xl text-muted-foreground">Real analysis from our team — updated daily</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {forecasts.map((forecast, i) => (
            <motion.div
              key={forecast.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Chart image */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={forecast.image_url}
                  alt={forecast.title || forecast.currency_pair || 'Forecast'}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    !isAuthenticated && i >= 2 ? 'blur-md' : ''
                  }`}
                  loading="lazy"
                />
                {!isAuthenticated && i >= 2 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Sign up to view</span>
                    </div>
                  </div>
                )}
                {/* Bias badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur border border-border/50 text-xs font-medium">
                  {getBiasIcon(forecast.trade_bias)}
                  <span className={getBiasColor(forecast.trade_bias)}>{getBiasLabel(forecast.trade_bias)}</span>
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/80 backdrop-blur border border-border/50 text-xs text-muted-foreground">
                  {timeAgo(forecast.created_at)}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">{forecast.currency_pair || 'Market'}</span>
                </div>
                {forecast.title && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{forecast.title}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> {forecast.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> {forecast.comments_count || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link to={isAuthenticated ? "/dashboard/forecasts" : "/auth"}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-success hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] transition-all duration-300"
              >
                {isAuthenticated ? "View All Forecasts" : "Sign Up to See More"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </Link>
        </div>
      </div>
    </section>
  );
};
