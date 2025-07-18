import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Signal, Shield, BarChart3, Zap, Target, Brain, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeFooter } from "@/components/layout/HomeFooter";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <HomeHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-20 h-20 border border-primary rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 border border-success rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 border border-premium rounded-full animate-ping"></div>
          <div className="absolute bottom-40 right-1/3 w-24 h-24 border border-primary rounded-full animate-pulse"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative">
          <div className="flex items-center justify-center mb-6 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-xl flex items-center justify-center mr-4 animate-scale-in shadow-glow">
              <TrendingUp className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold">
              <span className="text-foreground">Arova</span>
              <span className="text-primary">Forex</span>
            </h1>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
            Professional Forex Trading Platform
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in" style={{animationDelay: '0.4s'}}>
            Access premium market forecasts, exclusive trading signals, and professional analysis. 
            Join thousands of traders making informed decisions with ArovaForex.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: '0.6s'}}>
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 hover:shadow-glow">
                <Zap className="w-4 h-4 mr-2" />
                Start Trading
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="hover:scale-105 transition-all duration-300">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose ArovaForex?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="border-border/50 text-center group hover:shadow-card transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-lg">Real-time Forecasts</CardTitle>
                <CardDescription>
                  Professional technical analysis and market insights updated daily
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 text-center group hover:shadow-card transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-premium/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Signal className="w-6 h-6 text-premium" />
                </div>
                <CardTitle className="text-lg">Premium Trading Signals</CardTitle>
                <CardDescription>
                  Exclusive signals with precise entry, stop loss, and take profit levels
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 text-center group hover:shadow-card transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Institutional-level Analysis</CardTitle>
                <CardDescription>
                  Advanced market analysis tools used by professional trading firms
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 text-center group hover:shadow-card transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Trader Dashboard Preview</CardTitle>
                <CardDescription>
                  Comprehensive dashboard with portfolio tracking and performance analytics
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Forecast Preview */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Market Forecast Preview</h3>
          
          <Card className="relative overflow-hidden border-border/50">
            <CardContent className="p-0">
              {/* Blurred Chart Background */}
              <div className="h-80 bg-gradient-to-br from-primary/5 via-success/5 to-premium/5 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUwIDEwMCBMMTAwIDcwIEwxNTAgMTIwIEwyMDAgNDAgTDI1MCA5MCBMMzAwIDMwIEwzNTAgODAiIHN0cm9rZT0iaHNsKDE2MCA4OSUgMjglKSIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] bg-no-repeat bg-center bg-contain blur-sm"></div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      {user ? <Eye className="w-8 h-8 text-primary" /> : <EyeOff className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <h4 className="text-2xl font-bold mb-2">
                      {user ? "Full Market Analysis Available" : "Log in to view this forecast"}
                    </h4>
                    <p className="text-muted-foreground mb-6">
                      {user 
                        ? "Access complete technical analysis, price targets, and risk management strategies" 
                        : "Premium market forecasts with detailed technical analysis and price predictions"
                      }
                    </p>
                    {!user && (
                      <Link to="/auth">
                        <Button className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300">
                          <Shield className="w-4 h-4 mr-2" />
                          Access Forecasts
                        </Button>
                      </Link>
                    )}
                    {user && (
                      <Link to="/dashboard/forecasts">
                        <Button className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Dashboard
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 to-success/5">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Start Trading?</h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join our community of successful traders and get access to professional insights with ArovaForex.
          </p>
          {!user ? (
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 hover:shadow-glow">
                <Zap className="w-4 h-4 mr-2" />
                Get Started Today
              </Button>
            </Link>
          ) : (
            <Link to="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 hover:shadow-glow">
                <Target className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
      </section>

      <HomeFooter />
    </div>
  );
};

export default Index;
