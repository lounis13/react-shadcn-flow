/**
 * useLayout hook
 * Computes graph layout using ELK and returns React Flow nodes and edges
 */

import {useEffect, useState} from 'react';
import type {Edge, Node} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import type {RunResponse} from '../schemas';
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
 * Compute layout from run data using ELK
 */
async function computeLayout(run: RunResponse): Promise<{ nodes: Node[]; edges: Edge[] }> {
    const elkGraph = buildElkGraph(run) as ElkNode;
    const graphLayout = (await elk.layout(elkGraph)) as ElkGraph;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Collect root-level edges (between subflows and top-level tasks)
    collectEdges(graphLayout.edges, edges);

    // Flatten all children nodes (internal edges are collected during traversal)
    for (const child of graphLayout.children ?? []) {
        flattenElkNodes(child, nodes, edges);
    }

    // Create task mapping by ID and build task paths
    const taskById = new Map<string, any>();
    const taskPathById = new Map<string, string>();

    // Root-level tasks
    for (const task of run.tasks) {
        taskById.set(task.id, task);
        taskPathById.set(task.id, task.task_id);
    }

    // Build subflow instance to parent task mapping (recursively collect all subflows)
    const subflowToParentTask = new Map<string, any>();
    const allSubflows: any[] = [];

    // Recursive function to collect all subflows and their parent mapping
    function collectSubflows(subflows: any[], parentTasks: any[]) {
        for (let i = 0; i < subflows.length; i++) {
            const subflow = subflows[i];
            const parentTask = parentTasks[i];

            allSubflows.push(subflow);
            if (parentTask?.subflow_instance_id) {
                subflowToParentTask.set(parentTask.subflow_instance_id, parentTask);
            }

            // Recursively process nested subflows
            if (subflow.subflows && subflow.subflows.length > 0) {
                // Find parent tasks for nested subflows
                const nestedParentTasks = subflow.tasks.filter(
                    (t: any) => t.type === 'subflow' && t.subflow_instance_id
                );
                collectSubflows(subflow.subflows, nestedParentTasks);
            }
        }
    }

    // Start collection from root tasks
    const rootSubflowTasks = run.tasks.filter(
        (t) => t.type === 'subflow' && t.subflow_instance_id
    );
    collectSubflows(run.subflows, rootSubflowTasks);

    // Recursive function to build full path
    const buildTaskPath = (task: any, subflowId?: string): string => {
        if (!subflowId) {
            // Root-level task
            return task.task_id;
        }

        // Find parent subflow task
        const parentTask = subflowToParentTask.get(subflowId);
        if (!parentTask) {
            return task.task_id;
        }

        // Get parent path recursively
        const parentPath = taskPathById.get(parentTask.id) || parentTask.task_id;
        return `${parentPath}>>${task.task_id}`;
    };

    // Subflow tasks - build path with full hierarchy (now includes nested subflows)
    for (const subflow of allSubflows) {
        for (const task of subflow.tasks) {
            taskById.set(task.id, task);
            const fullPath = buildTaskPath(task, subflow.id);
            taskPathById.set(task.id, fullPath);
        }
    }

    // Enrich nodes with task data and path
    const enrichedNodes = nodes.map((node) => {
        const task = taskById.get(node.id);
        const taskPath = taskPathById.get(node.id);
        if (task) {
            if (node.type === 'subflow') {
                return {
                    ...node,
                    type: 'subflow',
                    data: {
                        ...node.data,
                        task,
                        taskPath: taskPath || task.task_id,
                        runId: run.id,
                    },
                };
            } else {
                return {
                    ...node,
                    type: 'task',
                    data: {
                        ...node.data,
                        task,
                        taskPath: taskPath || task.task_id,
                        runId: run.id,
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
export function useLayout(run: RunResponse | undefined): LayoutResult {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!run) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        computeLayout(run)
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
    }, [run]);

    return {nodes, edges, isLoading};
}
