'use client';

import { useAuth } from '@/lib/auth/useSession';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If no user is logged in, useAuth should redirect to /login.
  // We'll return null here to avoid flashing the app shell.
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 overflow-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
