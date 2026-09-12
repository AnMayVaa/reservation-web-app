"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, SEPOLIA_RPC_URLS, DEFAULT_ROOM_IMAGES } from "@/lib/constants";
import { PREMIUM_HOTEL_ABI } from "@/lib/abi";
import { useWallet } from "@/hooks/useWallet";
import { useGasTracker } from "@/hooks/useGasTracker";

export interface Room {
  id: bigint;
  pricePerNight: bigint;
  totalPrice: bigint;
  status: number;
  occupant: string;
  bookingTime: bigint;
  checkInTime: bigint;
  checkOutTime: bigint;
  name: string;
  roomType: string;
  imageUrl: string;
  isActive: boolean;
}

// Fallback demo rooms
const DEMO_ROOMS: Room[] = [
  {
    id: 1n,
    pricePerNight: ethers.parseEther("0.02"),
    totalPrice: 0n,
    status: 0,
    occupant: "0x0000000000000000000000000000000000000000",
    bookingTime: 0n,
    checkInTime: 0n,
    checkOutTime: 0n,
    name: "Ocean View Deluxe",
    roomType: "Deluxe",
    imageUrl: DEFAULT_ROOM_IMAGES.Deluxe,
    isActive: true,
  },
  {
    id: 2n,
    pricePerNight: ethers.parseEther("0.04"),
    totalPrice: 0n,
    status: 0,
    occupant: "0x0000000000000000000000000000000000000000",
    bookingTime: 0n,
    checkInTime: 0n,
    checkOutTime: 0n,
    name: "Executive Sky Suite",
    roomType: "Suite",
    imageUrl: DEFAULT_ROOM_IMAGES.Suite,
    isActive: true,
  },
  {
    id: 3n,
    pricePerNight: ethers.parseEther("0.06"),
    totalPrice: 0n,
    status: 0,
    occupant: "0x0000000000000000000000000000000000000000",
    bookingTime: 0n,
    checkInTime: 0n,
    checkOutTime: 0n,
    name: "Presidential Royal Villa",
    roomType: "Penthouse",
    imageUrl: DEFAULT_ROOM_IMAGES.Penthouse,
    isActive: true,
  },
  {
    id: 4n,
    pricePerNight: ethers.parseEther("0.03"),
    totalPrice: 0n,
    status: 0,
    occupant: "0x0000000000000000000000000000000000000000",
    bookingTime: 0n,
    checkInTime: 0n,
    checkOutTime: 0n,
    name: "Sunset Panoramic Suite",
    roomType: "Suite",
    imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80",
    isActive: true,
  },
  {
    id: 5n,
    pricePerNight: ethers.parseEther("0.05"),
    totalPrice: 0n,
    status: 0,
    occupant: "0x0000000000000000000000000000000000000000",
    bookingTime: 0n,
    checkInTime: 0n,
    checkOutTime: 0n,
    name: "Private Garden Pool Villa",
    roomType: "Penthouse",
    imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop&q=80",
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
    return "Must send exactly 50% of the total booking price as deposit.";
  }
  if (raw.includes("user rejected") || raw.includes("User rejected") || raw.includes("ACTION_REJECTED")) {
    return "Transaction was cancelled in MetaMask.";
  }
  if (raw.includes("insufficient funds")) {
    return "Insufficient Sepolia ETH balance in your wallet to cover gas.";
  }
  if (raw.includes("Check-in time cannot be in the past")) {
    return "Selected check-in time cannot be in the past.";
  }
  if (raw.includes("Check-out time must be after check-in")) {
    return "Check-out time must be after the check-in time.";
  }
  if (raw.includes("Booking has not yet expired")) {
    return "This booking duration has not expired yet.";
  }
  if (raw.includes("missing revert data") || raw.includes("require(false)") || raw.includes("CALL_EXCEPTION")) {
    return "Action reverted: Permission denied or invalid booking parameters.";
  }

  return err.shortMessage || err.reason || err.message || "Transaction failed";
}

