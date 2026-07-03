import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DRAWING_BOUNDS,
  getDrawingBoundsData,
  getLabels,
  getNodes,
  getSegments,
  LAYER_META,
  distancePointToSegment,
  type LayerKey,
  type Point,
  type Segment,
} from "./geometry";

export type ViewState = { scale: number; tx: number; ty: number };

export type CanvasHandle = {
  fit: () => void;
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  screenshot: () => void;
  getView: () => ViewState;
};

type Props = {
  visible: Record<LayerKey, boolean>;
  showGrid: boolean;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (seg: Segment | null) => void;
  onSelect: (seg: Segment | null) => void;
  onMouseWorld: (p: Point | null) => void;
  onView: (v: ViewState) => void;
  onReady: (h: CanvasHandle) => void;
};

// World: X right, Y up (engineering). Screen SVG: Y down. We invert Y in transform.
export function DrawingCanvas(props: Props) {
  const {
    visible,
    showGrid,
    selectedId,
    hoveredId,
    onHover,
    onSelect,
    onMouseWorld,
    onView,
    onReady,
  } = props;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<ViewState>({ scale: 1, tx: 0, ty: 0 });
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const clickGuardRef = useRef(false);

  // Track container size
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Emit view changes
  useEffect(() => {
    onView(view);
  }, [view, onView]);

  const fit = useCallback(() => {
    if (!size.w || !size.h) return;
    const bounds = getDrawingBoundsData();
    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;
    const pad = 40;
    const scale = Math.min((size.w - pad * 2) / bw, (size.h - pad * 2) / bh);
    // Center of bbox in world
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    // screen = (world.x * scale) + tx  ; want screen center -> size/2
    // For Y: screen = (-world.y * scale) + ty
    setView({
      scale,
      tx: size.w / 2 - cx * scale,
      ty: size.h / 2 + cy * scale,
    });
  }, [size]);

  // initial fit
  useEffect(() => {
    if (size.w && size.h && view.scale === 1 && view.tx === 0 && view.ty === 0) {
      fit();
    }
  }, [size, fit, view.scale, view.tx, view.ty]);

  const zoomAt = useCallback(
    (factor: number, sx?: number, sy?: number) => {
      setView((v) => {
        const cx = sx ?? size.w / 2;
        const cy = sy ?? size.h / 2;
        const newScale = Math.min(50, Math.max(0.005, v.scale * factor));
        // world point under cursor should stay put
        const wx = (cx - v.tx) / v.scale;
        const wy = -(cy - v.ty) / v.scale;
        const tx = cx - wx * newScale;
        const ty = cy + wy * newScale;
        return { scale: newScale, tx, ty };
      });
    },
    [size],
  );

  const handle = useMemo<CanvasHandle>(
    () => ({
      fit,
      reset: fit,
      zoomIn: () => zoomAt(1.25),
      zoomOut: () => zoomAt(1 / 1.25),
      getView: () => view,
      screenshot: () => {
        const svg = svgRef.current;
        if (!svg) return;
        const clone = svg.cloneNode(true) as SVGSVGElement;
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const s = new XMLSerializer().serializeToString(clone);
        const blob = new Blob([s], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `slabtake-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }),
    [fit, zoomAt, view],
  );

  useEffect(() => {
    onReady(handle);
  }, [handle, onReady]);

  // Convert screen -> world
  const screenToWorld = useCallback(
    (sx: number, sy: number): Point => ({
      x: (sx - view.tx) / view.scale,
      y: -(sy - view.ty) / view.scale,
    }),
    [view],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = wrapRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const factor = Math.pow(1.0015, -e.deltaY);
      zoomAt(factor, sx, sy);
    },
    [zoomAt],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // middle mouse OR space+left OR right button for pan
      if (e.button === 1 || e.button === 2 || e.shiftKey) {
        e.preventDefault();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        panRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
        clickGuardRef.current = true;
      }
    },
    [view],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = wrapRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (panRef.current) {
        const dx = e.clientX - panRef.current.x;
        const dy = e.clientY - panRef.current.y;
        setView((v) => ({ ...v, tx: panRef.current!.tx + dx, ty: panRef.current!.ty + dy }));
        return;
      }

      const world = screenToWorld(sx, sy);
      onMouseWorld(world);

      // hover pick — distance threshold ~5px in screen space
      const threshold = 6 / view.scale;
      let best: Segment | null = null;
      let bestD = Infinity;
      for (const seg of getSegments()) {
        if (!visible[seg.layer]) continue;
        const d = distancePointToSegment(world, seg);
        if (d < bestD && d <= threshold) {
          bestD = d;
          best = seg;
        }
      }
      onHover(best);
    },
    [screenToWorld, view.scale, visible, onHover, onMouseWorld],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (panRef.current) {
      panRef.current = null;
      // suppress click that follows pan
      setTimeout(() => (clickGuardRef.current = false), 0);
    }
  }, []);

  const onClick = useCallback(() => {
    if (clickGuardRef.current) {
      clickGuardRef.current = false;
      return;
    }
    if (hoveredId) {
      const seg = getSegments().find((s) => s.id === hoveredId) ?? null;
      onSelect(seg);
    } else {
      onSelect(null);
    }
  }, [hoveredId, onSelect]);

  const onLeave = useCallback(() => {
    onHover(null);
    onMouseWorld(null);
  }, [onHover, onMouseWorld]);

  // Grid spacing — adapt to zoom (world mm). Base grid every 1000 mm (1m), major every 5m.
  const grid = useMemo(() => {
    if (!showGrid) return null;
    const worldPerPx = 1 / view.scale;
    // pick minor spacing so it appears ~20-60 px on screen
    const targetPx = 40;
    const raw = targetPx * worldPerPx;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const candidates = [1, 2, 5, 10].map((c) => c * pow);
    const minor = candidates.find((c) => c >= raw) ?? 1000;
    const major = minor * 5;
    return { minor, major };
  }, [showGrid, view.scale]);

  // World -> screen transform helpers
  const wx = (x: number) => x * view.scale + view.tx;
  const wy = (y: number) => -y * view.scale + view.ty;

  // Visible world bounds for grid clipping
  const worldTL = screenToWorld(0, 0);
  const worldBR = screenToWorld(size.w, size.h);
  const wxMin = Math.min(worldTL.x, worldBR.x);
  const wxMax = Math.max(worldTL.x, worldBR.x);
  const wyMin = Math.min(worldTL.y, worldBR.y);
  const wyMax = Math.max(worldTL.y, worldBR.y);

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 min-w-0 overflow-hidden bg-canvas select-none"
      style={{
        cursor: panRef.current ? "grabbing" : hoveredId ? "pointer" : "crosshair",
      }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onLeave}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="block"
        style={{ background: "var(--canvas)" }}
      >
        {/* Grid */}
        {grid && (
          <GridLayer
            minor={grid.minor}
            major={grid.major}
            wxMin={wxMin}
            wxMax={wxMax}
            wyMin={wyMin}
            wyMax={wyMax}
            wx={wx}
            wy={wy}
          />
        )}

        {/* World-axis crosshair (origin marker) */}
        <g stroke="oklch(0.75 0.10 220)" strokeWidth={1} opacity={0.5}>
          <line x1={wx(-500)} y1={wy(0)} x2={wx(500)} y2={wy(0)} />
          <line x1={wx(0)} y1={wy(-500)} x2={wx(0)} y2={wy(500)} />
        </g>

        {/* Segments — draw in layer order so perimeter sits on top */}
        {getSegments().map((seg) => {
          if (!visible[seg.layer]) return null;
          const isHover = hoveredId === seg.id;
          const isSel = selectedId === seg.id;
          const meta = LAYER_META[seg.layer];
          const stroke = isSel
            ? "var(--selected)"
            : isHover
              ? "var(--hover)"
              : meta.color;
          const baseWidth =
            seg.layer === "perimeter"
              ? 2.25
              : seg.layer === "primary"
                ? 1.75
                : seg.layer === "secondary"
                  ? 1.25
                  : seg.layer === "edges"
                    ? 1
                    : 1;
          const width = isSel ? baseWidth + 1.5 : isHover ? baseWidth + 1 : baseWidth;
          const dash =
            seg.layer === "primary"
              ? undefined
              : seg.layer === "secondary"
                ? "6 3"
                : seg.layer === "edges"
                  ? "2 3"
                  : undefined;
          return (
            <g key={seg.id}>
              {(isHover || isSel) && (
                <line
                  x1={wx(seg.a.x)}
                  y1={wy(seg.a.y)}
                  x2={wx(seg.b.x)}
                  y2={wy(seg.b.y)}
                  stroke={stroke}
                  strokeOpacity={0.18}
                  strokeWidth={width + 8}
                  strokeLinecap="round"
                />
              )}
              <line
                x1={wx(seg.a.x)}
                y1={wy(seg.a.y)}
                x2={wx(seg.b.x)}
                y2={wy(seg.b.y)}
                stroke={stroke}
                strokeWidth={width}
                strokeDasharray={dash}
                strokeLinecap={seg.layer === "perimeter" ? "square" : "round"}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {visible.nodes &&
          getNodes().map((n) => (
            <g key={n.id}>
              <circle
                cx={wx(n.x)}
                cy={wy(n.y)}
                r={4}
                fill="oklch(1 0 0)"
                stroke="oklch(0.55 0.20 30)"
                strokeWidth={1.5}
              />
              {view.scale > 0.02 && (
                <text
                  x={wx(n.x) + 6}
                  y={wy(n.y) - 6}
                  fontFamily="var(--font-mono)"
                  fontSize={9}
                  fill="oklch(0.35 0.12 30)"
                >
                  {n.id}
                </text>
              )}
            </g>
          ))}

        {/* Labels */}
        {getLabels().map((l) => {
          if (l.layer === "dcj" && !visible.dcj) return null;
          if (l.layer === "rscj" && !visible.rscj) return null;
          const color = LAYER_META[l.layer].color;
          const tw = l.text.length * 7 + 10;
          return (
            <g key={l.id}>
              <rect
                x={wx(l.at.x) - 3}
                y={wy(l.at.y) - 11}
                width={tw}
                height={14}
                rx={2}
                fill="oklch(1 0 0)"
                stroke={color}
                strokeWidth={1}
              />
              <text
                x={wx(l.at.x) + 2}
                y={wy(l.at.y)}
                fontFamily="var(--font-mono)"
                fontWeight={600}
                fontSize={10}
                fill={color}
              >
                {l.text}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Corner HUD — north arrow / scale bar */}
      <ScaleBar scale={view.scale} />
      <NorthArrow />

      {/* Empty-state watermark when nothing visible */}
      {Object.values(visible).every((v) => !v) && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="rounded-md border border-dashed border-panel-border/60 bg-white/60 px-4 py-2 text-[11px] font-medium text-panel-muted">
            All layers hidden — enable one in the Layers panel
          </div>
        </div>
      )}
    </div>
  );
}

function GridLayer({
  minor,
  major,
  wxMin,
  wxMax,
  wyMin,
  wyMax,
  wx,
  wy,
}: {
  minor: number;
  major: number;
  wxMin: number;
  wxMax: number;
  wyMin: number;
  wyMax: number;
  wx: (x: number) => number;
  wy: (y: number) => number;
}) {
  const startX = Math.floor(wxMin / minor) * minor;
  const startY = Math.floor(wyMin / minor) * minor;
  const linesMinor: React.ReactElement[] = [];
  const linesMajor: React.ReactElement[] = [];
  for (let x = startX; x <= wxMax; x += minor) {
    const isMajor = Math.abs(x % major) < 1e-6;
    const line = (
      <line
        key={`vx${x}`}
        x1={wx(x)}
        x2={wx(x)}
        y1={wy(wyMin)}
        y2={wy(wyMax)}
        stroke={isMajor ? "var(--canvas-grid-strong)" : "var(--canvas-grid)"}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    );
    (isMajor ? linesMajor : linesMinor).push(line);
  }
  for (let y = startY; y <= wyMax; y += minor) {
    const isMajor = Math.abs(y % major) < 1e-6;
    const line = (
      <line
        key={`hy${y}`}
        x1={wx(wxMin)}
        x2={wx(wxMax)}
        y1={wy(y)}
        y2={wy(y)}
        stroke={isMajor ? "var(--canvas-grid-strong)" : "var(--canvas-grid)"}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    );
    (isMajor ? linesMajor : linesMinor).push(line);
  }
  return (
    <g>
      {linesMinor}
      {linesMajor}
    </g>
  );
}

function ScaleBar({ scale }: { scale: number }) {
  // choose a nice round length (mm) that renders around 80-140px
  const targetPx = 110;
  const worldLen = targetPx / scale;
  const pow = Math.pow(10, Math.floor(Math.log10(worldLen)));
  const candidates = [1, 2, 5, 10].map((c) => c * pow);
  const chosen = candidates.reduce((a, b) =>
    Math.abs(b * scale - targetPx) < Math.abs(a * scale - targetPx) ? b : a,
  );
  const px = chosen * scale;
  const labelM = chosen / 1000;
  const label =
    labelM >= 1 ? `${labelM % 1 === 0 ? labelM.toFixed(0) : labelM.toFixed(2)} m` : `${chosen} mm`;
  return (
    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-[3px] border border-black/10 bg-white/90 px-2 py-1 shadow-sm">
      <div className="flex flex-col">
        <div
          className="flex h-2 items-stretch border border-neutral-800"
          style={{ width: px }}
        >
          <div className="flex-1 bg-neutral-800" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-neutral-800" />
          <div className="flex-1 bg-white" />
        </div>
        <span className="mt-0.5 font-mono text-[9px] tracking-wider text-neutral-700">
          0 ──── {label}
        </span>
      </div>
    </div>
  );
}

function NorthArrow() {
  return (
    <div className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/90 shadow-sm">
      <svg viewBox="0 0 40 40" className="h-8 w-8">
        <polygon points="20,4 26,28 20,22 14,28" fill="oklch(0.32 0.004 250)" />
        <polygon points="20,36 14,12 20,18 26,12" fill="oklch(0.75 0.005 250)" />
        <text
          x="20"
          y="14"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="7"
          fontWeight="700"
          fill="oklch(0.20 0 0)"
        >
          N
        </text>
      </svg>
    </div>
  );
}
