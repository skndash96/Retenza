import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white p-4">
      <div className="flex flex-col items-center">
        {children}
      </div>
    </main>
  );
}