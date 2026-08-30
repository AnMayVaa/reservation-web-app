"use client";

import { useContract, Room } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import RoomGrid from "@/components/RoomGrid";
import OwnerPanel from "@/components/OwnerPanel";
import ReceptionistPanel from "@/components/ReceptionistPanel";

export default function Home() {
  const { role, isConnected, isCorrectNetwork, connect, switchToSepolia } = useWallet();
  const { rooms, loading } = useContract();

  const available = rooms.filter((r: Room) => r.status === 0).length;
  const booked = rooms.filter((r: Room) => r.status !== 0).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* Hero */}
      <section className="text-center space-y-3 py-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          🏨 PremiumHotel
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Transparent hotel reservations powered by{" "}
          <span className="text-amber-400 font-semibold">Ethereum</span> on the Sepolia testnet.
        </p>

        {/* CTA if not connected */}
        {!isConnected && (
          <button
            onClick={connect}
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-2xl shadow-lg shadow-amber-900/30 transition-all active:scale-95"
          >
            Connect MetaMask to Get Started
          </button>
        )}
        {isConnected && !isCorrectNetwork && (
          <button
            onClick={switchToSepolia}
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all"
          >
            ⚠️ Switch to Sepolia Testnet
          </button>
        )}
      </section>

      {/* Stats bar */}
      {!loading && rooms.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Rooms" value={rooms.length} color="text-slate-300" />
          <StatCard label="Available" value={available} color="text-emerald-400" />
          <StatCard label="Occupied" value={booked} color="text-amber-400" />
        </div>
      )}

      {/* Room Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">All Rooms</h2>
          <span className="text-xs text-slate-500 italic">Auto-refreshes every 8s</span>
        </div>
        <RoomGrid />
      </section>

      {/* Admin Panels (role-gated) */}
      {isConnected && isCorrectNetwork && (
        <section className="space-y-6">
          {role === "owner" && <OwnerPanel />}
          {(role === "receptionist" || role === "owner") && <ReceptionistPanel />}
        </section>
      )}

      {/* How it works */}
      <section className="border border-slate-800 rounded-2xl p-6 space-y-4 bg-slate-900/50">
        <h2 className="text-lg font-bold text-white">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            { step: "1", icon: "🦊", title: "Connect Wallet", desc: "Connect MetaMask on Sepolia testnet" },
            { step: "2", icon: "💸", title: "Book & Deposit", desc: "Pay 50% deposit (0.05 ETH) to reserve your room" },
            { step: "3", icon: "✅", title: "Pay Remaining", desc: "Pay the remaining 50% before check-in" },
            { step: "4", icon: "🔑", title: "Check In", desc: "Reception confirms key handover on-chain" },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-white font-semibold">{item.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-slate-600 text-xs pb-6">
        PremiumHotel Smart Contract · Sepolia Testnet ·{" "}
        <a
          href="https://sepolia.etherscan.io"
          className="hover:text-slate-400 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Etherscan
        </a>
      </footer>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </div>
  );
}
