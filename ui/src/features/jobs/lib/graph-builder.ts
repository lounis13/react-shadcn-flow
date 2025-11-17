import type { ElkEdge, ElkGraph, ElkNode } from "./elk-types";
import type { JobGraph, TaskDependency, TaskResponse } from "@/lib/schemas";

const DEFAULT_TASK_WIDTH = 280;
const DEFAULT_TASK_HEIGHT = 120;
const MIN_JOB_WIDTH = 280;
const MIN_JOB_HEIGHT = 120;

const ROOT_LAYOUT_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.hierarchyHandling": "INCLUDE_CHILDREN",
  "elk.spacing.nodeNode": "120",
  "elk.layered.spacing.nodeNodeBetweenLayers": "120",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  "elk.layered.crossingMinimization.semiInteractive": "true",
} as const;

const JOB_LAYOUT_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.padding": "[top=40,left=40,bottom=40,right=40]",
  "elk.spacing.nodeNode": "80",
  "elk.layered.spacing.nodeNodeBetweenLayers": "120",
  "elk.nodeSize.constraints": "MINIMUM_SIZE",
  "elk.nodeSize.minimum": `(${MIN_JOB_WIDTH},${MIN_JOB_HEIGHT})`,
} as const;

const getLabel = (task: TaskResponse) => task.name ?? task.kind;

const isJob = (
  t: TaskResponse,
): t is TaskResponse & { children: TaskResponse[] } =>
  t.task_type === "JOB" && Array.isArray(t.children) && t.children.length > 0;

const createTaskNode = (task: TaskResponse): ElkNode => ({
  id: task.id,
  labels: [{ text: getLabel(task) }],
  width: DEFAULT_TASK_WIDTH,
  height: DEFAULT_TASK_HEIGHT,
});

const createEdges = (task: { dependencies: TaskDependency[] }): ElkEdge[] => {
  const edges = task.dependencies.map((d) => ({
    id: `${d.upstream_task_id}->${d.task_id}`,
    sources: [d.upstream_task_id],
    targets: [d.task_id],
  }));
  return edges ?? [];
};

type BuildResult = {
  node: ElkNode;
};

const buildJob = (
  task: TaskResponse & { children: TaskResponse[] },
): BuildResult => {
  const built = task.children.map(buildNode);
  const childNodes = built.map((r) => r.node);
  const internalEdges = task.children.flatMap(createEdges);

  return {
    node: {
      id: task.id,
      labels: [{ text: getLabel(task) }],
      children: childNodes,
      edges: internalEdges,
      layoutOptions: JOB_LAYOUT_OPTIONS,
    },
  };
};

const buildNode = (task: TaskResponse): BuildResult =>
  isJob(task) ? buildJob(task) : { node: createTaskNode(task) };

export const buildElkGraph = (job: JobGraph): ElkGraph => {
  const built = job.children.map(buildNode);

  const children = built.map((r) => r.node);
  const internalRootEdges = job.children.flatMap(createEdges);
  const rootEdges = createEdges(job);

  return {
    id: job.id,
    layoutOptions: ROOT_LAYOUT_OPTIONS,
    children,
    edges: [...internalRootEdges, ...rootEdges],
  };
};
