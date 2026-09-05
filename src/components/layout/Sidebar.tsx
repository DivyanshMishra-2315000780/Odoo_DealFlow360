'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/useSession';
import {
  LayoutDashboard, FileText, CheckSquare, MessageSquare, Package,
  CreditCard, Users, Settings, Activity, Building2, PackageOpen, PieChart
} from 'lucide-react';
import { UserRole } from '@/types';

// Role-based navigation mapping
const NAV_CONFIG: Record<UserRole, { title: string; href: string; icon: any }[]> = {
  ADMIN: [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Customers', href: '/customers', icon: Building2 },
    { title: 'Users', href: '/users', icon: Users },
    { title: 'Products', href: '/products', icon: PackageOpen },
    { title: 'Quotations', href: '/quotes', icon: FileText },
    { title: 'Approvals', href: '/approvals', icon: CheckSquare },
    { title: 'Subscriptions', href: '/subscriptions', icon: Activity },
    { title: 'Invoices', href: '/invoices', icon: CreditCard },
    { title: 'Reports', href: '/reports', icon: PieChart },
    { title: 'Settings', href: '/settings', icon: Settings },
  ],
  SALES_MANAGER: [
    { title: 'Dashboard', href: '/sales-manager/dashboard', icon: LayoutDashboard },
    { title: 'Team Quotations', href: '/quotes', icon: FileText },
    { title: 'Approvals', href: '/approvals', icon: CheckSquare },
    { title: 'Deal Health', href: '/deal-health', icon: Activity },
    { title: 'Reports', href: '/reports', icon: PieChart },
  ],
  SALES_EXECUTIVE: [
    { title: 'Dashboard', href: '/sales/dashboard', icon: LayoutDashboard },
    { title: 'My Quotations', href: '/quotes', icon: FileText },
    { title: 'Fulfillment', href: '/fulfillment', icon: Package },
    { title: 'Invoices', href: '/invoices', icon: CreditCard },
    { title: 'Customers', href: '/customers', icon: Building2 },
  ],
  FINANCE_OFFICER: [
    { title: 'Dashboard', href: '/finance/dashboard', icon: LayoutDashboard },
    { title: 'Finance Approvals', href: '/approvals', icon: CheckSquare },
    { title: 'Invoices', href: '/invoices', icon: CreditCard },
    { title: 'Subscriptions', href: '/subscriptions', icon: Activity },
    { title: 'Reports', href: '/reports', icon: PieChart },
  ],
  CUSTOMER: [] // Customers use a different layout entirely (PortalLayout)
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  if (!user) return null;
  
  const navItems = NAV_CONFIG[user.role] || [];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center font-bold text-lg">D</div>
          <span className="font-bold tracking-tight">DealFlow360</span>
        </div>
      </div>
      
      <div className="px-4 py-6 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {user.role.replace('_', ' ')} Navigation
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !item.href.includes('dashboard'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-teal-600/10 text-teal-400" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-teal-400" : "text-slate-400")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
          <div className="font-medium text-slate-200 mb-1">{user.name}</div>
          <div className="truncate mb-2">{user.email}</div>
        </div>
      </div>
    </div>
  );
}
