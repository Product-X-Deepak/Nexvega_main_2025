
import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  HomeIcon, 
  BriefcaseIcon, 
  UserGroupIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Navbar from './Navbar';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/client', icon: HomeIcon },
    { name: 'Candidates', href: '/client/candidates', icon: UserGroupIcon },
    { name: 'Jobs', href: '/client/jobs', icon: BriefcaseIcon },
    { name: 'Help', href: '/client/help', icon: QuestionMarkCircleIcon },
  ];

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
      {/* Client sidebar - simplified compared to main sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-background">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <img
                className="h-8 w-auto"
                src="/placeholder.svg"
                alt="ATS Logo"
              />
              <span className="ml-3 text-lg font-semibold">Client Portal</span>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    location.pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary hover:text-secondary-foreground',
                    'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                  )}
                >
                  <item.icon
                    className={cn(
                      location.pathname === item.href
                        ? 'text-primary-foreground'
                        : 'text-foreground group-hover:text-secondary-foreground',
                      'mr-3 h-5 w-5 flex-shrink-0'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      
      <div className={`flex flex-col ${isMobile ? 'ml-0' : 'ml-64'} transition-all duration-300 ease-in-out`}>
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
        
        <footer className="px-4 sm:px-6 py-3 text-center text-sm text-gray-500">
          <p>© 2025 Client Portal. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
