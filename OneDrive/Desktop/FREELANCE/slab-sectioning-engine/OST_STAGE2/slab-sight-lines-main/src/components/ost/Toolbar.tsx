import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  FolderOpen,
  Maximize2,
  RotateCcw,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  Camera,
  MousePointer2,
  Ruler,
  Square,
  Layers,
  Save,
  Undo2,
  Redo2,
} from "lucide-react";

export type ToolbarProps = {
  onFit: () => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleGrid: () => void;
  gridOn: boolean;
  onScreenshot: () => void;
  onOpen: () => void;
  drawingName: string;
};

type BtnProps = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  shortcut?: string;
};

function TBtn({ icon: Icon, label, onClick, active, disabled, shortcut }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "group relative flex h-8 w-8 items-center justify-center rounded-[4px] border border-transparent",
        "text-panel-foreground/80 transition-colors",
        "hover:bg-accent hover:text-panel-foreground hover:border-panel-border",
        active && "bg-primary/15 text-primary border-primary/30",
        disabled && "opacity-35 cursor-not-allowed hover:bg-transparent hover:border-transparent",
      )}
    >
      <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-toolbar-border" />;
}

export function Toolbar(props: ToolbarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-0.5 border-b border-toolbar-border bg-toolbar px-2">
      {/* Brand */}
      <div className="mr-2 flex items-center gap-2 pr-3 border-r border-toolbar-border h-full">
        <div className="grid h-6 w-6 place-items-center rounded-[3px] bg-primary text-primary-foreground">
          <Layers className="h-3.5 w-3.5" strokeWidth={2.25} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-semibold tracking-wide text-panel-foreground">
            SLABTAKE
          </span>
          <span className="text-[9px] font-mono text-panel-muted tracking-wider">
            OST · v0.1.0
          </span>
        </div>
      </div>

      <TBtn icon={FolderOpen} label="Open Drawing" onClick={props.onOpen} shortcut="Ctrl+O" />
      <TBtn icon={Save} label="Save Session" disabled />
      <Divider />

      <TBtn icon={Undo2} label="Undo" disabled />
      <TBtn icon={Redo2} label="Redo" disabled />
      <Divider />

      <TBtn icon={MousePointer2} label="Select" active />
      <TBtn icon={Ruler} label="Measure" disabled />
      <TBtn icon={Square} label="Region Select (coming soon)" disabled />
      <Divider />

      <TBtn icon={Maximize2} label="Fit View" onClick={props.onFit} shortcut="F" />
      <TBtn icon={RotateCcw} label="Reset View" onClick={props.onReset} shortcut="R" />
      <TBtn icon={ZoomIn} label="Zoom In" onClick={props.onZoomIn} shortcut="+" />
      <TBtn icon={ZoomOut} label="Zoom Out" onClick={props.onZoomOut} shortcut="−" />
      <TBtn
        icon={Grid3x3}
        label="Toggle Grid"
        onClick={props.onToggleGrid}
        active={props.gridOn}
        shortcut="G"
      />
      <Divider />

      <TBtn icon={Camera} label="Export Screenshot" onClick={props.onScreenshot} />

      {/* Drawing name */}
      <div className="ml-auto flex items-center gap-2 pr-2">
        <span className="text-[10px] uppercase tracking-[0.14em] text-panel-muted">
          Drawing
        </span>
        <span className="font-mono text-[11px] text-panel-foreground/90 border border-panel-border rounded-[3px] px-2 py-0.5 bg-background/40">
          {props.drawingName}
        </span>
      </div>
    </div>
  );
}
