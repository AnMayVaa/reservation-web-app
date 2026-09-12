"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from "react";
import { Room } from "@/hooks/useContract";

export interface CartItem {
  room: Room;
  checkIn: string;  // Format: "YYYY-MM-DDTHH:mm"
  checkOut: string; // Format: "YYYY-MM-DDTHH:mm"
  nights: number;
  totalPriceWei: bigint;
  depositWei: bigint;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (room: Room, checkIn?: string, checkOut?: string) => void;
  removeFromCart: (roomId: bigint) => void;
  updateItemDates: (roomId: bigint, checkIn: string, checkOut: string) => void;
  clearCart: () => void;
  isInCart: (roomId: bigint) => boolean;
  totalRooms: number;
  totalNights: number;
  totalCostWei: bigint;
  totalDepositWei: bigint;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

function calculateNightsAndCost(checkIn: string, checkOut: string, pricePerNight: bigint) {
  const startMs = new Date(checkIn).getTime();
  const endMs = new Date(checkOut).getTime();
  const durationMs = Math.max(endMs - startMs, 86400000);
  const nights = Math.max(1, Math.ceil(durationMs / 86400000));
  const totalPriceWei = BigInt(nights) * pricePerNight;
  const depositWei = totalPriceWei / 2n;
  return { nights, totalPriceWei, depositWei };
}

function getDefaultDates() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const checkIn = now.toISOString().slice(0, 16);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
  const checkOut = tomorrow.toISOString().slice(0, 16);

  return { checkIn, checkOut };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("premiumhotel_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Revive BigInts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const revived: CartItem[] = parsed.map((item: any) => ({
          ...item,
          room: {
            ...item.room,
            id: BigInt(item.room.id),
            pricePerNight: BigInt(item.room.pricePerNight),
            totalPrice: BigInt(item.room.totalPrice || 0),
            bookingTime: BigInt(item.room.bookingTime || 0),
            checkInTime: BigInt(item.room.checkInTime || 0),
            checkOutTime: BigInt(item.room.checkOutTime || 0),
          },
          totalPriceWei: BigInt(item.totalPriceWei),
          depositWei: BigInt(item.depositWei),
        }));
        setItems(revived);
      }
    } catch (e) {
      console.warn("Could not load cart from localStorage", e);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    try {
      const serialized = items.map((item) => ({
        ...item,
        room: {
          ...item.room,
          id: item.room.id.toString(),
          pricePerNight: item.room.pricePerNight.toString(),
          totalPrice: item.room.totalPrice.toString(),
          bookingTime: item.room.bookingTime.toString(),
          checkInTime: item.room.checkInTime.toString(),
          checkOutTime: item.room.checkOutTime.toString(),
        },
        totalPriceWei: item.totalPriceWei.toString(),
        depositWei: item.depositWei.toString(),
      }));
      localStorage.setItem("premiumhotel_cart", JSON.stringify(serialized));
    } catch (e) {
      console.warn("Could not save cart to localStorage", e);
    }
  }, [items]);

  const addToCart = useCallback((room: Room, checkIn?: string, checkOut?: string) => {
    setItems((prev) => {
      const exists = prev.find((item) => item.room.id === room.id);
      if (exists) {
        return prev;
      }

      const defaults = getDefaultDates();
      const inDate = checkIn || defaults.checkIn;
      const outDate = checkOut || defaults.checkOut;
      const { nights, totalPriceWei, depositWei } = calculateNightsAndCost(inDate, outDate, room.pricePerNight);

      return [
        ...prev,
        {
          room,
          checkIn: inDate,
          checkOut: outDate,
          nights,
          totalPriceWei,
          depositWei,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((roomId: bigint) => {
    setItems((prev) => prev.filter((item) => item.room.id !== roomId));
  }, []);

  const updateItemDates = useCallback((roomId: bigint, checkIn: string, checkOut: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.room.id !== roomId) return item;
        const { nights, totalPriceWei, depositWei } = calculateNightsAndCost(checkIn, checkOut, item.room.pricePerNight);
        return {
          ...item,
          checkIn,
          checkOut,
          nights,
          totalPriceWei,
          depositWei,
        };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (roomId: bigint) => items.some((item) => item.room.id === roomId),
    [items]
  );

  const { totalCostWei, totalDepositWei, totalNights } = useMemo(() => {
    let cost = 0n;
    let dep = 0n;
    let nightsCount = 0;
    for (const item of items) {
      cost += item.totalPriceWei;
      dep += item.depositWei;
      nightsCount += item.nights;
    }
    return {
      totalCostWei: cost,
      totalDepositWei: dep,
      totalNights: nightsCount,
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateItemDates,
        clearCart,
        isInCart,
        totalRooms: items.length,
        totalNights,
        totalCostWei,
        totalDepositWei,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
