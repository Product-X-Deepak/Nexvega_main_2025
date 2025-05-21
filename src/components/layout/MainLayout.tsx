
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ('admin' | 'staff' | 'client')[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  requireAuth = true,
  allowedRoles = ['admin', 'staff']
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userRole, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (requireAuth && !user) {
    return <Navigate to="/login" />;
  }

  // Check role access
  if (requireAuth && user && userRole && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      // Redirect client users to client dashboard
      if (userRole === 'client') {
        return <Navigate to="/client" />;
      }
      // Redirect admin/staff to regular dashboard
      return <Navigate to="/dashboard" />;
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar component */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      {/* Content area */}
      <div className="flex flex-1 flex-col md:ml-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
