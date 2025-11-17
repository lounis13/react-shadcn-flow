import {apiClient} from '@/lib/api/client';
import {type Job, jobListResponseSchema, type Jobs, jobSchema} from "@/lib/schemas";

const BASE_PATH = '/api/jobs';

export const nightBatchJobApi = {
    getJobs: async (): Promise<Jobs> => {
        const url = `${BASE_PATH}`;
        return apiClient.get(url, jobListResponseSchema);
    },

    getJob: async (runId: string): Promise<Job> => {
        return apiClient.get(`${BASE_PATH}/${runId}`, jobSchema);
    },
};
