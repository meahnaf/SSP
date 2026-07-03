export type Point = { x: number; y: number };

export type Segment = {
  id: string;
  layer: LayerKey;
  type: string;
  a: Point;
  b: Point;
  label?: string;
};

export type LayerKey =
  | "perimeter"
  | "original"
  | "dcj"
  | "rscj"
  | "primary"
  | "secondary"
  | "nodes"
  | "edges";

export const LAYER_META: Record<
  LayerKey,
  { name: string; color: string; description: string }
> = {
  perimeter: { name: "Slab Perimeter", color: "var(--geometry)", description: "Outer boundary" },
  original: { name: "Original Geometry", color: "var(--geometry-muted)", description: "Source DXF linework" },
  dcj: { name: "DCJ Labels", color: "var(--label)", description: "Day Construction Joints" },
  rscj: { name: "RSCJ Labels", color: "var(--label)", description: "Restrained Shrinkage Joints" },
  primary: { name: "Primary Joint Chains", color: "oklch(0.55 0.19 250)", description: "Primary chain routing" },
  secondary: { name: "Secondary Branches", color: "oklch(0.62 0.14 180)", description: "Secondary branch joints" },
  nodes: { name: "Graph Nodes", color: "oklch(0.55 0.20 30)", description: "Topological nodes" },
  edges: { name: "Graph Edges", color: "oklch(0.65 0.12 155)", description: "Topological edges" },
};

export const LAYER_ORDER: LayerKey[] = [
  "original",
  "dcj",
  "rscj",
  "primary",
  "secondary",
  "nodes",
  "edges",
  "perimeter",
];

// A synthetic slab drawing in engineering (mm) world coordinates.
// Origin lower-left; canvas will invert Y for screen.
const PERIM: Point[] = [
  { x: 0, y: 0 },
  { x: 42000, y: 0 },
  { x: 42000, y: 18000 },
  { x: 30000, y: 18000 },
  { x: 30000, y: 24000 },
  { x: 12000, y: 24000 },
  { x: 12000, y: 18000 },
  { x: 0, y: 18000 },
];

function makeChain(points: Point[], layer: LayerKey, prefix: string): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segs.push({
      id: `${prefix}-${i + 1}`,
      layer,
      type: layer === "perimeter" ? "Slab Edge" : layer.toUpperCase(),
      a: points[i],
      b: points[i + 1],
    });
  }
  return segs;
}

const perimeterClosed = [...PERIM, PERIM[0]];

export const SEGMENTS: Segment[] = [
  ...makeChain(perimeterClosed, "perimeter", "SLAB-EDGE"),

  // Original geometry — internal reference linework
  ...makeChain(
    [
      { x: 6000, y: 4000 },
      { x: 36000, y: 4000 },
    ],
    "original",
    "GEO",
  ),
  ...makeChain(
    [
      { x: 6000, y: 14000 },
      { x: 36000, y: 14000 },
    ],
    "original",
    "GEO",
  ),

  // Primary joint chain — long horizontal
  {
    id: "DCJ-1",
    layer: "primary",
    type: "Day Construction Joint",
    a: { x: 0, y: 9000 },
    b: { x: 42000, y: 9000 },
    label: "DCJ-1",
  },
  // Primary vertical
  {
    id: "DCJ-2",
    layer: "primary",
    type: "Day Construction Joint",
    a: { x: 21000, y: 0 },
    b: { x: 21000, y: 24000 },
    label: "DCJ-2",
  },

  // Secondary branches
  {
    id: "RSCJ-1",
    layer: "secondary",
    type: "Restrained Shrinkage Joint",
    a: { x: 7000, y: 0 },
    b: { x: 7000, y: 9000 },
    label: "RSCJ-1",
  },
  {
    id: "RSCJ-2",
    layer: "secondary",
    type: "Restrained Shrinkage Joint",
    a: { x: 14000, y: 0 },
    b: { x: 14000, y: 9000 },
    label: "RSCJ-2",
  },
  {
    id: "RSCJ-3",
    layer: "secondary",
    type: "Restrained Shrinkage Joint",
    a: { x: 28000, y: 0 },
    b: { x: 28000, y: 9000 },
    label: "RSCJ-3",
  },
  {
    id: "RSCJ-4",
    layer: "secondary",
    type: "Restrained Shrinkage Joint",
    a: { x: 35000, y: 0 },
    b: { x: 35000, y: 9000 },
    label: "RSCJ-4",
  },
  {
    id: "RSCJ-5",
    layer: "secondary",
    type: "Restrained Shrinkage Joint",
    a: { x: 7000, y: 9000 },
    b: { x: 7000, y: 18000 },
    label: "RSCJ-5",
  },
  {
    id: "RSCJ-6",
    layer: "secondary",
    type: "Restrained Shrinkage Joint",
    a: { x: 14000, y: 9000 },
    b: { x: 14000, y: 24000 },
    label: "RSCJ-6",
  },
  {
    id: "RSCJ-7",
    layer: "secondary",
    type: "Restrained Shrinkage Joint",
    a: { x: 28000, y: 9000 },
    b: { x: 28000, y: 18000 },
    label: "RSCJ-7",
  },
  {
    id: "RSCJ-8",
    layer: "secondary",
    type: "Restrained Shrinkage Joint",
    a: { x: 35000, y: 9000 },
    b: { x: 35000, y: 18000 },
    label: "RSCJ-8",
  },

  // Graph edges (topology)
  {
    id: "E-1",
    layer: "edges",
    type: "Graph Edge",
    a: { x: 3500, y: 4500 },
    b: { x: 10500, y: 4500 },
  },
  {
    id: "E-2",
    layer: "edges",
    type: "Graph Edge",
    a: { x: 10500, y: 4500 },
    b: { x: 17500, y: 4500 },
  },
  {
    id: "E-3",
    layer: "edges",
    type: "Graph Edge",
    a: { x: 24500, y: 4500 },
    b: { x: 31500, y: 4500 },
  },
];

