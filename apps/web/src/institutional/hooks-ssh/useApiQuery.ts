import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from '@/institutional/hooks-ssh/use-toast';

// ─── Generic query hook ───────────────────────────────────────────────────────

/**
 * Wrapper around useQuery with standardized error toasting.
 */
export function useApiQuery<TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, Error>({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

// ─── Generic mutation hook ────────────────────────────────────────────────────

interface MutationConfig<TVariables> {
  mutationFn: (vars: TVariables) => Promise<void>;
  /** Query keys to invalidate on success (triggers refetch) */
  invalidateKeys?: string[][];
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Wrapper around useMutation with automatic cache invalidation and toasts.
 */
export function useApiMutation<TVariables>({
  mutationFn,
  invalidateKeys = [],
  successMessage,
  errorMessage,
}: MutationConfig<TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, TVariables>({
    mutationFn,
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      if (successMessage) {
        toast({ title: successMessage });
      }
    },
    onError: (error) => {
      toast({
        title: errorMessage ?? 'An error occurred',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
