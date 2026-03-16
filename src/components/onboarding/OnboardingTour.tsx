import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, BookOpen, Calculator, TrendingUp, Signal, Calendar,
  X, ArrowRight, Sparkles, CheckCircle 
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Market Forecasts",
    description: "Browse expert analysis and market forecasts. Like, comment, and bookmark your favorites.",
    icon: <TrendingUp className="w-6 h-6" />,
    route: "/dashboard/forecasts",
    color: "from-primary to-primary/60",
  },
  {
    title: "Trading Journal",
    description: "Log your trades, track performance, and review analytics to improve your trading.",
    icon: <BookOpen className="w-6 h-6" />,
    route: "/dashboard/journal",
    color: "from-success to-success/60",
  },
  {
    title: "Pip Calculator",
    description: "Calculate pip values, position sizes, and risk-reward ratios before entering trades.",
    icon: <Calculator className="w-6 h-6" />,
    route: "/dashboard/calculator",
    color: "from-warning to-warning/60",
  },
  {
    title: "Economic Calendar",
    description: "Stay informed about high-impact news events that could affect your trades.",
    icon: <Calendar className="w-6 h-6" />,
    route: "/dashboard/calendar",
    color: "from-destructive to-destructive/60",
  },
  {
    title: "Premium Signals",
    description: "Get real-time trading signals with entry, stop loss, and take profit levels.",
    icon: <Signal className="w-6 h-6" />,
    route: "/dashboard/signals",
    color: "from-primary to-success",
  },
];

export function OnboardingTour() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    checkTourStatus();
  }, [user?.id]);

  const checkTourStatus = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_tour_completed')
      .eq('user_id', user.id)
      .single();

    if (data && !data.onboarding_tour_completed && location.pathname === '/dashboard') {
      setShowTour(true);
    }
    setLoading(false);
  };

  const completeTour = async () => {
    if (!user?.id) return;
    await supabase
      .from('profiles')
      .update({ onboarding_tour_completed: true })
      .eq('user_id', user.id);
    setShowTour(false);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handleGoToFeature = () => {
    const step = TOUR_STEPS[currentStep];
    completeTour();
    navigate(step.route);
  };

  if (loading || !showTour) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold text-sm">Quick Tour</span>
            </div>
            <button onClick={completeTour} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 px-6 pb-4">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="px-6 pb-6"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-4`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleGoToFeature} className="text-primary">
              Try it now
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <Button onClick={handleNext} size="sm" className="gap-1.5">
                {currentStep < TOUR_STEPS.length - 1 ? (
                  <>Next <ArrowRight className="w-3.5 h-3.5" /></>
                ) : (
                  <>Done <CheckCircle className="w-3.5 h-3.5" /></>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
