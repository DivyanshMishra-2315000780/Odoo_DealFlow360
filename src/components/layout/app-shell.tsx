'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  FileText,
  ShieldCheck,
  CreditCard,
  Truck,
  RefreshCcw,
  HeartPulse,
  Package,
  Tag,
  BarChart3,
  SlidersHorizontal,
  Sparkles,
  Users,
  UserCheck,
  User,
  DollarSign,
  LayoutDashboard,
  Search,
  Bell,
  Command,

  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Layers,
  LogOut,
  Shield,
  HelpCircle,
  Inbox,
  ClipboardList,
} from 'lucide-react';
import { useToast } from '@/components/providers/query-provider';
import { useAuth, normalizeRole, getRoleMeta } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';


interface NavItemDef {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  alert?: boolean;
  tooltip: string;
}

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoading || pathname === '/login' || pathname === '/signup') return;
    if (!user) router.replace('/login');
    else if (user.role === 'CUSTOMER' && !pathname.startsWith('/portal')) router.replace('/portal');
    else if (user.role !== 'CUSTOMER' && pathname.startsWith('/portal')) router.replace('/');
  }, [isLoading, user, pathname, router]);
  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchDropdownOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchDropdownOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const searchableItems = [
      { id: 'Q-1042', title: 'Quotation Q-1042 (Laptop Pro + Onsite Setup)', subtitle: 'Acme Corporation • $3,650.24 • Exception Governance', href: '/quotes/Q-1042', category: 'Deal' },
      { id: 'Q-1039', title: 'Quotation Q-1039 (Laptop Pro 14)', subtitle: 'Beta Technologies • $14,400.00 • Approved', href: '/quotes/Q-1039', category: 'Deal' },
      { id: 'Q-1028', title: 'Quotation Q-1028 (Telemetry Workstations)', subtitle: 'Zenith Industries • $15,100.00 • Idle 9 Days', href: '/quotes/Q-1028', category: 'Deal' },
      { id: 'Q-1052', title: 'Quotation Q-1052 (High Discount Anomaly)', subtitle: 'Delta Solutions • $19,000.00 • +14 pts Excess', href: '/quotes/Q-1052', category: 'Deal' },
      { id: 'CUST-01', title: 'Acme Corporation (Customer 360)', subtitle: 'Gold Tier (15% Cap) • Strategic Enterprise Account', href: '/customers/CUST-01', category: 'Account' },
      { id: 'CUST-02', title: 'Beta Technologies (Customer 360)', subtitle: 'Silver Tier (10% Cap) • Cloud Infrastructure Client', href: '/customers/CUST-02', category: 'Account' },
      { id: 'INV-1042', title: 'Invoice INV-1042 ($3,650.24)', subtitle: 'Acme Corporation • Pre-Shipment Fulfillment Release', href: '/invoices/INV-1042', category: 'Invoice' },
      { id: 'FUL-801', title: 'Fulfillment Order FUL-801', subtitle: 'Acme Corporation • Main WH (18) + East Depot (6) Split', href: '/fulfillment/FUL-801', category: 'Fulfillment' },
      { id: 'RULES', title: 'Discount Rules & Policy Caps', subtitle: 'min(Customer Tier, Product Category) Governance Config', href: '/settings/discount-rules', category: 'Settings' },
      { id: 'HEALTH', title: 'Deal Health & Anomaly Radar', subtitle: 'Deterministic Governance Intelligence & Velocity Watchdog', href: '/deal-health', category: 'Intelligence' },
      { id: 'REPORTS', title: 'Commercial Revenue Reports', subtitle: 'Pipeline Conversion, MRR Realization & Top Upsells', href: '/reports', category: 'Reports' },
    ];

    return searchableItems.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchDropdownOpen(false);
  }, [pathname]);

  // Active user role normalization
  const currentRole = normalizeRole(user?.role);
  const roleMeta = getRoleMeta(currentRole);

  // Define role-specific navigation menus
  const roleNavItems: NavItemDef[] = useMemo(() => {
    switch (currentRole) {
      case 'CUSTOMER':
        return [
          {
            label: 'Portal Overview',
            href: '/portal',
            icon: LayoutDashboard,
            badge: 'Client',
            tooltip: 'Customer procurement overview, active deals & messages',
          },
          {
            label: 'My Requirements',
            href: '/portal/requirements',
            icon: ClipboardList,
            badge: 'Intake',
            tooltip: 'Submit demand requirements for sales executive quotation',
          },
          {
            label: 'My Quotations',
            href: '/portal/quotations',
            icon: FileText,
            badge: 'Live',
            tooltip: 'Review corporate quotations & submit counter-offers',
          },
          {
            label: 'Commercial Invoices',
            href: '/portal/invoices',
            icon: CreditCard,
            tooltip: 'View statements & execute instant online ACH settlements',
          },
          {
            label: 'Subscriptions',
            href: '/portal/profile#subscriptions',
            icon: RefreshCcw,
            tooltip: 'Active SaaS software seats & SLA recurring agreements',
          },
          {
            label: 'Company Profile',
            href: '/portal/profile',
            icon: User,
            tooltip: 'System-assigned customer tier, spend metrics & credit standing',
          },
        ];

      case 'SALES_EXECUTIVE':
        return [
          {
            label: 'Deal Dashboard',
            href: '/',
            icon: Activity,
            tooltip: 'Executive pipeline overview & immediate action required',
          },
          {
            label: 'Customer Requests',
            href: '/requirements',
            icon: Inbox,
            badge: 'Intake',
            tooltip: 'Incoming customer intake requirements awaiting quotation modeling',
          },
          {
            label: 'Quotations',
            href: '/quotes',
            icon: FileText,
            badge: 'Live',
            tooltip: 'Create and track multi-line enterprise quotations',
          },
          {
            label: 'Customers',
            href: '/customers',
            icon: Users,
            tooltip: 'Customer 360 command center, health gauges & account managers',
          },
          {
            label: 'Fulfillment',
            href: '/fulfillment',
            icon: Truck,
            tooltip: 'Warehouse allocation, dispatch readiness & split shipments',
          },
          {
            label: 'Subscriptions',
            href: '/subscriptions',
            icon: RefreshCcw,
            tooltip: 'Commercial subscriptions, multi-year contracts & MRR metrics',
          },
          {
            label: 'Invoices',
            href: '/invoices',
            icon: CreditCard,
            tooltip: 'Commercial cashflow ledger & pre-shipment invoice verification',
          },
          {
            label: 'Deal Health',
            href: '/deal-health',
            icon: HeartPulse,
            alert: true,
            tooltip: 'Velocity watchdog: stalled deals, discount anomalies & bottlenecks',
          },
        ];

      case 'SALES_MANAGER':
        return [
          {
            label: 'Deal Dashboard',
            href: '/',
            icon: Activity,
            tooltip: 'Pipeline governance & commercial deal velocity command center',
          },
          {
            label: 'Quotations',
            href: '/quotes',
            icon: FileText,
            badge: 'Live',
            tooltip: 'All company quotations across sales representatives',
          },
          {
            label: 'Discount Approvals',
            href: '/approvals',
            icon: ShieldCheck,
            alert: true,
            tooltip: 'Commercial approval center: evaluate margin exceptions & sign off',
          },
          {
            label: 'Customers',
            href: '/customers',
            icon: Users,
            tooltip: 'Strategic account governance & customer tier qualification',
          },
          {
            label: 'Deal Health',
            href: '/deal-health',
            icon: HeartPulse,
            alert: true,
            tooltip: 'Deterministic anomaly radar: stalled velocity & margin leaks',
          },
          {
            label: 'Reports & Analytics',
            href: '/reports',
            icon: BarChart3,
            tooltip: 'Pipeline win-rates, SLA turnaround velocity & top upsells',
          },
        ];

      case 'FINANCE_OFFICER':
        return [
          {
            label: 'Finance Dashboard',
            href: '/',
            icon: Activity,
            tooltip: 'Executive financial summary, cash conversion & exceptions',
          },
          {
            label: 'Discount Approvals',
            href: '/approvals',
            icon: ShieldCheck,
            alert: true,
            tooltip: 'Critical risk discount sign-offs & gross margin protection',
          },
          {
            label: 'Invoices & Cashflow',
            href: '/invoices',
            icon: CreditCard,
            tooltip: 'Commercial receivables, pre-shipment hold & settlement ledger',
          },
          {
            label: 'Payments & Settlement',
            href: '/invoices?tab=settlements',
            icon: DollarSign,
            tooltip: 'ACH wire receipts, partial payments & reconciled deposits',
          },
          {
            label: 'Revenue Reports',
            href: '/reports',
            icon: BarChart3,
            tooltip: 'Realized revenue trajectory, MRR run-rate & margin retention',
          },
        ];

      case 'ADMIN':
      default:
        return [
          {
            label: 'Executive Dashboard',
            href: '/',
            icon: Activity,
            tooltip: 'DealFlow360 platform health & governance overview',
          },
          {
            label: 'Customer Accounts',
            href: '/customers',
            icon: Users,
            tooltip: 'Enterprise client ledger & system-assigned qualification',
          },
          {
            label: 'Product Catalog',
            href: '/products',
            icon: Package,
            tooltip: 'Hardware and service catalog, variant matrix & base prices',
          },
          {
            label: 'Price Lists',
            href: '/price-lists',
            icon: Tag,
            tooltip: 'Multi-currency schedules for Bronze, Silver, and Gold tiers',
          },
          {
            label: 'Commercial Reports',
            href: '/reports',
            icon: BarChart3,
            tooltip: 'Aggregate commercial intelligence, pipeline velocity & conversions',
          },
          {
            label: 'Discount Rules',
            href: '/settings/discount-rules',
            icon: SlidersHorizontal,
            badge: 'Admin',
            tooltip: 'Configure tier discount caps, category ceilings & workflow rules',
          },
          {
            label: 'Employee Accounts',
            href: '/settings/employees',
            icon: UserCheck,
            badge: 'Staff',
            tooltip: 'Manage enterprise employee roster, roles, credentials & status',
          },
        ];
    }
  }, [currentRole]);

  const handleResetData = async () => {
    try {
      await resetMutation.mutateAsync();
      toast({
        title: 'Data Refreshed',
        description: 'Latest records have been requested from the server.',
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

  const handleRoleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    setIsRoleDropdownOpen(false);
    toast({
      title: 'Sign in to another account',
      description: 'Access follows the account authenticated by the server.',
      type: 'info',
    });
  };

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

  if (pathname !== '/login' && pathname !== '/signup' && (isLoading || !user || (user.role === 'CUSTOMER' && !pathname.startsWith('/portal')) || (user.role !== 'CUSTOMER' && pathname.startsWith('/portal')))) return <div className="p-12 text-center">Loading session...</div>;
  // Distraction-free full-screen layout for authentication & customer portal pages (placed after all hooks)
  if (pathname === '/login' || pathname === '/signup' || pathname?.startsWith('/portal')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-enterprise">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Trigger & Logo */}
            <div className="flex items-center gap-3 sm:gap-6">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
                aria-label="Toggle navigation drawer"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link href={currentRole === 'CUSTOMER' ? '/portal' : '/'} className="flex items-center gap-3 group">
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
            <div className="hidden md:flex items-center flex-1 max-w-md mx-6 relative">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search deals (e.g. Q-1042), accounts, rules..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
                />
                <div className="absolute right-2.5 top-2 flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded border border-slate-300">
                  <Command className="w-2.5 h-2.5" /> K
                </div>
              </div>

              {/* Instant Search Results Palette Dropdown */}
              {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSearchDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-enterprise-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Quick Navigation Results</span>
                      <span className="font-mono text-[10px] text-slate-400">ESC to close</span>
                    </div>

                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No deals, accounts, or records matching &ldquo;{searchQuery}&rdquo;
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {searchResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              router.push(item.href);
                              setIsSearchDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-teal-50/60 transition flex items-center justify-between group cursor-pointer"
                          >
                            <div className="space-y-0.5 pr-2">
                              <div className="text-xs font-semibold text-slate-900 group-hover:text-teal-900 flex items-center gap-1.5">
                                <span>{item.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                            </div>
                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-teal-100 group-hover:text-teal-800 shrink-0">
                              {item.category}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Quick Role Switcher Pill & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Role Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer shadow-2xs hover:opacity-90 ${roleMeta.badgeClass}`}
                  title="Click to switch perspective between 5 user roles"
                >
                  <span className={`w-2 h-2 rounded-full ${roleMeta.dotColor}`} />
                  <span className="hidden sm:inline">{roleMeta.label}</span>
                  <span className="sm:hidden">{roleMeta.label.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {isRoleDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsRoleDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white border border-slate-200 shadow-enterprise-lg z-50 p-2 text-xs animate-in fade-in-0 zoom-in-95 duration-150">
                      <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                        Switch Demo Role
                      </div>
                      {DEMO_ACCOUNTS.map((acc) => {
                        const isSelected = normalizeRole(acc.role) === currentRole;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => handleRoleSwitch(acc.role as UserRole)}
                            className={`w-full text-left px-2.5 py-2 rounded-md transition flex flex-col gap-0.5 cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 text-teal-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{acc.roleLabel}</span>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-teal-600" />}
                            </div>
                            <span className="text-[11px] text-slate-500 truncate">{acc.name} • {acc.company}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Demo Reset */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetData}
                loading={resetMutation.isPending}
                title="Reset local demo data to default state"
                className="hidden sm:inline-flex text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline">Reset Demo</span>
              </Button>

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              {/* Notifications */}
              <button
                type="button"
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              {/* User Profile */}
              <Link
                href="/login"
                title="Switch Account / Sign In"
                className="flex items-center gap-2 pl-1 sm:pl-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs ring-2 ring-teal-500/20 shadow-2xs group-hover:ring-teal-500 transition">
                  {user?.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'AP'}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-none group-hover:text-teal-700 transition">
                    {user?.name || 'Arthur Pendelton'}
                  </p>
                  <p className="text-[10px] text-teal-600 font-medium leading-tight mt-0.5">
                    {roleMeta.label}
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

      {/* Main Workspace Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 gap-6 lg:gap-8">
        {/* Desktop Navigation Sidebar with Collapse Capability */}
        <aside
          className={`shrink-0 hidden md:block transition-all duration-200 ${
            isCollapsed ? 'w-18' : 'w-64'
          }`}
        >
          <div className="sticky top-28 space-y-4">
            {/* Sidebar Header & Collapse Toggle */}
            <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-200/80">
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {roleMeta.label} Menu
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer ml-auto"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar to icons'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {roleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : item.href.startsWith('/#')
                    ? pathname === '/'
                    : pathname.startsWith(item.href.split('?')[0]);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={item.tooltip}
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                    } text-xs rounded-lg font-medium transition group relative ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 font-bold border-l-3 border-teal-600 shadow-enterprise'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition ${
                          isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                        {item.badge}
                      </span>
                    )}

                    {item.alert && (
                      <span
                        className={`${
                          isCollapsed
                            ? 'absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse'
                            : 'w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0'
                        }`}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Role Governance Badge & Helper Card (Expanded only) */}
            {!isCollapsed && (
              <div className="pt-4 space-y-3">
                <div className={`p-3 rounded-lg border text-xs ${roleMeta.badgeClass}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Enterprise Role Profile
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-white/70">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-snug">
                    {roleMeta.description}
                  </p>
                </div>

                {/* Quick Policy Reminder Card */}
                <Card className="bg-white border-slate-200 shadow-enterprise">
                  <CardHeader className="p-3 pb-2 border-b border-slate-100 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-semibold text-slate-800">
                      Discount Ceilings
                    </CardTitle>
                    <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-medium border border-teal-200">
                      Active
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 pt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Hardware:</span>
                      <strong className="text-slate-800 font-mono">15% Max</strong>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Services:</span>
                      <strong className="text-slate-800 font-mono">10% Max</strong>
                    </div>
                    <div className="pt-1 border-t border-slate-100 flex justify-between text-[11px] text-slate-600">
                      <span>Formula:</span>
                      <strong className="text-teal-700 font-mono">min(Tier, Cat)</strong>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-out Drawer */}
            <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-enterprise-lg flex flex-col p-4 z-10 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">DealFlow360</span>
                    <span className="text-[10px] text-teal-600 block font-medium">{roleMeta.label}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Role Switcher */}
              <div className="py-3 border-b border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Select Role View
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleRoleSwitch(acc.role as UserRole)}
                      className={`text-left px-2 py-1.5 rounded text-xs transition ${
                        normalizeRole(acc.role) === currentRole
                          ? 'bg-teal-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {acc.roleLabel.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Nav Items */}
              <nav className="py-3 space-y-1 flex-1">
                {roleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : item.href.startsWith('/#')
                      ? pathname === '/'
                      : pathname.startsWith(item.href.split('?')[0]);

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 text-xs rounded-lg font-medium transition ${
                        isActive
                          ? 'bg-teal-50 text-teal-900 font-bold border-l-3 border-teal-600'
                          : 'text-slate-700 hover:bg-slate-100'
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
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Footer */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetData}
                  className="w-full text-xs justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Demo Data
                </Button>

                <div className="text-[11px] text-slate-400 text-center">
                  Signed in as <strong>{user?.name}</strong> ({roleMeta.label})
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};
