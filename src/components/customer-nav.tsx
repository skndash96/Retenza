'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MenuIcon, XIcon } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { motion, AnimatePresence } from 'framer-motion';

export function CustomerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { logout } = useAuthSession();

  const handleLogout = async () => {
    logout();
    router.push('/login/customer');
  };

  const navItems = [
    { name: 'Dashboard', href: '/customer' },
    { name: 'Profile', href: '/customer/profile' },
    { name: 'Shops', href: '/customer/shops' },
    { name: 'Missions', href: '/customer/missions' },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/customer"
            className="flex items-center space-x-2 group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
              <img
                src="/icon-512.png"
                alt="Retenza Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              RETENZA
            </span>
          </Link>

          <div className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${pathname === item.href
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
              >
                {item.name}
              </Link>
            ))}



            <Button
              variant="outline"
              size="sm"
              className="border-indigo-500 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-600 transition-colors"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            >
              {isMobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${pathname === item.href
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                >
                  {item.name}
                </Link>
              ))}



              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full border-indigo-500 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-600 transition-colors"
              >
                Logout
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
