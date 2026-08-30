"use client";

import { RoomStatus, ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from "@/lib/constants";

interface StatusBadgeProps {
  status: number;
  isActive?: boolean;
}

export default function StatusBadge({ status, isActive = true }: StatusBadgeProps) {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-rose-500/10 text-rose-400 border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        Maintenance / Inactive
      </span>
    );
  }

  const label = ROOM_STATUS_LABELS[status as RoomStatus] ?? "Unknown";
  const colorClass = ROOM_STATUS_COLORS[status as RoomStatus] ?? "bg-slate-700 text-slate-300 border-slate-600";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
