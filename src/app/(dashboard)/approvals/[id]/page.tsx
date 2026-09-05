'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '@/lib/api/approvalsApi';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, X, CornerUpLeft, Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useSession';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ApprovalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: approval, isLoading } = useQuery({
    queryKey: ['approval', id],
    queryFn: () => approvalsApi.getApproval(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => approvalsApi.approveQuote(id, comment, user!.id, user!.name),
    onSuccess: () => {
      toast.success('Approved successfully');
      queryClient.invalidateQueries({ queryKey: ['approval', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setComment('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const returnMutation = useMutation({
    mutationFn: () => approvalsApi.returnQuote(id, comment, user!.id, user!.name),
    onSuccess: () => {
      toast.success('Returned for revision');
      queryClient.invalidateQueries({ queryKey: ['approval', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setComment('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const rejectMutation = useMutation({
    mutationFn: () => approvalsApi.rejectQuote(id, comment, user!.id, user!.name),
    onSuccess: () => {
      toast.success('Quote rejected');
      queryClient.invalidateQueries({ queryKey: ['approval', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setComment('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!approval) return <div className="p-8">Approval not found</div>;

  const canAction = approval.status === 'PENDING' && (
      (approval.currentStage === 'SALES_MANAGER' && user?.role === 'SALES_MANAGER') ||
      (approval.currentStage === 'FINANCE_OFFICER' && user?.role === 'FINANCE_OFFICER')
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
        <Link href="/approvals" className="hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Approvals
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Approval Request</h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={approval.status} />
            <span className="text-slate-500 text-sm">Requested by {approval.requestedByName} on {new Date(approval.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <Link href={`/quotes/${approval.quotationId}`}>
           <Button variant="outline">View Full Quotation</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(approval.auditTrail || []).map((h: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 relative flex-shrink-0">
                      {i !== (approval.auditTrail || []).length - 1 && (
                        <div className="absolute top-6 bottom-[-24px] left-1/2 -translate-x-1/2 w-px bg-slate-200"></div>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        h.action === 'APPROVED' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
                        h.action === 'REJECTED' ? 'border-red-500 bg-red-50 text-red-600' :
                        h.action === 'RETURNED' ? 'border-amber-500 bg-amber-50 text-amber-600' :
                        'border-slate-300 bg-slate-50 text-slate-500'
                      }`}>
                         {h.action === 'APPROVED' ? <Check className="w-4 h-4"/> : 
                          h.action === 'REJECTED' ? <X className="w-4 h-4"/> : 
                          h.action === 'RETURNED' ? <CornerUpLeft className="w-4 h-4"/> : 
                          <MessageSquare className="w-4 h-4"/>}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-slate-900">{h.userName} <span className="text-slate-500 font-normal">({h.stage || approval.currentStage})</span></div>
                        <div className="text-xs text-slate-500">{new Date(h.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="text-sm font-semibold mb-1" style={{color: h.action === 'APPROVED' ? '#059669' : h.action === 'REJECTED' ? '#dc2626' : '#d97706'}}>
                        {h.action}
                      </div>
                      {h.comment && <p className="text-sm text-slate-600">{h.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current Stage</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="font-medium text-slate-900">{approval.currentStage.replace('_', ' ')}</div>
               <div className="text-sm text-slate-500 mt-1">
                 This deal requires review at this stage due to margin risk or policy rules.
               </div>
            </CardContent>
          </Card>

          {canAction && (
            <Card className="border-teal-200 shadow-sm shadow-teal-600/10">
              <CardHeader className="pb-3 bg-teal-50/50">
                <CardTitle className="text-base">Your Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comments (Optional for approval, required for return/reject)</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    placeholder="Enter your reasoning..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending || returnMutation.isPending || rejectMutation.isPending}
                  >
                    {approveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Check className="w-4 h-4 mr-2"/>}
                    Approve
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => returnMutation.mutate()}
                      disabled={approveMutation.isPending || returnMutation.isPending || rejectMutation.isPending || !comment}
                    >
                      {returnMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <CornerUpLeft className="w-4 h-4 mr-2"/>}
                      Return
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => rejectMutation.mutate()}
                      disabled={approveMutation.isPending || returnMutation.isPending || rejectMutation.isPending || !comment}
                    >
                      {rejectMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <X className="w-4 h-4 mr-2"/>}
                      Reject
                    </Button>
                  </div>
                  {!comment && <p className="text-xs text-slate-500 text-center mt-2">Comment required to return or reject.</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
