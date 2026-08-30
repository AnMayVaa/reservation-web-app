"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useContract } from "@/hooks/useContract";

export default function OwnerPanel() {
  const { contractBalance, setReceptionist, withdrawFunds, txPending } = useContract();
  const [receptionistInput, setReceptionistInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<"set" | "withdraw" | null>(null);

  async function handle(type: "set" | "withdraw", fn: () => Promise<void>, successMsg: string) {
    setActionError(null);
    setActionSuccess(null);
    setCurrentAction(type);
    try {
      await fn();
      setActionSuccess(successMsg);
      if (type === "set") setReceptionistInput("");
    } catch (e: unknown) {
      const msg = (e as { reason?: string; message?: string }).reason ?? (e as { message?: string }).message ?? "Transaction failed";
      setActionError(msg.length > 150 ? msg.slice(0, 150) + "…" : msg);
    } finally {
      setCurrentAction(null);
    }
  }

  const isPending = (type: "set" | "withdraw") => txPending && currentAction === type;

  const isValidAddress = receptionistInput.startsWith("0x") && receptionistInput.length === 42;

  return (
    <section className="bg-slate-800 border border-yellow-700/40 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">👑</span>
        <div>
          <h2 className="text-white font-bold text-lg">Owner Panel</h2>
          <p className="text-slate-400 text-sm">Admin controls for hotel management</p>
        </div>
      </div>

      {/* Feedback */}
      {actionError && (
        <div className="text-sm text-red-400 bg-red-900/30 rounded-xl px-4 py-3 break-words">
          ❌ {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="text-sm text-emerald-400 bg-emerald-900/30 rounded-xl px-4 py-3">
          ✅ {actionSuccess}
        </div>
      )}

      {/* Contract Balance */}
      <div className="bg-slate-700/50 rounded-xl px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Contract Balance</p>
          <p className="text-white text-2xl font-bold">
            {ethers.formatEther(contractBalance)}
            <span className="text-slate-400 text-sm font-normal ml-1">ETH</span>
          </p>
        </div>
        <button
          disabled={txPending || contractBalance === 0n}
          onClick={() => handle("withdraw", withdrawFunds, "Funds withdrawn to your wallet!")}
          className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 font-bold text-sm rounded-xl transition-all active:scale-95 min-w-[120px] text-center"
        >
          {isPending("withdraw") ? <Spinner /> : "Withdraw All"}
        </button>
      </div>

      {/* Set Receptionist */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">
          Set Receptionist Address
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={receptionistInput}
            onChange={(e) => setReceptionistInput(e.target.value)}
            placeholder="0x..."
            className="flex-1 bg-slate-700 border border-slate-600 focus:border-yellow-500 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors font-mono"
          />
          <button
            disabled={txPending || !isValidAddress}
            onClick={() =>
              handle(
                "set",
                () => setReceptionist(receptionistInput),
                `Receptionist set to ${receptionistInput.slice(0, 10)}…`
              )
            }
            className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 font-bold text-sm rounded-xl transition-all active:scale-95 min-w-[80px] text-center whitespace-nowrap"
          >
            {isPending("set") ? <Spinner /> : "Set"}
          </button>
        </div>
        <p className="text-slate-500 text-xs">
          The receptionist can confirm check-ins and check-outs.
        </p>
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
