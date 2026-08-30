"use client";

import { RoomStatus, ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from "@/lib/constants";

interface StatusBadgeProps {
  status: number;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = ROOM_STATUS_LABELS[status as RoomStatus] ?? "Unknown";
  const colorClass = ROOM_STATUS_COLORS[status as RoomStatus] ?? "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
