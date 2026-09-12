"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import { useContract, Room } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { useCart } from "@/hooks/useCart";

export default function BatchPayRemainingCard() {
  const { rooms, payRemainingBatch, txPending, error } = useContract();
  const { account, isConnected, isCorrectNetwork } = useWallet();
  const { setIsCartOpen } = useCart();

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

  // Stable key based on actual room IDs to prevent 8-second polling reset
  const pendingIdKey = useMemo(
    () => pendingRooms.map((r) => r.id.toString()).sort().join(","),
    [pendingRooms]
  );

  useEffect(() => {
    const ids = pendingRooms.map((r) => r.id.toString());
    setSelectedRoomIds((prev) => {
      if (prev.length === 0) return ids;
      const valid = prev.filter((id) => ids.includes(id));
      return valid.length > 0 ? valid : ids;
    });
  }, [pendingIdKey]);

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
    <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-blue-950/60 via-slate-900/90 to-indigo-950/60 border-2 border-blue-500/50 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl text-blue-300 shadow-lg shadow-blue-500/10 shrink-0">
            💳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                Multi-Room Pay Remaining
              </h3>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {pendingRooms.length} {pendingRooms.length === 1 ? "Suite" : "Suites"} Awaiting Payment
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select which suites to pay the remaining 50% balance in <strong>1 atomic transaction</strong> (saves ~27% Gas)
            </p>
          </div>
        </div>

        {/* Selection Toolbar Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition cursor-pointer flex items-center gap-1"
          >
            <span>✓✓</span>
            <span>Select All</span>
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
          >
            <span>✕</span>
            <span>Deselect All</span>
          </button>
        </div>
      </div>

      {/* Notice for Single Booked Room */}
      {pendingRooms.length === 1 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl shrink-0">💡</span>
            <p className="text-amber-300/90 leading-relaxed">
              <strong>Tip:</strong> You currently have <strong>1 suite booked</strong> (#{pendingRooms[0].id.toString()}). To test multi-room batch payment with multiple checkboxes, add and book another suite (e.g. Suite #1 or #2) using the Cart!
            </p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 cursor-pointer"
          >
            Open Cart 🛒
          </button>
        </div>
      )}

      {/* Interactive Suite Checkbox Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingRooms.map((room) => {
          const isSelected = selectedRoomIds.includes(room.id.toString());
          const remainingWei = room.totalPrice - room.totalPrice / 2n;
          const remainingEth = ethers.formatEther(remainingWei);

          return (
            <div
              key={room.id.toString()}
              onClick={() => toggleSelect(room.id.toString())}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 select-none ${
                isSelected
                  ? "bg-blue-900/30 border-blue-400 shadow-lg shadow-blue-950/50 ring-1 ring-blue-400/50"
                  : "bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Custom Styled High-Visibility Checkbox */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/40 ring-2 ring-blue-400"
                      : "border-2 border-slate-600 bg-slate-900"
                  }`}
                >
                  {isSelected && <span className="text-xs font-black">✓</span>}
                </div>

                {/* Room Thumbnail */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                  <Image
                    src={room.imageUrl}
                    alt={room.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                {/* Room Details */}
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{room.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-slate-400">
                      Suite #{room.id.toString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isSelected ? "Selected" : "Click to select"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  50% Remaining
                </span>
                <span className="text-sm font-black font-mono text-blue-300">
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

      {/* Real-time Summary & Action Bar */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Selected Suites:</span>
            <strong className="text-white bg-slate-800 px-2 py-0.5 rounded-md font-mono">
              {selectedRooms.length} of {pendingRooms.length}
            </strong>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-400">Combined Total:</span>
            <strong className="text-lg font-mono text-blue-300 font-black">
              {totalRemainingEth} ETH
            </strong>
            {selectedRooms.length > 1 && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                🔥 ~27% Gas Saved in 1 Tx
              </span>
            )}
          </div>
        </div>

        <button
          disabled={selectedRooms.length === 0 || isPending}
          onClick={handleBatchPay}
          className="px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing 1 Batch Payment...
            </span>
          ) : (
            `Pay Remaining for ${selectedRooms.length} ${selectedRooms.length === 1 ? "Suite" : "Suites"} (1 Batch Tx) →`
          )}
        </button>
      </div>
    </div>
  );
}
