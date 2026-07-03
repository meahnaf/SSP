import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { LayerPanel } from "./LayerPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatusBar } from "./StatusBar";
import { DrawingCanvas, type CanvasHandle, type ViewState } from "./DrawingCanvas";
import { LAYER_ORDER, loadGeometryFromJSON, getSegments, type LayerKey, type Point, type Segment } from "./geometry";

const DEFAULT_VISIBLE: Record<LayerKey, boolean> = {
  perimeter: true,
  original: true,
  dcj: true,
  rscj: true,
  primary: true,
  secondary: true,
  nodes: false,
  edges: false,
};

export function OSTApp() {
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>(DEFAULT_VISIBLE);
  const [gridOn, setGridOn] = useState(true);
  const [hovered, setHovered] = useState<Segment | null>(null);
  const [selected, setSelected] = useState<Segment | null>(null);
  const [mouse, setMouse] = useState<Point | null>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, tx: 0, ty: 0 });
  const [drawingName] = useState("SLAB-L02-POUR-PLAN.dxf");

  const handleRef = useRef<CanvasHandle | null>(null);
  const onReady = useCallback((h: CanvasHandle) => {
    handleRef.current = h;
  }, []);

  // Load geometry from JSON on mount
  useEffect(() => {
    loadGeometryFromJSON();
  }, []);

  const toggleLayer = useCallback((k: LayerKey) => {
    setVisible((v) => ({ ...v, [k]: !v[k] }));
  }, []);
  const setAll = useCallback((val: boolean) => {
    setVisible(
      Object.fromEntries(LAYER_ORDER.map((k) => [k, val])) as Record<LayerKey, boolean>,
    );
  }, []);

  const visibleKeys = useMemo(
    () => LAYER_ORDER.filter((k) => visible[k]),
    [visible],
  );

  // Keep hover in sync when a layer with the hovered segment turns off
  const validatedHovered =
    hovered && visible[hovered.layer]
      ? hovered
      : hovered
        ? null
        : null;
  const validatedSelected =
    selected && visible[selected.layer] ? selected : null;

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      <Toolbar
        drawingName={drawingName}
        gridOn={gridOn}
        onFit={() => handleRef.current?.fit()}
        onReset={() => handleRef.current?.reset()}
        onZoomIn={() => handleRef.current?.zoomIn()}
        onZoomOut={() => handleRef.current?.zoomOut()}
        onToggleGrid={() => setGridOn((v) => !v)}
        onScreenshot={() => handleRef.current?.screenshot()}
        onOpen={() => {
          /* placeholder — DXF import to be wired later */
        }}
      />

      <div className="flex flex-1 min-h-0">
        <LayerPanel visible={visible} onToggle={toggleLayer} onAll={setAll} />

        <div className="relative flex-1 min-w-0 flex flex-col bg-panel">
          {/* thin frame between chrome and canvas */}
          <div className="flex-1 min-h-0 border-y border-panel-border/40 flex">
            <DrawingCanvas
              visible={visible}
              showGrid={gridOn}
              selectedId={validatedSelected?.id ?? null}
              hoveredId={validatedHovered?.id ?? null}
              onHover={setHovered}
              onSelect={setSelected}
              onMouseWorld={setMouse}
              onView={setView}
              onReady={onReady}
            />
          </div>
        </div>

        <PropertiesPanel selected={validatedSelected} hovered={validatedHovered} />
      </div>

      <StatusBar
        drawingName={drawingName}
        zoom={view.scale}
        mouse={mouse}
        visibleLayers={visibleKeys}
        totalLayers={LAYER_ORDER.length}
        selectedId={validatedSelected?.id ?? null}
        hoveredId={validatedHovered?.id ?? null}
      />
    </div>
  );
}
