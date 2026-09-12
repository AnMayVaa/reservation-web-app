"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import { useContract, Room } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";

export default function BatchPayRemainingCard() {
  const { rooms, payRemainingBatch, txPending, error } = useContract();
  const { account, isConnected, isCorrectNetwork } = useWallet();

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [localPending, setLocalPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Find all rooms booked by the connected user that need 50% remaining payment (status == 1)
  const pendingRooms = useMemo(() => {
    if (!account) return [];
    return rooms.filter(
      (r: Room) =>
        r.status === 1 && // RoomStatus.Booked
        r.occupant.toLowerCase() === account.toLowerCase()
    );
  }, [rooms, account]);

  // Keep selected IDs in sync when pendingRooms changes
  useEffect(() => {
    setSelectedRoomIds(pendingRooms.map((r) => r.id.toString()));
  }, [pendingRooms]);

  if (!isConnected || !isCorrectNetwork || pendingRooms.length === 0) {
    return null;
  }

  const toggleSelect = (idStr: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  const selectAll = () => {
    setSelectedRoomIds(pendingRooms.map((r) => r.id.toString()));
  };

  const deselectAll = () => {
    setSelectedRoomIds([]);
  };

  // Calculate total remaining wei for selected rooms
  const selectedRooms = pendingRooms.filter((r) => selectedRoomIds.includes(r.id.toString()));
  const totalRemainingWei = selectedRooms.reduce((acc, r) => {
    const remaining = r.totalPrice - r.totalPrice / 2n;
    return acc + remaining;
  }, 0n);

  const totalRemainingEth = ethers.formatEther(totalRemainingWei);

  async function handleBatchPay() {
    if (selectedRooms.length === 0) return;
    setLocalError(null);
    setLocalPending(true);

    try {
      const roomIds = selectedRooms.map((r) => r.id);
      await payRemainingBatch(roomIds, totalRemainingWei);
    } catch (e: unknown) {
      const msg = (e as Error).message || "Batch payment failed";
      setLocalError(msg);
    } finally {
      setLocalPending(false);
    }
  }

  const isPending = txPending || localPending;

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-indigo-950/40 border border-blue-500/40 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xl text-blue-300 shrink-0">
            💳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Pending Remaining Payments
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {pendingRooms.length} {pendingRooms.length === 1 ? "Suite" : "Suites"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pay the remaining 50% balance in <strong>1 single transaction</strong> to unlock your Digital Door OTP keys!
            </p>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={selectAll}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 px-2.5 py-1 rounded-lg hover:bg-blue-500/10 transition"
          >
            Select All
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={deselectAll}
            className="text-[11px] font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            Deselect
          </button>
        </div>
      </div>

      {/* Suites List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pendingRooms.map((room) => {
          const isSelected = selectedRoomIds.includes(room.id.toString());
          const remainingWei = room.totalPrice - room.totalPrice / 2n;
          const remainingEth = ethers.formatEther(remainingWei);

          return (
            <div
              key={room.id.toString()}
              onClick={() => toggleSelect(room.id.toString())}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? "bg-blue-900/30 border-blue-400/60 shadow-md shadow-blue-950/40"
                  : "bg-slate-950/50 border-slate-800 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // handled by div click
                  className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500/20 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                  <Image
                    src={room.imageUrl}
                    alt={room.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{room.name}</h4>
                  <span className="text-[10px] text-slate-400">Suite #{room.id.toString()}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Remaining
                </span>
                <span className="text-xs font-bold font-mono text-blue-300">
                  {remainingEth} ETH
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {(localError || error) && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 break-words">
          {localError || error}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800/80">
        <div>
          <span className="text-xs text-slate-400">
            Selected: <strong className="text-white">{selectedRooms.length}</strong> of {pendingRooms.length} Suites
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Combined Balance:{" "}
            <strong className="text-sm font-mono text-blue-300 font-extrabold">
              {totalRemainingEth} ETH
            </strong>
          </p>
        </div>

        <button
          disabled={selectedRooms.length === 0 || isPending}
          onClick={handleBatchPay}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing 1 Batch Payment...
            </span>
          ) : (
            `Pay Remaining for ${selectedRooms.length} Suites (1 Batch Tx) →`
          )}
        </button>
      </div>
    </div>
  );
}
