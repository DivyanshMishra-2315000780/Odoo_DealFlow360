'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, MessageSquare, CreditCard, User } from 'lucide-react';

const portalNav = [
  { name: 'Overview', href: '/portal', icon: LayoutDashboard },
  { name: 'My Quotations', href: '/portal/quotations', icon: FileText },
  { name: 'Invoices', href: '/portal/invoices', icon: CreditCard },
  { name: 'Profile', href: '/portal/profile', icon: User },
];

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-56 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center px-6 gap-2">
        <span className="font-bold text-lg text-primary">DealFlow360</span>
        <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">Portal</span>
      </div>
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {portalNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                )}
              >
                <item.icon className={cn('mr-3 h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4 text-xs text-muted-foreground text-center">
        Acme Corp — GOLD Customer
      </div>
    </div>
  );
}
