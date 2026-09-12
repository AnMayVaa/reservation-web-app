"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface GasReceipt {
  id: string;
  title: string;
  methodName: string;
  roomCount: number;
  gasUsed: string; // String representation of BigInt
  effectiveGasPriceGwei: string;
  totalGasFeeEth: string;
  txHash?: string;
  timestamp: number;
  blockNumber?: number;
  status: "success" | "reverted";
  savingsNote?: string;
  isOffChain?: boolean;
}

interface GasTrackerContextType {
  receipts: GasReceipt[];
  latestReceipt: GasReceipt | null;
  addReceipt: (receipt: Omit<GasReceipt, "id" | "timestamp">) => void;
  clearReceipts: () => void;
  dismissLatestReceipt: () => void;
  isTrackerOpen: boolean;
  setIsTrackerOpen: (open: boolean) => void;
}

const STORAGE_KEY = "premium_hotel_gas_history_v1";

const GasTrackerContext = createContext<GasTrackerContextType | undefined>(undefined);

export function GasTrackerProvider({ children }: { children: React.ReactNode }) {
  const [receipts, setReceipts] = useState<GasReceipt[]>([]);
  const [latestReceipt, setLatestReceipt] = useState<GasReceipt | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setReceipts(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load gas receipts from localStorage:", e);
    }
  }, []);

  // Save to localStorage whenever receipts change
  const saveToStorage = (updated: GasReceipt[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save gas receipts to localStorage:", e);
    }
  };

  const addReceipt = (receiptData: Omit<GasReceipt, "id" | "timestamp">) => {
    const newReceipt: GasReceipt = {
      ...receiptData,
      id: "gas-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      timestamp: Date.now(),
    };

    setReceipts((prev) => {
      const updated = [newReceipt, ...prev];
      saveToStorage(updated);
      return updated;
    });

    setLatestReceipt(newReceipt);
  };

  const clearReceipts = () => {
    setReceipts([]);
    setLatestReceipt(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear receipts in localStorage:", e);
    }
  };

  const dismissLatestReceipt = () => {
    setLatestReceipt(null);
  };

  return (
    <GasTrackerContext.Provider
      value={{
        receipts,
        latestReceipt,
        addReceipt,
        clearReceipts,
        dismissLatestReceipt,
        isTrackerOpen,
        setIsTrackerOpen,
      }}
    >
      {children}
    </GasTrackerContext.Provider>
  );
}

export function useGasTracker() {
  const context = useContext(GasTrackerContext);
  if (!context) {
    throw new Error("useGasTracker must be used within a GasTrackerProvider");
  }
  return context;
}
