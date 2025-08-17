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
    <nav className="bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-50 shadow-md p-4 md:px-6 border-b border-amber-200">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/customer"
          className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent tracking-wide hover:opacity-90 transition"
        >
          RETENZA
        </Link>

        <div className="hidden md:flex space-x-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-lg font-medium transition ${
                pathname === item.href
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent'
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500 text-amber-700 hover:bg-amber-100"
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
            className="text-amber-800 hover:bg-amber-100"
          >
            {isMobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden mt-4 space-y-2 px-2 pb-3 pt-2 bg-white/70 backdrop-blur-sm rounded-md shadow-inner border border-amber-100"
          >
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-900'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Button
              variant="outline"
              className="w-full mt-2 border-amber-500 text-amber-700 hover:bg-amber-100"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
