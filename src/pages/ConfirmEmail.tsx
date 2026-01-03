import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfirmEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const email = location.state?.email || '';
  const message = location.state?.message || 'Please check your email to confirm your account.';

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check if user is already confirmed
  useEffect(() => {
    const checkConfirmation = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.email_confirmed_at) {
        // Already confirmed, redirect to dashboard
        navigate('/dashboard');
      }
    };

    checkConfirmation();

    // Listen for auth changes (when user confirms via email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user.email_confirmed_at) {
        toast({
          title: "Email Confirmed",
          description: "Your email has been confirmed successfully!",
        });
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Resend confirmation email
  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email address not found. Please try signing up again.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: "Confirmation email sent! Please check your inbox.",
      });
      setCountdown(60); // 60 second cooldown
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 group transition-all duration-300 hover:scale-105"
          >
            <img
              src="https://raw.githubusercontent.com/Promiles0/assets/main/apple-touch-icon.png"
              alt="ArovaForex Logo"
              className="w-10 h-10 rounded-xl object-contain"
            />
            <span className="text-2xl font-bold">
              <span className="text-foreground group-hover:text-primary transition-colors duration-300">
                Arova
              </span>
              <span className="text-primary group-hover:text-foreground transition-colors duration-300 ml-1">
                Forex
              </span>
            </span>
          </Link>
        </div>

        {/* Confirmation Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {/* Email Icon */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-4">
            Check Your Email
          </h1>

          {/* Message */}
          <p className="text-center text-muted-foreground mb-4">
            {message}
          </p>

          {/* Email Display */}
          {email && (
            <p className="text-center text-primary font-medium mb-6 bg-primary/5 py-2 px-4 rounded-lg">
              {email}
            </p>
          )}

          {/* Instructions */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-foreground mb-3">
              📧 What to do next:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                Check your email inbox (and spam folder)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                Click the confirmation link we sent you
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                You'll be automatically signed in
              </li>
            </ul>
          </div>

          {/* Resend Button */}
          <Button
            onClick={handleResendEmail}
            disabled={isResending || countdown > 0}
            className="w-full mb-4"
            variant="default"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend Confirmation Email'
            )}
          </Button>

          {/* Back to Sign In */}
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={handleResendEmail}
                disabled={isResending || countdown > 0}
                className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                resend confirmation email
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
