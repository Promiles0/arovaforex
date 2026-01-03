import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but email not confirmed - redirect to confirm email page
  if (!user.email_confirmed_at) {
    return <Navigate to="/auth/confirm-email" state={{ email: user.email }} replace />;
  }

  // Logged in and email confirmed - allow access
  return <>{children}</>;
}