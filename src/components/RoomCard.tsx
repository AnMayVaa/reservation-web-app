"use client";

import { useState } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import { RoomStatus } from "@/lib/constants";
import { useWallet } from "@/hooks/useWallet";
import { useContract, Room } from "@/hooks/useContract";
import StatusBadge from "@/components/StatusBadge";

interface RoomCardProps {
  room: Room;
  onEdit?: (room: Room) => void;
}

export default function RoomCard({ room, onEdit }: RoomCardProps) {
  const { account, role, isConnected, isCorrectNetwork } = useWallet();
  const {
    bookRoom,
    cancelReservation,
    payRemaining,
    toggleRoomActive,
    forceResetRoom,
    txPending,
    error,
    setError,
  } = useContract();

  const [localError, setLocalError] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(false);

  const isMyRoom =
    account && room.occupant.toLowerCase() === account.toLowerCase();
  const isOwner = role === "owner";
  const priceEth = ethers.formatEther(room.price);
  const depositEth = ethers.formatEther(room.price / 2n);
  const isPending = localPending || txPending;
  const canInteract = isConnected && isCorrectNetwork;

  async function handle(fn: () => Promise<void>) {
    setLocalError(null);
    setError(null);
    setLocalPending(true);
    try {
      await fn();
    } catch (e: unknown) {
      const msg =
        (e as { reason?: string; message?: string }).reason ??
        (e as { message?: string }).message ??
        "Transaction failed";
      setLocalError(msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
    } finally {
      setLocalPending(false);
    }
  }

  const displayError = localError ?? (error && isMyRoom ? error : null);

  // Cancellation countdown
  const bookingDeadline =
    room.bookingTime > 0n
      ? new Date((Number(room.bookingTime) + 86400) * 1000)
      : null;
  const hoursLeft = bookingDeadline
    ? Math.max(0, Math.round((bookingDeadline.getTime() - Date.now()) / 3600000))
    : null;

  return (
    <div
      className={`group relative flex flex-col rounded-3xl border bg-slate-900/90 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl ${
        !room.isActive
          ? "border-slate-800 opacity-60"
          : room.status === RoomStatus.Available
          ? "border-emerald-500/30 hover:border-emerald-400/60 hover:shadow-emerald-950/30"
          : isMyRoom
          ? "border-amber-500/50 shadow-amber-950/30 ring-1 ring-amber-500/30"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Room Photo Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-800">
        <Image
          src={room.imageUrl}
          alt={room.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-amber-300 border border-slate-700 shadow-md">
            {room.roomType}
          </span>
          <StatusBadge status={room.status} isActive={room.isActive} />
        </div>

        {/* Room Header Info */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight drop-shadow truncate">
              {room.name}
            </h3>
            <span className="text-xs font-mono text-slate-400 ml-2">#{room.id.toString()}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-5 space-y-4">
        {/* Pricing Matrix */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Full Price</span>
            <span className="text-base font-bold text-white">{priceEth} ETH</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-amber-400/90 uppercase tracking-wider block">50% Deposit</span>
            <span className="text-base font-bold text-amber-400">{depositEth} ETH</span>
          </div>
        </div>

        {/* Occupant Info */}
        {room.occupant !== "0x0000000000000000000000000000000000000000" && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
            <span className="text-slate-400">Occupant</span>
            <a
              href={`https://sepolia.etherscan.io/address/${room.occupant}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono hover:underline truncate max-w-[140px]"
            >
              {isMyRoom ? "🌟 You (" + room.occupant.slice(0, 6) + "…)" : room.occupant.slice(0, 6) + "…" + room.occupant.slice(-4)}
            </a>
          </div>
        )}

        {/* 24h Cancellation Window Notice */}
        {isMyRoom && room.status === RoomStatus.Booked && hoursLeft !== null && (
          <div
            className={`text-xs px-3 py-2 rounded-xl border ${
              hoursLeft > 0
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-300 border-rose-500/20"
            }`}
          >
            {hoursLeft > 0
              ? `⏱️ Free refund cancel: ~${hoursLeft}h left`
              : "⚠️ 24h refund window expired (Deposit forfeited if cancelled)"}
          </div>
        )}

        {/* Error message */}
        {displayError && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 break-words">
            {displayError}
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="p-5 pt-0 space-y-2">
        {/* Guest: Available to Book */}
        {room.isActive && room.status === RoomStatus.Available && (
          <button
            disabled={!canInteract || isPending}
            onClick={() => handle(() => bookRoom(room.id, room.price / 2n))}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isPending ? <Spinner /> : `Book Room · Pay ${depositEth} ETH`}
          </button>
        )}

        {/* Guest: Booked by connected wallet */}
        {room.status === RoomStatus.Booked && isMyRoom && (
          <div className="space-y-2">
            <button
              disabled={!canInteract || isPending}
              onClick={() => handle(() => payRemaining(room.id, room.price / 2n))}
              className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isPending ? <Spinner /> : `Pay Remaining ${depositEth} ETH`}
            </button>
            <button
              disabled={!canInteract || isPending}
              onClick={() => handle(() => cancelReservation(room.id))}
              className="w-full py-2 rounded-2xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold transition"
            >
              Cancel Reservation
            </button>
          </div>
        )}

        {/* Guest: Booked by someone else */}
        {room.status === RoomStatus.Booked && !isMyRoom && (
          <div className="text-center text-xs text-slate-500 py-2 bg-slate-800/40 rounded-2xl">
            Reserved by another guest
          </div>
        )}

        {/* Paid & Waiting for Key */}
        {room.status === RoomStatus.PaidWaitingForKey && (
          <div className="text-center text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-2xl py-3 px-3">
            {isMyRoom
              ? "🎉 Payment Complete! Visit the front desk for check-in."
              : "Fully Paid — Awaiting Front Desk Check-in"}
          </div>
        )}

        {/* Checked In */}
        {room.status === RoomStatus.CheckedIn && (
          <div className="text-center text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-2xl py-3 px-3">
            {isMyRoom ? "🏨 Currently enjoying stay" : "Occupied"}
          </div>
        )}

        {/* Inactive Room Notice */}
        {!room.isActive && (
          <div className="text-center text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl py-2 px-3">
            Unavailable (Under Maintenance)
          </div>
        )}

        {/* Owner Admin Bar for this Room */}
        {isOwner && (
          <div className="pt-2 mt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => onEdit?.(room)}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center justify-center gap-1"
            >
              ✏️ Edit
            </button>
            <button
              disabled={isPending || room.status !== 0}
              onClick={() => handle(() => toggleRoomActive(room.id))}
              title={room.status !== 0 ? "Cannot toggle status of occupied room" : ""}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl transition flex items-center justify-center gap-1"
            >
              {room.isActive ? "⏸️ Pause" : "▶️ Active"}
            </button>
            <button
              disabled={isPending || room.status === 0}
              onClick={() => handle(() => forceResetRoom(room.id, true))}
              title="Force reset room status back to available"
              className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-400 rounded-xl transition flex items-center justify-center gap-1"
            >
              🔄 Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <>
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      Confirming on-chain...
    </>
  );
}
