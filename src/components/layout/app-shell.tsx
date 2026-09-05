'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Users,
  CreditCard,
  Truck,
  Search,
  Bell,
  Activity,
  Layers,
  CheckCircle,
  Command,
  RefreshCcw,
} from 'lucide-react';
import { useResetDemoData } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const resetMutation = useResetDemoData();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Distraction-free full-screen layout for authentication & dedicated customer portal
  if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/portal')) {
    return <>{children}</>;
  }

  const handleResetData = async () => {
    try {
      await resetMutation.mutateAsync();
      toast({
        title: 'Demo Data Restored',
        description: 'All mock quotations, audits, and invoices have been reset to default seeds.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Reset Failed',
        description: 'Unable to clear demo storage.',
        type: 'error',
      });
    }
  };

  const navItems = [
    { label: 'Deal Overview', href: '/', icon: Activity },
    { label: 'Quotations', href: '/quotes', icon: FileText, badge: 'Live' },
    { label: 'Discount Approvals', href: '/approvals', icon: ShieldCheck, alert: true },
    { label: 'Invoices & Cashflow', href: '/invoices', icon: CreditCard },
    { label: 'Fulfillment & Logistics', href: '/fulfillment', icon: Truck },
    { label: 'Subscriptions', href: '/subscriptions', icon: RefreshCcw },
    { label: 'Customer Tiers', href: '/#customers', icon: Users },
    { label: 'Client Portal', href: '/portal', icon: Sparkles, badge: 'Client' },
  ];

  const workflowSteps = [
    'Quotation',
    'Discount Check',
    'Risk Eval',
    'Approval',
    'Negotiation',
    'Confirmation',
    'Fulfillment',
    'Invoice',
    'Deal Health',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Header: Enterprise Deal Lifecycle Progress Indicator */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-enterprise">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-enterprise group-hover:bg-teal-700 transition">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 tracking-tight text-lg leading-none">
                      DealFlow<span className="text-teal-600">360</span>
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded">
                      Enterprise
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">B2B Deal Governance & Intelligence</p>
                </div>
              </Link>
            </div>

            {/* Global Search / Action Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search deals (e.g. Q-1042), accounts, invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
                />
                <div className="absolute right-2.5 top-2 flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded border border-slate-300">
                  <Command className="w-2.5 h-2.5" /> K
                </div>
              </div>
            </div>

            {/* Quick Actions & Demo Reset */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetData}
                loading={resetMutation.isPending}
                title="Reset local demo data to default state"
                className="hidden sm:inline-flex"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Reset Demo
              </Button>

              <div className="h-5 w-px bg-slate-200" />

              <button
                type="button"
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {/* User Profile */}
              <Link
                href="/login"
                title="Switch Account / Sign In"
                className="flex items-center gap-2.5 pl-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs ring-2 ring-teal-500/20 shadow-2xs group-hover:ring-teal-500 transition">
                  {user?.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'MV'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-none group-hover:text-teal-700 transition">
                    {user?.name || 'Marcus Vance'}
                  </p>
                  <p className="text-[10px] text-teal-600 font-medium leading-tight mt-0.5">
                    {user?.role?.replace(/_/g, ' ') || 'Deal Desk / Sales Ops'}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* B2B Deal Lifecycle Pipeline Tracker */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1 shrink-0 mr-2 text-xs">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> Deal Lifecycle:
            </span>
            {workflowSteps.map((step, idx) => (
              <React.Fragment key={step}>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                    idx < 3
                      ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs'
                      : idx === 3
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold shadow-2xs'
                      : 'text-slate-500 bg-white border border-slate-200/80'
                  }`}
                >
                  {idx < 3 && <CheckCircle className="w-3 h-3 text-teal-600" />}
                  {step}
                </span>
                {idx < workflowSteps.length - 1 && (
                  <span className="text-slate-300 font-bold px-0.5">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-60 shrink-0 hidden md:block">
          <nav className="sticky top-28 space-y-1.5">
            <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : item.href.startsWith('/#')
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-md font-medium transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-600 shadow-enterprise'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </Link>
              );
            })}

            {/* Policy Cheat-Sheet Card using Card primitive */}
            <div className="pt-6">
              <Card className="bg-white border-slate-200 shadow-enterprise">
                <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-800">
                    Discount Caps
                  </CardTitle>
                  <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-medium border border-teal-200">
                    Enforced
                  </span>
                </CardHeader>
                <CardContent className="p-3.5 pt-2.5 space-y-2 text-xs">
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Hardware Limit:</span>
                      <span className="font-semibold text-slate-800 font-mono">15% Max</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Services Limit:</span>
                      <span className="font-semibold text-slate-800 font-mono">10% Max</span>
                    </div>
                    <div className="border-t border-slate-100 pt-1 flex justify-between">
                      <span>Gold Tier:</span>
                      <span className="font-semibold text-amber-700 font-mono">15% Cap</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Silver Tier:</span>
                      <span className="font-semibold text-slate-700 font-mono">10% Cap</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bronze Tier:</span>
                      <span className="font-semibold text-orange-800 font-mono">5% Cap</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic pt-1.5 border-t border-slate-100 leading-snug">
                    Formula: min(Tier, Category). Tiers never bypass approval requirements.
                  </p>
                </CardContent>
              </Card>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};
