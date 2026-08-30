"use client";

import { useState } from "react";
import { DEFAULT_ROOM_IMAGES } from "@/lib/constants";

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (priceEth: string, name: string, roomType: string, imageUrl: string) => Promise<void>;
  txPending: boolean;
}

export default function AddRoomModal({ isOpen, onClose, onAdd, txPending }: AddRoomModalProps) {
  const [name, setName] = useState("");
  const [priceEth, setPriceEth] = useState("0.05");
  const [roomType, setRoomType] = useState("Deluxe");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a room name");
      return;
    }
    if (parseFloat(priceEth) <= 0 || isNaN(parseFloat(priceEth))) {
      setError("Please enter a valid price greater than 0");
      return;
    }
    setError(null);
    try {
      const finalImage = imageUrl.trim() || DEFAULT_ROOM_IMAGES[roomType] || DEFAULT_ROOM_IMAGES.Standard;
      await onAdd(priceEth, name.trim(), roomType, finalImage);
      setName("");
      setPriceEth("0.05");
      setImageUrl("");
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to add room");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold">
              ✨
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Hotel Room</h2>
              <p className="text-xs text-slate-400">Deploy room metadata on-chain</p>
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
              placeholder="e.g. Ocean View Deluxe"
              className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
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
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer"
              >
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Price (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={priceEth}
                onChange={(e) => setPriceEth(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Leave blank to use the high-res luxury default image for {roomType}.
            </p>
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
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              {txPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Room on Chain"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
