import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Signal, Wallet, BookOpen, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";

export default function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      {/* Welcome Section */}
      <WelcomeCard />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Link to="/dashboard/academy">
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-premium" />
                <span className="truncate">Academy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-xs text-muted-foreground hidden sm:block">Access premium courses</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/support">
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Support</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-xs text-muted-foreground hidden sm:block">Get help when you need it</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/wallet">
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="truncate">Wallet</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-xs text-muted-foreground hidden sm:block">Manage subscription</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/calendar">
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-xs text-muted-foreground hidden sm:block">Trading events & news</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Latest Forecast */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Latest Forecast
            </CardTitle>
            <CardDescription>Free analysis for all members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border border-border/50">
              <p className="text-muted-foreground text-xs sm:text-sm">EUR/USD Analysis Chart</p>
            </div>
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
              <div>
                <p className="font-medium text-sm sm:text-base">EUR/USD Weekly Outlook</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Posted 2 hours ago</p>
              </div>
              <Link to="/dashboard/forecasts">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Premium Signals */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signal className="w-5 h-5 text-premium" />
              Premium Signals
            </CardTitle>
            <CardDescription>Exclusive trading signals for premium members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="p-4 sm:p-6 border border-border/50 rounded-lg bg-muted/20 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-premium/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Signal className="w-5 h-5 sm:w-6 sm:h-6 text-premium" />
              </div>
              <p className="font-medium mb-2 text-sm sm:text-base">Upgrade to Premium</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Get access to exclusive trading signals with entry, SL, and TP levels.
              </p>
              <Link to="/dashboard/wallet">
                <Button className="bg-premium hover:bg-premium/90 text-premium-foreground text-xs sm:text-sm" size="sm">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30">
              <div className="w-2 h-2 bg-success rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">New forecast published</p>
                <p className="text-xs text-muted-foreground truncate">EUR/USD technical analysis - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30">
              <div className="w-2 h-2 bg-premium rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Premium signal alert</p>
                <p className="text-xs text-muted-foreground truncate">GBP/JPY signal posted - 4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30">
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Calendar event reminder</p>
                <p className="text-xs text-muted-foreground truncate">US NFP data release - Tomorrow 8:30 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}