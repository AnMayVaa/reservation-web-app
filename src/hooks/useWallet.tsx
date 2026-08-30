"use client";

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX, CONTRACT_ADDRESS, SEPOLIA_RPC_URL } from "@/lib/constants";
import { PREMIUM_HOTEL_ABI } from "@/lib/abi";

export type UserRole = "owner" | "receptionist" | "customer";

interface WalletState {
  account: string | null;
  role: UserRole;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToSepolia: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const WalletContext = createContext<WalletState>({} as WalletState);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("customer");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const isConnected = !!account;
  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  // Detect role from contract
  const detectRole = useCallback(async (addr: string) => {
    if (!addr || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setRole("customer");
      return;
    }
    try {
      const readProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PREMIUM_HOTEL_ABI, readProvider);
      
      const ownerAddr = await contract.owner();
      if (addr.toLowerCase() === ownerAddr.toLowerCase()) {
        setRole("owner");
        return;
      }

      const isRecep = await contract.isReceptionist(addr);
      if (isRecep) {
        setRole("receptionist");
        return;
      }
    } catch (e) {
      console.warn("Role detection error:", e);
    }
    setRole("customer");
  }, []);

  const refreshRole = useCallback(async () => {
    if (account) {
      await detectRole(account);
    }
  }, [account, detectRole]);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask browser extension.");
      return;
    }
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      const accounts: string[] = await prov.send("eth_requestAccounts", []);
      if (!accounts.length) return;

      const network = await prov.getNetwork();
      const cId = Number(network.chainId);
      setChainId(cId);

      const sign = await prov.getSigner();
      const addr = accounts[0];

      setProvider(prov);
      setSigner(sign);
      setAccount(addr);

      await detectRole(addr);
    } catch (err) {
      console.error("Connect wallet error:", err);
    }
  }, [detectRole]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setRole("customer");
    setProvider(null);
    setSigner(null);
    setChainId(null);
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (err: unknown) {
      if ((err as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    }
  }, []);

  // Listen for account/network changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || !accounts.length) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        detectRole(accounts[0]);
      }
    };

    const handleChain = (...args: unknown[]) => {
      const chainIdHex = args[0] as string;
      setChainId(parseInt(chainIdHex, 16));
    };

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccounts);
      window.ethereum?.removeListener("chainChanged", handleChain);
    };
  }, [detectRole, disconnect]);

  return (
    <WalletContext.Provider
      value={{
        account,
        role,
        isConnected,
        isCorrectNetwork,
        provider,
        signer,
        connect,
        disconnect,
        switchToSepolia,
        refreshRole,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
