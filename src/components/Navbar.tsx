"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import WalletButton from "@/components/WalletButton";
import GasGuideModal from "@/components/Modals/GasGuideModal";
import { useCart } from "@/hooks/useCart";
import { useGasTracker } from "@/hooks/useGasTracker";

export default function Navbar() {
  const [isGasGuideOpen, setIsGasGuideOpen] = useState(false);
  const { totalRooms, setIsCartOpen } = useCart();
  const { receipts, setIsTrackerOpen } = useGasTracker();

  const isContractConfigured =
    CONTRACT_ADDRESS &&
    CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
              🏨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold text-lg tracking-tight group-hover:text-amber-300 transition-colors">
                  PremiumHotel
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  v4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Multi-Room Web3 Hospitality on Sepolia
              </p>
            </div>
          </Link>

          {/* Right Side Links, Cart & Wallet */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 transition cursor-pointer"
            >
              <span>🛒</span>
              <span className="hidden sm:inline">Cart</span>
              {totalRooms > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center ml-0.5 animate-pulse">
                  {totalRooms}
                </span>
              )}
            </button>

            {/* Gas Guide Button (Teacher Feature) */}
            <button
              onClick={() => setIsGasGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <span>⛽</span>
              <span className="hidden sm:inline">Gas Guide</span>
            </button>

            {/* Gas Tracker & Comparison Button */}
            <button
              onClick={() => setIsTrackerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 transition cursor-pointer"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Gas Tracker</span>
              {receipts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  {receipts.length}
                </span>
              )}
            </button>

            {isContractConfigured && (
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-amber-400 hover:border-slate-700 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Contract
              </a>
            )}
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Gas Guide Modal */}
      <GasGuideModal
        isOpen={isGasGuideOpen}
        onClose={() => setIsGasGuideOpen(false)}
      />
    </>
  );
}
