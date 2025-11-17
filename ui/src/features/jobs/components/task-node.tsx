import * as React from "react";
import { memo } from "react";
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
} from "@/components/base-node";
import type { Node, NodeProps } from "@xyflow/react";
import { Position } from "@xyflow/react";
import { BaseHandle } from "@/components/base-handle.tsx";
import { type TaskResponse } from "@/lib/schemas";
import { useRetryTask } from "../api/queries";
import { NodeStatusIndicator } from "@/components/node-status-indicator.tsx";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";

type TaskNodeProps = NodeProps<
  Node & {
    data: {
      jobId: string;
      task: TaskResponse;
    };
  }
>;
export const TaskNode = memo((node: TaskNodeProps) => {
  const { task, jobId } = node.data;
  const retryMutation = useRetryTask();

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    retryMutation.mutate({
      jobId,
      taskId: task.id,
    });
  };

  return (
    <NodeStatusIndicator status={task.status.toLowerCase()} variant="border">
      <BaseNode className="w-full h-full">
        <BaseNodeHeader className="border-b">
          <Badge variant="secondary" className="rounded">
            {task.status}
          </Badge>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRetryClick}
            disabled={retryMutation.isPending}
          >
            <RotateCcw />
          </Button>
        </BaseNodeHeader>
        <BaseNodeContent>
          <BaseHandle type="target" position={Position.Left} />
          <span>{task.name || task.kind}</span>
          <span className="text-xs text-secondary-foreground">
            {task.started_at}
          </span>
          <BaseHandle type="source" position={Position.Right} />
        </BaseNodeContent>
      </BaseNode>
    </NodeStatusIndicator>
  );
});

TaskNode.displayName = "TaskNode";
