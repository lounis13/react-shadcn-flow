import { apiClient } from '@/lib/api/client';
import type {
  RunListResponse,
  RunResponse,
  RunCreatedResponse,
  RunCreateRequest,
  TaskRetryRequest,
  TaskRetryResponse,
} from '../schemas';
import {
  runListResponseSchema,
  runResponseSchema,
  runCreatedResponseSchema,
  taskRetryResponseSchema,
} from '../schemas';

/**
 * Night Batch API Client
 * Type-safe API client functions for Night Batch endpoints
 */

const BASE_PATH = '/api/night-batch';

export const nightBatchApi = {
  /**
   * List all night batch runs with pagination
   * GET /api/night-batch/runs
   */
  listRuns: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<RunListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.offset !== undefined) {
      searchParams.append('offset', params.offset.toString());
    }

    const url = `${BASE_PATH}/runs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get(url, runListResponseSchema);
  },

  /**
   * Get a specific run by ID with full details
   * GET /api/night-batch/runs/{run_id}
   */
  getRun: async (runId: string): Promise<RunResponse> => {
    return apiClient.get(`${BASE_PATH}/runs/${runId}`, runResponseSchema);
  },

  /**
   * Create a new night batch run
   * POST /api/night-batch/runs
   */
  createRun: async (data: RunCreateRequest): Promise<RunCreatedResponse> => {
    return apiClient.post(`${BASE_PATH}/runs`, runCreatedResponseSchema, data);
  },

  /**
   * Delete a specific run
   * DELETE /api/night-batch/runs/{run_id}
   */
  deleteRun: async (runId: string): Promise<void> => {
    const response = await fetch(`${BASE_PATH}/runs/${runId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete run: ${response.statusText}`);
    }
  },

  /**
   * Retry a failed task in a run
   * POST /api/night-batch/runs/{run_id}/retry
   */
  retryTask: async (
    runId: string,
    data: TaskRetryRequest
  ): Promise<TaskRetryResponse> => {
    return apiClient.post(
      `${BASE_PATH}/runs/${runId}/retry`,
      taskRetryResponseSchema,
      data
    );
  },
};
