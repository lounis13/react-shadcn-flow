import {z} from 'zod';

// Task Dependency
export const taskDependencySchema = z.object({
    task_id: z.string(),
    upstream_task_id: z.string(),
});

export type TaskDependency = z.infer<typeof taskDependencySchema>;

// Task Response (recursive for nested jobs)
export const taskResponseSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.string(),
    task_type: z.string(),
    kind: z.string(),
    name: z.string().nullable(),
    status: z.string(),
    error: z.string().nullable(),
    parent_id: z.string().nullable(),
    started_at: z.string().nullable(),
    finished_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    dependencies: z.array(taskDependencySchema),
    children: z.array(taskResponseSchema).optional().default([]),
}));

export type TaskResponse = {
    id: string;
    task_type: string;
    kind: string;
    name: string | null;
    status: "scheduled" | "success" | "failed" | "running" | "skipped";
    error: string | null;
    parent_id: string | null;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
    updated_at: string;
    dependencies: TaskDependency[];
    children?: TaskResponse[];
};

// Job Response (with children)
export const jobGraphResponseSchema = z.object({
    id: z.string(),
    task_type: z.string(),
    kind: z.string(),
    name: z.string().nullable(),
    status: z.string(),
    error: z.string().nullable(),
    parent_id: z.string().nullable(),
    started_at: z.string().nullable(),
    finished_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    children: z.array(taskResponseSchema),
    dependencies: z.array(taskDependencySchema),
});

export type JobGraph = z.infer<typeof jobGraphResponseSchema>;

// Job Summary (for list)
export const jobSummarySchema = z.object({
    job_id: z.string(),
    status: z.string(),
});

export type JobSummary = z.infer<typeof jobSummarySchema>;

export const jobListResponseSchema = z.array(jobGraphResponseSchema);

export type Jobs = z.infer<typeof jobListResponseSchema>;

// Backward compatibility
export type Job = JobGraph;
