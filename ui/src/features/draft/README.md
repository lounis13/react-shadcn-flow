# Night Batch Feature Module

This module provides type-safe API integration for the Night Batch flow management system.

## Structure

```
night-batch/
├── schemas/
│   └── index.ts          # Zod schemas for type validation
├── api/
│   ├── client.ts         # API client functions
│   ├── queries.ts        # React Query hooks
│   └── index.ts          # API barrel export
├── index.ts              # Main barrel export
└── README.md             # This file
```

## Features

- ✅ **Type-safe**: Full TypeScript support with Zod validation
- ✅ **DRY**: Reusable patterns and consistent API
- ✅ **React Query**: Optimized caching and state management
- ✅ **Error handling**: Proper error types and handling

## Usage Examples

### List all runs

```tsx
import { useNightBatchRuns } from '@/features/night-batch';

function RunsList() {
  const { data, isLoading, error } = useNightBatchRuns({
    limit: 50,
    offset: 0,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.detail}</div>;

  return (
    <div>
      <h2>Total runs: {data.total}</h2>
      {data.runs.map(run => (
        <div key={run.id}>
          <p>Status: {run.status}</p>
          {run.task_statistics && (
            <p>
              Success: {run.task_statistics.success} /
              {run.task_statistics.total}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Get a specific run

```tsx
import { useNightBatchRun } from '@/features/night-batch';

function RunDetails({ runId }: { runId: string }) {
  const { data, isLoading } = useNightBatchRun(runId, {
    refetchInterval: 5000, // Poll every 5 seconds
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return null;

  return (
    <div>
      <h2>Run {data.id}</h2>
      <p>Status: {data.status}</p>
      <h3>Tasks ({data.tasks.length})</h3>
      {data.tasks.map(task => (
        <div key={task.id}>
          <p>{task.task_name}: {task.state}</p>
        </div>
      ))}
    </div>
  );
}
```

### Create a new run

```tsx
import { useCreateNightBatchRun } from '@/features/night-batch';
import { toast } from 'sonner';

function CreateRunButton() {
  const createRun = useCreateNightBatchRun({
    onSuccess: (data) => {
      toast.success(`Run created: ${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create run: ${error.detail}`);
    },
  });

  const handleCreate = () => {
    createRun.mutate({
      region: 'APAC',
      run_types: ['ftb', 'hpl'],
    });
  };

  return (
    <button
      onClick={handleCreate}
      disabled={createRun.isPending}
    >
      {createRun.isPending ? 'Creating...' : 'Create Run'}
    </button>
  );
}
```

### Retry a failed task

```tsx
import { useRetryTask } from '@/features/night-batch';

function RetryTaskButton({ runId, taskPath }: {
  runId: string;
  taskPath: string;
}) {
  const retryTask = useRetryTask({
    onSuccess: (data) => {
      console.log('Task retry initiated:', data.message);
    },
  });

  const handleRetry = () => {
    retryTask.mutate({
      runId,
      data: {
        task_path: taskPath,
        reset_downstream: false,
      },
    });
  };

  return (
    <button onClick={handleRetry} disabled={retryTask.isPending}>
      Retry Task
    </button>
  );
}
```

### Delete a run

```tsx
import { useDeleteNightBatchRun } from '@/features/night-batch';

function DeleteRunButton({ runId }: { runId: string }) {
  const deleteRun = useDeleteNightBatchRun({
    onSuccess: () => {
      console.log('Run deleted successfully');
    },
  });

  return (
    <button onClick={() => deleteRun.mutate(runId)}>
      Delete Run
    </button>
  );
}
```

## API Endpoints

All endpoints are prefixed with `/api/night-batch`:

- `GET /runs` - List all runs
- `GET /runs/{run_id}` - Get specific run details
- `POST /runs` - Create new run
- `DELETE /runs/{run_id}` - Delete run
- `POST /runs/{run_id}/retry` - Retry failed task

## Types

All types are exported from the main module:

```tsx
import type {
  RunResponse,
  RunListResponse,
  TaskResponse,
  TaskStatistics,
  RunCreateRequest,
  TaskRetryRequest,
} from '@/features/night-batch';
```

## Query Keys

For advanced cache manipulation:

```tsx
import { nightBatchKeys } from '@/features/night-batch';

// Invalidate all night-batch queries
queryClient.invalidateQueries({ queryKey: nightBatchKeys.all });

// Invalidate all runs
queryClient.invalidateQueries({ queryKey: nightBatchKeys.runs() });

// Invalidate specific run
queryClient.invalidateQueries({
  queryKey: nightBatchKeys.run(runId)
});
```
