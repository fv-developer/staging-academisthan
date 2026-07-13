import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'super_admin' | 'admin' | 'user';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role')
        .limit(1);

      if (data && data.length > 0) {
        setRole(data[0].role as AppRole);
      } else {
        setRole('user');
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'super_admin' || role === 'admin';

  return { role, loading, isSuperAdmin, isAdmin };
}
