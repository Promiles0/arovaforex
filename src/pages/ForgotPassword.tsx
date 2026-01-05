import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast({
        title: "Email Sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {isEmailSent ? (
            <>
              {/* Success State */}
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>

              <h1 className="text-2xl font-bold text-center text-foreground mb-4">
                Check Your Email
              </h1>

              <p className="text-center text-muted-foreground mb-6">
                We've sent a password reset link to:
              </p>

              <p className="text-center text-primary font-medium mb-6 bg-primary/5 py-2 px-4 rounded-lg">
                {email}
              </p>

              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">1.</span>
                    Check your email inbox (and spam folder)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">2.</span>
                    Click the reset password link
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">3.</span>
                    Create a new secure password
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => setIsEmailSent(false)}
                variant="outline"
                className="w-full mb-4"
              >
                Try a different email
              </Button>
            </>
          ) : (
            <>
              {/* Request Reset State */}
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-center text-foreground mb-4">
                Forgot Password?
              </h1>

              <p className="text-center text-muted-foreground mb-6">
                No worries! Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="transition-all duration-300 focus:scale-[1.02]"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Back to Sign In */}
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
