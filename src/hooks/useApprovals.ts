import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '@/lib/api/approvalsApi';

export function useApprovals() {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: approvalsApi.getApprovals,
  });
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: ['approval', id],
    queryFn: () => approvalsApi.getApproval(id),
    enabled: !!id,
  });
}

export function useApproveQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, comment, userId, userName }: { id: string; comment?: string; userId?: string; userName?: string }) => approvalsApi.approveQuote(id, comment, userId, userName),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
