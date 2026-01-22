import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'supervisor' | 'lead' | 'guide' | 'user';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [loginName, setLoginName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole('user');
      setLoginName(null);
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        // Fetch role from user_roles
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData && !roleError) {
          setRole(roleData.role as UserRole);
        } else {
          setRole('user');
        }

        // Fetch login_name from user_accounts if available
        const { data: accountData } = await supabase
          .from('user_accounts')
          .select('login_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (accountData?.login_name) {
          setLoginName(accountData.login_name);
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

  return { 
    role, 
    loginName,
    isAdmin: role === 'admin', 
    isSupervisor: role === 'supervisor',
    isLead: role === 'lead',
    isGuide: role === 'guide',
    canViewAllData: role === 'admin' || role === 'supervisor' || role === 'lead',
    canExport: role === 'admin' || role === 'supervisor' || role === 'lead',
    canUpload: role === 'admin',
    canEditData: role === 'admin',
    isLoading 
  };
}