'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, SubscriptionPlan } from '@/types/auth';
import { CustomerTier } from '@/types/dealflow';

const STORAGE_KEY = 'dealflow360_auth_user_v1';

export const DEMO_ACCOUNTS: Array<AuthUser & { passwordHint: string; roleLabel: string; title: string }> = [
  {
    id: 'USR-01',
    name: 'Arthur Pendelton',
    email: 'admin@dealflow360.com',
    company: 'DealFlow360 Global',
    role: 'ADMIN',
    roleLabel: 'Admin',
    title: 'System Administrator & Governance Lead',
    passwordHint: 'admin123',
  },
  {
    id: 'USR-02',
    name: 'Marcus Vance',
    email: 'marcus@dealflow360.com',
    company: 'DealFlow360 Deal Desk',
    role: 'SALES_MANAGER',
    roleLabel: 'Sales Manager',
    title: 'Director of Commercial Sales & Deal Desk',
    passwordHint: 'sales123',
  },
  {
    id: 'USR-03',
    name: 'Elena Rostova',
    email: 'elena@dealflow360.com',
    company: 'DealFlow360 Commercial Sales',
    role: 'SALES_EXECUTIVE',
    roleLabel: 'Sales Executive',
    title: 'Senior Enterprise Account Executive',
    passwordHint: 'exec123',
  },
  {
    id: 'USR-04',
    name: 'Sarah Sterling',
    email: 'sarah.sterling@dealflow360.com',
    company: 'DealFlow360 Finance Ops',
    role: 'FINANCE_OFFICER',
    roleLabel: 'Finance Officer',
    title: 'Finance Controller & Risk Sign-Off',
    passwordHint: 'finance123',
  },
  {
    id: 'USR-05',
    name: 'Sarah Jenkins',
    email: 's.jenkins@acmecorp.com',
    company: 'Acme Corporation',
    role: 'CUSTOMER',
    roleLabel: 'Customer (Client)',
    title: 'VP of Global Procurement (Gold Tier)',
    tier: 'Gold',
    subscriptionPlan: 'ENTERPRISE',
    passwordHint: 'acme123',
  },
];

export function normalizeRole(
  role?: string
): 'CUSTOMER' | 'ADMIN' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'FINANCE_OFFICER' {
  if (!role) return 'SALES_EXECUTIVE';
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'CUSTOMER') return 'CUSTOMER';
  if (role === 'SALES_MANAGER' || role === 'DEAL_DESK') return 'SALES_MANAGER';
  if (role === 'FINANCE_OFFICER' || role === 'FINANCE_CONTROLLER') return 'FINANCE_OFFICER';
  if (role === 'SALES_EXECUTIVE' || role === 'SALES_EXEC') return 'SALES_EXECUTIVE';
  return 'SALES_EXECUTIVE';
}

export function getRoleMeta(role?: string) {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'ADMIN':
      return {
        label: 'Admin',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-500',
        description: 'Full administrative access: users, products, price lists, and policy settings',
      };
    case 'SALES_MANAGER':
      return {
        label: 'Sales Manager',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-500',
        description: 'Deal Desk manager: deal approvals, quotations oversight, reports, and risk velocity',
      };
    case 'SALES_EXECUTIVE':
      return {
        label: 'Sales Executive',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
        dotColor: 'bg-teal-500',
        description: 'Field AE: quotation creation, pipeline management, client accounts, fulfillment',
      };
    case 'FINANCE_OFFICER':
      return {
        label: 'Finance Officer',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotColor: 'bg-purple-500',
        description: 'Financial governance: critical risk approvals, invoices, payments, cashflow',
      };
    case 'CUSTOMER':
      return {
        label: 'Customer (Client)',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
        description: 'Procurement portal: quote reviews, negotiations, online invoice settlements',
      };
  }
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, overrideUser?: Partial<AuthUser>) => Promise<AuthUser>;
  switchRole: (role: UserRole) => void;
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

  const switchRole = (role: UserRole) => {
    const norm = normalizeRole(role);
    const matched = DEMO_ACCOUNTS.find((a) => a.role === norm) || DEMO_ACCOUNTS[1];
    setUser(matched);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matched));
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
    <AuthContext.Provider value={{ user, isLoading, login, switchRole, signup, logout }}>
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
