"use client";

import {
  AlertTriangle,
  Archive,
  BadgeDollarSign,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  GraduationCap,
  Inbox,
  Layers,
  ListChecks,
  MessageSquare,
  Receipt,
  UserCheck,
  UserX,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// Icons are named (not passed as components) so server pages can describe tiles.
const ICONS: Record<string, LucideIcon> = {
  alert: AlertTriangle,
  archive: Archive,
  dues: BadgeDollarSign,
  book: BookOpen,
  calendar: CalendarDays,
  check: CheckCircle2,
  dot: CircleDot,
  clock: Clock3,
  teacher: GraduationCap,
  inbox: Inbox,
  layers: Layers,
  batches: ListChecks,
  message: MessageSquare,
  receipt: Receipt,
  active: UserCheck,
  inactive: UserX,
  users: Users,
  wallet: Wallet,
};

export type GridTile = {
  key: string;
  label: string;
  value: string | number;
  icon: keyof typeof ICONS | string;
  tone: "blue" | "green" | "amber" | "red" | "purple" | "brand" | "zinc";
  /** Preset sent to the server when the tile is clicked ("" = everything). */
  preset?: string;
  note?: string;
};

export function GridTiles({ tiles, active, onSelect }: { tiles: GridTile[]; active: string; onSelect: (preset: string) => void }) {
  return (
    <div className="sa-grid-tiles" style={{ gridTemplateColumns: `repeat(${Math.min(tiles.length, 5)}, minmax(0, 1fr))` }}>
      {tiles.map((tile) => {
        const Icon = ICONS[tile.icon] ?? CircleDot;
        const clickable = tile.preset !== undefined;
        const isActive = clickable && (tile.preset ?? "") === active;
        const zero = tile.value === 0 || tile.value === "0";
        const body = (
          <>
            <span className={`sa-grid-tile-icon tone-${zero ? "zinc" : tile.tone}`}>
              <Icon size={15} />
            </span>
            <span className="sa-grid-tile-copy">
              <small>{tile.label}</small>
              <strong>{tile.value}</strong>
              {tile.note ? <em>{tile.note}</em> : null}
            </span>
          </>
        );
        return clickable ? (
          <button
            key={tile.key}
            type="button"
            className={`sa-grid-tile clickable${isActive ? " active" : ""}`}
            onClick={() => onSelect(tile.preset ?? "")}
            aria-pressed={isActive}
          >
            {body}
          </button>
        ) : (
          <div key={tile.key} className="sa-grid-tile">
            {body}
          </div>
        );
      })}
    </div>
  );
}
