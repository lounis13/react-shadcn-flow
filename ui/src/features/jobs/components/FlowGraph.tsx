import {
    Background,
    Controls,
    type Edge,
    MiniMap,
    type Node,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {useEffect} from "react";
import type {JobGraph} from "@/lib/schemas";
import {useLayout} from "../hooks/useLayout";
import {Loader2} from "lucide-react";
import {TaskNode} from "../components/task-node";
import {SubflowNode} from "../components/subflow-node";

const nodeTypes = {
    subflow: SubflowNode,
    task: TaskNode,
};

interface FlowGraphProps {
    job: JobGraph;
}

export function FlowGraph({job}: FlowGraphProps) {
    const {nodes: layoutNodes, edges: layoutEdges, isLoading} = useLayout(job);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        if (layoutNodes.length === 0) return;
        setNodes(layoutNodes);
        setEdges(layoutEdges);
    }, [layoutNodes, layoutEdges, setNodes, setEdges]);

    if (isLoading && nodes.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background/>
                <MiniMap/>
                <Controls/>
            </ReactFlow>
        </div>
    );
}
