/**
 * FlowGraph component
 * Renders a run's task graph using React Flow
 */

import {
    Background,
    Controls,
    type Edge,
    MiniMap,
    type Node,
    ReactFlow,
    useEdgesState,
    useNodesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {useEffect, useRef} from 'react';
import type {RunResponse} from '../schemas';
import {useLayout} from '../hooks/useLayout';
import {Loader2} from 'lucide-react';
import {TaskNode} from "@/features/night-batch/components/task-node.tsx";
import "@xyflow/react/dist/style.css";
import {SubflowNode} from "@/features/night-batch/components/subflow-node.tsx";

const nodeTypes = {
    subflow: SubflowNode,
    task: TaskNode,
};

interface FlowGraphProps {
    run: RunResponse;
}

export function FlowGraph({run}: FlowGraphProps) {
    const {nodes: layoutNodes, edges: layoutEdges, isLoading} = useLayout(run);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current && layoutNodes.length > 0) {
            // First load: set nodes and edges normally
            setNodes(layoutNodes);
            setEdges(layoutEdges);
            initializedRef.current = true;
        } else if (initializedRef.current) {
            // Subsequent updates: only update node data without changing positions
            setNodes((currentNodes) =>
                currentNodes.map((node) => {
                    const updatedNode = layoutNodes.find((n) => n.id === node.id);
                    if (updatedNode) {
                        return {
                            ...node,
                            data: updatedNode.data,
                        };
                    }
                    return node;
                })
            );
        }
    }, [layoutNodes, layoutEdges, setNodes, setEdges]);

    if (isLoading && !initializedRef.current) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
        );
    }

    return (
        <div style={{width: '100%', height: '100%'}}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView={!initializedRef.current}
            >
                <Background/>
                <MiniMap/>
                <Controls/>
            </ReactFlow>
        </div>
    );
}
