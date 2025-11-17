import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  RunListResponse,
  RunResponse,
  RunCreatedResponse,
  RunCreateRequest,
  TaskRetryRequest,
  TaskRetryResponse,
} from '../schemas';
import { nightBatchApi } from './client';
import type { ApiError } from '@/lib/api/types';

/**
 * React Query hooks for Night Batch API
 * Follows DRY principles with consistent patterns
 */

// Query Keys Factory
export const nightBatchKeys = {
  all: ['night-batch'] as const,
  runs: () => [...nightBatchKeys.all, 'runs'] as const,
  runList: (filters?: { limit?: number; offset?: number }) =>
    [...nightBatchKeys.runs(), 'list', filters] as const,
  run: (id: string) => [...nightBatchKeys.runs(), 'detail', id] as const,
};

/**
 * Hook to list all night batch runs
 * GET /api/night-batch/runs
 */
export const useNightBatchRuns = (
  params?: { limit?: number; offset?: number },
  options?: Omit<
    UseQueryOptions<RunListResponse, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<RunListResponse, ApiError>({
    queryKey: nightBatchKeys.runList(params),
    queryFn: () => nightBatchApi.listRuns(params),
    ...options,
  });
};

/**
 * Hook to get a specific run by ID
 * GET /api/night-batch/runs/{run_id}
 */
export const useNightBatchRun = (
  runId: string,
  options?: Omit<UseQueryOptions<RunResponse, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<RunResponse, ApiError>({
    queryKey: nightBatchKeys.run(runId),
    queryFn: () => nightBatchApi.getRun(runId),
    enabled: !!runId,
    ...options,
  });
};

/**
 * Hook to create a new night batch run
 * POST /api/night-batch/runs
 */
export const useCreateNightBatchRun = (
  options?: UseMutationOptions<
    RunCreatedResponse,
    ApiError,
    RunCreateRequest
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<RunCreatedResponse, ApiError, RunCreateRequest>({
    mutationFn: (data) => nightBatchApi.createRun(data),
    onSuccess: (...args) => {
      // Invalidate run list to reflect new run
      queryClient.invalidateQueries({ queryKey: nightBatchKeys.runs() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

/**
 * Hook to delete a night batch run
 * DELETE /api/night-batch/runs/{run_id}
 */
export const useDeleteNightBatchRun = (
  options?: UseMutationOptions<void, ApiError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (runId) => nightBatchApi.deleteRun(runId),
    onSuccess: (data, runId, ...rest) => {
      // Invalidate run list
      queryClient.invalidateQueries({ queryKey: nightBatchKeys.runs() });
      // Remove specific run from cache
      queryClient.removeQueries({ queryKey: nightBatchKeys.run(runId) });
      options?.onSuccess?.(data, runId, ...rest);
    },
    ...options,
  });
};

/**
 * Hook to retry a failed task
 * POST /api/night-batch/runs/{run_id}/retry
 */
export const useRetryTask = (
  options?: UseMutationOptions<
    TaskRetryResponse,
    ApiError,
    { runId: string; data: TaskRetryRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    TaskRetryResponse,
    ApiError,
    { runId: string; data: TaskRetryRequest }
  >({
    mutationFn: ({ runId, data }) => nightBatchApi.retryTask(runId, data),
    onSuccess: (response, variables, ...rest) => {
      // Refetch the specific run in background without showing loading state
      queryClient.refetchQueries({
        queryKey: nightBatchKeys.run(variables.runId),
      });
      // Also refetch run list in case status changed
      queryClient.refetchQueries({ queryKey: nightBatchKeys.runs() });
      options?.onSuccess?.(response, variables, ...rest);
    },
    ...options,
  });
};
