import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { WalletProvider } from "@/hooks/useWallet";
import { CartProvider } from "@/hooks/useCart";
import { GasTrackerProvider } from "@/hooks/useGasTracker";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PremiumHotel — Blockchain Reservations",
  description: "Book hotel rooms on the Ethereum Sepolia testnet using MetaMask",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-slate-950 text-slate-100 min-h-screen antialiased`}>
        <WalletProvider>
          <GasTrackerProvider>
            <CartProvider>
              <Navbar />
              <main>{children}</main>
            </CartProvider>
          </GasTrackerProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
