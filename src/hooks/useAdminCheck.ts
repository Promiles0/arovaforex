import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdminCheck() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (active) {
          if (error) {
            console.error('Admin check failed:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(Boolean(data));
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (active) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}
