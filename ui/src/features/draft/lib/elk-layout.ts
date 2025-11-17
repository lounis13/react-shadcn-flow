/**
 * ELK layout utilities
 * Converts ELK graph with computed positions to React Flow nodes and edges
 */

import {type Edge, type Node, Position, type XYPosition} from '@xyflow/react';
import type {ElkEdge, ElkNode} from './elk-types';

/**
 * Collect edges from ELK node hierarchy
 */
export function collectEdges(levelEdges: ElkEdge[] | undefined, output: Edge[]): void {
    if (!levelEdges) return;

    for (const edge of levelEdges) {
        for (const source of edge.sources) {
            for (const target of edge.targets) {
                output.push({
                    id: edge.id,
                    source,
                    target,
                    type: "smoothstep",
                });
            }
        }
    }
}

/**
 * Recursively flatten ELK node hierarchy into React Flow nodes
 */
export function flattenElkNodes(
    node: ElkNode,
    outNodes: Node[],
    outEdges: Edge[],
    _parentNode?: string,
    offset: XYPosition = {x: 0, y: 0}
): void {
    const absX = (node.x ?? 0) + offset.x;
    const absY = (node.y ?? 0) + offset.y;
    const isGroup = !!(node.children && node.children.length);

    outNodes.push({
        id: node.id,
        position: {x: absX, y: absY},
        data: {label: node.labels?.[0]?.text ?? node.id},
        draggable: false,
        selectable: !isGroup,
        type: isGroup ? 'subflow' : 'task',
        connectable: true,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
            ...(node.width ? {width: node.width} : {}),
            ...(node.height ? {height: node.height} : {}),
            zIndex: isGroup ? -10 : 100,
        },
    });

    // Collect edges at this level
    collectEdges(node.edges, outEdges);

    // Process children recursively
    if (node.children) {
        for (const child of node.children) {
            flattenElkNodes(child, outNodes, outEdges, node.id, {x: absX, y: absY});
        }
    }
}
