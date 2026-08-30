"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { RoomStatus } from "@/lib/constants";
import { useWallet } from "@/hooks/useWallet";
import { useContract, Room } from "@/hooks/useContract";
import StatusBadge from "@/components/StatusBadge";

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  const { account, isConnected, isCorrectNetwork } = useWallet();
  const { bookRoom, cancelReservation, payRemaining, txPending, error, setError } = useContract();
  const [localError, setLocalError] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(false);

  const isMyRoom =
    account && room.occupant.toLowerCase() === account.toLowerCase();
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
      const msg = (e as { reason?: string; message?: string }).reason ?? (e as { message?: string }).message ?? "Transaction failed";
      setLocalError(msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
    } finally {
      setLocalPending(false);
    }
  }

  const displayError = localError ?? (error && isMyRoom ? error : null);

  // Booking deadline countdown
  const bookingDeadline =
    room.bookingTime > 0n
      ? new Date((Number(room.bookingTime) + 86400) * 1000)
      : null;
  const hoursLeft = bookingDeadline
    ? Math.max(0, Math.round((bookingDeadline.getTime() - Date.now()) / 3600000))
    : null;

  return (
    <div className={`relative flex flex-col rounded-2xl border bg-slate-800 shadow-lg overflow-hidden transition-all
      ${room.status === RoomStatus.Available ? "border-emerald-700/50 hover:border-emerald-500/70 hover:shadow-emerald-900/40 hover:shadow-xl" : "border-slate-700"}
    `}>
      {/* Room header */}
      <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center overflow-hidden">
        <span className="text-6xl opacity-40 select-none">🛏</span>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-800/80 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <h2 className="text-white font-bold text-xl">Room {room.id.toString()}</h2>
          <StatusBadge status={room.status} />
        </div>
      </div>

      {/* Room info */}
      <div className="flex-1 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Full Price</span>
          <span className="text-white font-semibold">{priceEth} ETH</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">50% Deposit</span>
          <span className="text-amber-400 font-semibold">{depositEth} ETH</span>
        </div>

        {/* Occupant info */}
        {room.occupant !== "0x0000000000000000000000000000000000000000" && (
          <div className="text-xs text-slate-400 truncate pt-1 border-t border-slate-700">
            Booked by:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${room.occupant}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono"
            >
              {room.occupant.slice(0, 8)}…{room.occupant.slice(-6)}
            </a>
          </div>
        )}

        {/* Cancellation window */}
        {isMyRoom && room.status === RoomStatus.Booked && hoursLeft !== null && (
          <div className={`text-xs px-2 py-1.5 rounded-lg ${hoursLeft > 0 ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
            {hoursLeft > 0
              ? `✅ Free cancel window: ~${hoursLeft}h left`
              : "⚠️ Cancellation window expired — deposit forfeited"}
          </div>
        )}

        {/* Error display */}
        {displayError && (
          <div className="text-xs text-red-400 bg-red-900/30 rounded-lg px-3 py-2 break-words">
            {displayError}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-4 pt-0 space-y-2">
        {/* AVAILABLE — book */}
        {room.status === RoomStatus.Available && (
          <button
            disabled={!canInteract || isPending}
            onClick={() => handle(() => bookRoom(room.id, room.price / 2n))}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm transition-all active:scale-95"
          >
            {isPending ? <Spinner /> : `Book — Pay ${depositEth} ETH`}
          </button>
        )}

        {/* BOOKED — pay remaining or cancel */}
        {room.status === RoomStatus.Booked && isMyRoom && (
          <>
            <button
              disabled={!canInteract || isPending}
              onClick={() => handle(() => payRemaining(room.id, room.price / 2n))}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm transition-all active:scale-95"
            >
              {isPending ? <Spinner /> : `Pay Remaining ${depositEth} ETH`}
            </button>
            <button
              disabled={!canInteract || isPending}
              onClick={() => handle(() => cancelReservation(room.id))}
              className="w-full py-2 rounded-xl bg-transparent hover:bg-red-900/30 border border-red-700/50 text-red-400 hover:text-red-300 text-sm transition-all"
            >
              Cancel Booking
            </button>
          </>
        )}

        {/* BOOKED — not your room */}
        {room.status === RoomStatus.Booked && !isMyRoom && (
          <div className="text-center text-xs text-slate-500 py-1">Reserved by another guest</div>
        )}

        {/* PAID WAITING */}
        {room.status === RoomStatus.PaidWaitingForKey && (
          <div className="text-center text-sm text-blue-400 bg-blue-900/20 rounded-xl py-2.5 px-3">
            {isMyRoom
              ? "✅ Payment complete — visit the front desk to check in"
              : "Awaiting receptionist confirmation"}
          </div>
        )}

        {/* CHECKED IN */}
        {room.status === RoomStatus.CheckedIn && (
          <div className="text-center text-sm text-purple-400 bg-purple-900/20 rounded-xl py-2.5 px-3">
            {isMyRoom ? "🏠 Welcome! Enjoy your stay." : "Currently occupied"}
          </div>
        )}

        {/* Not connected notice */}
        {!canInteract && room.status === RoomStatus.Available && (
          <p className="text-center text-xs text-slate-500">Connect MetaMask to book</p>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Waiting for confirmation…
    </span>
  );
}
