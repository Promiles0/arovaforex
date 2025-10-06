import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, BarChart, TrendingUp, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Edit,
      label: "New Journal Entry",
      onClick: () => navigate('/dashboard/journal'),
      variant: "default" as const,
      primary: true
    },
    {
      icon: BarChart,
      label: "View Analytics",
      onClick: () => navigate('/dashboard/journal'),
      variant: "outline" as const
    },
    {
      icon: TrendingUp,
      label: "Latest Forecast",
      onClick: () => navigate('/dashboard/forecasts'),
      variant: "outline" as const
    },
    {
      icon: DollarSign,
      label: "Track P&L",
      onClick: () => navigate('/dashboard/wallet'),
      variant: "outline" as const
    }
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Button
                key={idx}
                variant={action.variant}
                onClick={action.onClick}
                className={`w-full justify-start gap-3 h-auto py-3 ${
                  action.primary ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
