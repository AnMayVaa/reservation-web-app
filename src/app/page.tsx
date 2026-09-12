"use client";

import { useContract, Room } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import RoomGrid from "@/components/RoomGrid";
import OwnerPanel from "@/components/OwnerPanel";
import ReceptionistPanel from "@/components/ReceptionistPanel";
import FloatingCartBar from "@/components/Cart/FloatingCartBar";
import CartModal from "@/components/Cart/CartModal";

export default function Home() {
  const { role, isConnected, isCorrectNetwork, connect, switchToSepolia } = useWallet();
  const { rooms, isDemoMode, isContractConfigured } = useContract();

  const activeRooms = rooms.filter((r: Room) => r.isActive);
  const availableCount = activeRooms.filter((r: Room) => r.status === 0).length;
  const bookedCount = activeRooms.filter((r: Room) => r.status !== 0).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 sm:space-y-12">
      
      {/* Contract Configuration Alert Banner */}
      {!isContractConfigured && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                Ready for Smart Contract Deployment
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Currently displaying initial preview rooms. Run <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-[11px]">npm run deploy:sepolia</code> and paste the address into <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-[11px]">src/lib/constants.ts</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="text-center space-y-4 py-4 sm:py-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400 shadow-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Web3 Luxury Hotel Reservations
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Reserve Luxury Suites <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            Directly on Blockchain
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Transparent 2-step bookings with a 50% deposit, smart-contract guaranteed 24-hour refunds, and decentralized front desk verification.
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {!isConnected ? (
            <button
              onClick={connect}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              Connect MetaMask to Book
            </button>
          ) : !isCorrectNetwork ? (
            <button
              onClick={switchToSepolia}
              className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-rose-600/20 transition-all cursor-pointer"
            >
              ⚠️ Switch to Sepolia Testnet
            </button>
          ) : null}
        </div>
      </section>

      {/* Real-Time Stats Counters */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6">
        <StatCard
          label="Total Suites"
          value={activeRooms.length}
          color="text-white"
          icon="🏨"
        />
        <StatCard
          label="Available Now"
          value={availableCount}
          color="text-emerald-400"
          icon="✨"
        />
        <StatCard
          label="Active Bookings"
          value={bookedCount}
          color="text-amber-400"
          icon="🧳"
        />
      </div>

      {/* Role-Gated Admin Suites (Strict Visibility) */}
      {isConnected && isCorrectNetwork && (
        <section className="space-y-8">
          {/* OWNER VIEW: Full financial & staff suite */}
          {role === "owner" && <OwnerPanel />}

          {/* RECEPTIONIST & OWNER VIEW: Front Desk Operations */}
          {(role === "receptionist" || role === "owner") && (
            <ReceptionistPanel />
          )}
        </section>
      )}

      {/* Main Room Explorer */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Featured Rooms & Suites
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live blockchain inventory updated in real-time
            </p>
          </div>
        </div>

        <RoomGrid />
      </section>

      {/* Workflow Explainer */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">How On-Chain Reservation Works</h3>
          <p className="text-xs text-slate-400 mt-0.5">Four simple transparent steps powered by Solidity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              icon: "🦊",
              title: "Connect Wallet",
              desc: "Connect your MetaMask wallet on the Ethereum Sepolia testnet.",
            },
            {
              step: "02",
              icon: "💸",
              title: "50% Deposit",
              desc: "Lock in your room by paying 50% deposit. Refundable within 24 hours.",
            },
            {
              step: "03",
              icon: "💳",
              title: "Pay Remaining",
              desc: "Pay the remaining 50% balance before visiting the front desk.",
            },
            {
              step: "04",
              icon: "🔑",
              title: "Check-In",
              desc: "Front desk confirms key handover on-chain, granting your room access.",
            },
          ].map((card) => (
            <div
              key={card.step}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-[11px] font-mono font-bold text-slate-500">{card.step}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{card.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-900 space-y-2">
        <p>PremiumHotel Smart Contract · Sepolia Testnet · ERC-Solidity 0.8.20</p>
        <p className="text-[11px] text-slate-600">Built with Next.js 14, Tailwind CSS, Hardhat & ethers.js v6</p>
      </footer>

      {/* Floating Cart Bar & Batch Checkout Modal */}
      <FloatingCartBar />
      <CartModal />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <p className={`text-2xl sm:text-4xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
