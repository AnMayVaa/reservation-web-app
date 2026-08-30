# 🏨 PremiumHotel — Blockchain Reservation Web App

A **Next.js 14** frontend for the `PremiumHotel` Solidity smart contract deployed on the **Ethereum Sepolia testnet**.  
Payments are handled via **MetaMask**. Deploy instantly on **Vercel**.

---

## ✨ Features

- 🦊 **MetaMask integration** — connect, auto-switch to Sepolia
- 🛏 **Room grid** — live status polling every 8 seconds
- 💸 **2-step payment** — 50% deposit on booking + 50% before check-in
- ⏰ **24h cancellation window** — countdown shown on room card
- 👑 **Owner panel** — set receptionist, withdraw funds
- 🔑 **Receptionist panel** — confirm check-in & checkout
- 🌙 **Dark theme** — sleek slate/amber design

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/AnMayVaa/reservation-web-app.git
cd reservation-web-app
npm install
```

### 2. Deploy the smart contract (No Remix Needed!)

Create `.env.deploy` file in `reservation-web-app`:
```bash
cp .env.deploy.example .env.deploy
```
Fill in your keys in `.env.deploy`:
```env
PRIVATE_KEY=your_metamask_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key_here # optional
```

Deploy directly from terminal:
```bash
npm run deploy:sepolia
```
*The script will print the deployed contract address and automatically verify the contract on Etherscan.*

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy on Vercel

1. Push to GitHub ✅ (already done)
2. Go to [vercel.com](https://vercel.com) → **New Project** → import `reservation-web-app`
3. Add Environment Variable:
   - Key: `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - Value: your Sepolia contract address
4. Click **Deploy** 🚀

---

## 🧩 Smart Contract Roles

| Role | What they can do |
|------|-----------------|
| **Customer** | Book room (50% deposit), pay remaining 50%, cancel |
| **Receptionist** | Confirm check-in, confirm checkout |
| **Owner** | Set receptionist address, withdraw all funds |

Role is **auto-detected** by comparing the connected wallet address to the contract's `owner` and `receptionist` values.

---

## 🛠 Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v4 |
| Blockchain | ethers.js v6 |
| Wallet | MetaMask |
| Network | Sepolia Testnet |
| Deployment | Vercel |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout + WalletProvider
│   ├── page.tsx         # Home page
│   └── globals.css
├── components/
│   ├── Navbar.tsx
│   ├── RoomCard.tsx
│   ├── RoomGrid.tsx
│   ├── StatusBadge.tsx
│   ├── WalletButton.tsx
│   ├── OwnerPanel.tsx
│   └── ReceptionistPanel.tsx
├── hooks/
│   ├── useWallet.ts     # MetaMask connection + role detection
│   └── useContract.ts   # Contract reads/writes via ethers.js
└── lib/
    ├── abi.ts           # Contract ABI
    └── constants.ts     # Chain ID, contract address, enums
```
