"use client";

import { useContract, Room } from "@/hooks/useContract";
import RoomCard from "@/components/RoomCard";

export default function RoomGrid() {
  const { rooms, loading } = useContract();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-72 rounded-2xl bg-slate-800 border border-slate-700" />
        ))}
      </div>
    );
  }

  if (!rooms.length) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-4xl mb-4">🏗️</p>
        <p className="font-medium">No rooms found.</p>
        <p className="text-sm mt-1">Make sure the contract address is set correctly.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room: Room) => (
        <RoomCard key={room.id.toString()} room={room} />
      ))}
    </div>
  );
}
