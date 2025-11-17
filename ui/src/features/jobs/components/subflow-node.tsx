import {memo} from "react";
import {BaseNode, BaseNodeContent,} from "@/components/base-node";
import type {Node, NodeProps} from '@xyflow/react';
import {Position} from "@xyflow/react";
import {BaseHandle} from "@/components/base-handle.tsx";
import {type TaskResponse} from "@/lib/schemas";
import {Workflow} from "lucide-react";
import {NodeAppendix} from "@/components/node-appendix.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Separator} from "@/components/ui/separator.tsx";


type TaskSubflowNodeProps = NodeProps<Node & {
    data: {
        jobId: string;
        task: TaskResponse,
    };
}>


export const SubflowNode = memo((node: TaskSubflowNodeProps) => {
    const {task} = node.data


    return (
        <BaseNode className="h-full border  border-dashed bg-transparent">
            <NodeAppendix position="top" className="border-none bg-transparent p-3">
                <Badge
                    className="rounded "
                    variant="secondary"
                >
                    <Workflow/>
                    <span>{(task.name || task.kind).toUpperCase()}</span>
                    -
                    <span>{task.status}</span>
                </Badge>
            </NodeAppendix>
            <BaseNodeContent>
                <BaseHandle type="target" position={Position.Left}/>
                <BaseHandle type="source" position={Position.Right}/>
            </BaseNodeContent>
        </BaseNode>
    );
});

SubflowNode.displayName = "SubflowNode";