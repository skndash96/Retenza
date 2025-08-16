import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white p-4">
      <Link
        href="/"
        className="fixed top-4 left-4 z-10 text-xl md:text-2xl font-extrabold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent tracking-wide hover:opacity-90 transition"
      >
        RETENZA
      </Link>
      <div className="flex flex-col items-center">
        {children}
      </div>
    </main>
  );
}