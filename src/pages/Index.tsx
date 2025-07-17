import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Signal, Shield, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mr-4">
              <TrendingUp className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Arova
            </h1>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Professional Forex Trading Platform
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Access premium market forecasts, exclusive trading signals, and professional analysis. 
            Join thousands of traders making informed decisions with Arova.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Trading
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose Arova?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-border/50 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-success" />
                </div>
                <CardTitle>Free Market Forecasts</CardTitle>
                <CardDescription>
                  Professional technical analysis and market insights available to all members
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-premium/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Signal className="w-6 h-6 text-premium" />
                </div>
                <CardTitle>Premium Trading Signals</CardTitle>
                <CardDescription>
                  Exclusive signals with precise entry, stop loss, and take profit levels
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Professional Support</CardTitle>
                <CardDescription>
                  24/7 support from our team of experienced trading professionals
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Start Trading?</h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join our community of successful traders and get access to professional insights.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="bg-premium hover:bg-premium/90 text-premium-foreground">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
