import { TrendingUp, DollarSign, BarChart3, Globe, Zap } from "lucide-react";

export function AuthVisual() {
  return (
    <div className="relative h-full bg-gradient-to-br from-primary/20 via-background to-premium/10 flex items-center justify-center overflow-hidden">
      {/* Background floating elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-16 h-16 bg-primary/20 rounded-full animate-pulse" />
        <div className="absolute top-40 right-32 w-8 h-8 bg-premium/30 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-32 left-16 w-12 h-12 bg-success/20 rounded-full animate-pulse delay-500" />
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-primary/10 rounded-full animate-pulse delay-700" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-lg px-8">
        {/* Animated icon cluster */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-primary/20 rounded-full animate-bounce delay-100">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <div className="p-4 bg-success/20 rounded-full animate-bounce delay-300">
              <DollarSign className="w-8 h-8 text-success" />
            </div>
            <div className="p-4 bg-premium/20 rounded-full animate-bounce delay-500">
              <BarChart3 className="w-8 h-8 text-premium" />
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-6">
            <div className="p-3 bg-primary/10 rounded-full animate-pulse delay-200">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div className="p-3 bg-premium/10 rounded-full animate-pulse delay-600">
              <Zap className="w-6 h-6 text-premium" />
            </div>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in animate-brand-glow">
          <span className="text-white">Arova</span>
          <span style={{ color: '#084d34' }}>Forex</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl text-muted-foreground mb-8 animate-fade-in delay-300">
          Master the Markets. Start your Trading Journey with ArovaForex.
        </p>

        {/* Feature highlights */}
        <div className="space-y-4 animate-fade-in delay-500">
          <div className="flex items-center justify-center space-x-3 text-muted-foreground">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span>Real-time Market Forecasts</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200" />
            <span>Premium Trading Signals</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-muted-foreground">
            <div className="w-2 h-2 bg-premium rounded-full animate-pulse delay-400" />
            <span>Professional Analysis</span>
          </div>
        </div>

        {/* Animated chart visualization */}
        <div className="mt-12 relative">
          <svg
            viewBox="0 0 300 100"
            className="w-full max-w-sm mx-auto opacity-30"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="50%" stopColor="hsl(var(--premium))" />
                <stop offset="100%" stopColor="hsl(var(--success))" />
              </linearGradient>
            </defs>
            <path
              d="M0,80 Q75,20 150,40 T300,30"
              stroke="url(#chartGradient)"
              strokeWidth="3"
              fill="none"
              className="animate-pulse"
            />
            <circle cx="75" cy="35" r="4" fill="hsl(var(--primary))" className="animate-bounce delay-100" />
            <circle cx="150" cy="40" r="4" fill="hsl(var(--premium))" className="animate-bounce delay-300" />
            <circle cx="225" cy="25" r="4" fill="hsl(var(--success))" className="animate-bounce delay-500" />
          </svg>
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
    </div>
  );
}