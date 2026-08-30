"use client";

import { useState, useMemo } from "react";
import { useContract, Room } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import RoomCard from "@/components/RoomCard";
import EditRoomModal from "@/components/Modals/EditRoomModal";

interface RoomGridProps {
  filterMode?: "all" | "available" | "my-bookings";
}

export default function RoomGrid({ filterMode = "all" }: RoomGridProps) {
  const { rooms, loading, updateRoomDetails, updateRoomPrice, txPending } = useContract();
  const { account } = useWallet();

  const [activeFilter, setActiveFilter] = useState<string>(filterMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // Status Filter
      if (activeFilter === "available" && (r.status !== 0 || !r.isActive)) return false;
      if (activeFilter === "booked" && r.status === 0) return false;
      if (
        activeFilter === "my-bookings" &&
        (!account || r.occupant.toLowerCase() !== account.toLowerCase())
      ) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesType = r.roomType.toLowerCase().includes(q);
        const matchesId = r.id.toString() === q;
        if (!matchesName && !matchesType && !matchesId) return false;
      }

      return true;
    });
  }, [rooms, activeFilter, searchQuery, account]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-96 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/60 border border-slate-800">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          {[
            { id: "all", label: "All Rooms" },
            { id: "available", label: "Available" },
            { id: "booked", label: "Booked" },
            { id: "my-bookings", label: "My Bookings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room name, suite..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400/80 text-white placeholder-slate-500 rounded-2xl px-4 py-2 text-xs outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl bg-slate-900/30 border border-slate-800/80">
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="text-base font-bold text-white">No rooms match your filter</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {activeFilter === "my-bookings"
              ? "You don't have any active room reservations under this connected wallet."
              : "Try adjusting your search query or selecting a different filter tab."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id.toString()}
              room={room}
              onEdit={(r) => setEditingRoom(r)}
            />
          ))}
        </div>
      )}

      {/* Edit Room Modal */}
      <EditRoomModal
        isOpen={!!editingRoom}
        room={editingRoom}
        onClose={() => setEditingRoom(null)}
        onUpdateDetails={updateRoomDetails}
        onUpdatePrice={updateRoomPrice}
        txPending={txPending}
      />
    </div>
  );
}
