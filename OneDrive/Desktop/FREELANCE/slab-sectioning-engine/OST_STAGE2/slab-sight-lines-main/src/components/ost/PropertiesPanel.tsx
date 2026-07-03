import { LAYER_META, segmentAngle, segmentLength, type Segment } from "./geometry";

export function PropertiesPanel({
  selected,
  hovered,
}: {
  selected: Segment | null;
  hovered: Segment | null;
}) {
  const seg = selected ?? hovered;

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-panel-border bg-panel text-panel-foreground">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-panel-border bg-background/30 px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-panel-foreground/80">
          Properties
        </span>
        <span className="ml-auto font-mono text-[10px] text-panel-muted">
          {selected ? "selected" : hovered ? "hovered" : "—"}
        </span>
      </div>

      {seg ? <SegmentInspector seg={seg} isSelected={!!selected} /> : <EmptyState />}

      <div className="border-t border-panel-border">
        <div className="flex h-8 items-center gap-1.5 border-b border-panel-border bg-background/30 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-panel-foreground/80">
            Takeoff Summary
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-3 py-3 font-mono text-[11px]">
          <SummaryRow label="Pour Sections" value="—" />
          <SummaryRow label="Total Area" value="—" unit="m²" />
          <SummaryRow label="Joint Length" value="—" unit="m" />
          <SummaryRow label="Perimeter" value="132.00" unit="m" />
        </dl>
        <p className="px-3 pb-3 text-[10px] leading-relaxed text-panel-muted">
          Quantities activate after pour section detection is run.
        </p>
      </div>
    </aside>
  );
}

function SegmentInspector({ seg, isSelected }: { seg: Segment; isSelected: boolean }) {
  const layerMeta = LAYER_META[seg.layer];
  const len = segmentLength(seg);
  const angle = segmentAngle(seg);
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-panel-border px-3 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-[2px] border border-black/20"
            style={{ background: layerMeta.color }}
          />
          <span className="font-mono text-[13px] font-semibold text-panel-foreground">
            {seg.id}
          </span>
          <span
            className={
              "ml-auto rounded-[3px] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider " +
              (isSelected
                ? "bg-[color-mix(in_oklab,var(--selected)_25%,transparent)] text-[color:var(--selected)] border border-[color-mix(in_oklab,var(--selected)_40%,transparent)]"
                : "bg-[color-mix(in_oklab,var(--hover)_20%,transparent)] text-[color:var(--hover)] border border-[color-mix(in_oklab,var(--hover)_35%,transparent)]")
            }
          >
            {isSelected ? "Selected" : "Hovered"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-panel-muted">{seg.type}</p>
      </div>

      <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 px-3 py-3 font-mono text-[11px]">
        <Field label="Layer" value={layerMeta.name} />
        <Field label="Type" value={seg.type} />
        <Field label="Length" value={`${(len / 1000).toFixed(3)} m`} />
        <Field label="Length (mm)" value={`${len.toFixed(1)} mm`} />
        <Field label="Orientation" value={`${angle.toFixed(2)}°`} />
        <Field label="Start X" value={fmt(seg.a.x)} />
        <Field label="Start Y" value={fmt(seg.a.y)} />
        <Field label="End X" value={fmt(seg.b.x)} />
        <Field label="End Y" value={fmt(seg.b.y)} />
        <Field label="Label" value={seg.label ?? "—"} />
        <Field label="Status" value={isSelected ? "LOCKED" : "IDLE"} />
      </dl>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 h-10 w-10 rounded-full border border-dashed border-panel-border grid place-items-center">
        <span className="font-mono text-[11px] text-panel-muted">—</span>
      </div>
      <p className="text-[11px] font-medium text-panel-foreground/90">
        No element selected
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-panel-muted">
        Hover over a segment to preview, click to inspect. Middle-drag to pan; wheel to
        zoom.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-panel-muted uppercase tracking-wider text-[10px] pt-0.5">
        {label}
      </dt>
      <dd className="text-panel-foreground truncate">{value}</dd>
    </>
  );
}

function SummaryRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <>
      <dt className="text-panel-muted uppercase tracking-wider text-[10px]">{label}</dt>
      <dd className="text-panel-foreground text-right">
        {value}
        {unit && <span className="ml-1 text-panel-muted">{unit}</span>}
      </dd>
    </>
  );
}

function fmt(n: number) {
  return `${n.toFixed(1)} mm`;
}
