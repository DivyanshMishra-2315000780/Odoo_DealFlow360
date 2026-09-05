'use client';

import { mockDiscountRules } from '@/lib/api/mockDataExtended';
import { useState } from 'react';
import { Save } from 'lucide-react';

export default function DiscountRulesPage() {
  const [rules, setRules] = useState(mockDiscountRules);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Discount & Approval Rules</h2>
        <p className="text-muted-foreground mt-1">Configure tier-based discount limits and approval routing.</p>
      </div>

      {/* Tier Limits Summary */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold text-foreground">Tier Discount Limits</h3>
        </div>
        <div className="grid grid-cols-3 divide-x">
          {['BRONZE', 'SILVER', 'GOLD'].map(tier => {
            const tierRules = rules.filter(r => r.tier === tier);
            const maxDiscount = Math.max(...tierRules.map(r => r.maxDiscountPercentage));
            return (
              <div key={tier} className={`p-6 text-center ${tier === 'GOLD' ? 'bg-amber-50/30' : ''}`}>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${tier === 'GOLD' ? 'text-amber-700' : tier === 'SILVER' ? 'text-slate-600' : 'text-orange-700'}`}>
                  {tier}
                </div>
                <div className="text-4xl font-bold text-foreground">{maxDiscount}%</div>
                <div className="text-xs text-muted-foreground mt-1">Max discount</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold text-foreground">Category Rules</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/10 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Max Discount</th>
                <th className="px-4 py-3">Manager Approval</th>
                <th className="px-4 py-3">Finance Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map((rule, index) => (
                <tr key={rule.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <span className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                      rule.tier === 'GOLD' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      rule.tier === 'SILVER' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                      'bg-orange-50 text-orange-800 border-orange-100'
                    }`}>
                      {rule.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{rule.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={rule.maxDiscountPercentage}
                        onChange={(e) => {
                          const newRules = [...rules];
                          newRules[index] = { ...newRules[index], maxDiscountPercentage: parseInt(e.target.value) || 0 };
                          setRules(newRules);
                        }}
                        className="w-16 border rounded-md px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={rule.requiresManagerApproval}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[index] = { ...newRules[index], requiresManagerApproval: e.target.checked };
                        setRules(newRules);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={rule.requiresFinanceApproval}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[index] = { ...newRules[index], requiresFinanceApproval: e.target.checked };
                        setRules(newRules);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90"
        >
          <Save className="h-4 w-4" /> {saved ? 'Saved!' : 'Save Rules'}
        </button>
      </div>
    </div>
  );
}
