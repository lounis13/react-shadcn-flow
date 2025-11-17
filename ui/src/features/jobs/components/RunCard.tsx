import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle2, XCircle, Circle, Loader2 } from 'lucide-react';
import type { RunResponse } from '../schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface RunCardProps {
  run: RunResponse;
}

const statusConfig = {
  SUCCESS: {
    icon: CheckCircle2,
    variant: 'default' as const,
    label: 'Success',
  },
  FAILED: {
    icon: XCircle,
    variant: 'destructive' as const,
    label: 'Failed',
  },
  RUNNING: {
    icon: Loader2,
    variant: 'secondary' as const,
    label: 'Running',
  },
  SCHEDULED: {
    icon: Clock,
    variant: 'outline' as const,
    label: 'Scheduled',
  },
  CANCELED: {
    icon: Circle,
    variant: 'outline' as const,
    label: 'Canceled',
  },
};

export function RunCard({ run }: RunCardProps) {
  const statusInfo = statusConfig[run.status as keyof typeof statusConfig] || statusConfig.SCHEDULED;
  const StatusIcon = statusInfo.icon;

  // Calculate progress percentage
  const progress = run.task_statistics
    ? Math.round(
        ((run.task_statistics.success + run.task_statistics.failed + run.task_statistics.skipped) /
          run.task_statistics.total) *
          100
      )
    : 0;

  return (
    <Card className="hover:bg-accent transition-colors cursor-pointer">
      <Link to="/runs/$runId" params={{ runId: run.id }} className="block">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <StatusIcon
                  className={`h-5 w-5 ${
                    run.status === 'RUNNING' ? 'animate-spin' : ''
                  }`}
                />
                {run.id.slice(0, 8)}
              </CardTitle>
              <CardDescription>
                Created {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
              </CardDescription>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Task Statistics */}
          {run.task_statistics && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{run.task_statistics.success}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>{run.task_statistics.failed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Loader2 className="h-4 w-4 text-blue-600" />
                  <span>{run.task_statistics.running}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>{run.task_statistics.scheduled}</span>
                </div>
              </div>
            </div>
          )}

          {/* Duration */}
          {run.started_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Started {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
              </span>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
