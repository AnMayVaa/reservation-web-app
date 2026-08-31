"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, SEPOLIA_RPC_URLS, DEFAULT_ROOM_IMAGES } from "@/lib/constants";
import { PREMIUM_HOTEL_ABI } from "@/lib/abi";
import { useWallet } from "@/hooks/useWallet";

export interface Room {
  id: bigint;
  price: bigint;
  status: number;
  occupant: string;
  bookingTime: bigint;
  name: string;
  roomType: string;
  imageUrl: string;
  isActive: boolean;
}

// Fallback demo rooms
const DEMO_ROOMS: Room[] = [
  {
    id: 1n,
    price: ethers.parseEther("0.05"),
    status: 0,
    occupant: "0x0000000000000000000000000000000000000000",
    bookingTime: 0n,
    name: "Ocean View Deluxe",
    roomType: "Deluxe",
    imageUrl: DEFAULT_ROOM_IMAGES.Deluxe,
    isActive: true,
  },
  {
    id: 2n,
    price: ethers.parseEther("0.08"),
    status: 0,
    occupant: "0x0000000000000000000000000000000000000000",
    bookingTime: 0n,
    name: "Executive Sky Suite",
    roomType: "Suite",
    imageUrl: DEFAULT_ROOM_IMAGES.Suite,
    isActive: true,
  },
  {
    id: 3n,
    price: ethers.parseEther("0.12"),
    status: 0,
    occupant: "0x0000000000000000000000000000000000000000",
    bookingTime: 0n,
    name: "Presidential Royal Villa",
    roomType: "Penthouse",
    imageUrl: DEFAULT_ROOM_IMAGES.Penthouse,
    isActive: true,
  },
];

async function getWorkingProvider(): Promise<ethers.Provider> {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      return p;
    } catch {}
  }
  for (const url of SEPOLIA_RPC_URLS) {
    try {
      const p = new ethers.JsonRpcProvider(url);
      return p;
    } catch {
      continue;
    }
  }
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URLS[0]);
}

function extractErrorMessage(e: unknown): string {
  if (!e) return "Transaction failed";
  const err = e as {
    reason?: string;
    shortMessage?: string;
    message?: string;
    info?: { error?: { message?: string } };
  };

  const raw =
    err.reason ||
    err.shortMessage ||
    err.info?.error?.message ||
    err.message ||
    "";

  if (raw.includes("Error: Only Owner can perform this action")) {
    return "Error: Only the Hotel Owner wallet can perform this action.";
  }
  if (raw.includes("Address is already a receptionist")) {
    return "This address is already registered as a receptionist.";
  }
  if (raw.includes("Must pay exactly 50% deposit")) {
    return "Must send exactly 50% of the room price as deposit.";
  }
  if (raw.includes("user rejected") || raw.includes("User rejected")) {
    return "Transaction was rejected in MetaMask.";
  }
  if (raw.includes("insufficient funds")) {
    return "Insufficient Sepolia ETH balance in your wallet.";
  }
  if (raw.includes("require(false)")) {
    return "Transaction reverted: Sender is not the contract owner or permission denied.";
  }

  return err.reason || err.shortMessage || err.message || "Transaction failed";
}

