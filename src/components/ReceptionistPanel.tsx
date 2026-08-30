"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { RoomStatus } from "@/lib/constants";
import { useContract, Room } from "@/hooks/useContract";

export default function ReceptionistPanel() {
  const { rooms, confirmCheckIn, checkoutRoom, txPending } = useContract();
  const [localError, setLocalError] = useState<string | null>(null);
  const [actionRoomId, setActionRoomId] = useState<bigint | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const awaitingCheckIn = rooms.filter(
    (r: Room) => r.status === RoomStatus.PaidWaitingForKey
  );
  const checkedIn = rooms.filter(
    (r: Room) => r.status === RoomStatus.CheckedIn
  );

  async function handle(roomId: bigint, fn: (id: bigint) => Promise<void>) {
    setLocalError(null);
    setActionRoomId(roomId);
    try {
      await fn(roomId);
    } catch (e: unknown) {
      const msg =
        (e as { reason?: string; message?: string }).reason ??
        (e as { message?: string }).message ??
        "Transaction failed";
      setLocalError(msg.length > 150 ? msg.slice(0, 150) + "…" : msg);
    } finally {
      setActionRoomId(null);
    }
  }

  const isPending = (id: bigint) => txPending && actionRoomId === id;

  const filterBySearch = (list: Room[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.id.toString() === q ||
        r.occupant.toLowerCase().includes(q)
    );
  };

  const filteredAwaiting = filterBySearch(awaitingCheckIn);
  const filteredCheckedIn = filterBySearch(checkedIn);

  return (
    <section className="bg-slate-900/90 border border-blue-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/10">
            🔑
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Front Desk Operations</h2>
            <p className="text-xs text-slate-400">
              Manage key handovers, guest check-ins, and departures
            </p>
          </div>
        </div>

        {/* Search occupant or room */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest or room..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-400 text-white placeholder-slate-500 rounded-2xl px-4 py-2 text-xs outline-none transition"
          />
        </div>
      </div>

      {localError && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
          ❌ {localError}
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Ready for Check-in */}
        <div className="p-5 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              📥 Awaiting Key Handover ({awaitingCheckIn.length})
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              100% Paid
            </span>
          </div>

          {filteredAwaiting.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No guests currently awaiting check-in.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAwaiting.map((room: Room) => (
                <div
                  key={room.id.toString()}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{room.name}</span>
                      <span className="text-xs font-mono text-amber-400">#{room.id.toString()}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 truncate">
                      Guest: {room.occupant.slice(0, 8)}…{room.occupant.slice(-6)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Total Paid: {ethers.formatEther(room.price)} ETH
                    </p>
                  </div>
                  <button
                    disabled={txPending}
                    onClick={() => handle(room.id, confirmCheckIn)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition active:scale-95 whitespace-nowrap"
                  >
                    {isPending(room.id) ? "..." : "Confirm Check-In"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Currently Checked In */}
        <div className="p-5 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              🏠 Currently Checked In ({checkedIn.length})
            </span>
            <span className="text-[11px] text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              Active Stays
            </span>
          </div>

          {filteredCheckedIn.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No occupied rooms currently checked in.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredCheckedIn.map((room: Room) => (
                <div
                  key={room.id.toString()}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{room.name}</span>
                      <span className="text-xs font-mono text-purple-400">#{room.id.toString()}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 truncate">
                      Guest: {room.occupant.slice(0, 8)}…{room.occupant.slice(-6)}
                    </p>
                  </div>
                  <button
                    disabled={txPending}
                    onClick={() => handle(room.id, checkoutRoom)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition active:scale-95 whitespace-nowrap"
                  >
                    {isPending(room.id) ? "..." : "Confirm Checkout"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
