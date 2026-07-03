import type { LayerKey } from "./geometry";

export function StatusBar({
  drawingName,
  zoom,
  mouse,
  visibleLayers,
  totalLayers,
  selectedId,
  hoveredId,
}: {
  drawingName: string;
  zoom: number;
  mouse: { x: number; y: number } | null;
  visibleLayers: LayerKey[];
  totalLayers: number;
  selectedId: string | null;
  hoveredId: string | null;
}) {
  return (
    <div className="flex h-6 shrink-0 items-center gap-4 border-t border-toolbar-border bg-toolbar px-3 font-mono text-[10.5px] text-panel-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_currentColor] text-emerald-400" />
        <span className="text-panel-foreground/80">READY</span>
      </span>

      <Divider />
      <Field label="DWG" value={drawingName} strong />
      <Divider />
      <Field label="X" value={mouse ? fmtMm(mouse.x) : "———.——"} />
      <Field label="Y" value={mouse ? fmtMm(mouse.y) : "———.——"} />
      <Field label="UNITS" value="mm" />
      <Divider />
      <Field label="ZOOM" value={`${(zoom * 100).toFixed(1)}%`} />
      <Field label="1:" value={`${Math.round(50 / zoom)}`} />
      <Divider />
      <Field label="LAYERS" value={`${visibleLayers.length}/${totalLayers}`} />

      <div className="ml-auto flex items-center gap-4">
        <Field label="HOVER" value={hoveredId ?? "—"} />
        <Field
          label="SEL"
          value={selectedId ?? "—"}
          strong={!!selectedId}
        />
        <Divider />
        <span className="text-panel-muted">OST · Metric (mm)</span>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-panel-muted/70 uppercase tracking-wider">{label}</span>
      <span className={strong ? "text-primary" : "text-panel-foreground/90"}>
        {value}
      </span>
    </span>
  );
}

function Divider() {
  return <span className="h-3 w-px bg-toolbar-border" />;
}

function fmtMm(v: number) {
  const sign = v < 0 ? "-" : " ";
  const abs = Math.abs(v);
  return `${sign}${abs.toFixed(2).padStart(9, " ")}`;
}
