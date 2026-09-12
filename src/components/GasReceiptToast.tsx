"use client";

import { useGasTracker } from "@/hooks/useGasTracker";

export default function GasReceiptToast() {
  const { latestReceipt, dismissLatestReceipt, setIsTrackerOpen } = useGasTracker();

  if (!latestReceipt) return null;

  const isFree = latestReceipt.isOffChain || latestReceipt.gasUsed === "0";

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 rounded-3xl p-5 shadow-2xl shadow-black/80 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isFree ? "🔐" : "⛽"}</span>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {isFree ? "0-Gas Off-Chain Verified" : "Transaction Gas Receipt"}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">{latestReceipt.title}</p>
            </div>
          </div>

          <button
            onClick={dismissLatestReceipt}
            className="text-slate-400 hover:text-white p-1 text-xs transition"
          >
            ✕
          </button>
        </div>

        {/* Gas Fee Metric Pill */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Gas Units</span>
            <span className={`text-xs font-mono font-bold ${isFree ? "text-emerald-400" : "text-amber-300"}`}>
              {isFree ? "0 Units" : Number(latestReceipt.gasUsed).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Gas Price</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {isFree ? "0 Gwei" : `${latestReceipt.effectiveGasPriceGwei} Gwei`}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Gas Fee</span>
            <span className={`text-xs font-mono font-bold ${isFree ? "text-emerald-400" : "text-amber-400"}`}>
              {isFree ? "0 ETH (Free)" : `${parseFloat(latestReceipt.totalGasFeeEth).toFixed(6)} ETH`}
            </span>
          </div>
        </div>

        {/* Savings Note */}
        {latestReceipt.savingsNote && (
          <p className="text-[11px] text-emerald-400/90 leading-tight bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2.5 py-1.5 font-medium">
            💡 {latestReceipt.savingsNote}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {latestReceipt.txHash ? (
            <a
              href={`https://sepolia.etherscan.io/tx/${latestReceipt.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
            >
              View on Etherscan ↗
            </a>
          ) : (
            <span className="text-[11px] text-slate-500 italic">Off-Chain EIP-191</span>
          )}

          <button
            onClick={() => {
              setIsTrackerOpen(true);
              dismissLatestReceipt();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
          >
            📊 Compare in Gas Tracker →
          </button>
        </div>
      </div>
    </div>
  );
}
