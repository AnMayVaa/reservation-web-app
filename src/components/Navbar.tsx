"use client";

import Link from "next/link";
import WalletButton from "@/components/WalletButton";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl">🏨</span>
          <div className="leading-tight">
            <p className="text-white font-bold text-base group-hover:text-amber-400 transition-colors">
              PremiumHotel
            </p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest">
              on Sepolia Chain
            </p>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <a
            href={`https://sepolia.etherscan.io/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Etherscan
          </a>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
