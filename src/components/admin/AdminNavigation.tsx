'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Home,
  Mail,
  Calculator,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  MoreHorizontal,
  Palette,
  FileCode,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Primary navigation items (always visible)
const primaryNavigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
    description: 'Leads Management',
  },
  {
    name: 'Card Builder',
    href: '/admin/card-builder',
    icon: FileText,
    description: 'Card Templates',
  },
  {
    name: 'Calculations',
    href: '/admin/calculations',
    icon: Calculator,
    description: 'Formula Management',
  },
];

// Secondary navigation items (in dropdown)
const secondaryNavigation = [
  {
    name: 'Visual Assets',
    href: '/admin/visual-assets',
    icon: ImageIcon,
    description: 'Manage Images and Assets',
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System Configuration',
  },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return (
      pathname === href || (href !== '/admin' && pathname.startsWith(href))
    );
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 border-b-4 border-gradient-to-r from-blue-400 to-indigo-400 shadow-2xl sticky top-0 z-50 backdrop-blur-md bg-opacity-95 relative overflow-hidden">
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none"></div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - Now more prominent */}
          <div className="flex items-center flex-shrink-0">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap">
                E1 Calculator
              </h1>
            </div>
          </div>

          {/* Primary Navigation Links - Always visible */}
          <div className="hidden md:flex items-center space-x-2 flex-1 justify-center">
            {primaryNavigation.map((item, index) => {
              const active = isActive(item.href);
              return (
                <div key={item.name} className="flex items-center">
                  <Button
                    asChild
                    variant={active ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-9 px-4 transition-all duration-300 ease-out transform hover:scale-105 ${
                      active
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl border-2 border-blue-300/50 backdrop-blur-sm'
                        : 'hover:bg-gradient-to-r hover:from-blue-700/80 hover:to-indigo-700/80 hover:text-white text-blue-100 hover:border-blue-300/30 border-2 border-transparent backdrop-blur-sm hover:shadow-md'
                    }`}
                  >
                    <Link href={item.href} title={item.description}>
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  </Button>
                  {index < primaryNavigation.length - 1 && (
                    <div className="h-6 w-px bg-gradient-to-b from-blue-400/50 via-blue-300 to-transparent mx-2"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Secondary Navigation Dropdown */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 text-blue-100 hover:bg-gradient-to-r hover:from-blue-700/80 hover:to-indigo-700/80 hover:text-white backdrop-blur-sm transition-all duration-300 hover:shadow-md border-2 border-transparent hover:border-blue-300/30"
                >
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  More
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-gradient-to-b from-blue-900/95 to-indigo-900/95 border border-blue-400/30 backdrop-blur-md shadow-2xl"
              >
                {secondaryNavigation.map(item => {
                  const active = isActive(item.href);
                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center w-full px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white'
                            : 'text-blue-100 hover:bg-gradient-to-r hover:from-blue-700/80 hover:to-indigo-700/80 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-blue-200/70">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-blue-100 hover:bg-gradient-to-r hover:from-blue-700/80 hover:to-indigo-700/80 hover:text-white backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 bg-gradient-to-b from-blue-900/95 to-indigo-900/95 border border-blue-400/30 backdrop-blur-md shadow-2xl"
              >
                {/* Primary items */}
                {primaryNavigation.map(item => {
                  const active = isActive(item.href);
                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center w-full px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white'
                            : 'text-blue-100 hover:bg-gradient-to-r hover:from-blue-700/80 hover:to-indigo-700/80 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-blue-200/70">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}

                <DropdownMenuSeparator className="bg-blue-400/30" />

                {/* Secondary items */}
                {secondaryNavigation.map(item => {
                  const active = isActive(item.href);
                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center w-full px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white'
                            : 'text-blue-100 hover:bg-gradient-to-r hover:from-blue-700/80 hover:to-indigo-700/80 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-blue-200/70">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
