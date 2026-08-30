"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, SEPOLIA_RPC_URL } from "@/lib/constants";
import { PREMIUM_HOTEL_ABI } from "@/lib/abi";
import { useWallet } from "@/hooks/useWallet";

// ── Shared Room type ──────────────────────────────────────
export interface Room {
  id: bigint;
  price: bigint;
  status: number;
  occupant: string;
  bookingTime: bigint;
}

// Get a read-only contract (no wallet needed)
function getReadContract() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, PREMIUM_HOTEL_ABI, provider);
}

// Get a write contract (requires signer)
function getWriteContract(signer: ethers.JsonRpcSigner) {
  return new ethers.Contract(CONTRACT_ADDRESS, PREMIUM_HOTEL_ABI, signer);
}

// ── useContract hook ──────────────────────────────────────
export function useContract() {
  const { signer, isConnected, isCorrectNetwork } = useWallet();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [contractBalance, setContractBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all rooms from the chain
  const fetchRooms = useCallback(async () => {
    try {
      const contract = getReadContract();
      const raw = await contract.getAllRooms();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Room[] = raw.map((r: any) => ({
        id: BigInt(r.id),
        price: BigInt(r.price),
        status: Number(r.status),
        occupant: r.occupant as string,
        bookingTime: BigInt(r.bookingTime),
      }));
      setRooms(mapped);
    } catch (e) {
      console.error("fetchRooms error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      const bal = await provider.getBalance(CONTRACT_ADDRESS);
      setContractBalance(bal);
    } catch {
      // ignore
    }
  }, []);

  // Poll every 8 seconds for live updates
  useEffect(() => {
    fetchRooms();
    fetchBalance();
    const id = setInterval(() => { fetchRooms(); fetchBalance(); }, 8000);
    return () => clearInterval(id);
  }, [fetchRooms, fetchBalance]);

  // ── Write helpers ─────────────────────────────────────
  const sendTx = useCallback(
    async (fn: (contract: ethers.Contract) => Promise<ethers.ContractTransactionResponse>) => {
      if (!signer) throw new Error("Wallet not connected");
      setTxPending(true);
      setError(null);
      try {
        const contract = getWriteContract(signer);
        const tx = await fn(contract);
        await tx.wait();
        await fetchRooms();
        await fetchBalance();
      } catch (e: unknown) {
        const msg = (e as { reason?: string; message?: string }).reason ?? (e as { message?: string }).message ?? "Transaction failed";
        setError(msg);
        throw e;
      } finally {
        setTxPending(false);
      }
    },
    [signer, fetchRooms, fetchBalance]
  );

  const bookRoom = useCallback(
    (roomId: bigint, depositWei: bigint) =>
      sendTx((c) => c.bookRoom(roomId, { value: depositWei })),
    [sendTx]
  );

  const cancelReservation = useCallback(
    (roomId: bigint) => sendTx((c) => c.cancelReservation(roomId)),
    [sendTx]
  );

  const payRemaining = useCallback(
    (roomId: bigint, amountWei: bigint) =>
      sendTx((c) => c.payRemaining(roomId, { value: amountWei })),
    [sendTx]
  );

  const confirmCheckIn = useCallback(
    (roomId: bigint) => sendTx((c) => c.confirmCheckIn(roomId)),
    [sendTx]
  );

  const checkoutRoom = useCallback(
    (roomId: bigint) => sendTx((c) => c.checkoutRoom(roomId)),
    [sendTx]
  );

  const setReceptionist = useCallback(
    (address: string) => sendTx((c) => c.setReceptionist(address)),
    [sendTx]
  );

  const withdrawFunds = useCallback(
    () => sendTx((c) => c.withdrawFunds()),
    [sendTx]
  );

  return {
    rooms,
    contractBalance,
    loading,
    txPending,
    error,
    setError,
    isReady: isConnected && isCorrectNetwork,
    bookRoom,
    cancelReservation,
    payRemaining,
    confirmCheckIn,
    checkoutRoom,
    setReceptionist,
    withdrawFunds,
    refetch: fetchRooms,
  };
}
