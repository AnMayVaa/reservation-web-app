"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Room } from "@/hooks/useContract";

interface EditRoomModalProps {
  isOpen: boolean;
  room: Room | null;
  onClose: () => void;
  onUpdateDetails: (roomId: bigint, name: string, roomType: string, imageUrl: string) => Promise<void>;
  onUpdatePrice: (roomId: bigint, newPriceEth: string) => Promise<void>;
  txPending: boolean;
}

export default function EditRoomModal({
  isOpen,
  room,
  onClose,
  onUpdateDetails,
  onUpdatePrice,
  txPending,
}: EditRoomModalProps) {
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState("Deluxe");
  const [priceEth, setPriceEth] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (room) {
      setName(room.name);
      setRoomType(room.roomType);
      setPriceEth(ethers.formatEther(room.pricePerNight));
      setImageUrl(room.imageUrl);
    }
  }, [room]);

  if (!isOpen || !room) return null;

  const isAvailable = room.status === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // If price changed and room is available
      const currentPriceEth = ethers.formatEther(room!.pricePerNight);
      if (priceEth !== currentPriceEth && isAvailable) {
        await onUpdatePrice(room!.id, priceEth);
      }
      
      // Update details
      await onUpdateDetails(room!.id, name.trim(), roomType, imageUrl.trim());
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to update room");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-bold">
              ✏️
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Room {room.id.toString()}</h2>
              <p className="text-xs text-slate-400">Update pricing and metadata on-chain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer"
              >
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Price (ETH) {isAvailable ? "" : "(Locked - Occupied)"}
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                disabled={!isAvailable}
                value={priceEth}
                onChange={(e) => setPriceEth(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={txPending}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={txPending}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              {txPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
