"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Room } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";

interface DigitalLockModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCheckIn?: () => void;
}

export default function DigitalLockModal({
  room,
  isOpen,
  onClose,
  onConfirmCheckIn,
}: DigitalLockModalProps) {
  const { account } = useWallet();

  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30);
  const [currentNonce, setCurrentNonce] = useState("849201");
  const [currentTimestamp, setCurrentTimestamp] = useState(Math.floor(Date.now() / 1000));
  
  const [signing, setSigning] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState<"idle" | "success" | "spoof_failed" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [recoveredSigner, setRecoveredSigner] = useState<string | null>(null);

  // TOTP 30-second rolling window simulation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = 30 - (now % 30);
      setTotpSecondsLeft(secondsLeft);
      setCurrentTimestamp(now);

      if (secondsLeft === 30 || secondsLeft === 1) {
        // Generate pseudo-random 6-digit nonce for this window
        const newNonce = Math.floor(100000 + Math.random() * 900000).toString();
        setCurrentNonce(newNonce);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setUnlockStatus("idle");
      setStatusMessage("");
      setRecoveredSigner(null);
    }
  }, [isOpen]);

  // Genuine MetaMask signature unlock (EIP-191)
  const handleRealUnlock = useCallback(async () => {
    if (!room || !account) return;
    setSigning(true);
    setUnlockStatus("idle");
    setStatusMessage("");

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const challengeMessage = `[SmartHotel IoT Lock]\nRoom ID: ${room.id.toString()}\nNonce: ${currentNonce}\nTimestamp: ${currentTimestamp}\nAction: UNLOCK_DOOR`;
      
      // Guest signs with their private key (0 Gas)
      const signature = await signer.signMessage(challengeMessage);

      // Lock verifies signature off-chain using ecrecover / verifyMessage (0 Gas)
      const recovered = ethers.verifyMessage(challengeMessage, signature);
      setRecoveredSigner(recovered);

      if (recovered.toLowerCase() === room.occupant.toLowerCase()) {
        setUnlockStatus("success");
        setStatusMessage("✅ ACCESS GRANTED! Door servo motor activated. Welcome to your room!");
        if (onConfirmCheckIn && room.status === 2) {
          onConfirmCheckIn();
        }
      } else {
        setUnlockStatus("error");
        setStatusMessage(
          `❌ ACCESS DENIED: Signer (${recovered.slice(0, 6)}…) does not match Room Occupant (${room.occupant.slice(0, 6)}…)`
        );
      }
    } catch (err: unknown) {
      setUnlockStatus("error");
      setStatusMessage((err as Error).message || "Signing was cancelled or failed.");
    } finally {
      setSigning(false);
    }
  }, [room, account, currentNonce, currentTimestamp, onConfirmCheckIn]);

  // Teacher Demonstration: Simulate Attacker who only knows occupant's public address
  const handleSpoofAttackSimulation = useCallback(() => {
    setSigning(true);
    setUnlockStatus("idle");
    setTimeout(() => {
      setUnlockStatus("spoof_failed");
      setRecoveredSigner("0xAttackerWithoutPrivateKey...");
      setStatusMessage(
        "🛑 ACCESS REJECTED! Attacker copied occupant's public address, but could NOT produce a valid cryptographic signature signed by the occupant's private key. The door lock remained securely bolted!"
      );
      setSigning(false);
    }, 800);
  }, []);

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl p-2 rounded-xl hover:bg-slate-800 transition"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-500/10">
            🚪
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              IoT Smart Door Lock Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Room #{room.id.toString()} — {room.name}
            </p>
          </div>
        </div>

        {/* Dynamic Rolling TOTP Nonce Box */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Door Challenge (TOTP)
            </span>
            <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              Window expires in: {totpSecondsLeft}s
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Dynamic Nonce</span>
              <span className="font-mono text-sm font-bold text-purple-300">{currentNonce}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Timestamp</span>
              <span className="font-mono text-sm font-bold text-blue-300">{currentTimestamp}</span>
            </div>
          </div>

          {/* Progress bar for 30s window */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(totpSecondsLeft / 30) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Occupant Proof Details */}
        <div className="text-xs space-y-1.5 text-slate-300 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between">
            <span className="text-slate-500">Authorized Occupant:</span>
            <span className="font-mono text-purple-400 font-semibold truncate max-w-[220px]">
              {room.occupant}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Verification Gas Fee:</span>
            <span className="text-emerald-400 font-bold">0 ETH (Off-Chain Cryptographic Proof)</span>
          </div>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs leading-relaxed border ${
              unlockStatus === "success"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
            }`}
          >
            {statusMessage}
            {recoveredSigner && (
              <div className="mt-2 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-700/50">
                Recovered Signer Address: {recoveredSigner}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            disabled={signing}
            onClick={handleRealUnlock}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {signing ? "Verifying Cryptographic Signature..." : "🔐 Sign with MetaMask & Unlock Door"}
          </button>

          {/* Teacher Test Button: Address Spoofing Attack */}
          <button
            disabled={signing}
            onClick={handleSpoofAttackSimulation}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            🕵️ Simulate Address Spoof Attack (Teacher Demo)
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center leading-tight">
          💡 <strong>Teacher Note:</strong> Anyone can see your public address on Etherscan, but only you hold the private key needed to create a valid cryptographic signature for the door lock.
        </p>
      </div>
    </div>
  );
}
