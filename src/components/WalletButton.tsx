"use client";

import { useWallet } from "@/hooks/useWallet";

export default function WalletButton() {
  const { account, role, isConnected, isCorrectNetwork, connect, disconnect, switchToSepolia } =
    useWallet();

  const roleBadge: Record<string, string> = {
    owner: "bg-yellow-400 text-yellow-900",
    receptionist: "bg-blue-500 text-white",
    customer: "bg-slate-200 text-slate-700",
  };

  const roleLabel: Record<string, string> = {
    owner: "👑 Owner",
    receptionist: "🔑 Receptionist",
    customer: "🧳 Guest",
  };

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl shadow transition-all active:scale-95"
      >
        <MetaMaskIcon />
        Connect MetaMask
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-400 font-medium">Wrong Network</span>
        <button
          onClick={switchToSepolia}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-lg transition-all"
        >
          Switch to Sepolia
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${roleBadge[role]}`}>
        {roleLabel[role]}
      </span>
      <button
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm rounded-xl border border-slate-600 transition-all"
        title="Click to disconnect"
        onClick={disconnect}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        {account!.slice(0, 6)}…{account!.slice(-4)}
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