export interface TxMeta {
  title: string;
  methodName: string;
  roomCount?: number;
  savingsNote?: string;
}

export function useContract() {
  const { isConnected, isCorrectNetwork, refreshRole } = useWallet();
  const { addReceipt } = useGasTracker();

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
        pricePerNight: BigInt(r.pricePerNight || r.price || 0n),
        totalPrice: BigInt(r.totalPrice || 0n),
        status: Number(r.status),
        occupant: r.occupant as string,
        bookingTime: BigInt(r.bookingTime || 0n),
        checkInTime: BigInt(r.checkInTime || 0n),
        checkOutTime: BigInt(r.checkOutTime || 0n),
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

  // Execute transaction helper — dynamically requests fresh active signer
  const sendTx = useCallback(
    async (
      fn: (contract: ethers.Contract) => Promise<ethers.ContractTransactionResponse>,
      meta?: TxMeta
    ) => {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected. Please install MetaMask.");
      }
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error("Contract address is not configured yet. Please deploy the contract.");
      }
      setTxPending(true);
      setError(null);
      try {
        const liveProvider = new ethers.BrowserProvider(window.ethereum);
        const liveSigner = await liveProvider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, PREMIUM_HOTEL_ABI, liveSigner);
        const tx = await fn(contract);
        const receipt = await tx.wait();

        if (receipt) {
          const gasUsedBigInt = receipt.gasUsed ?? 0n;
          const gasPriceBigInt = receipt.gasPrice ?? 0n;
          const totalFeeWei = gasUsedBigInt * gasPriceBigInt;
          const totalFeeEth = ethers.formatEther(totalFeeWei);
          const gasPriceGwei = ethers.formatUnits(gasPriceBigInt, "gwei");

          addReceipt({
            title: meta?.title || "Contract Transaction",
            methodName: meta?.methodName || "contractCall",
            roomCount: meta?.roomCount || 1,
            gasUsed: gasUsedBigInt.toString(),
            effectiveGasPriceGwei: parseFloat(gasPriceGwei).toFixed(3),
            totalGasFeeEth: totalFeeEth,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? "success" : "reverted",
            savingsNote: meta?.savingsNote,
          });
        }

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
    [fetchRooms, refreshRole, addReceipt]
  );

  // ── Customer Functions ────────────────────────────────

  const bookRoom = useCallback(
    (roomId: bigint, checkInTimestamp: number, checkOutTimestamp: number, depositWei: bigint) => {
      return sendTx(
        (c) => c.bookRoom(roomId, checkInTimestamp, checkOutTimestamp, { value: depositWei }),
        {
          title: `Single Book Suite #${roomId.toString()}`,
          methodName: "bookRoom",
          roomCount: 1,
          savingsNote: "Standard individual suite booking on Sepolia",
        }
      );
    },
    [sendTx]
  );

  const bookRoomsBatch = useCallback(
    (
      roomIds: bigint[],
      checkInTimestamps: number[],
      checkOutTimestamps: number[],
      totalDepositWei: bigint
    ) => {
      return sendTx(
        (c) =>
          c.bookRoomsBatch(roomIds, checkInTimestamps, checkOutTimestamps, {
            value: totalDepositWei,
          }),
        {
          title: `Batch Book Suites (${roomIds.length} Rooms)`,
          methodName: "bookRoomsBatch",
          roomCount: roomIds.length,
          savingsNote: `Bundled ${roomIds.length} rooms into 1 transaction. Saved base 21,000 tx gas and contract call overhead!`,
        }
      );
    },
    [sendTx]
  );

  const cancelReservation = useCallback(
    (roomId: bigint) => {
      return sendTx((c) => c.cancelReservation(roomId), {
        title: `Cancel Reservation Suite #${roomId.toString()}`,
        methodName: "cancelReservation",
        roomCount: 1,
        savingsNote: "50% refund processed on-chain within 24h guaranteed window",
      });
    },
    [sendTx]
  );

  const payRemaining = useCallback(
    (roomId: bigint, remainingWei: bigint) => {
      return sendTx((c) => c.payRemaining(roomId, { value: remainingWei }), {
        title: `Single Pay Remaining Suite #${roomId.toString()}`,
        methodName: "payRemaining",
        roomCount: 1,
        savingsNote: "Single 50% remaining balance payment",
      });
    },
    [sendTx]
  );

  const payRemainingBatch = useCallback(
    (roomIds: bigint[], totalRemainingWei: bigint) => {
      return sendTx(
        (c) => c.payRemainingBatch(roomIds, { value: totalRemainingWei }),
        {
          title: `Batch Pay Remaining (${roomIds.length} Rooms)`,
          methodName: "payRemainingBatch",
          roomCount: roomIds.length,
          savingsNote: `Bundled remaining payment for ${roomIds.length} rooms in 1 atomic transaction!`,
        }
      );
    },
    [sendTx]
  );

  const checkoutRoom = useCallback(
    (roomId: bigint) => {
      return sendTx((c) => c.checkoutRoom(roomId), {
        title: `Self Check-Out Suite #${roomId.toString()}`,
        methodName: "checkoutRoom",
        roomCount: 1,
        savingsNote: "Released suite back to Available on-chain",
      });
    },
    [sendTx]
  );

  const checkoutRoomBatch = useCallback(
    (roomIds: bigint[]) => {
      return sendTx((c) => c.checkoutRoomBatch(roomIds), {
        title: `Batch Check-Out (${roomIds.length} Rooms)`,
        methodName: "checkoutRoomBatch",
        roomCount: roomIds.length,
        savingsNote: `Released ${roomIds.length} suites simultaneously in 1 transaction`,
      });
    },
    [sendTx]
  );

  const expireBooking = useCallback(
    (roomId: bigint) => {
      return sendTx((c) => c.expireBooking(roomId), {
        title: `Expire Booking Suite #${roomId.toString()}`,
        methodName: "expireBooking",
        roomCount: 1,
        savingsNote: "Released expired booking after checkout time passed",
      });
    },
    [sendTx]
  );

  // ── Staff & Key Unlock Functions ─────────────────────

  const confirmCheckIn = useCallback(
    (roomId: bigint) => {
      return sendTx((c) => c.confirmCheckIn(roomId), {
        title: `On-Chain Staff Check-In Suite #${roomId.toString()}`,
        methodName: "confirmCheckIn",
        roomCount: 1,
        savingsNote: "Recorded check-in state change on Sepolia",
      });
    },
    [sendTx]
  );

  /// Off-Chain EIP-191 Cryptographic Challenge Signing (0 Gas)
  const signDoorChallenge = useCallback(
    async (roomId: bigint, otp: string, timestamp: number): Promise<string> => {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected");
      }
      const liveProvider = new ethers.BrowserProvider(window.ethereum);
      const liveSigner = await liveProvider.getSigner();
      
      const message = `[SmartHotel IoT Lock]\nRoom ID: ${roomId.toString()}\nDynamic Door OTP: ${otp}\nTimestamp: ${timestamp}\nAction: UNLOCK_DOOR`;
      const signature = await liveSigner.signMessage(message);

      // Record off-chain 0 gas event for comparison
      addReceipt({
        title: `Digital Door OTP Unlock (Suite #${roomId.toString()})`,
        methodName: "EIP-191 personal_sign",
        roomCount: 1,
        gasUsed: "0",
        effectiveGasPriceGwei: "0",
        totalGasFeeEth: "0.000000",
        status: "success",
        isOffChain: true,
        savingsNote: "Zero Gas (100% Free) - Cryptographic signature verified off-chain by IoT Lock without mining",
      });

      return signature;
    },
    [addReceipt]
  );

  // ── Owner Functions ───────────────────────────────────

  const addRoom = useCallback(
    (pricePerNightEth: string, name: string, roomType: string, imageUrl: string) => {
      const priceWei = ethers.parseEther(pricePerNightEth);
      return sendTx((c) => c.addRoom(priceWei, name, roomType, imageUrl), {
        title: `Add New Room (${name})`,
        methodName: "addRoom",
        roomCount: 1,
      });
    },
    [sendTx]
  );

  const updateRoomPrice = useCallback(
    (roomId: bigint, newPriceEth: string) => {
      const priceWei = ethers.parseEther(newPriceEth);
      return sendTx((c) => c.updateRoomPrice(roomId, priceWei), {
        title: `Update Room #${roomId.toString()} Price`,
        methodName: "updateRoomPrice",
        roomCount: 1,
      });
    },
    [sendTx]
  );

  const updateRoomDetails = useCallback(
    (roomId: bigint, name: string, roomType: string, imageUrl: string) => {
      return sendTx((c) => c.updateRoomDetails(roomId, name, roomType, imageUrl), {
        title: `Update Room #${roomId.toString()} Details`,
        methodName: "updateRoomDetails",
        roomCount: 1,
      });
    },
    [sendTx]
  );

  const toggleRoomActive = useCallback(
    (roomId: bigint) => {
      return sendTx((c) => c.toggleRoomActive(roomId), {
        title: `Toggle Room #${roomId.toString()} Active`,
        methodName: "toggleRoomActive",
        roomCount: 1,
      });
    },
    [sendTx]
  );

  const forceResetRoom = useCallback(
    (roomId: bigint, refundOccupant: boolean) => {
      return sendTx((c) => c.forceResetRoom(roomId, refundOccupant), {
        title: `Force Reset Room #${roomId.toString()}`,
        methodName: "forceResetRoom",
        roomCount: 1,
      });
    },
    [sendTx]
  );

  const addReceptionist = useCallback(
    (address: string) => {
      const clean = ethers.getAddress(address.trim());
      return sendTx((c) => c.addReceptionist(clean), {
        title: `Add Receptionist (${clean.slice(0, 6)}...${clean.slice(-4)})`,
        methodName: "addReceptionist",
        roomCount: 1,
      });
    },
    [sendTx]
  );

  const removeReceptionist = useCallback(
    (address: string) => {
      const clean = ethers.getAddress(address.trim());
      return sendTx((c) => c.removeReceptionist(clean), {
        title: `Remove Receptionist (${clean.slice(0, 6)}...${clean.slice(-4)})`,
        methodName: "removeReceptionist",
        roomCount: 1,
      });
    },
    [sendTx]
  );

  const withdrawCustom = useCallback(
    (amountEth: string) => {
      const amountWei = ethers.parseEther(amountEth);
      return sendTx((c) => c.withdrawCustom(amountWei), {
        title: `Withdraw ${amountEth} ETH`,
        methodName: "withdrawCustom",
        roomCount: 1,
      });
    },
    [sendTx]
  );

  const withdrawFunds = useCallback(() => {
    return sendTx((c) => c.withdrawFunds(), {
      title: "Withdraw All Contract Funds",
      methodName: "withdrawFunds",
      roomCount: 1,
    });
  }, [sendTx]);

  return {
    rooms,
    receptionists,
    ownerAddress,
    contractBalance,
    loading,
    txPending,
    error,
    isDemoMode,
    isContractConfigured,
    fetchRooms,
    // Customer
    bookRoom,
    bookRoomsBatch,
    cancelReservation,
    payRemaining,
    payRemainingBatch,
    checkoutRoom,
    checkoutRoomBatch,
    expireBooking,
    // Staff & IoT Key
    confirmCheckIn,
    signDoorChallenge,
    // Owner
    addRoom,
    updateRoomPrice,
    updateRoomDetails,
    toggleRoomActive,
    forceResetRoom,
    addReceptionist,
    removeReceptionist,
    withdrawCustom,
    withdrawFunds,
  };
}
