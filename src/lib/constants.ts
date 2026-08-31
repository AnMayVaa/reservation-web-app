// ============================================================
// Contract Configuration
// Deployed on Ethereum Sepolia Testnet
// ============================================================

const envAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export const CONTRACT_ADDRESS: `0x${string}` = (
  envAddress &&
  envAddress !== "0x0000000000000000000000000000000000000000" &&
  envAddress.startsWith("0x")
    ? envAddress
    : "0x435e26dfB8faeB30fdDEf888aeba681E130D8014"
) as `0x${string}`;

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

// Multi-RPC fallbacks for stable Sepolia connectivity
export const SEPOLIA_RPC_URLS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://rpc.sepolia.org",
  "https://rpc2.sepolia.org",
  "https://sepolia.gateway.tenderly.co",
];

export const SEPOLIA_RPC_URL = SEPOLIA_RPC_URLS[0];

// Room status enum — matches Solidity enum order
export enum RoomStatus {
  Available = 0,
  Booked = 1,
  PaidWaitingForKey = 2,
  CheckedIn = 3,
}

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  [RoomStatus.Available]: "Available",
  [RoomStatus.Booked]: "Booked (50% Paid)",
  [RoomStatus.PaidWaitingForKey]: "Paid (Awaiting Key)",
  [RoomStatus.CheckedIn]: "Checked In",
};

export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  [RoomStatus.Available]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  [RoomStatus.Booked]: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  [RoomStatus.PaidWaitingForKey]: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  [RoomStatus.CheckedIn]: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

export const DEFAULT_ROOM_IMAGES: Record<string, string> = {
  Deluxe: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80",
  Suite: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80",
  Penthouse: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80",
  Standard: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80",
};
