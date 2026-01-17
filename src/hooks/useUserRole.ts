import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'user';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole('user');
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && !error) {
          setRole(data.role as UserRole);
        } else {
          // No role found, default to 'user'
          setRole('user');
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, isAdmin: role === 'admin', isLoading };
}
