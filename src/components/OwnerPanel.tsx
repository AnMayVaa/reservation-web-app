"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import AddRoomModal from "@/components/Modals/AddRoomModal";

export default function OwnerPanel() {
  const {
    contractBalance,
    receptionists,
    ownerAddress,
    addReceptionist,
    removeReceptionist,
    withdrawCustom,
    withdrawFunds,
    addRoom,
    txPending,
  } = useContract();

  const { account, switchAccount } = useWallet();

  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [receptionistInput, setReceptionistInput] = useState("");
  const [customWithdrawEth, setCustomWithdrawEth] = useState("0.1");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const isCurrentWalletOwner =
    account &&
    ownerAddress &&
    account.toLowerCase() === ownerAddress.toLowerCase();

  async function handle(key: string, fn: () => Promise<void>, successMsg: string) {
    setActionError(null);
    setActionSuccess(null);
    setActiveAction(key);
    try {
      await fn();
      setActionSuccess(successMsg);
    } catch (e: unknown) {
      const msg = (e as Error).message || "Transaction failed";
      setActionError(msg.length > 150 ? msg.slice(0, 150) + "…" : msg);
    } finally {
      setActiveAction(null);
    }
  }

  const isValidAddress =
    receptionistInput.startsWith("0x") && receptionistInput.length === 42;
  const balanceEth = ethers.formatEther(contractBalance);

  return (
    <section className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-500/10">
            👑
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Hotel Owner Administration</h2>
            <p className="text-xs text-slate-400">
              Full control over finances, rooms, and front desk staff
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {ownerAddress && (
            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Contract Owner</span>
              <span className="text-xs font-mono text-amber-400">
                {ownerAddress.slice(0, 6)}…{ownerAddress.slice(-4)}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsAddRoomOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            ➕ Add New Room
          </button>
        </div>
      </div>

      {/* Non-owner Warning Banner */}
      {!isCurrentWalletOwner && ownerAddress && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-300">
              ⚠️ Connected Wallet is Not the Contract Owner
            </p>
            <p className="text-[11px] text-slate-400">
              Connected: <code className="text-white font-mono">{account?.slice(0, 8)}…{account?.slice(-6)}</code>. Contract Owner: <code className="text-amber-400 font-mono">{ownerAddress}</code>.
            </p>
          </div>
          <button
            onClick={switchAccount}
            className="px-3.5 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl transition hover:bg-amber-400 whitespace-nowrap cursor-pointer"
          >
            Switch to Owner Wallet
          </button>
        </div>
      )}

      {/* Notifications */}
      {actionError && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
          ❌ {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
          ✅ {actionSuccess}
        </div>
      )}

      {/* Grid: Financials & Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Financial Management */}
        <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              💰 Hotel Revenue & Treasury
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Sepolia Contract
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Contract Balance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-white">{balanceEth}</span>
              <span className="text-sm font-semibold text-amber-400">ETH</span>
            </div>
          </div>

          {/* Withdraw Actions */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Custom Amount Withdraw
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={customWithdrawEth}
                  onChange={(e) => setCustomWithdrawEth(e.target.value)}
                  placeholder="e.g. 0.05"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 text-white rounded-xl px-4 py-2.5 text-xs outline-none transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-semibold">
                  ETH
                </span>
              </div>
              <button
                disabled={txPending || contractBalance === 0n || !customWithdrawEth}
                onClick={() =>
                  handle(
                    "withdrawCustom",
                    () => withdrawCustom(customWithdrawEth),
                    `Successfully withdrew ${customWithdrawEth} ETH to owner wallet!`
                  )
                }
                className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 disabled:opacity-40 rounded-xl text-xs font-bold transition whitespace-nowrap min-w-[90px] cursor-pointer"
              >
                {activeAction === "withdrawCustom" ? "..." : "Withdraw"}
              </button>
            </div>

            <button
              disabled={txPending || contractBalance === 0n}
              onClick={() =>
                handle(
                  "withdrawAll",
                  withdrawFunds,
                  "All accumulated hotel funds transferred to your wallet!"
                )
              }
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {activeAction === "withdrawAll" ? "Processing..." : `Withdraw 100% Full Balance (${balanceEth} ETH)`}
            </button>
          </div>
        </div>

        {/* 2. Receptionist Staff Management */}
        <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              🔑 Front Desk Receptionists
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {receptionists.length} Staff Members
            </span>
          </div>

          {/* Add Receptionist Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Grant Receptionist Access
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={receptionistInput}
                onChange={(e) => setReceptionistInput(e.target.value)}
                placeholder="0x... (Wallet Address)"
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-400 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-xs font-mono outline-none transition"
              />
              <button
                disabled={txPending || !isValidAddress}
                onClick={() =>
                  handle(
                    "addRecep",
                    async () => {
                      await addReceptionist(receptionistInput.trim());
                      setReceptionistInput("");
                    },
                    `Granted receptionist role to ${receptionistInput.slice(0, 8)}…`
                  )
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition whitespace-nowrap min-w-[70px] cursor-pointer"
              >
                {activeAction === "addRecep" ? "..." : "Add"}
              </button>
            </div>
          </div>

          {/* Receptionists List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Active Staff List</span>
            {receptionists.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No receptionist addresses added yet.</p>
            ) : (
              receptionists.map((addr) => (
                <div
                  key={addr}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
                >
                  <a
                    href={`https://sepolia.etherscan.io/address/${addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono hover:underline truncate max-w-[200px]"
                  >
                    {addr}
                  </a>
                  <button
                    disabled={txPending}
                    onClick={() =>
                      handle(
                        `remove-${addr}`,
                        () => removeReceptionist(addr),
                        `Revoked receptionist role from ${addr.slice(0, 6)}…`
                      )
                    }
                    className="px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        onAdd={addRoom}
        txPending={txPending}
      />
    </section>
  );
}
