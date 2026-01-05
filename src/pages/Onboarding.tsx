import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out with trading' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years of trading experience' },
  { value: 'advanced', label: 'Advanced', description: '3+ years of active trading' },
  { value: 'professional', label: 'Professional', description: 'Full-time trader or fund manager' },
];

const TRADING_STYLES = [
  { value: 'scalping', label: 'Scalping', description: 'Quick trades, minutes to hours' },
  { value: 'day_trading', label: 'Day Trading', description: 'Intraday positions, no overnight' },
  { value: 'swing_trading', label: 'Swing Trading', description: 'Hold for days to weeks' },
  { value: 'position_trading', label: 'Position Trading', description: 'Long-term, weeks to months' },
];

const FAVORITE_INSTRUMENTS = [
  { value: 'EUR/USD', label: 'EUR/USD' },
  { value: 'GBP/USD', label: 'GBP/USD' },
  { value: 'USD/JPY', label: 'USD/JPY' },
  { value: 'XAU/USD', label: 'Gold (XAU/USD)' },
  { value: 'BTC/USD', label: 'Bitcoin (BTC/USD)' },
  { value: 'US30', label: 'Dow Jones (US30)' },
  { value: 'NAS100', label: 'NASDAQ (NAS100)' },
  { value: 'GBP/JPY', label: 'GBP/JPY' },
];

const RISK_TOLERANCE = [
  { value: 'conservative', label: 'Conservative', description: 'Low risk, steady returns' },
  { value: 'medium', label: 'Moderate', description: 'Balanced risk and reward' },
  { value: 'aggressive', label: 'Aggressive', description: 'Higher risk for bigger gains' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    experience_level: '',
    trading_style: '',
    favorite_instruments: [] as string[],
    risk_tolerance: 'medium',
    trading_goals: '',
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleInstrumentToggle = (instrument: string) => {
    setFormData(prev => ({
      ...prev,
      favorite_instruments: prev.favorite_instruments.includes(instrument)
        ? prev.favorite_instruments.filter(i => i !== instrument)
        : [...prev.favorite_instruments, instrument],
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          experience_level: formData.experience_level,
          trading_style: formData.trading_style,
          favorite_instruments: formData.favorite_instruments,
          risk_tolerance: formData.risk_tolerance,
          trading_goals: formData.trading_goals,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Welcome to ArovaForex!",
        description: "Your profile has been set up successfully.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!formData.experience_level;
      case 2:
        return !!formData.trading_style;
      case 3:
        return formData.favorite_instruments.length > 0;
      case 4:
        return !!formData.risk_tolerance;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2">
            <img
              src="https://raw.githubusercontent.com/Promiles0/assets/main/apple-touch-icon.png"
              alt="ArovaForex Logo"
              className="w-10 h-10 rounded-xl object-contain"
            />
            <span className="text-2xl font-bold">
              <span className="text-foreground">Arova</span>
              <span className="text-primary ml-1">Forex</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-success"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What's your trading experience?
                </h2>
                <p className="text-muted-foreground mb-6">
                  This helps us personalize your experience.
                </p>

                <div className="grid gap-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setFormData({ ...formData, experience_level: level.value })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.experience_level === level.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{level.label}</div>
                          <div className="text-sm text-muted-foreground">{level.description}</div>
                        </div>
                        {formData.experience_level === level.value && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What's your trading style?
                </h2>
                <p className="text-muted-foreground mb-6">
                  We'll show you relevant forecasts and signals.
                </p>

                <div className="grid gap-3">
                  {TRADING_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setFormData({ ...formData, trading_style: style.value })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.trading_style === style.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{style.label}</div>
                          <div className="text-sm text-muted-foreground">{style.description}</div>
                        </div>
                        {formData.trading_style === style.value && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What do you trade?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select your favorite instruments (choose multiple).
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {FAVORITE_INSTRUMENTS.map((instrument) => (
                    <button
                      key={instrument.value}
                      onClick={() => handleInstrumentToggle(instrument.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.favorite_instruments.includes(instrument.value)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{instrument.label}</span>
                        {formData.favorite_instruments.includes(instrument.value) && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What's your risk tolerance?
                </h2>
                <p className="text-muted-foreground mb-6">
                  This helps us filter signals that match your style.
                </p>

                <div className="grid gap-3 mb-6">
                  {RISK_TOLERANCE.map((risk) => (
                    <button
                      key={risk.value}
                      onClick={() => setFormData({ ...formData, risk_tolerance: risk.value })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.risk_tolerance === risk.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{risk.label}</div>
                          <div className="text-sm text-muted-foreground">{risk.description}</div>
                        </div>
                        {formData.risk_tolerance === risk.value && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Trading Goals (Optional)
                  </label>
                  <textarea
                    value={formData.trading_goals}
                    onChange={(e) => setFormData({ ...formData, trading_goals: e.target.value })}
                    placeholder="e.g., Generate consistent monthly income, build long-term wealth..."
                    className="w-full p-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Skip Button */}
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
