import {z} from 'zod';

export const jobSchema = z.object({
    id: z.string(),
    status: z.union([z.literal('SCHEDULED'), z.literal('RUNNING'), z.literal('SUCCESS'), z.literal('FAILED')])
});

export const jobListResponseSchema = z.array(jobSchema);

export type Jobs = z.infer<typeof jobListResponseSchema>;


export type Job = z.infer<typeof jobSchema>;