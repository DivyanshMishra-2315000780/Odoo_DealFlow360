import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi } from '@/lib/api/quotesApi';

export function useQuotes() {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: quotesApi.getQuotes,
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: () => quotesApi.getQuote(id),
    enabled: !!id,
  });
}

export function useSubmitQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, submittedById, submittedByName }: { id: string; submittedById: string; submittedByName: string }) => quotesApi.submitQuote(id, submittedById, submittedByName),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
