'use client';

import { useAuth } from '@/lib/auth/useSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'CUSTOMER': router.replace('/portal'); break;
        case 'ADMIN': router.replace('/admin/dashboard'); break;
        case 'SALES_MANAGER': router.replace('/sales-manager/dashboard'); break;
        case 'SALES_EXECUTIVE': router.replace('/sales/dashboard'); break;
        case 'FINANCE_OFFICER': router.replace('/finance/dashboard'); break;
      }
    }
  }, [user, router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
    </div>
  );
}
