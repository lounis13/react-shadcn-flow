import type { RunResponse, TaskResponse, SubflowResponse } from '../schemas';
import type { ElkGraph, ElkNode, ElkEdge } from './elk-types';

const DEFAULT_TASK_WIDTH = 250;
const DEFAULT_TASK_HEIGHT = 56;
const DEFAULT_SUBFLOW_WIDTH = 200;
const DEFAULT_SUBFLOW_HEIGHT = 100;

const ROOT_LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '120',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.semiInteractive': 'true',
};

const SUBFLOW_LAYOUT_OPTIONS = {
  'elk.direction': 'RIGHT',
  'elk.padding': '[top=28,left=28,bottom=28,right=28]',
  'elk.spacing.nodeNode': '60',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
};

/**
 * Create a leaf node (task) for ELK
 */
function createTaskNode(task: TaskResponse): ElkNode {
  return {
    id: task.id,
    labels: [{ text: task.task_name || task.task_id }],
    width: DEFAULT_TASK_WIDTH,
    height: DEFAULT_TASK_HEIGHT,
  };
}

/**
 * Create edges from task dependencies
 */
function createEdgesFromTask(task: TaskResponse, prefix: string): ElkEdge[] {
  return (task.dependencies || []).map((dep) => ({
    id: `${prefix}:${dep.instance_id}->${task.id}`,
    sources: [dep.instance_id],
    targets: [task.id],
  }));
}

/**
 * Create a subflow group node with its children (recursively handles nested subflows)
 */
function createSubflowNode(
  task: TaskResponse,
  subflow: SubflowResponse,
  allSubflows: Map<string, SubflowResponse>
): ElkNode {
  const children: ElkNode[] = [];
  const edges: ElkEdge[] = [];

  // Process tasks and nested subflows
  for (const subTask of subflow.tasks) {
    if (subTask.type === 'subflow' && subTask.subflow_instance_id) {
      // Recursively create nested subflow nodes
      const nestedSubflow = allSubflows.get(subTask.subflow_instance_id);
      if (nestedSubflow) {
        children.push(createSubflowNode(subTask, nestedSubflow, allSubflows));
      }
    } else {
      children.push(createTaskNode(subTask));
    }

    // Add internal edges for subflow tasks
    edges.push(...createEdgesFromTask(subTask, `sf:${subflow.id}`));
  }

  return {
    id: task.id,
    labels: [{ text: task.task_name || task.task_id }],
    width: DEFAULT_SUBFLOW_WIDTH,
    height: DEFAULT_SUBFLOW_HEIGHT,
    children,
    edges,
    layoutOptions: SUBFLOW_LAYOUT_OPTIONS,
  };
}

/**
 * Recursively collect all subflows into a flat map
 */
function collectAllSubflows(subflows: SubflowResponse[]): Map<string, SubflowResponse> {
  const map = new Map<string, SubflowResponse>();

  function addSubflow(sf: SubflowResponse) {
    map.set(sf.id, sf);
    // Recursively add nested subflows
    if (sf.subflows) {
      for (const nested of sf.subflows) {
        addSubflow(nested);
      }
    }
  }

  for (const sf of subflows) {
    addSubflow(sf);
  }

  return map;
}

/**
 * Build ELK graph from API run response
 */
export function buildElkGraph(run: RunResponse): ElkGraph {
  // Recursively collect all subflows (including nested ones)
  const allSubflows = collectAllSubflows(run.subflows);
  const children: ElkNode[] = [];
  const edges: ElkEdge[] = [];

  for (const task of run.tasks) {
    if (task.type === 'subflow' && task.subflow_instance_id) {
      const subflow = allSubflows.get(task.subflow_instance_id);
      if (subflow) {
        children.push(createSubflowNode(task, subflow, allSubflows));
      }
    } else {
      children.push(createTaskNode(task));
    }

    edges.push(...createEdgesFromTask(task, 'root'));
  }

  return {
    id: run.id,
    layoutOptions: ROOT_LAYOUT_OPTIONS,
    children,
    edges,
  };
}
