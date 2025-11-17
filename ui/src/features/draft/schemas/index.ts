import { z } from 'zod';

/**
 * Zod schemas for Night Batch API
 * Corresponds to Python Pydantic schemas in app/libs/flow/rest/schema.py
 *
 * Note: Complex nested structures use z.any() to avoid Zod parsing issues
 * Type safety is maintained through TypeScript inference and API contracts
 */

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Run List Response
 * GET /api/night-batch/runs
 */
export const runListResponseSchema = z.object({
  runs: z.array(z.any()),
  total: z.number(),
});

export type RunListResponse = z.infer<typeof runListResponseSchema>;

/**
 * Run Response (detailed)
 * GET /api/night-batch/runs/{run_id}
 */
export const runResponseSchema = z.any();

export type RunResponse = {
  id: string;
  flow_id: string;
  status: string;
  input: Record<string, unknown>;
  context: Record<string, unknown>;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  tasks: TaskResponse[];
  subflows: SubflowResponse[];
  task_statistics: TaskStatistics | null;
};

/**
 * Run Created Response
 * POST /api/night-batch/runs
 */
export const runCreatedResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  message: z.string(),
});

export type RunCreatedResponse = z.infer<typeof runCreatedResponseSchema>;

/**
 * Task Retry Response
 * POST /api/night-batch/runs/{run_id}/retry
 */
export const taskRetryResponseSchema = z.object({
  run_id: z.string(),
  task_path: z.string(),
  message: z.string(),
});

export type TaskRetryResponse = z.infer<typeof taskRetryResponseSchema>;

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Run Create Request
 * POST /api/night-batch/runs
 */
export const runCreateRequestSchema = z.object({
  region: z.string(),
  run_types: z.array(z.string()),
});

export type RunCreateRequest = z.infer<typeof runCreateRequestSchema>;

/**
 * Task Retry Request
 * POST /api/night-batch/runs/{run_id}/retry
 */
export const taskRetryRequestSchema = z.object({
  task_path: z.string(),
  reset_downstream: z.boolean(),
});

export type TaskRetryRequest = z.infer<typeof taskRetryRequestSchema>;

// ============================================================================
// Nested Types (TypeScript only - no Zod validation)
// ============================================================================

export type TaskStatistics = {
  total: number;
  scheduled: number;
  running: number;
  success: number;
  failed: number;
  skipped: number;
  canceled: number;
};

export type TaskDependency = {
  task_id: string;
  instance_id: string;
};

export type TaskResponse = {
  id: string;
  task_id: string;
  task_name: string;
  type: string;
  state: "scheduled" | "success" | "failed" | "running" | "skipped";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  try_number: number;
  subflow_instance_id: string | null;
  dependencies: TaskDependency[];
};

export type SubflowResponse = {
  id: string;
  status: string;
  input: Record<string, unknown>;
  context: Record<string, unknown>;
  tasks: TaskResponse[];
  subflows: SubflowResponse[];
  started_at: string | null;
  finished_at: string | null;
};