export const NODES: (Point & { id: string })[] = [
  { id: "N-1", x: 3500, y: 4500 },
  { id: "N-2", x: 10500, y: 4500 },
  { id: "N-3", x: 17500, y: 4500 },
  { id: "N-4", x: 24500, y: 4500 },
  { id: "N-5", x: 31500, y: 4500 },
  { id: "N-6", x: 38500, y: 4500 },
  { id: "N-7", x: 10500, y: 13500 },
  { id: "N-8", x: 31500, y: 13500 },
  { id: "N-9", x: 17500, y: 21000 },
  { id: "N-10", x: 24500, y: 21000 },
];

export const LABELS: {
  id: string;
  layer: "dcj" | "rscj";
  text: string;
  at: Point;
}[] = [
  { id: "L-DCJ-1", layer: "dcj", text: "DCJ-1", at: { x: 1200, y: 9600 } },
  { id: "L-DCJ-2", layer: "dcj", text: "DCJ-2", at: { x: 21400, y: 22800 } },
  { id: "L-RSCJ-1", layer: "rscj", text: "RSCJ-1", at: { x: 7200, y: 600 } },
  { id: "L-RSCJ-2", layer: "rscj", text: "RSCJ-2", at: { x: 14200, y: 600 } },
  { id: "L-RSCJ-3", layer: "rscj", text: "RSCJ-3", at: { x: 28200, y: 600 } },
  { id: "L-RSCJ-4", layer: "rscj", text: "RSCJ-4", at: { x: 35200, y: 600 } },
];

export const DRAWING_BOUNDS = {
  minX: -1000,
  minY: -1000,
  maxX: 43000,
  maxY: 25000,
};

// Load geometry from JSON or use mock data
let loadedSegments: Segment[] | null = null;
let loadedNodes: (Point & { id: string })[] | null = null;
let loadedLabels: {
  id: string;
  layer: "dcj" | "rscj";
  text: string;
  at: Point;
}[] | null = null;
let loadedBounds: typeof DRAWING_BOUNDS | null = null;

/**
 * Load geometry from geometry.json file
 * Call this to load real backend data instead of mock data
 */
export async function loadGeometryFromJSON(): Promise<void> {
  try {
    const { loadGeometry, transformGeometryToSegments, transformNodesToSegments, transformLabelsToSegments, getDrawingBounds } = await import('./api');
    
    const data = await loadGeometry('/geometry.json');
    
    // Transform all data
    loadedSegments = [
      ...transformGeometryToSegments(data),
      ...transformNodesToSegments(data),
      ...transformLabelsToSegments(data)
    ];
    
    loadedNodes = data.graph.nodes.map((node) => ({
      id: `node-${node.node_id}`,
      x: node.x,
      y: node.y
    }));
    
    loadedLabels = data.labels.map((label) => ({
      id: label.id,
      layer: label.layer as "dcj" | "rscj",
      text: label.text,
      at: { x: label.x, y: label.y }
    }));
    
    const bounds = getDrawingBounds(data);
    loadedBounds = {
      minX: bounds.minX,
      minY: bounds.minY,
      maxX: bounds.maxX,
      maxY: bounds.maxY
    };
    
    console.log('Geometry loaded from JSON:', {
      segments: loadedSegments?.length || 0,
      nodes: loadedNodes?.length || 0,
      labels: loadedLabels?.length || 0
    });
  } catch (error) {
    console.error('Failed to load geometry from JSON, using mock data:', error);
    // Keep null to fall back to mock data
  }
}

/**
 * Get segments - returns loaded JSON data or mock data
 */
export function getSegments(): Segment[] {
  return loadedSegments || SEGMENTS;
}

/**
 * Get nodes - returns loaded JSON data or mock data
 */
export function getNodes(): (Point & { id: string })[] {
  return loadedNodes || NODES;
}

/**
 * Get labels - returns loaded JSON data or mock data
 */
export function getLabels(): {
  id: string;
  layer: "dcj" | "rscj";
  text: string;
  at: Point;
}[] {
  return loadedLabels || LABELS;
}

/**
 * Get drawing bounds - returns loaded JSON data or mock data
 */
export function getDrawingBoundsData(): typeof DRAWING_BOUNDS {
  return loadedBounds || DRAWING_BOUNDS;
}

export function segmentLength(s: Segment): number {
  return Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
}

export function segmentAngle(s: Segment): number {
  return (Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x) * 180) / Math.PI;
}

export function distancePointToSegment(p: Point, s: Segment): number {
  const dx = s.b.x - s.a.x;
  const dy = s.b.y - s.a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - s.a.x, p.y - s.a.y);
  let t = ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = s.a.x + t * dx;
  const py = s.a.y + t * dy;
  return Math.hypot(p.x - px, p.y - py);
}
