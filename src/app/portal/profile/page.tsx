'use client';

import { CustomerTierBadge } from '@/components/ui/CustomerTierBadge';

export default function PortalProfilePage() {
  return (
    <div className="p-8 space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h2>
        <p className="text-muted-foreground mt-1">Manage your company profile and contact details.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-2xl">A</div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Acme Corp</h3>
            <div className="mt-1"><CustomerTierBadge tier="GOLD" showPriorityText /></div>
          </div>
        </div>

        <div className="divide-y">
          {[
            { label: 'Company Name', value: 'Acme Corp' },
            { label: 'Contact Name', value: 'Alice Smith' },
            { label: 'Email', value: 'contact@acme.com' },
            { label: 'Customer Tier', value: 'GOLD — High Priority' },
          ].map(({ label, value }) => (
            <div key={label} className="py-3 flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <button className="w-full rounded-md border border-input py-2.5 text-sm font-medium hover:bg-muted transition-colors">
          Edit Profile
        </button>
      </div>
    </div>
  );
}
