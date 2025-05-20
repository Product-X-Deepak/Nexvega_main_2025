
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, User, UserRole } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isClient: () => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (userData) {
            setUser(userData as User);
            setUserRole(userData.role as UserRole);
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (userData) {
            setUser(userData as User);
            setUserRole(userData.role as UserRole);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Update last_sign_in timestamp
      if (user) {
        await supabase
          .from('profiles')
          .update({ last_sign_in: new Date().toISOString() })
          .eq('id', user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: (error as Error).message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Role checking helpers
  const isAdmin = () => userRole === 'admin';
  const isStaff = () => userRole === 'staff';
  const isClient = () => userRole === 'client';

  // Permission checking based on role
  const hasPermission = (permission: string) => {
    // Define permissions for each role
    const permissions = {
      admin: [
        'manage_users', 'manage_roles', 'manage_clients', 'manage_candidates',
        'manage_jobs', 'view_analytics', 'edit_settings', 'delete_data',
        'assign_candidates', 'bulk_actions', 'view_all_data', 'download_resumes'
      ],
      staff: [
        'create_candidates', 'upload_resumes', 'edit_candidates', 
        'view_candidates', 'manage_jobs', 'send_emails', 'download_resumes',
        'add_notes', 'move_pipeline'
      ],
      client: [
        'view_assigned_candidates', 'like_candidates', 'reject_candidates',
        'add_feedback', 'view_pipeline'
      ]
    };

    if (!userRole) return false;
    
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    // Check if the role has the specific permission
    return permissions[userRole]?.includes(permission) || false;
  };

  const value = {
    user,
    loading,
    userRole,
    signIn,
    signOut,
    isAdmin,
    isStaff,
    isClient,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
