'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, UserRole, SubscriptionPlan } from '@/types/auth';
import { useQueryClient } from '@tanstack/react-query';
import { CustomerTier } from '@/types/dealflow';

const STORAGE_KEY = 'dealflow360_auth_user_v1';

// ──────────────────────────────────────────────────────────────────────
// Demo Accounts — used for quick-fill login buttons
// Passwords match what the seed script inserts (bcrypt hashed in DB)
// ──────────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────────
// Backend Auth API Types & Responses
// ──────────────────────────────────────────────────────────────────────

export interface UserSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  current?: boolean;
}

interface BackendAuthUser {
  userId: string;
  customerId: string | null;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  sessionId: string;
}

interface BackendAuthResult {
  user: BackendAuthUser;
  accessToken: string;
  expiresIn: number;
  isPendingApproval?: boolean;
  message?: string;
}

/** Transform backend AuthenticatedUser to frontend AuthUser */
function backendToFrontendUser(backend: BackendAuthUser, isPendingApproval = false): AuthUser {
  // Find a matching demo account for enriched data (company, tier, etc.)
  const demo = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === backend.email.toLowerCase()
  );

  return {
    id: backend.userId,
    sessionId: backend.sessionId,
    customerId: backend.customerId ?? undefined,
    name: `${backend.firstName} ${backend.lastName}`,
    email: backend.email,
    company: demo?.company ?? 'Enterprise Partner',
    role: normalizeRole(backend.role),
    tier: demo?.tier as CustomerTier | undefined,
    subscriptionPlan: demo?.subscriptionPlan as SubscriptionPlan | undefined,
    isPendingApproval,
  };
}

async function enrichCustomer(user: AuthUser): Promise<AuthUser> {
  if (user.role !== 'CUSTOMER') return user;
  try {
    const response = await fetch('/api/customer/profile', { credentials: 'include' });
    if (!response.ok) return user;
    const body = await response.json();
    const customer = (body.data ?? body).customer;
    return {
      ...user,
      customerId: customer?.id ?? user.customerId,
      company: customer?.name ?? user.company,
      tier: customer?.tier
        ? (customer.tier.charAt(0) + customer.tier.slice(1).toLowerCase()) as CustomerTier
        : user.tier,
    };
  } catch {
    return user;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Complete Auth API Calls (All Auth Endpoints Implemented)
// ──────────────────────────────────────────────────────────────────────

/**
 * 1. POST /api/auth/login
 */
async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.error ?? error.message ?? 'Invalid credentials');
  }

  const data: BackendAuthResult = await res.json();
  return enrichCustomer(backendToFrontendUser(data.user));
}

/**
 * 2. POST /api/auth/signup
 */
async function apiSignup(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName?: string;
  userType?: 'CUSTOMER' | 'INTERNAL';
}): Promise<AuthUser> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Signup failed' }));
    throw new Error(error.error ?? error.message ?? 'Signup failed');
  }

  const result: BackendAuthResult = await res.json();
  return enrichCustomer(backendToFrontendUser(result.user, result.isPendingApproval));
}

/**
 * 3. GET /api/auth/me
 */
async function apiGetMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.user) return null;
    return enrichCustomer(backendToFrontendUser(data.user));
  } catch {
    return null;
  }
}

/**
 * 4. POST /api/auth/logout
 */
async function apiLogout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Always clear local state even if API call fails
  }
}

/**
 * 5. POST /api/auth/refresh
 */
async function apiRefreshToken(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data: BackendAuthResult = await res.json();
    if (!data.user) return null;
    return enrichCustomer(backendToFrontendUser(data.user));
  } catch {
    return null;
  }
}

/**
 * 6. GET /api/auth/sessions
 */
async function apiGetSessions(): Promise<UserSession[]> {
  try {
    const res = await fetch('/api/auth/sessions', {
      credentials: 'include',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? data) as UserSession[];
  } catch {
    return [];
  }
}

/**
 * 7. DELETE /api/auth/sessions
 */
async function apiRevokeSession(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/sessions', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Auth Context & Provider
// ──────────────────────────────────────────────────────────────────────

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
    tier?: CustomerTier;
    subscriptionPlan?: SubscriptionPlan;
    userType?: 'CUSTOMER' | 'INTERNAL';
  }) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  refreshSession: () => Promise<AuthUser | null>;
  getSessions: () => Promise<UserSession[]>;
  revokeSession: (sessionId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    localStorage.removeItem(STORAGE_KEY);
    apiGetMe().then((value) => {
      if (active) {
        setUser(value);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const refreshUser = useCallback(async () => {
    const updated = await apiGetMe();
    setUser(updated);
    return updated;
  }, []);


  const login = useCallback(
    async (email: string, password: string, overrideUser?: Partial<AuthUser>): Promise<AuthUser> => {
      const authenticated = await apiLogin(email, password);
      const mergedUser = authenticated;
      void overrideUser;
      await queryClient.cancelQueries();
      queryClient.clear();
      setUser(mergedUser);
      return mergedUser;
    },
    [queryClient]
  );

  const signup = useCallback(
    async (data: {
      fullName: string;
      email: string;
      password: string;
      company: string;
      tier?: CustomerTier;
      subscriptionPlan?: SubscriptionPlan;
      userType?: 'CUSTOMER' | 'INTERNAL';
    }): Promise<AuthUser> => {
      const [firstName, ...rest] = data.fullName.trim().split(/\s+/);
      const authenticated = await apiSignup({
        firstName,
        lastName: rest.join(' ') || firstName,
        email: data.email,
        password: data.password,
        companyName: data.company,
        userType: data.userType ?? 'CUSTOMER',
      });
      // If the account is pending approval (internal user), don't set global active session
      if (!authenticated.isPendingApproval) {
        await queryClient.cancelQueries();
        queryClient.clear();
        setUser(authenticated);
      }
      return authenticated;
    },
    [queryClient]
  );

  const logout = useCallback(() => {
    setIsLoading(true);
    apiLogout().finally(async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      setUser(null);
      setIsLoading(false);
      window.location.assign('/login');
    });
  }, [queryClient]);
  // A role is determined by the authenticated account. Choose another account by logging in.


  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    const refreshed = await apiRefreshToken();
    if (refreshed) {
      setUser(refreshed);
    }
    return refreshed;
  }, []);

  const getSessions = useCallback(async (): Promise<UserSession[]> => {
    return apiGetSessions();
  }, []);

  const revokeSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      const success = await apiRevokeSession(sessionId);
      if (success && user && user.sessionId === sessionId) {
        logout();
      }
      return success;
    },
    [user, logout]
  );

  // Role switching allows quick switching between demo profiles
  const switchRole = useCallback(
    (role: UserRole) => {
      const norm = normalizeRole(role);
      const matched = DEMO_ACCOUNTS.find((a) => a.role === norm) || DEMO_ACCOUNTS[1];
      apiLogin(matched.email, matched.passwordHint)
        .then(async (backendUser) => {
          await queryClient.cancelQueries();
          queryClient.clear();
          setUser(backendUser);
        })
        .catch(() => {
          logout();
        });
    },
    [queryClient, logout]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        switchRole,
        signup,
        logout,
        refreshUser: refreshSession,
        refreshSession,
        getSessions,
        revokeSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
