
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  hasPermission: (requiredRoles: string[]) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isClient: () => boolean;
}

export function useProvideAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setUserRole(data?.role || null);
      return data?.role;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserRole(null);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;
      
      setUser(data.user);
      await getUserProfile(data.user?.id);
      
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error: (error as Error).message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setUserRole(null);
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: (error as Error).message };
    }
  };

  const checkSession = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (data.session?.user) {
        setUser(data.session.user);
        await getUserProfile(data.session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        getUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (requiredRoles: string[]) => {
    if (!userRole) return false;
    return requiredRoles.includes(userRole);
  };

  const isAdmin = () => userRole === 'admin';
  const isStaff = () => userRole === 'staff';
  const isClient = () => userRole === 'client';

  return {
    user,
    userRole,
    loading,
    signIn,
    signOut,
    hasPermission,
    isAdmin,
    isStaff,
    isClient,
  };
}

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  signIn: async () => ({ data: null, error: 'Not implemented' }),
  signOut: async () => ({ error: 'Not implemented' }),
  hasPermission: () => false,
  isAdmin: () => false,
  isStaff: () => false,
  isClient: () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useProvideAuth();
  
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
