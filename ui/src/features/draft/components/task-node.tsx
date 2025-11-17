import * as React from "react";
import {memo, useState} from "react";
import {BaseNode, BaseNodeContent,} from "@/components/base-node";
import type {Node, NodeProps} from '@xyflow/react';
import {Position} from "@xyflow/react";
import {BaseHandle} from "@/components/base-handle.tsx";
import {type TaskResponse, useRetryTask} from "@/features/night-batch";
import {NodeStatusIndicator} from "@/components/node-status-indicator.tsx";
import {Loader2, RotateCcw} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Label} from "@/components/ui/label.tsx";


type TaskNodeProps = NodeProps<Node & {
    data: {
        runId: string;
        label: string;
        task: TaskResponse,
        taskPath: string,
    };
}>
export const TaskNode = memo((node: TaskNodeProps) => {
    const {task, taskPath, label, runId} = node.data
    const retryMutation = useRetryTask();
    const [showRetryDialog, setShowRetryDialog] = useState(false);
    const [resetDownstream, setResetDownstream] = useState(false);


    const handleRetryClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowRetryDialog(true);
    };

    const handleRetryConfirm = () => {
        retryMutation.mutate({
            runId,
            data: {
                task_path: taskPath,
                reset_downstream: resetDownstream,
            },
        });
        setShowRetryDialog(false);
        setResetDownstream(false);
    };

    return (<>
            <NodeStatusIndicator status={task.state} variant="border">
                <BaseNode className="h-full  border-1">
                    <BaseNodeContent className="flex flex-row content-between   justify-between">
                        <BaseHandle type="target" position={Position.Left}/>
                        <div>{label}</div>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleRetryClick}
                            disabled={retryMutation.isPending}
                        >
                            <RotateCcw />
                        </Button>
                        <BaseHandle type="source" position={Position.Right}/>
                    </BaseNodeContent>
                </BaseNode>

            </NodeStatusIndicator>
            <Dialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Retry Task</DialogTitle>
                        <DialogDescription>
                            Retry the task "{task.task_name}" with the following options.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="reset-downstream"
                            checked={resetDownstream}
                            onCheckedChange={(checked) => setResetDownstream(checked === true)}
                        />
                        <Label htmlFor="reset-downstream">Reset downstream tasks</Label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRetryDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRetryConfirm} disabled={retryMutation.isPending}>
                            {retryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin"/>}
                            Retry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>
    );
});

TaskNode.displayName = "TaskNode";