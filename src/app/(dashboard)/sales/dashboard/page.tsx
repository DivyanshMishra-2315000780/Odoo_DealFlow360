'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboardApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckSquare, Package, Building2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function SalesDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: dashboardApi.getKpis,
  });

  const { data: priorityCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ['priority-customers'],
    queryFn: dashboardApi.getPriorityCustomers,
  });

  if (kpisLoading || customersLoading) {
    return <div className="p-8">Loading dashboard...</div>; // Replace with proper skeleton later
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Sales Dashboard</h1>
        <Link href="/quotes/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          + New Quotation
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">My Active Quotes</CardTitle>
            <FileText className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.openQuotations}</div>
            <p className="text-xs text-slate-500 mt-1">Pending action or negotiation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Approvals</CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.pendingApprovals}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting manager review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">At-Risk Deals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.atRiskDeals}</div>
            <p className="text-xs text-slate-500 mt-1">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Confirmed Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis?.revenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Closed won this quarter</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Quotations</CardTitle>
          </CardHeader>
          <CardContent>
             {/* We will add the actual recent quotes list here later */}
             <div className="text-sm text-slate-500">List of recent quotes goes here...</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              Priority Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityCustomers?.map((customer: any) => (
                <div key={customer.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium text-slate-900">{customer.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{customer.activeDeals} Active Deals</div>
                  </div>
                  <Badge variant="outline" className={
                    customer.tier === 'GOLD' ? 'border-amber-400 bg-amber-50 text-amber-800' :
                    customer.tier === 'SILVER' ? 'border-slate-300 bg-slate-50 text-slate-700' :
                    'border-amber-700/30 bg-amber-50/50 text-amber-900'
                  }>
                    {customer.tier}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
