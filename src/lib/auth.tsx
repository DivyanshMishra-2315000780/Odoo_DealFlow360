'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, SubscriptionPlan } from '@/types/auth';
import { CustomerTier } from '@/types/dealflow';

const STORAGE_KEY = 'dealflow360_auth_user_v1';

export const DEMO_ACCOUNTS: Array<AuthUser & { passwordHint: string }> = [
  {
    id: 'USR-01',
    name: 'Marcus Vance',
    email: 'marcus@dealflow360.com',
    company: 'DealFlow360 Internal',
    role: 'DEAL_DESK',
    passwordHint: 'admin123',
  },
  {
    id: 'USR-02',
    name: 'Sarah Sterling',
    email: 'sarah.sterling@dealflow360.com',
    company: 'DealFlow360 Finance',
    role: 'FINANCE_CONTROLLER',
    passwordHint: 'finance123',
  },
  {
    id: 'USR-03',
    name: 'Sarah Jenkins',
    email: 's.jenkins@acmecorp.com',
    company: 'Acme Corporation',
    role: 'CUSTOMER',
    tier: 'Gold',
    subscriptionPlan: 'ENTERPRISE',
    passwordHint: 'acme123',
  },
];

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, overrideUser?: Partial<AuthUser>) => Promise<AuthUser>;
  signup: (data: {
    fullName: string;
    email: string;
    password: string;
    company: string;
    tier: CustomerTier;
    subscriptionPlan?: SubscriptionPlan;
  }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default to Marcus Vance for frictionless demo inspection
        setUser(DEMO_ACCOUNTS[0]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_ACCOUNTS[0]));
      }
    } catch {
      setUser(DEMO_ACCOUNTS[0]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    overrideUser?: Partial<AuthUser>
  ): Promise<AuthUser> => {
    // Simulate slight network delay
    await new Promise((res) => setTimeout(res, 250));

    // Match with demo account if exists, otherwise construct valid session
    const matched = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
    const authenticatedUser: AuthUser = {
      id: matched?.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: overrideUser?.name || matched?.name || email.split('@')[0],
      email,
      company: overrideUser?.company || matched?.company || 'Enterprise Partner',
      role: overrideUser?.role || matched?.role || 'DEAL_DESK',
      tier: overrideUser?.tier || matched?.tier || 'Silver',
      subscriptionPlan: overrideUser?.subscriptionPlan || matched?.subscriptionPlan || 'PROFESSIONAL',
    };

    setUser(authenticatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
    return authenticatedUser;
  };

  const signup = async (data: {
    fullName: string;
    email: string;
    password: string;
    company: string;
    tier: CustomerTier;
    subscriptionPlan?: SubscriptionPlan;
  }): Promise<AuthUser> => {
    await new Promise((res) => setTimeout(res, 300));

    const newUser: AuthUser = {
      id: `USR-${Math.floor(2000 + Math.random() * 8000)}`,
      name: data.fullName,
      email: data.email,
      company: data.company,
      role: 'CUSTOMER',
      tier: data.tier,
      subscriptionPlan: data.subscriptionPlan || 'NONE',
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
