
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, signOut, isAdmin, isStaff, isClient } = useAuth();

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden -ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <h1 className="text-lg font-semibold">
                  {isAdmin() && "Admin Dashboard"}
                  {isStaff() && "Staff Dashboard"}
                  {isClient() && "Client Portal"}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              className="relative rounded-full p-1 text-foreground hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-600"></span>
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-3">
              <div>
                <Menu.Button className="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <span className="sr-only">Open user menu</span>
                  <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-background py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-border">
                    <div className="font-medium">{user?.email}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={cn(
                          active ? 'bg-secondary' : '',
                          'block px-4 py-2 text-sm text-foreground'
                        )}
                      >
                        Your Profile
                      </Link>
                    )}
                  </Menu.Item>
                  {isAdmin() && (
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/settings"
                          className={cn(
                            active ? 'bg-secondary' : '',
                            'block px-4 py-2 text-sm text-foreground'
                          )}
                        >
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={signOut}
                        className={cn(
                          active ? 'bg-secondary' : '',
                          'block w-full text-left px-4 py-2 text-sm text-foreground'
                        )}
                      >
                        <div className="flex items-center">
                          <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
                          Sign out
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </div>
  );
}
