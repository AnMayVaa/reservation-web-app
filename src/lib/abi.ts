// ABI for PremiumHotel smart contract
// Generated from Solidity source (pragma ^0.8.20)

export const PREMIUM_HOTEL_ABI = [
  // ── Read functions ────────────────────────────────────────
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "receptionist",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "totalRooms",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "rooms",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "occupant", type: "address" },
      { name: "bookingTime", type: "uint256" },
    ],
  },
  {
    name: "getRoomDetails",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_roomId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "occupant", type: "address" },
          { name: "bookingTime", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getAllRooms",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "occupant", type: "address" },
          { name: "bookingTime", type: "uint256" },
        ],
      },
    ],
  },
  // ── Customer write functions ──────────────────────────────
  {
    name: "bookRoom",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_roomId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelReservation",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_roomId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "payRemaining",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_roomId", type: "uint256" }],
    outputs: [],
  },
  // ── Owner / Receptionist write functions ─────────────────
  {
    name: "setReceptionist",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_receptionist", type: "address" }],
    outputs: [],
  },
  {
    name: "confirmCheckIn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_roomId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "checkoutRoom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_roomId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "withdrawFunds",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;
