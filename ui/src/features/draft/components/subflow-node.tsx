import {memo} from "react";
import {BaseNode, BaseNodeContent,} from "@/components/base-node";
import type {Node, NodeProps} from '@xyflow/react';
import {Position} from "@xyflow/react";
import {BaseHandle} from "@/components/base-handle.tsx";
import {type TaskResponse} from "@/features/night-batch";
import {Workflow} from "lucide-react";
import {NodeAppendix} from "@/components/node-appendix.tsx";
import {Badge} from "@/components/ui/badge.tsx";


type TaskSubflowNodeProps = NodeProps<Node & {
    data: {
        runId: string;
        label: string;
        task: TaskResponse,
        taskPath: string,
    };
}>


export const SubflowNode = memo((node: TaskSubflowNodeProps) => {
    const {label, task} = node.data


    return (
        <BaseNode className="h-full border-2  border-dashed bg-transparent">
            <NodeAppendix position="top" className="border-none bg-transparent p-0">
                <Badge
                    className="gap-1 self-start border-2  p-1 text-xs  rounded-none border-dashed"
                    variant="outline"
                >
                    <Workflow className="text-muted-foreground text-lg size-6!"/>
                    <span className="text-lg">{label.toUpperCase()} - {task.state.toUpperCase()}</span>
                </Badge>
            </NodeAppendix>
            <BaseNodeContent>
                <BaseHandle type="target" position={Position.Left}/>
                <BaseHandle type="source" position={Position.Right}/>
            </BaseNodeContent>
        </BaseNode>
    );
});

SubflowNode.displayName = "TaskNode";