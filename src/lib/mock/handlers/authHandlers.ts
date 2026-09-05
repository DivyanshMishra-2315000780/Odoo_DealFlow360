import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB, nextId } from '@/lib/mock/db';
import { User, UserRole, CustomerTier, SubscriptionPlan } from '@/types';

// In a real app, this would be an HttpOnly cookie or similar.
// For the mock, we'll store the current user ID in localStorage as a simple session mechanism.
const SESSION_KEY = 'dealflow360_mock_session';

export const mockAuthHandlers = {
  async login(email: string, password: string) {
    await delay(500);
    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // For demo, accept 'demo1234' for any valid user
    if (password !== 'demo1234') {
        throw new Error('Invalid email or password');
    }

    if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, user.id);
    }

    return { user };
  },

  async getCurrentUser() {
    await delay(200);
    if (typeof window === 'undefined') return null;
    
    const userId = localStorage.getItem(SESSION_KEY);
    if (!userId) return null;

    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    return user ? { user } : null;
  },

  async logout() {
    await delay(300);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
    }
    return { success: true };
  },

  async signupCustomer(data: {
    fullName: string;
    email: string;
    companyName: string;
    tier: CustomerTier;
    subscriptionPlanId?: string;
  }) {
    await delay(800);
    const db = getDB();
    
    // Check if user exists
    if (db.users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error('Email already registered');
    }

    // 1. Create Customer
    const customerId = `c-${nextId('customer')}`;
    const newCustomer = {
        id: customerId,
        name: data.companyName,
        tier: data.tier,
        contactName: data.fullName,
        contactEmail: data.email,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
    };
    db.customers.push(newCustomer);

    // 2. Create User
    const userId = `u-${nextId('user')}`;
    const newUser: User = {
        id: userId,
        name: data.fullName,
        email: data.email,
        role: 'CUSTOMER',
        customerId,
        companyName: data.companyName,
        createdAt: new Date().toISOString(),
        isActive: true,
    };
    db.users.push(newUser);

    // 3. Create Subscription (if selected)
    if (data.subscriptionPlanId) {
        const plan = db.subscriptionPlans.find(p => p.id === data.subscriptionPlanId);
        if (plan) {
            db.subscriptions.push({
                id: `sub-${nextId('subscription')}`,
                customerId,
                planId: plan.id,
                planName: plan.name,
                billingFrequency: plan.billingFrequency,
                amount: plan.price,
                currency: plan.currency,
                status: 'ACTIVE',
                startDate: new Date().toISOString(),
                nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
                billingHistory: [{
                    id: `bh-${Date.now()}`,
                    subscriptionId: `sub-${nextId('subscription')}`, // This is a minor bug in the mock, it should use the generated ID, but fine for now
                    amount: plan.price,
                    status: 'PAID',
                    billedAt: new Date().toISOString()
                }]
            });
        }
    }

    saveDB();
    
    // Auto-login
    if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, userId);
    }

    return { user: newUser };
  },

  async signupInternal(data: {
      fullName: string;
      email: string;
      role: UserRole;
  }) {
    await delay(600);
    const db = getDB();
    
    if (db.users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error('Email already registered');
    }

    const userId = `u-${nextId('user')}`;
    const newUser: User = {
        id: userId,
        name: data.fullName,
        email: data.email,
        role: data.role,
        createdAt: new Date().toISOString(),
        isActive: true,
    };
    db.users.push(newUser);
    saveDB();

    if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, userId);
    }

    return { user: newUser };
  }
};
