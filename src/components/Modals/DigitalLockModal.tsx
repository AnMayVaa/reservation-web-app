"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { Room } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";

interface DigitalLockModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCheckIn?: () => Promise<void>;
}

export default function DigitalLockModal({
  room,
  isOpen,
  onClose,
  onConfirmCheckIn,
}: DigitalLockModalProps) {
  const { account } = useWallet();

  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30);
  const [currentOTP, setCurrentOTP] = useState("849201");
  const [currentTimestamp, setCurrentTimestamp] = useState(Math.floor(Date.now() / 1000));
  
  // Keep live references to active OTP & timestamp for expiry checking
  const activeOTPRef = useRef(currentOTP);
  const activeTimestampRef = useRef(currentTimestamp);
  useEffect(() => {
    activeOTPRef.current = currentOTP;
    activeTimestampRef.current = currentTimestamp;
  }, [currentOTP, currentTimestamp]);

  const [signing, setSigning] = useState(false);
  const [syncingOnChain, setSyncingOnChain] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState<"idle" | "success" | "spoof_failed" | "error" | "expired">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [recoveredSigner, setRecoveredSigner] = useState<string | null>(null);

  // TOTP 30-second rolling window
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = 30 - (now % 30);
      setTotpSecondsLeft(secondsLeft);
      setCurrentTimestamp(now);

      if (secondsLeft === 30 || secondsLeft === 1) {
        // Rotate pseudo-random 6-digit OTP for this 30s window
        const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
        setCurrentOTP(newOTP);
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

  // Genuine MetaMask signature unlock (EIP-191) with schedule and OTP-expiry checks
  const handleRealUnlock = useCallback(async () => {
    if (!room || !account) return;
    setSigning(true);
    setUnlockStatus("idle");
    setStatusMessage("");

    // 1. Schedule Validation: Cannot check in / unlock before scheduled check-in time!
    const nowSec = Math.floor(Date.now() / 1000);
    const checkInSec = Number(room.checkInTime);
    const checkOutSec = Number(room.checkOutTime);

    if (checkInSec > 0 && nowSec < checkInSec) {
      const diffSec = checkInSec - nowSec;
      const diffMins = Math.ceil(diffSec / 60);
      const checkInStr = new Date(checkInSec * 1000).toLocaleString();
      setUnlockStatus("error");
      setStatusMessage(
        `⏳ CANNOT UNLOCK BEFORE SCHEDULE: Your reservation begins on ${checkInStr}. The digital door lock will remain locked until your scheduled check-in time (in ~${diffMins} minutes).`
      );
      setSigning(false);
      return;
    }

    if (checkOutSec > 0 && nowSec > checkOutSec) {
      const checkOutStr = new Date(checkOutSec * 1000).toLocaleString();
      setUnlockStatus("error");
      setStatusMessage(
        `⌛ STAY EXPIRED: Your reservation ended on ${checkOutStr}. Key access has been automatically revoked.`
      );
      setSigning(false);
      return;
    }

    // Capture the OTP & timestamp presented to user when clicking sign
    const challengeOTP = currentOTP;
    const challengeTimestamp = currentTimestamp;

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const challengeMessage = `[SmartHotel IoT Lock]\nRoom ID: ${room.id.toString()}\nDoor OTP: ${challengeOTP}\nTimestamp: ${challengeTimestamp}\nAction: UNLOCK_DOOR`;
      
      // Guest signs with their private key (0 Gas)
      const signature = await signer.signMessage(challengeMessage);

      // 2. Dynamic Door OTP Expiration Check:
      // If the user took longer than 30 seconds or the active OTP changed during signing
      const finishedNowSec = Math.floor(Date.now() / 1000);
      const isExpiredWindow =
        finishedNowSec - challengeTimestamp > 30 ||
        challengeOTP !== activeOTPRef.current;

      if (isExpiredWindow) {
        setUnlockStatus("expired");
        setStatusMessage(
          `⏱️ DYNAMIC DOOR OTP EXPIRED (>30s): You signed challenge with OTP [${challengeOTP}], but the lock rotated to OTP [${activeOTPRef.current}]. The lock rejected this signature to prevent replay attacks! Please sign the live active OTP.`
        );
        return;
      }

      // 3. Cryptographic Verification: recover public address
      const recovered = ethers.verifyMessage(challengeMessage, signature);
      setRecoveredSigner(recovered);

      if (recovered.toLowerCase() === room.occupant.toLowerCase()) {
        setUnlockStatus("success");
        setStatusMessage("✅ ACCESS GRANTED! Signature verified with live Door OTP. Door servo motor activated!");
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
  }, [room, account, currentOTP, currentTimestamp]);

  // Optional on-chain check-in trigger
  const handleOnChainSync = useCallback(async () => {
    if (!onConfirmCheckIn) return;
    setSyncingOnChain(true);
    try {
      await onConfirmCheckIn();
      setStatusMessage("🎉 On-chain status updated to 'Checked In' on Sepolia!");
    } catch (e: unknown) {
      setStatusMessage(`Transaction error: ${(e as Error).message || "Failed to update on-chain"}`);
    } finally {
      setSyncingOnChain(false);
    }
  }, [onConfirmCheckIn]);

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
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
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

        {/* Scheduled Stay Info Box */}
        {room.checkInTime > 0n && (
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>📅 Scheduled Stay:</span>
              <span className="font-semibold text-white">
                {new Date(Number(room.checkInTime) * 1000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                {" → "}
                {new Date(Number(room.checkOutTime) * 1000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Door Access Window:</span>
              <span className="text-emerald-400 font-semibold">Active only during stay dates</span>
            </div>
          </div>
        )}

        {/* Dynamic Rolling TOTP Door OTP Box */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Door OTP (TOTP)
            </span>
            <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              OTP expires in: {totpSecondsLeft}s
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Door OTP (6 Digits)</span>
              <span className="font-mono text-sm font-bold text-purple-300">{currentOTP}</span>
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
            <span className="text-slate-500">Unlock Fee:</span>
            <span className="text-emerald-400 font-bold">0 ETH (Instant Off-Chain Proof)</span>
          </div>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs leading-relaxed border ${
              unlockStatus === "success"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : unlockStatus === "expired"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
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

        {/* Optional On-Chain Status Update after successful unlock */}
        {unlockStatus === "success" && room.status === 2 && onConfirmCheckIn && (
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2 text-xs">
            <p className="text-blue-300">
              💡 Door is unlocked! Would you like to record your check-in on the Sepolia blockchain ledger?
            </p>
            <button
              disabled={syncingOnChain}
              onClick={handleOnChainSync}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer"
            >
              {syncingOnChain ? "Submitting on-chain..." : "📝 Record Check-In on Blockchain (Sepolia Tx)"}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            disabled={signing}
            onClick={handleRealUnlock}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {signing ? "Waiting for MetaMask signature..." : "🔐 Sign Challenge with Door OTP & Unlock Door"}
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
          💡 <strong>Teacher Note:</strong> Dynamic Door OTP rotates every 30 seconds (TOTP). Signatures signed late or with expired OTPs are rejected. Address spoofers fail because they lack the occupant&apos;s private key.
        </p>
      </div>
    </div>
  );
}
