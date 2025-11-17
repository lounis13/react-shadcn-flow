// Query Keys Factory
import type {ApiError} from "@/lib/api";
import {useQuery, type UseQueryOptions} from "@tanstack/react-query";
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

export default useGetJobs