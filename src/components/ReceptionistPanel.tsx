"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { RoomStatus } from "@/lib/constants";
import { useContract, Room } from "@/hooks/useContract";

export default function ReceptionistPanel() {
  const { rooms, confirmCheckIn, checkoutRoom, txPending } = useContract();
  const [localError, setLocalError] = useState<string | null>(null);
  const [actionRoomId, setActionRoomId] = useState<bigint | null>(null);

  const awaitingCheckIn = rooms.filter((r: Room) => r.status === RoomStatus.PaidWaitingForKey);
  const checkedIn = rooms.filter((r: Room) => r.status === RoomStatus.CheckedIn);

  async function handle(roomId: bigint, fn: (id: bigint) => Promise<void>) {
    setLocalError(null);
    setActionRoomId(roomId);
    try {
      await fn(roomId);
    } catch (e: unknown) {
      const msg = (e as { reason?: string; message?: string }).reason ?? (e as { message?: string }).message ?? "Transaction failed";
      setLocalError(msg.length > 150 ? msg.slice(0, 150) + "…" : msg);
    } finally {
      setActionRoomId(null);
    }
  }

  const isPending = (id: bigint) => txPending && actionRoomId === id;

  return (
    <section className="bg-slate-800 border border-blue-700/40 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔑</span>
        <div>
          <h2 className="text-white font-bold text-lg">Receptionist Panel</h2>
          <p className="text-slate-400 text-sm">Manage guest check-ins and check-outs</p>
        </div>
      </div>

      {localError && (
        <div className="text-sm text-red-400 bg-red-900/30 rounded-xl px-4 py-3 break-words">
          {localError}
        </div>
      )}

      {/* Awaiting Check-In */}
      <div>
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
          Awaiting Check-In ({awaitingCheckIn.length})
        </h3>
        {awaitingCheckIn.length === 0 ? (
          <p className="text-slate-500 text-sm">No rooms awaiting check-in.</p>
        ) : (
          <div className="space-y-2">
            {awaitingCheckIn.map((room: Room) => (
              <div key={room.id.toString()} className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white font-medium">Room {room.id.toString()}</p>
                  <p className="text-slate-400 text-xs font-mono">
                    {room.occupant.slice(0, 10)}…{room.occupant.slice(-8)}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Paid: {ethers.formatEther(room.price)} ETH total
                  </p>
                </div>
                <button
                  disabled={txPending}
                  onClick={() => handle(room.id, confirmCheckIn)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 min-w-[110px] text-center"
                >
                  {isPending(room.id) ? <MiniSpinner /> : "Confirm Check-In"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Currently Checked In */}
      <div>
        <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3">
          Currently Checked In ({checkedIn.length})
        </h3>
        {checkedIn.length === 0 ? (
          <p className="text-slate-500 text-sm">No rooms currently checked in.</p>
        ) : (
          <div className="space-y-2">
            {checkedIn.map((room: Room) => (
              <div key={room.id.toString()} className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white font-medium">Room {room.id.toString()}</p>
                  <p className="text-slate-400 text-xs font-mono">
                    {room.occupant.slice(0, 10)}…{room.occupant.slice(-8)}
                  </p>
                </div>
                <button
                  disabled={txPending}
                  onClick={() => handle(room.id, checkoutRoom)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 min-w-[110px] text-center"
                >
                  {isPending(room.id) ? <MiniSpinner /> : "Confirm Checkout"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MiniSpinner() {
  return (
    <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
