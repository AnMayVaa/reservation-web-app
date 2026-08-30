// ============================================================
// Contract Configuration
// Fill NEXT_PUBLIC_CONTRACT_ADDRESS after deploying on Sepolia
// ============================================================

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ?? "0x0000000000000000000000000000000000000000";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const SEPOLIA_RPC_URL = "https://rpc.sepolia.org";

// Room status enum — must match Solidity enum order
export enum RoomStatus {
  Available = 0,
  Booked = 1,
  PaidWaitingForKey = 2,
  CheckedIn = 3,
}

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  [RoomStatus.Available]: "Available",
  [RoomStatus.Booked]: "Booked",
  [RoomStatus.PaidWaitingForKey]: "Paid — Awaiting Key",
  [RoomStatus.CheckedIn]: "Checked In",
};

export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  [RoomStatus.Available]: "bg-emerald-100 text-emerald-800 border-emerald-300",
  [RoomStatus.Booked]: "bg-amber-100 text-amber-800 border-amber-300",
  [RoomStatus.PaidWaitingForKey]: "bg-blue-100 text-blue-800 border-blue-300",
  [RoomStatus.CheckedIn]: "bg-purple-100 text-purple-800 border-purple-300",
};
