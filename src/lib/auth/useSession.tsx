'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { User } from '@/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  const user = data?.user || null;

  const logout = async () => {
    await authApi.logout();
    queryClient.setQueryData(['currentUser'], null);
    router.push('/login');
  };

  // Basic route protection
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/signup';
    
    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && isPublicRoute && pathname !== '/') {
      // Redirect logged in users away from login/signup
      switch (user.role) {
        case 'CUSTOMER': router.push('/portal'); break;
        case 'ADMIN': router.push('/admin/dashboard'); break;
        case 'SALES_MANAGER': router.push('/sales-manager/dashboard'); break;
        case 'SALES_EXECUTIVE': router.push('/sales/dashboard'); break;
        case 'FINANCE_OFFICER': router.push('/finance/dashboard'); break;
        default: router.push('/login');
      }
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
