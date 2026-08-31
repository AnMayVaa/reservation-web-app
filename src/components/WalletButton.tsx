"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";

export default function WalletButton() {
  const {
    account,
    role,
    isConnected,
    isCorrectNetwork,
    connect,
    disconnect,
    switchAccount,
    switchToSepolia,
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${currentRole.bg}`}>
          {currentRole.label}
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs rounded-2xl border border-slate-700/80 transition-all cursor-pointer shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-mono">{account!.slice(0, 6)}…{account!.slice(-4)}</span>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Wallet Management Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 space-y-3 z-50 animate-fadeIn">
          {/* Account Details */}
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Connected Account</span>
              <span className="text-[10px] font-bold text-amber-400 uppercase">{role}</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-xs text-white truncate max-w-[160px]">
                {account}
              </span>
              <button
                onClick={copyAddress}
                className="text-[11px] text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                title="Copy Address"
              >
                {copied ? "✓ Copied" : "📋"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <button
              onClick={() => {
                setIsOpen(false);
                switchAccount();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500/10 hover:text-amber-300 rounded-xl transition cursor-pointer text-left"
            >
              <span className="text-sm">🔄</span>
              <span>Switch / Change Wallet</span>
            </button>

            <a
              href={`https://sepolia.etherscan.io/address/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition text-left"
            >
              <span className="text-sm">↗️</span>
              <span>View on Etherscan</span>
            </a>

            <button
              onClick={() => {
                setIsOpen(false);
                disconnect();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer text-left"
            >
              <span className="text-sm">🚪</span>
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
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
