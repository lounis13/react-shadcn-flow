import {apiClient} from "@/lib/api/client";
import {type Job, jobGraphResponseSchema, jobListResponseSchema, type Jobs} from "@/lib/schemas";
import {z} from "zod";

const BASE_PATH = "/api/jobs";

export const nightBatchJobApi = {
    getJobs: async (): Promise<Jobs> => {
        const url = `${BASE_PATH}`;
        return apiClient.get(url, jobListResponseSchema);
    },

    getJob: async (jobId: string): Promise<Job> => {
        return apiClient.get(`${BASE_PATH}/${jobId}`, jobGraphResponseSchema);
    },

    retryTask: async (jobId: string, taskId: string): Promise<void> => {
        await apiClient.post<{task_id: string}>(`${BASE_PATH}/${jobId}/retries`, z.any(), { task_id: taskId });
    },
};