export function useContract() {
  const { signer, isConnected, isCorrectNetwork, refreshRole } = useWallet();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [receptionists, setReceptionists] = useState<string[]>([]);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [contractBalance, setContractBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const isContractConfigured =
    CONTRACT_ADDRESS &&
    CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  // Fetch all rooms and metadata from contract
  const fetchRooms = useCallback(async () => {
    if (!isContractConfigured) {
      setRooms(DEMO_ROOMS);
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      const provider = await getWorkingProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PREMIUM_HOTEL_ABI, provider);
      
      const [rawRooms, recepsList, owner, bal] = await Promise.all([
        contract.getAllRooms(),
        contract.getReceptionists().catch(() => []),
        contract.owner().catch(() => null),
        provider.getBalance(CONTRACT_ADDRESS).catch(() => 0n),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Room[] = rawRooms.map((r: any) => ({
        id: BigInt(r.id),
        price: BigInt(r.price),
        status: Number(r.status),
        occupant: r.occupant as string,
        bookingTime: BigInt(r.bookingTime),
        name: r.name || `Room ${r.id}`,
        roomType: r.roomType || "Standard",
        imageUrl: r.imageUrl || DEFAULT_ROOM_IMAGES.Standard,
        isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
      }));

      setRooms(mapped);
      setReceptionists(recepsList);
      setOwnerAddress(owner);
      setContractBalance(bal);
      setIsDemoMode(false);
    } catch (e) {
      console.warn("Error reading on-chain rooms:", e);
      setRooms((prev) => (prev.length ? prev : DEMO_ROOMS));
    } finally {
      setLoading(false);
    }
  }, [isContractConfigured]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 8000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Execute transaction helper
  const sendTx = useCallback(
    async (fn: (contract: ethers.Contract) => Promise<ethers.ContractTransactionResponse>) => {
      if (!signer) throw new Error("Wallet not connected. Please connect MetaMask.");
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error("Contract address is not configured yet. Please deploy the contract and set the address.");
      }
      setTxPending(true);
      setError(null);
      try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, PREMIUM_HOTEL_ABI, signer);
        const tx = await fn(contract);
        await tx.wait();
        await fetchRooms();
        await refreshRole();
      } catch (e: unknown) {
        const msg = extractErrorMessage(e);
        setError(msg);
        throw new Error(msg);
      } finally {
        setTxPending(false);
      }
    },
    [signer, fetchRooms, refreshRole]
  );

  // ── Customer Functions ────────────────────────────────
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

  // ── Receptionist Functions ────────────────────────────
  const confirmCheckIn = useCallback(
    (roomId: bigint) => sendTx((c) => c.confirmCheckIn(roomId)),
    [sendTx]
  );

  const checkoutRoom = useCallback(
    (roomId: bigint) => sendTx((c) => c.checkoutRoom(roomId)),
    [sendTx]
  );

  // ── Owner Functions: Room Management ──────────────────
  const addRoom = useCallback(
    (priceEth: string, name: string, roomType: string, imageUrl: string) => {
      const priceWei = ethers.parseEther(priceEth);
      const img = imageUrl || DEFAULT_ROOM_IMAGES[roomType] || DEFAULT_ROOM_IMAGES.Standard;
      return sendTx((c) => c.addRoom(priceWei, name, roomType, img));
    },
    [sendTx]
  );

  const updateRoomPrice = useCallback(
    (roomId: bigint, newPriceEth: string) => {
      const newPriceWei = ethers.parseEther(newPriceEth);
      return sendTx((c) => c.updateRoomPrice(roomId, newPriceWei));
    },
    [sendTx]
  );

  const updateRoomDetails = useCallback(
    (roomId: bigint, name: string, roomType: string, imageUrl: string) => {
      const img = imageUrl || DEFAULT_ROOM_IMAGES[roomType] || DEFAULT_ROOM_IMAGES.Standard;
      return sendTx((c) => c.updateRoomDetails(roomId, name, roomType, img));
    },
    [sendTx]
  );

  const toggleRoomActive = useCallback(
    (roomId: bigint) => sendTx((c) => c.toggleRoomActive(roomId)),
    [sendTx]
  );

  const forceResetRoom = useCallback(
    (roomId: bigint, refundOccupant: boolean) =>
      sendTx((c) => c.forceResetRoom(roomId, refundOccupant)),
    [sendTx]
  );

  // ── Owner Functions: Receptionist Management ──────────
  const addReceptionist = useCallback(
    (address: string) => sendTx((c) => c.addReceptionist(address)),
    [sendTx]
  );

  const removeReceptionist = useCallback(
    (address: string) => sendTx((c) => c.removeReceptionist(address)),
    [sendTx]
  );

  // ── Owner Functions: Financial ────────────────────────
  const withdrawCustom = useCallback(
    (amountEth: string) => {
      const amountWei = ethers.parseEther(amountEth);
      return sendTx((c) => c.withdrawCustom(amountWei));
    },
    [sendTx]
  );

  const withdrawFunds = useCallback(
    () => sendTx((c) => c.withdrawFunds()),
    [sendTx]
  );

  return {
    rooms,
    receptionists,
    ownerAddress,
    contractBalance,
    loading,
    txPending,
    error,
    setError,
    isDemoMode,
    isContractConfigured,
    isReady: isConnected && isCorrectNetwork,
    bookRoom,
    cancelReservation,
    payRemaining,
    confirmCheckIn,
    checkoutRoom,
    addRoom,
    updateRoomPrice,
    updateRoomDetails,
    toggleRoomActive,
    forceResetRoom,
    addReceptionist,
    removeReceptionist,
    withdrawCustom,
    withdrawFunds,
    refetch: fetchRooms,
  };
}
