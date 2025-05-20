
import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full"></div>
          <div className="space-y-4">
            <div className="h-4 w-48 bg-primary/20 rounded"></div>
            <div className="h-4 w-32 bg-primary/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // If not logged in, we should redirect to login screen
    // which is handled at the route level
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={`flex flex-col ${isMobile ? 'ml-0' : 'ml-64'} transition-all duration-300 ease-in-out`}>
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
        
        <footer className="px-4 sm:px-6 py-3 text-center text-sm text-gray-500">
          <p>© 2025 ATS System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
