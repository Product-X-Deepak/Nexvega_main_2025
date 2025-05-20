
import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  HomeIcon, 
  UserIcon, 
  UserGroupIcon, 
  BriefcaseIcon, 
  Cog6ToothIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { isAdmin, isStaff, isClient } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'staff', 'client'] },
    { name: 'Candidates', href: '/candidates', icon: UserIcon, roles: ['admin', 'staff'] },
    { name: 'Clients', href: '/clients', icon: UserGroupIcon, roles: ['admin', 'staff'] },
    { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon, roles: ['admin', 'staff', 'client'] },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['admin'] },
    { name: 'Chat Assistant', href: '/chat-assistant', icon: ChatBubbleLeftRightIcon, roles: ['admin', 'staff'] },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (isAdmin() && item.roles.includes('admin')) return true;
    if (isStaff() && item.roles.includes('staff')) return true;
    if (isClient() && item.roles.includes('client')) return true;
    return false;
  });

  // Mobile sidebar
  if (isMobile) {
    return (
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <img
                      className="h-8 w-auto"
                      src="/placeholder.svg"
                      alt="ATS Logo"
                    />
                    <span className="ml-3 text-lg font-semibold">ATS System</span>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul className="-mx-2 space-y-1">
                          {filteredNavigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={cn(
                                  location.pathname === item.href
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-foreground hover:bg-secondary hover:text-secondary-foreground',
                                  'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                                )}
                                onClick={() => isMobile && setOpen(false)}
                              >
                                <item.icon
                                  className="h-6 w-6 shrink-0"
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    );
  }

  // Desktop sidebar
  return (
    <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
      <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-background">
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-4">
            <img
              className="h-8 w-auto"
              src="/placeholder.svg"
              alt="ATS Logo"
            />
            <span className="ml-3 text-lg font-semibold">ATS System</span>
          </div>
          <nav className="mt-5 flex-1 space-y-1 px-2">
            {filteredNavigation.map((item) => (
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
  );
}
