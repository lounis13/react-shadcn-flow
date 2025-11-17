/**
 * ELK (Eclipse Layout Kernel) type definitions
 * Used for automatic graph layout computation
 */

export type ElkPoint = {
  x: number;
  y: number;
};

export type ElkSection = {
  startPoint: ElkPoint;
  endPoint: ElkPoint;
  bendPoints?: ElkPoint[];
};

export type ElkEdge = {
  id: string;
  sources: string[];
  targets: string[];
  sections?: ElkSection[];
};

export type ElkNode = {
  id: string;
  labels?: Array<{ text: string }>;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ElkNode[];
  edges?: ElkEdge[];
  layoutOptions?: Record<string, string>;
};

export type ElkGraph = ElkNode & {
  id: string;
  labels?: Array<{ text: string }>;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ElkNode[];
  edges?: ElkEdge[];
  layoutOptions?: Record<string, string>;
};
