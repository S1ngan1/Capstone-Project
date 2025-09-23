import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
export const useAppRole = () => {
  const { session } = useAuthContext();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          setError(null);
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id);
          if (error) throw error;
          if (data && data.length > 0) {
            setUserRole(data[0].role);
            console.log("User role set to:", data[0].role);
          } else {
            setUserRole('user');
            console.log("User role fallback: user");
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch user role');
          setUserRole('user'); // fallback when there's an error
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setUserRole(null);
      }
    };
    fetchUserRole();
  }, [session]);
  // Helper function to check if user is admin
  const isAdmin = userRole?.trim() === 'admin';
  // Helper function to check if user has specific role
  const hasRole = (role: string) => userRole?.trim() === role;
  return {
    userRole,
    loading,
    error,
    isAdmin,
    hasRole,
  };
};
