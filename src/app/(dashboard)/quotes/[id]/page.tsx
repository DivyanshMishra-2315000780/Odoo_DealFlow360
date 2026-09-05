'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi } from '@/lib/api/quotesApi';
import { approvalsApi } from '@/lib/api/approvalsApi';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { CustomerTierBadge } from '@/components/ui/CustomerTierBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, Check, Send, AlertTriangle, FileEdit, Trash2, 
  MessageSquare, Loader2, ShieldCheck, Box, CreditCard, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useSession';
import { toast } from 'sonner';

export default function QuoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => quotesApi.getQuote(id),
  });

  const { data: approvals } = useQuery({
    queryKey: ['quote-approvals', id],
    queryFn: () => approvalsApi.getApprovals({ quotationId: id }),
    enabled: !!quote,
  });

  const submitMutation = useMutation({
    mutationFn: () => quotesApi.submitQuote(id, user!.id, user!.name),
    onSuccess: () => {
      toast.success('Quote submitted for approval');
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const confirmMutation = useMutation({
    mutationFn: () => quotesApi.confirmQuote(id),
    onSuccess: () => {
      toast.success('Quote confirmed. Fulfillment process started.');
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!quote) return <div className="p-8">Quote not found</div>;

  const currentApproval = approvals?.data?.find((a: any) => a.status === 'PENDING' || a.status === 'RETURNED');
  
  const canSubmit = quote.status === 'DRAFT' || quote.status === 'RETURNED';
  const canEdit = quote.status === 'DRAFT' || quote.status === 'RETURNED';
  const canConfirm = quote.status === 'APPROVED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
        <Link href="/quotes" className="hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Quotes
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{quote.quoteNumber}</span>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{quote.quoteNumber}</h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={quote.status} />
            <RiskBadge level={quote.riskLevel} />
            <span className="text-slate-500 text-sm">Created {new Date(quote.createdAt).toLocaleDateString()}</span>
            <span className="text-slate-600">Valid Until</span><span className="font-medium">{new Date(quote.expiresAt || '').toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline">
                <FileEdit className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button 
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                Submit for Approval
              </Button>
            </>
          )}
          {canConfirm && (
             <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Check className="w-4 h-4 mr-2" />}
              Confirm Order
            </Button>
          )}
          {quote.status === 'PENDING_APPROVAL' && (
            <Link href={`/approvals/${currentApproval?.id}`}>
              <Button variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                View Approval Workflow <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 px-4 text-right">Qty</th>
                      <th className="pb-3 px-4 text-right">Unit Price</th>
                      <th className="pb-3 px-4 text-right">Discount</th>
                      <th className="pb-3 pl-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quote.lines.map((line: any, i: number) => (
                      <tr key={i}>
                        <td className="py-4 pr-4">
                          <div className="font-medium text-slate-900">{line.productName}</div>
                          <div className="text-xs text-slate-500">SKU: {line.productId.split('-')[1]}</div>
                        </td>
                        <td className="py-4 px-4 text-right">{line.quantity}</td>
                        <td className="py-4 px-4 text-right">${line.unitPrice.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-red-500">
                          {line.discountPercentage > 0 ? `-${line.discountPercentage}%` : '-'}
                        </td>
                        <td className="py-4 pl-4 text-right font-medium">${line.lineTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td colSpan={4} className="py-4 pr-4 text-right font-bold text-slate-900 text-lg">Total</td>
                      <td className="py-4 pl-4 text-right font-bold text-teal-700 text-lg">${quote.amount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm text-slate-600">
                <p>Payment terms: Net 30</p>
                <p>Valid until: {new Date(quote.validUntil).toLocaleDateString()}</p>
                {quote.notes && <p className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">{quote.notes}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Company</div>
                <div className="font-medium text-slate-900">{quote.customer?.name}</div>
                <div className="mt-1"><CustomerTierBadge tier={quote.customer?.tier!} /></div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Contact</div>
                <div className="font-medium text-slate-900">{quote.customer?.contactName}</div>
                <div className="text-sm text-slate-500">{quote.customer?.contactEmail}</div>
              </div>
            </CardContent>
          </Card>

          <Card className={quote.riskLevel === 'HIGH' ? 'border-red-200 bg-red-50/30' : quote.riskLevel === 'MEDIUM' ? 'border-amber-200 bg-amber-50/30' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {quote.riskLevel === 'HIGH' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Risk Level</span>
                  <RiskBadge level={quote.riskLevel} />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Margin</span>
                  <span className={`font-medium ${quote.riskLevel === 'HIGH' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {Math.round(((quote.subtotal - (quote.subtotal * 0.7)) / quote.subtotal) * 100)}%
                  </span>
                </div>
                {quote.riskLevel === 'HIGH' && (
                  <div className="p-3 bg-red-100 text-red-800 text-xs rounded-lg mt-2 border border-red-200">
                    <strong>High Risk:</strong> Discount exceeds standard boundaries. Requires Finance Officer approval.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
