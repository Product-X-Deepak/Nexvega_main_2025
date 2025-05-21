
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: any | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isClient: () => boolean;
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
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, email, company, position, phone, is_active')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        // Validate that we have a proper role
        const role = data.role as UserRole;
        setUserRole(role);
        
        // Update user object with profile data for convenience
        setUser(prev => ({
          ...prev,
          ...data
        }));
      }
      
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
      
      // Set basic user info immediately
      setUser(data.user);
      
      // Get extended profile info
      const role = await getUserProfile(data.user?.id);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user?.email}`,
      });
      
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
      navigate('/login');
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
      
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
    // Check for existing session on component mount
    checkSession();
    
    // Set up auth state listener for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const role = await getUserProfile(session.user.id);
        
        // Redirect based on role
        if (role === 'client') {
          navigate('/client');
        } else {
          navigate('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        navigate('/login');
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Add an additional effect for navigation logic based on auth state
  useEffect(() => {
    if (!loading) {
      // Redirect unauthenticated users to login
      // Except for public routes like login, privacy policy, etc.
      if (!user && 
          window.location.pathname !== '/login' && 
          window.location.pathname !== '/privacy-policy' && 
          window.location.pathname !== '/help') {
        navigate('/login');
      }
      // Redirect authenticated users to appropriate dashboard when on login page
      else if (user && window.location.pathname === '/login') {
        if (userRole === 'client') {
          navigate('/client');
        } else {
          navigate('/dashboard');
        }
      }
      // Redirect users to appropriate section based on role
      else if (user && userRole === 'client' && !window.location.pathname.startsWith('/client')) {
        navigate('/client');
      }
      else if (user && userRole !== 'client' && window.location.pathname.startsWith('/client')) {
        navigate('/dashboard');
      }
    }
  }, [user, loading, userRole, navigate]);

  const hasPermission = (requiredRoles: UserRole[]) => {
    if (!userRole) return false;
    return requiredRoles.includes(userRole);
  };

  const isAdmin = () => userRole === 'admin';
  const isStaff = () => userRole === 'staff';
  const isClient = () => userRole === 'client';

  const value = {
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
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
