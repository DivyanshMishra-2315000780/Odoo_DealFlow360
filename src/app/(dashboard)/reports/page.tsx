'use client';

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 40000 },
  { month: 'Feb', revenue: 30000 },
  { month: 'Mar', revenue: 20000 },
  { month: 'Apr', revenue: 27800 },
  { month: 'May', revenue: 18900 },
  { month: 'Jun', revenue: 23900 },
  { month: 'Jul', revenue: 48240 },
];

const quotesByTier = [
  { name: 'Gold', value: 34, fill: '#d97706' },
  { name: 'Silver', value: 47, fill: '#64748b' },
  { name: 'Bronze', value: 19, fill: '#9a6044' },
];

const approvalDist = [
  { name: 'Approved', value: 65 },
  { name: 'Returned', value: 20 },
  { name: 'Rejected', value: 15 },
];

const COLORS = ['#0d9488', '#f59e0b', '#ef4444'];

export default function ReportsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Reports</h2>
        <p className="text-muted-foreground mt-1">Analytics and insights across your entire pipeline.</p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Quotes Created', value: '156' },
          { label: 'Avg Approval Time', value: '2.3d' },
          { label: 'Approved', value: '102' },
          { label: 'Rejected', value: '12' },
          { label: 'Revenue', value: '$210k' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
              <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: '#0d9488' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quotes by Tier */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Quotes by Customer Tier</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={quotesByTier}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {quotesByTier.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Approval Distribution */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Approval Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={approvalDist} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                {approvalDist.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Deal Health */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Deal Health Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Healthy', value: 89 },
              { name: 'Stalled', value: 14 },
              { name: 'At Risk', value: 8 },
              { name: 'Critical', value: 3 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
