/**
 * API Service for loading geometry.json from the geometry engine
 * 
 * This service handles loading the standardized JSON schema exported by the Python backend.
 * It provides type-safe parsing and transformation of the geometry data.
 */

export type Point = { x: number; y: number };

export type LayerKey =
  | "perimeter"
  | "original"
  | "dcj"
  | "rscj"
  | "primary"
  | "secondary"
  | "nodes"
  | "edges";

export type Segment = {
  id: string;
  layer: LayerKey;
  type: string;
  a: Point;
  b: Point;
  label?: string;
};

export type Label = {
  id: string;
  x: number;
  y: number;
  text: string;
  layer: string;
  matched_segment_id?: string;
};

export type ChainSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Chain = {
  chain_id: number;
  boundary_id: number;
  is_primary: boolean;
  segments: ChainSegment[];
  start_point: [number, number];
  end_point: [number, number];
  total_length: number;
  branch_point: [number, number] | null;
};

export type GraphNode = {
  node_id: number;
  x: number;
  y: number;
  node_type: string;
  chain_ids: number[];
  edge_ids: number[];
};

export type GraphEdge = {
  edge_id: number;
  start_node_id: number;
  end_node_id: number;
  chain_id: number;
  start: [number, number];
  end: [number, number];
  length: number;
};

export type PerimeterSegment = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Perimeter = {
  segments: PerimeterSegment[];
  is_closed: boolean;
  total_length: number;
};

export type Diagnostics = {
  total_segments: number;
  total_labels: number;
  total_chains: number;
  primary_chains: number;
  branch_chains: number;
  total_nodes: number;
  total_edges: number;
};

export type GeometryMetadata = {
  filename: string;
  processed_at: string;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  units: string;
  version: string;
};

export type GeometryData = {
  metadata: GeometryMetadata;
  segments: Segment[];
  labels: Label[];
  chains: Chain[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  perimeter: Perimeter;
  diagnostics: Diagnostics;
};

/**
 * Load geometry.json from the shared data directory
 * 
 * @param path - Path to the geometry.json file (relative to public directory)
 * @returns Parsed geometry data
 */
export async function loadGeometry(path: string = '/shared_data/output/geometry.json'): Promise<GeometryData> {
  try {
    const response = await fetch(path);
    
    if (!response.ok) {
      throw new Error(`Failed to load geometry.json: ${response.status} ${response.statusText}`);
    }
    
    const data: GeometryData = await response.json();
    
    // Validate basic structure
    if (!data.metadata || !data.segments || !data.chains) {
      throw new Error('Invalid geometry.json structure: missing required fields');
    }
    
    return data;
  } catch (error) {
    console.error('Error loading geometry.json:', error);
    throw error;
  }
}

/**
 * Transform geometry.json data into the format expected by the DrawingCanvas
 * 
 * This converts the backend JSON schema into the frontend Segment format
 * with proper layer mapping.
 */
export function transformGeometryToSegments(data: GeometryData): Segment[] {
  const segments: Segment[] = [];
  
  // Transform perimeter segments
  data.perimeter.segments.forEach((seg, index) => {
    segments.push({
      id: seg.id,
      layer: 'perimeter' as LayerKey,
      type: 'Slab Edge',
      a: { x: seg.x1, y: seg.y1 },
      b: { x: seg.x2, y: seg.y2 }
    });
  });
  
  // Transform original geometry segments
  data.segments.forEach((seg) => {
    if (seg.layer === 'original') {
      segments.push({
        id: seg.id,
        layer: 'original' as LayerKey,
        type: seg.type,
        a: { x: seg.x1, y: seg.y1 },
        b: { x: seg.x2, y: seg.y2 }
      });
    }
  });
  
  // Transform chains (primary and secondary)
  data.chains.forEach((chain) => {
    const layer: LayerKey = chain.is_primary ? 'primary' : 'secondary';
    const type = chain.is_primary ? 'Day Construction Joint' : 'Restrained Shrinkage Joint';
    
    // Find matching label if any
    const label = data.labels.find(l => l.matched_segment_id === `chain-${chain.chain_id}`);
    
    chain.segments.forEach((seg, index) => {
      segments.push({
        id: `chain-${chain.chain_id}-${index}`,
        layer,
        type,
        a: { x: seg.x1, y: seg.y1 },
        b: { x: seg.x2, y: seg.y2 },
        label: label?.text
      });
    });
  });
  
  // Transform graph edges
  data.graph.edges.forEach((edge) => {
    segments.push({
      id: `edge-${edge.edge_id}`,
      layer: 'edges' as LayerKey,
      type: 'Graph Edge',
      a: { x: edge.start[0], y: edge.start[1] },
      b: { x: edge.end[0], y: edge.end[1] }
    });
  });
  
  return segments;
}

/**
 * Transform graph nodes into point segments for rendering
 */
export function transformNodesToSegments(data: GeometryData): Segment[] {
  return data.graph.nodes.map((node) => ({
    id: `node-${node.node_id}`,
    layer: 'nodes',
    type: node.node_type,
    a: { x: node.x, y: node.y },
    b: { x: node.x, y: node.y } // Point as zero-length segment
  }));
}

/**
 * Transform labels into point segments with label data
 */
export function transformLabelsToSegments(data: GeometryData): Segment[] {
  return data.labels.map((label) => ({
    id: label.id,
    layer: label.layer as LayerKey,
    type: 'Label',
    a: { x: label.x, y: label.y },
    b: { x: label.x, y: label.y }, // Point as zero-length segment
    label: label.text
  }));
}

/**
 * Get drawing bounds from geometry metadata
 */
export function getDrawingBounds(data: GeometryData): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  return data.metadata.bounds;
}

/**
 * Calculate total bounds from all segments (fallback if metadata bounds are missing)
 */
export function calculateBoundsFromSegments(segments: Segment[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (segments.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  segments.forEach((seg) => {
    minX = Math.min(minX, seg.a.x, seg.b.x);
    minY = Math.min(minY, seg.a.y, seg.b.y);
    maxX = Math.max(maxX, seg.a.x, seg.b.x);
    maxY = Math.max(maxY, seg.a.y, seg.b.y);
  });
  
  return { minX, minY, maxX, maxY };
}
