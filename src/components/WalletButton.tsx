"use client";

import { useWallet } from "@/hooks/useWallet";

export default function WalletButton() {
  const { account, role, isConnected, isCorrectNetwork, connect, disconnect, switchToSepolia } =
    useWallet();

  const roleConfig: Record<string, { label: string; bg: string }> = {
    owner: { label: "👑 Owner", bg: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
    receptionist: { label: "🔑 Receptionist", bg: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
    customer: { label: "🧳 Guest", bg: "bg-slate-800 text-slate-300 border-slate-700" },
  };

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
      >
        <MetaMaskIcon />
        Connect Wallet
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={switchToSepolia}
          className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          Switch to Sepolia
        </button>
      </div>
    );
  }

  const currentRole = roleConfig[role] || roleConfig.customer;

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${currentRole.bg}`}>
        {currentRole.label}
      </span>
      <button
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs rounded-2xl border border-slate-700/80 transition-all cursor-pointer"
        title="Click to disconnect"
        onClick={disconnect}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="font-mono">{account!.slice(0, 6)}…{account!.slice(-4)}</span>
      </button>
    </div>
  );
}

function MetaMaskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 318.6 318.6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="274.1,35.5 174.6,109.4 193,65.8" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
      <polygon points="44.4,35.5 143.1,110.1 125.6,65.8" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <polygon points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <polygon points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
