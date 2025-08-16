'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuthSession } from '@/hooks/useAuthSession';
import { CustomerNav } from '@/components/customer-nav';
import BusinessNavbar from '@/components/business-nav';
import React, { useEffect } from 'react';

function ConditionalNavAndContent({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login/customer');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading application...</p>
      </div>
    );
  }

  if (pathname.startsWith('/login')) {
    return (
      <main className="flex-grow p-4 md:p-6 bg-gray-50 min-h-screen">
        {children}
      </main>
    );
  }

  const NavbarComponent =
    role === 'user'
      ? CustomerNav
      : role === 'business'
      ? BusinessNavbar
      : null;

  return (
    <>
      {NavbarComponent && <NavbarComponent />}
      <main className="flex-grow p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
        {children}
      </main>
    </>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ConditionalNavAndContent>{children}</ConditionalNavAndContent>
    </AuthProvider>
  );
}
