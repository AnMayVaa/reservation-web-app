"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import { RoomStatus } from "@/lib/constants";
import { useWallet } from "@/hooks/useWallet";
import { useContract, Room } from "@/hooks/useContract";
import StatusBadge from "@/components/StatusBadge";
import DigitalLockModal from "@/components/Modals/DigitalLockModal";

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
    checkoutRoom,
    expireBooking,
    confirmCheckIn,
    toggleRoomActive,
    forceResetRoom,
    txPending,
    error,
  } = useContract();

  const [localError, setLocalError] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(false);
  const [isDigitalLockOpen, setIsDigitalLockOpen] = useState(false);

  // Date selection states (defaults to today -> tomorrow)
  const defaultCheckIn = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, []);

  const defaultCheckOut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, []);

  const [checkInInput, setCheckInInput] = useState(defaultCheckIn);
  const [checkOutInput, setCheckOutInput] = useState(defaultCheckOut);

  // Nights and pricing calculation
  const { nights, calculatedTotalWei, depositWei } = useMemo(() => {
    const startMs = new Date(checkInInput).getTime();
    const endMs = new Date(checkOutInput).getTime();
    const durationMs = Math.max(endMs - startMs, 86400000);
    const calculatedNights = Math.max(1, Math.ceil(durationMs / 86400000));
    const total = BigInt(calculatedNights) * room.pricePerNight;
    const dep = total / 2n;
    return {
      nights: calculatedNights,
      calculatedTotalWei: total,
      depositWei: dep,
    };
  }, [checkInInput, checkOutInput, room.pricePerNight]);

  const isMyRoom =
    account && room.occupant.toLowerCase() === account.toLowerCase();
  const isOwner = role === "owner";
  const isPending = localPending || txPending;
  const canInteract = isConnected && isCorrectNetwork;

  const pricePerNightEth = ethers.formatEther(room.pricePerNight);
  const currentTotalEth = ethers.formatEther(
    room.totalPrice > 0n ? room.totalPrice : calculatedTotalWei
  );
  const currentDepositEth = ethers.formatEther(
    room.totalPrice > 0n ? room.totalPrice / 2n : depositWei
  );

  async function handle(fn: () => Promise<void>) {
    setLocalError(null);
    setLocalPending(true);
    try {
      await fn();
    } catch (e: unknown) {
      const msg = (e as Error).message || "Transaction failed";
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

  // Expiry check
  const isExpired =
    room.checkOutTime > 0n &&
    Math.floor(Date.now() / 1000) > Number(room.checkOutTime) &&
    room.status !== RoomStatus.Available;

  return (
    <>
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
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Price / Night</span>
              <span className="text-base font-bold text-white">{pricePerNightEth} ETH</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-amber-400/90 uppercase tracking-wider block">50% Deposit</span>
              <span className="text-base font-bold text-amber-400">{currentDepositEth} ETH</span>
            </div>
          </div>

          {/* Date Range Selection (when Available) */}
          {room.status === RoomStatus.Available && room.isActive && (
            <div className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-400 font-semibold pb-1 border-b border-slate-800">
                <span>🗓️ Select Dates</span>
                <span className="text-emerald-400 font-bold">{nights} Night{nights > 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Check-in</label>
                  <input
                    type="datetime-local"
                    value={checkInInput}
                    onChange={(e) => setCheckInInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5 text-[11px] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Check-out</label>
                  <input
                    type="datetime-local"
                    value={checkOutInput}
                    onChange={(e) => setCheckOutInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5 text-[11px] outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between text-[11px] pt-1 text-slate-400">
                <span>Total: <strong className="text-white">{ethers.formatEther(calculatedTotalWei)} ETH</strong></span>
                <span>Deposit (50%): <strong className="text-amber-400">{ethers.formatEther(depositWei)} ETH</strong></span>
              </div>
            </div>
          )}

          {/* Booked Schedule Display (when Booked/CheckedIn) */}
          {room.status !== RoomStatus.Available && room.checkInTime > 0n && (
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Scheduled Stay
              </span>
              <div className="flex justify-between text-slate-300">
                <span>In: {new Date(Number(room.checkInTime) * 1000).toLocaleDateString()}</span>
                <span>Out: {new Date(Number(room.checkOutTime) * 1000).toLocaleDateString()}</span>
              </div>
            </div>
          )}

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
                : "⚠️ 24h refund window expired"}
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
              onClick={() => {
                const inSec = Math.floor(new Date(checkInInput).getTime() / 1000);
                const outSec = Math.floor(new Date(checkOutInput).getTime() / 1000);
                handle(() => bookRoom(room.id, inSec, outSec, depositWei));
              }}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? <Spinner /> : `Book ${nights} Night${nights > 1 ? "s" : ""} · Deposit ${ethers.formatEther(depositWei)} ETH`}
            </button>
          )}

          {/* Guest: Booked (50% paid) */}
          {room.status === RoomStatus.Booked && isMyRoom && (
            <div className="space-y-2">
              <button
                disabled={!canInteract || isPending}
                onClick={() => handle(() => payRemaining(room.id, room.totalPrice / 2n))}
                className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? <Spinner /> : `Pay Remaining Balance (${currentDepositEth} ETH)`}
              </button>
              <button
                disabled={!canInteract || isPending}
                onClick={() => handle(() => cancelReservation(room.id))}
                className="w-full py-2 rounded-2xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel Reservation
              </button>
            </div>
          )}

          {/* Paid Waiting For Key or Checked In -> Show IoT Digital Key & Unlock */}
          {(room.status === RoomStatus.PaidWaitingForKey || room.status === RoomStatus.CheckedIn) && isMyRoom && (
            <div className="space-y-2">
              {/* Upcoming stay warning if before check-in time */}
              {room.checkInTime > 0n && Math.floor(Date.now() / 1000) < Number(room.checkInTime) && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                  <span>⏳ Scheduled Stay:</span>
                  <span className="font-semibold">
                    {new Date(Number(room.checkInTime) * 1000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              )}

              <button
                onClick={() => setIsDigitalLockOpen(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                🚪 Open Digital Key & Unlock Door (0 Gas)
              </button>

              {/* Optional On-Chain Check-In Button for users who want to update state on Sepolia */}
              {room.status === RoomStatus.PaidWaitingForKey && (
                <button
                  disabled={!canInteract || isPending}
                  onClick={() => handle(() => confirmCheckIn(room.id))}
                  className="w-full py-2 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isPending ? <Spinner /> : "🛎️ Record Check-In on Blockchain (Sepolia Tx)"}
                </button>
              )}

              <button
                disabled={!canInteract || isPending}
                onClick={() => handle(() => checkoutRoom(room.id))}
                className="w-full py-2 rounded-2xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                👋 Self Check-Out (Release Room)
              </button>
            </div>
          )}

          {/* Expired Booking Release Action (if past checkout time) */}
          {isExpired && (
            <button
              disabled={!canInteract || isPending}
              onClick={() => handle(() => expireBooking(room.id))}
              className="w-full py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              ⏰ Stay Expired — Reset Room to Available
            </button>
          )}

          {/* Non-occupant notices */}
          {room.status !== RoomStatus.Available && !isMyRoom && (
            <div className="text-center text-xs text-slate-500 py-2 bg-slate-800/40 rounded-2xl">
              {room.status === RoomStatus.Booked
                ? "Reserved by another guest"
                : room.status === RoomStatus.PaidWaitingForKey
                ? "Paid — Digital Key active for guest"
                : "Occupied"}
            </div>
          )}

          {/* Owner Admin Bar */}
          {isOwner && (
            <div className="pt-2 mt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                onClick={() => onEdit?.(room)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
              >
                ✏️ Edit
              </button>
              <button
                disabled={isPending || room.status !== 0}
                onClick={() => handle(() => toggleRoomActive(room.id))}
                title={room.status !== 0 ? "Cannot toggle status of occupied room" : ""}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
              >
                {room.isActive ? "⏸️ Pause" : "▶️ Active"}
              </button>
              <button
                disabled={isPending || room.status === 0}
                onClick={() => handle(() => forceResetRoom(room.id, true))}
                title="Force reset room status back to available"
                className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-400 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
              >
                🔄 Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Digital Key & Smart Door Lock Modal */}
      <DigitalLockModal
        room={room}
        isOpen={isDigitalLockOpen}
        onClose={() => setIsDigitalLockOpen(false)}
        onConfirmCheckIn={() => confirmCheckIn(room.id)}
      />
    </>
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
