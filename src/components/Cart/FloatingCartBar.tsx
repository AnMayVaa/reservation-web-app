"use client";

import { ethers } from "ethers";
import { useCart } from "@/hooks/useCart";

export default function FloatingCartBar() {
  const { totalRooms, totalDepositWei, setIsCartOpen } = useCart();

  if (totalRooms === 0) return null;

  const depositEth = ethers.formatEther(totalDepositWei);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-lg animate-bounce-short">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shadow-amber-500/20 shrink-0">
            {totalRooms}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">
                {totalRooms} {totalRooms === 1 ? "Suite" : "Suites"} in Cart
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Combined Deposit: <strong className="text-amber-400 font-mono">{depositEth} ETH</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition active:scale-95 whitespace-nowrap cursor-pointer"
        >
          Review & Book →
        </button>
      </div>
    </div>
  );
}
