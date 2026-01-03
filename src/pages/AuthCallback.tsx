import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the session from the URL hash (OAuth callback)
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data.session) {
        const user = data.session.user;

        // Check if email is confirmed
        if (!user.email_confirmed_at) {
          setStatus('error');
          toast({
            title: "Email Confirmation Required",
            description: "Please confirm your email address before signing in.",
            variant: "destructive",
          });
          navigate('/auth/confirm-email', { state: { email: user.email } });
          return;
        }

        // Email confirmed - success!
        setStatus('success');
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });

        // Small delay for better UX
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        throw new Error('No session found');
      }
    } catch (error: any) {
      setStatus('error');
      console.error('Auth callback error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });

      // Redirect to login after error
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-lg text-muted-foreground">Completing sign in...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <p className="text-lg text-foreground">Success! Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <p className="text-lg text-foreground">Authentication failed</p>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
