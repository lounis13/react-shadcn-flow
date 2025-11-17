// Query Keys Factory
import type {ApiError} from "@/lib/api";
import {useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions} from "@tanstack/react-query";
import {nightBatchJobApi} from "./client";
import type {Job, Jobs} from "@/lib/schemas";

export const nightBatchJobKeys = {
    all: ['night-batch'] as const,
    runs: () => [...nightBatchJobKeys.all, 'jobs'] as const,
    jobList: (filters?: { limit?: number; offset?: number }) =>
        [...nightBatchJobKeys.runs(), 'list', filters] as const,
    job: (id: string) => [...nightBatchJobKeys.runs(), 'detail', id] as const,
};


export const useGetJobs = (options?: Omit<UseQueryOptions<Jobs, ApiError>, 'queryKey' | 'queryFn'>) => {
    return useQuery<Jobs, ApiError>({
        queryKey: nightBatchJobKeys.jobList(),
        queryFn: () => nightBatchJobApi.getJobs(),
        ...options,
    });
};

export const useGetJob = (
    jobId: string,
    options?: Omit<UseQueryOptions<Job, ApiError>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<Job, ApiError>({
        queryKey: nightBatchJobKeys.job(jobId),
        queryFn: () => nightBatchJobApi.getJob(jobId),
        enabled: !!jobId,
        ...options,
    });
}

export const useRetryTask = (
    options?: UseMutationOptions<void, ApiError, { jobId: string; taskId: string }>
) => {
    const queryClient = useQueryClient();
    return useMutation<void, ApiError, { jobId: string; taskId: string }>({
        mutationFn: ({ jobId, taskId }) => nightBatchJobApi.retryTask(jobId, taskId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: nightBatchJobKeys.job(variables.jobId) });
            options?.onSuccess?.(data, variables, undefined);
        },
        ...options,
    });
};

export default useGetJobs