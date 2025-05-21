
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Users,
  Briefcase,
  Building,
  LayoutDashboard,
  Menu,
  LogOut,
  Settings,
  User,
  HelpCircle,
  MessageSquare,
  FileText,
  FilePlus,
  ChevronRight,
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  const isAdmin = () => userRole === 'admin';
  const isStaff = () => userRole === 'staff';
  const isClient = () => userRole === 'client';
  
  // Navigation items based on user role
  const navItems = [
    {
      title: 'Dashboard',
      href: isClient() ? '/client' : '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['admin', 'staff', 'client'],
    },
    {
      title: 'Candidates',
      href: isClient() ? '/client/candidates' : '/candidates',
      icon: <Users className="h-5 w-5" />,
      roles: ['admin', 'staff', 'client'],
    },
    {
      title: 'Jobs',
      href: isClient() ? '/client/jobs' : '/jobs',
      icon: <Briefcase className="h-5 w-5" />,
      roles: ['admin', 'staff', 'client'],
    },
    {
      title: 'Clients',
      href: '/clients',
      icon: <Building className="h-5 w-5" />,
      roles: ['admin', 'staff'],
    },
    {
      title: 'AI Assistant',
      href: '/ai-assistant',
      icon: <MessageSquare className="h-5 w-5" />,
      roles: ['admin', 'staff'],
    },
  ];
  
  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userRole || '')
  );
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  // Helper function to get user initials
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };
  
  const getActiveStyles = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
      ? 'bg-primary text-primary-foreground'
      : 'hover:bg-muted';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col border-r bg-background h-full">
          <div className="h-16 flex items-center px-4 border-b">
            <Link 
              to={isClient() ? '/client' : '/dashboard'} 
              className="flex items-center gap-2"
            >
              <img
                src="/logo.svg"
                alt="NexVega"
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold tracking-tight">NexVega</span>
            </Link>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
            <nav className="flex-1 px-2 space-y-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${getActiveStyles(item.href)}`}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              ))}
              
              {/* Add Candidate section for admin/staff */}
              {(isAdmin() || isStaff()) && (
                <div className="pt-4 mt-4 border-t">
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                  </h3>
                  <div className="mt-2 space-y-1">
                    <Link
                      to="/candidates/new"
                      className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"
                    >
                      <FilePlus className="h-5 w-5 mr-3" />
                      Add Candidate
                    </Link>
                    <Link
                      to="/candidates/upload"
                      className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"
                    >
                      <FileText className="h-5 w-5 mr-3" />
                      Upload Resumes
                    </Link>
                  </div>
                </div>
              )}
            </nav>
          </div>
          <div className="h-16 flex items-center px-4 border-t">
            <div className="w-full flex justify-between items-center">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.email}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {userRole} Role
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(isClient() ? '/client/profile' : '/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(isClient() ? '/client/settings' : '/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(isClient() ? '/client/help' : '/help')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden border-b sticky top-0 z-10 bg-background">
        <div className="flex items-center h-16 px-4 justify-between">
          <div className="flex items-center">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img
                      src="/logo.svg"
                      alt="NexVega"
                      className="h-6 w-auto"
                    />
                    NexVega
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-8">
                  {filteredNavItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="flex items-center px-3 py-2 text-base font-medium rounded-md hover:bg-muted"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                  
                  {(isAdmin() || isStaff()) && (
                    <>
                      <div className="h-px bg-border my-4" />
                      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Quick Actions
                      </h3>
                      <Link
                        to="/candidates/new"
                        className="flex items-center px-3 py-2 text-base font-medium rounded-md hover:bg-muted"
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <FilePlus className="h-5 w-5 mr-3" />
                        Add Candidate
                      </Link>
                      <Link
                        to="/candidates/upload"
                        className="flex items-center px-3 py-2 text-base font-medium rounded-md hover:bg-muted"
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <FileText className="h-5 w-5 mr-3" />
                        Upload Resumes
                      </Link>
                    </>
                  )}
                </nav>
                <div className="absolute bottom-4 left-4 right-4">
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Link to={isClient() ? '/client' : '/dashboard'} className="flex items-center gap-2 ml-2">
              <img
                src="/logo.svg"
                alt="NexVega"
                className="h-6 w-auto"
              />
              <span className="font-bold tracking-tight">NexVega</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.email}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {userRole} Role
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(isClient() ? '/client/profile' : '/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(isClient() ? '/client/settings' : '/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(isClient() ? '/client/help' : '/help')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
