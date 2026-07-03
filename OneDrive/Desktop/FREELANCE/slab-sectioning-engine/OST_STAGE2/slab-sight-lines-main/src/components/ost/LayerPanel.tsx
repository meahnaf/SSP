import { cn } from "@/lib/utils";
import { LAYER_META, LAYER_ORDER, type LayerKey } from "./geometry";
import { Eye, EyeOff, ChevronDown, Lock } from "lucide-react";

export type LayerPanelProps = {
  visible: Record<LayerKey, boolean>;
  onToggle: (key: LayerKey) => void;
  onAll: (v: boolean) => void;
};

export function LayerPanel({ visible, onToggle, onAll }: LayerPanelProps) {
  const shownCount = Object.values(visible).filter(Boolean).length;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-panel-border bg-panel text-panel-foreground">
      <PanelHeader title="Layers" meta={`${shownCount}/${LAYER_ORDER.length}`} />

      <div className="flex items-center gap-2 border-b border-panel-border/70 px-3 py-2">
        <button
          onClick={() => onAll(true)}
          className="text-[10px] uppercase tracking-wider font-medium text-panel-muted hover:text-panel-foreground transition-colors"
        >
          Show all
        </button>
        <span className="text-panel-muted/40">·</span>
        <button
          onClick={() => onAll(false)}
          className="text-[10px] uppercase tracking-wider font-medium text-panel-muted hover:text-panel-foreground transition-colors"
        >
          Hide all
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto py-1">
        {LAYER_ORDER.map((key) => {
          const meta = LAYER_META[key];
          const on = visible[key];
          return (
            <li key={key}>
              <button
                onClick={() => onToggle(key)}
                className={cn(
                  "group flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors",
                  "hover:bg-accent/60",
                  !on && "opacity-55",
                )}
              >
                <span
                  className="inline-block h-3 w-3 rounded-[2px] border border-black/20"
                  style={{ background: meta.color }}
                />
                <span className="flex-1 truncate text-[12px] font-medium">
                  {meta.name}
                </span>
                <span className="text-panel-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <Lock className="h-3 w-3" strokeWidth={1.5} />
                </span>
                {on ? (
                  <Eye className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-panel-muted" strokeWidth={1.75} />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <PanelHeader title="Detected Regions" meta="0" collapsible />
      <div className="border-t border-panel-border px-3 py-3 text-[11px] text-panel-muted leading-relaxed">
        Region detection has not been run. Open a DXF and use{" "}
        <span className="font-mono text-panel-foreground/80">Detect Pours</span> when it
        becomes available.
      </div>
    </aside>
  );
}

function PanelHeader({
  title,
  meta,
  collapsible,
}: {
  title: string;
  meta?: string;
  collapsible?: boolean;
}) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-panel-border bg-background/30 px-3">
      {collapsible && (
        <ChevronDown className="h-3 w-3 text-panel-muted" strokeWidth={2} />
      )}
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-panel-foreground/80">
        {title}
      </span>
      {meta && (
        <span className="ml-auto font-mono text-[10px] text-panel-muted">{meta}</span>
      )}
    </div>
  );
}
