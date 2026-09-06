'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useToast } from '@/components/providers/query-provider';
import { useRouter } from 'next/navigation';
import {
  FileText,
  CreditCard,
  User,
  LayoutDashboard,
  Sparkles,
  ArrowLeft,
  Building,
  ShieldCheck,
  RefreshCcw,
  ClipboardList,
} from 'lucide-react';
import { TierBadge } from '@/components/ui/tier-badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const customerName = user?.company || '';
  const customerTier = user?.tier || 'Bronze';

  const portalNav = [
    { label: 'Overview', href: '/portal', icon: LayoutDashboard },
    { label: 'My Requirements', href: '/portal/requirements', icon: ClipboardList },
    { label: 'My Quotations', href: '/portal/quotations', icon: FileText },
    { label: 'Invoices', href: '/portal/invoices', icon: CreditCard },
    { label: 'Subscriptions', href: '/portal/subscriptions', icon: RefreshCcw },
    { label: 'Profile', href: '/portal/profile', icon: User },
  ];

  const handleLogout = async () => {
    try {
      logout();
      toast({
        title: 'Logout SuccessFull',
        type: 'success',
      });
      router.push('/login');
    } catch {
      toast({
        title: 'Authentication Failed',
        description: 'Invalid credentials. Please verify your email and password.',
        type: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Client Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-enterprise">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Client Branding */}
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/portal" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-enterprise group-hover:bg-teal-700 transition">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 tracking-tight text-lg leading-none">
                      DealFlow<span className="text-teal-600">360</span>
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded">
                      Client Portal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">Commercial Negotiation & Procurement</p>
                </div>
              </Link>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              {/* Company & Tier Badge */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="p-1 rounded-md bg-slate-100 text-slate-600">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 leading-none block">
                    {customerName}
                  </span>
                  <div className="mt-0.5">
                    <TierBadge tier={customerTier} size="sm" showLimitNotice />
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Internal Dashboard Button */}
            <div className="flex items-center gap-3">
              <Link href="/portal/profile">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-600">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Account</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              </Link>
              <Button onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>

        {/* Portal Navigation Bar */}
        <div className="border-t border-slate-100 bg-slate-50/90 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto">
            {portalNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/portal'
                  ? pathname === '/portal'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition ${
                    isActive
                      ? 'bg-white text-teal-800 shadow-enterprise font-semibold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
