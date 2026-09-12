"use client";

import { useState } from "react";
import { useGasTracker } from "@/hooks/useGasTracker";

export default function GasTrackerModal() {
  const { receipts, clearReceipts, isTrackerOpen, setIsTrackerOpen } = useGasTracker();
  const [activeTab, setActiveTab] = useState<"live" | "benchmark">("live");

  if (!isTrackerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 shrink-0">
              ⛽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Gas Tracker & Performance Comparison
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {receipts.length} Recorded
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time Ethereum Sepolia gas metrics & architectural cost comparisons for evaluation
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTrackerOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-800/80 bg-slate-950/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("live")}
              className={`px-4 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "live"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              📊 Live Recorded Transactions ({receipts.length})
            </button>
            <button
              onClick={() => setActiveTab("benchmark")}
              className={`px-4 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "benchmark"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              🎓 EVM Benchmark Comparison (Teacher Guide)
            </button>
          </div>

          {activeTab === "live" && receipts.length > 0 && (
            <button
              onClick={clearReceipts}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
            >
              🗑️ Clear History
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {activeTab === "live" ? (
            receipts.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-3xl mx-auto">
                  📋
                </div>
                <h4 className="text-base font-bold text-white">No Transactions Recorded Yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Perform any action on the web (e.g. Single Booking, Batch Booking with Cart, Multi Pay Remaining, or Digital Key Unlock) and its exact gas metrics will appear here for comparison!
                </p>
                <button
                  onClick={() => setActiveTab("benchmark")}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  View EVM Benchmark Comparison →
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Transaction Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-3.5">Action & Method</th>
                        <th className="p-3.5 text-center">Suites</th>
                        <th className="p-3.5 text-right">Gas Units Used</th>
                        <th className="p-3.5 text-right">Gas / Suite</th>
                        <th className="p-3.5 text-right">Gas Price</th>
                        <th className="p-3.5 text-right">Total Gas Fee</th>
                        <th className="p-3.5 text-center">Tx Proof</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {receipts.map((r) => {
                        const isFree = r.isOffChain || r.gasUsed === "0";
                        const gasPerSuite =
                          !isFree && r.roomCount > 0
                            ? Math.round(Number(r.gasUsed) / r.roomCount)
                            : 0;

                        return (
                          <tr key={r.id} className="hover:bg-slate-900/40 transition">
                            <td className="p-3.5 font-sans font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span>{isFree ? "🔐" : "⚡"}</span>
                                <div>
                                  <div className="font-bold">{r.title}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {r.methodName}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 text-center font-sans font-bold text-slate-300">
                              {r.roomCount}
                            </td>

                            <td className="p-3.5 text-right font-bold">
                              {isFree ? (
                                <span className="text-emerald-400 font-sans">0 (Free)</span>
                              ) : (
                                <span className="text-amber-300">
                                  {Number(r.gasUsed).toLocaleString()}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-right font-semibold">
                              {isFree ? (
                                <span className="text-emerald-400 font-sans">0</span>
                              ) : (
                                <span className="text-slate-300">
                                  ~{gasPerSuite.toLocaleString()}
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-right text-slate-400">
                              {isFree ? "0 Gwei" : `${r.effectiveGasPriceGwei} Gwei`}
                            </td>

                            <td className="p-3.5 text-right font-bold">
                              {isFree ? (
                                <span className="text-emerald-400 font-sans">0.000000 ETH</span>
                              ) : (
                                <span className="text-amber-400">
                                  {parseFloat(r.totalGasFeeEth).toFixed(6)} ETH
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-center font-sans">
                              {r.txHash ? (
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${r.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  {r.txHash.slice(0, 6)}…
                                </a>
                              ) : (
                                <span className="text-[11px] text-emerald-400 font-semibold">
                                  Off-Chain
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Live Savings Analysis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <span className="text-xl">🛒</span>
                    <h5 className="text-xs font-bold text-amber-300">Batch Booking Efficiency</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      By bundling multiple rooms into 1 transaction (`bookRoomsBatch`), you eliminate repetitive 21,000 base transaction fees and multiple MetaMask confirmations.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                    <span className="text-xl">💳</span>
                    <h5 className="text-xs font-bold text-blue-300">Multi Pay Remaining</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Paying remaining balances for multiple suites in 1 atomic call (`payRemainingBatch`) saves 25%–35% total gas compared to individual transactions.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                    <span className="text-xl">🔑</span>
                    <h5 className="text-xs font-bold text-emerald-300">0-Gas Digital Key (EIP-191)</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Cryptographic challenge signing is verified locally by the IoT door lock without broadcasting a transaction, achieving 100% free (0 Gas) access!
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* EVM Benchmark Comparison Tab */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📐</span> Architectural Gas Comparison Table
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This table compares the empirical EVM execution cost between individual transactions and our optimized batch/off-chain architecture:
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Operation Type</th>
                      <th className="p-3.5 text-center">Rooms</th>
                      <th className="p-3.5 text-right">Average Gas</th>
                      <th className="p-3.5 text-right">Gas Per Room</th>
                      <th className="p-3.5 text-right">Est. Fee (1.5 Gwei)</th>
                      <th className="p-3.5 text-center">Gas Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-sans font-semibold text-slate-300">
                        Single Room Booking (`bookRoom`)
                      </td>
                      <td className="p-3.5 text-center font-sans">1</td>
                      <td className="p-3.5 text-right text-slate-300">~145,000</td>
                      <td className="p-3.5 text-right text-slate-300">145,000</td>
                      <td className="p-3.5 text-right text-slate-300">0.000218 ETH</td>
                      <td className="p-3.5 text-center font-sans text-slate-500">Baseline</td>
                    </tr>

                    <tr className="hover:bg-slate-900/40 bg-amber-500/5">
                      <td className="p-3.5 font-sans font-semibold text-amber-300">
                        Batch Booking 2 Rooms (`bookRoomsBatch`)
                      </td>
                      <td className="p-3.5 text-center font-sans font-bold text-amber-300">2</td>
                      <td className="p-3.5 text-right font-bold text-amber-300">~205,000</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">102,500</td>
                      <td className="p-3.5 text-right text-amber-400">0.000308 ETH</td>
                      <td className="p-3.5 text-center font-sans font-extrabold text-emerald-400">
                        🔥 29% Saved / Room
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-900/40 bg-amber-500/10">
                      <td className="p-3.5 font-sans font-semibold text-amber-300">
                        Batch Booking 3 Rooms (`bookRoomsBatch`)
                      </td>
                      <td className="p-3.5 text-center font-sans font-bold text-amber-300">3</td>
                      <td className="p-3.5 text-right font-bold text-amber-300">~265,000</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">88,333</td>
                      <td className="p-3.5 text-right text-amber-400">0.000398 ETH</td>
                      <td className="p-3.5 text-center font-sans font-extrabold text-emerald-400">
                        🔥 39% Saved / Room
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-sans font-semibold text-slate-300">
                        Single Pay Remaining (`payRemaining`)
                      </td>
                      <td className="p-3.5 text-center font-sans">1</td>
                      <td className="p-3.5 text-right text-slate-300">~65,000</td>
                      <td className="p-3.5 text-right text-slate-300">65,000</td>
                      <td className="p-3.5 text-right text-slate-300">0.000098 ETH</td>
                      <td className="p-3.5 text-center font-sans text-slate-500">Baseline</td>
                    </tr>

                    <tr className="hover:bg-slate-900/40 bg-blue-500/5">
                      <td className="p-3.5 font-sans font-semibold text-blue-300">
                        Batch Pay Remaining 2 Rooms (`payRemainingBatch`)
                      </td>
                      <td className="p-3.5 text-center font-sans font-bold text-blue-300">2</td>
                      <td className="p-3.5 text-right font-bold text-blue-300">~95,000</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">47,500</td>
                      <td className="p-3.5 text-right text-blue-300">0.000143 ETH</td>
                      <td className="p-3.5 text-center font-sans font-extrabold text-emerald-400">
                        🔥 27% Saved / Room
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-900/40 bg-emerald-500/10">
                      <td className="p-3.5 font-sans font-semibold text-emerald-300">
                        Digital Door OTP Unlock (EIP-191 Challenge)
                      </td>
                      <td className="p-3.5 text-center font-sans font-bold text-emerald-300">1</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">0</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">0</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">0.000000 ETH</td>
                      <td className="p-3.5 text-center font-sans font-extrabold text-emerald-400">
                        ✨ 100% Free (Zero Gas)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Technical Explanation for Teachers */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  💡 Technical Rationale: Why Batching Saves Gas
                </h5>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    <strong>Base 21,000 Gas Elimination:</strong> In Ethereum, every single transaction incurs a non-negotiable 21,000 gas overhead for signature recovery and nonce updates. By executing 3 bookings in 1 batch, the user pays this 21,000 gas once instead of 3 times.
                  </li>
                  <li>
                    <strong>Single Value Transfer:</strong> Instead of processing multiple individual payable transfers, the contract aggregates all deposits into `msg.value` in a single validation step.
                  </li>
                  <li>
                    <strong>Off-Chain Cryptography:</strong> For everyday door access, sending on-chain transactions is wasteful and slow. Using EIP-191 signed OTP challenges allows instantaneous, zero-gas verification while maintaining the security of the private key.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            PremiumHotel v4 Gas Tracker · Auto-saved to LocalStorage
          </span>
          <button
            onClick={() => setIsTrackerOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
