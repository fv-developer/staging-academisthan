import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'super_admin' | 'admin' | 'user';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function useUserRole() {
  const { user, session } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !session) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/role`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRole(data.role as AppRole);
        } else {
          setRole('user');
        }
      } catch (error) {
        console.error('Failed to fetch role:', error);
        setRole('user');
      }
      setLoading(false);
    };

    fetchRole();
  }, [user, session]);

  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'super_admin' || role === 'admin';

  return { role, loading, isSuperAdmin, isAdmin };
}
