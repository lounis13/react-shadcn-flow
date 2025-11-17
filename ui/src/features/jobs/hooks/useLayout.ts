/**
 * useLayout hook
 * Computes graph layout using ELK and returns React Flow nodes and edges
 */

import {useEffect, useState} from 'react';
import type {Edge, Node} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import type {JobGraph} from '@/lib/schemas';
import type {ElkGraph} from '../lib/elk-types';
import {buildElkGraph} from '../lib/graph-builder';
import {collectEdges, flattenElkNodes} from '../lib/elk-layout';
import type {ElkNode} from "elkjs/lib/elk-api";

const elk = new ELK();

export type LayoutResult = {
    nodes: Node[];
    edges: Edge[];
    isLoading: boolean;
};

/**
 * Compute layout from job data using ELK
 */
async function computeLayout(job: JobGraph): Promise<{ nodes: Node[]; edges: Edge[] }> {
    const elkGraph = buildElkGraph(job) as ElkNode;
    const graphLayout = (await elk.layout(elkGraph)) as ElkGraph;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Collect root-level edges
    collectEdges(graphLayout.edges, edges);

    // Flatten all children nodes (internal edges are collected during traversal)
    for (const child of graphLayout.children ?? []) {
        flattenElkNodes(child, nodes, edges);
    }

    // Create task mapping by ID
    const taskById = new Map<string, any>();

    // Recursively collect all tasks including nested ones
    function collectTasks(tasks: any[]) {
        for (const task of tasks) {
            taskById.set(task.id, task);
            if (task.children && task.children.length > 0) {
                collectTasks(task.children);
            }
        }
    }
    collectTasks(job.children);

    // Enrich nodes with task data
    const enrichedNodes = nodes.map((node) => {
        const task = taskById.get(node.id);
        if (task) {
            if (task.task_type === 'JOB') {
                return {
                    ...node,
                    type: 'subflow',
                    data: {
                        ...node.data,
                        task,
                        jobId: job.id,
                    },
                };
            } else {
                return {
                    ...node,
                    type: 'task',
                    data: {
                        ...node.data,
                        task,
                        jobId: job.id,
                    },
                };
            }
        }
        return node;
    });

    return {nodes: enrichedNodes, edges};
}

/**
 * Hook to compute and return graph layout
 */
export function useLayout(job: JobGraph | undefined): LayoutResult {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!job) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        computeLayout(job)
            .then(({nodes, edges}) => {
                setNodes(nodes);
                setEdges(edges);
            })
            .catch((error) => {
                console.error('Failed to compute layout:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [job]);

    return {nodes, edges, isLoading};
}
