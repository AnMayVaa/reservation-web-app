"use client";

import { useState } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import { useCart } from "@/hooks/useCart";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";

export default function CartModal() {
  const {
    items,
    removeFromCart,
    updateItemDates,
    clearCart,
    totalRooms,
    totalNights,
    totalCostWei,
    totalDepositWei,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const { bookRoomsBatch, txPending, error } = useContract();
  const { isConnected, isCorrectNetwork, connect, switchToSepolia } = useWallet();

  const [bookingPending, setBookingPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isCartOpen) return null;

  async function handleBatchCheckout() {
    setLocalError(null);
    setSuccessMessage(null);

    if (items.length === 0) return;

    if (!isConnected) {
      await connect();
      return;
    }
    if (!isCorrectNetwork) {
      await switchToSepolia();
      return;
    }

    setBookingPending(true);
    try {
      const roomIds = items.map((item) => item.room.id);
      const checkInTimestamps = items.map((item) =>
        Math.floor(new Date(item.checkIn).getTime() / 1000)
      );
      const checkOutTimestamps = items.map((item) =>
        Math.floor(new Date(item.checkOut).getTime() / 1000)
      );

      await bookRoomsBatch(
        roomIds,
        checkInTimestamps,
        checkOutTimestamps,
        totalDepositWei
      );

      setSuccessMessage(
        `🎉 Successfully reserved ${items.length} suites in 1 atomic transaction!`
      );
      clearCart();
    } catch (e: unknown) {
      const msg = (e as Error).message || "Batch booking failed";
      setLocalError(msg.length > 150 ? msg.slice(0, 150) + "…" : msg);
    } finally {
      setBookingPending(false);
    }
  }

  const grandTotalEth = ethers.formatEther(totalCostWei);
  const totalDepositEth = ethers.formatEther(totalDepositWei);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-left overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl font-bold shadow-md shadow-amber-500/10">
              🛒
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Multi-Room Booking Cart
              </h3>
              <p className="text-xs text-slate-400">
                {totalRooms} {totalRooms === 1 ? "suite" : "suites"} selected · Custom dates for each room
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-slate-400 hover:text-white text-lg p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
              {successMessage}
            </div>
          )}

          {localError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
              ❌ {localError}
            </div>
          )}

          {error && !localError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
              ❌ {error}
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">🛏️</div>
              <p className="text-sm font-semibold text-slate-300">Your cart is empty</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore the hotel suites and click &ldquo;Add to Cart&rdquo; to book multiple rooms with custom stay dates in 1 transaction.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.room.id.toString()}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 transition hover:border-slate-700"
              >
                {/* Room title row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                      <Image
                        src={item.room.imageUrl}
                        alt={item.room.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white truncate">
                          {item.room.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          #{item.room.id.toString()}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold uppercase">
                        {item.room.roomType} · {ethers.formatEther(item.room.pricePerNight)} ETH/night
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.room.id)}
                    className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-900 transition cursor-pointer shrink-0"
                    title="Remove from cart"
                  >
                    🗑️
                  </button>
                </div>

                {/* Independent Date pickers for this room */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">
                      Check-in Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={item.checkIn}
                      onChange={(e) =>
                        updateItemDates(item.room.id, e.target.value, item.checkOut)
                      }
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white rounded-lg p-1.5 text-xs outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">
                      Check-out Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={item.checkOut}
                      onChange={(e) =>
                        updateItemDates(item.room.id, item.checkIn, e.target.value)
                      }
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white rounded-lg p-1.5 text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Individual subtotal */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50 text-slate-400">
                  <span>
                    Duration: <strong className="text-emerald-400">{item.nights} Night{item.nights > 1 ? "s" : ""}</strong>
                  </span>
                  <span>
                    Total: <strong className="text-white">{ethers.formatEther(item.totalPriceWei)} ETH</strong>
                    {" · "}
                    Deposit (50%): <strong className="text-amber-400">{ethers.formatEther(item.depositWei)} ETH</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer: Grand Summary & Single-Click Checkout */}
        {items.length > 0 && (
          <div className="p-6 border-t border-slate-800 bg-slate-950/80 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Suites:</span>
                <span className="font-bold text-white">{totalRooms} Rooms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Combined Nights:</span>
                <span className="font-bold text-white">{totalNights} Nights</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Grand Total Cost:</span>
                <span className="font-bold text-white">{grandTotalEth} ETH</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="font-extrabold text-amber-400 uppercase tracking-wider">
                  Total 50% Deposit Now:
                </span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {totalDepositEth} ETH
                </span>
              </div>
            </div>

            <button
              disabled={bookingPending || txPending}
              onClick={handleBatchCheckout}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {bookingPending || txPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Confirming Batch Reservation on Sepolia...
                </>
              ) : (
                `⚡ Confirm Batch Booking (${totalDepositEth} ETH via 1 MetaMask Tx)`
              )}
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              💡 <strong>Batch Gas Benefit:</strong> All {totalRooms} rooms will be booked in a single atomic transaction. You only sign once in MetaMask.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
