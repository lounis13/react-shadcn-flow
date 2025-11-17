import { useState } from 'react';
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { useNightBatchRuns } from '../api';
import type { RunResponse } from '../schemas';
import { RunCard } from './RunCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

const PAGE_SIZE = 20;

// Define columns for React Table (even though we render cards)
const columns: ColumnDef<RunResponse>[] = [
  {
    accessorKey: 'created_at',
    header: 'Created At',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
];

export function RunsList() {
  const [page, setPage] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);

  const { data, isLoading, error, refetch, isRefetching } = useNightBatchRuns(
    {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    },
    {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  const table = useReactTable({
    data: data?.runs || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading runs</AlertTitle>
        <AlertDescription>
          {error.detail || 'Failed to fetch runs. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data && (
            <>
              Showing {page * PAGE_SIZE + 1} to{' '}
              {Math.min((page + 1) * PAGE_SIZE, data.total)} of {data.total}{' '}
              runs
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Runs Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <>
          {table.getRowModel().rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No runs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new run to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {table.getRowModel().rows.map((row) => (
                <RunCard key={row.original.id} run={row.original} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(0)}
            disabled={!hasPrevPage || isLoading}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrevPage || isLoading}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">Page</span>
            <span className="font-medium">{page + 1}</span>
            <span className="text-muted-foreground">of</span>
            <span className="font-medium">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage || isLoading}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages - 1)}
            disabled={!hasNextPage || isLoading}
          >
            Last
          </Button>
        </div>
      )}
    </div>
  );
}
