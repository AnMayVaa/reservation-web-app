import { ethers, run } from "hardhat";

async function main() {
  console.log("🚀 Deploying PremiumHotel to Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📬 Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  const PremiumHotel = await ethers.getContractFactory("PremiumHotel");
  console.log("⏳ Sending deploy transaction...");
  const hotel = await PremiumHotel.deploy();

  await hotel.waitForDeployment();

  const address = await hotel.getAddress();
  console.log("✅ PremiumHotel deployed to:", address);
  console.log("\n────────────────────────────────────────────");
  console.log("📋 Next steps:");
  console.log(`   1. Copy this address: ${address}`);
  console.log("   2. Create .env.local in this folder:");
  console.log(`      NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log("   3. Set the same variable in Vercel → Settings → Environment Variables");
  console.log("────────────────────────────────────────────\n");

  // Auto-verify on Etherscan if API key is set
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("⏳ Waiting 30s for Etherscan to index the contract...");
    await new Promise((r) => setTimeout(r, 30000));
    try {
      await run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan!");
      console.log(`   🔗 https://sepolia.etherscan.io/address/${address}#code`);
    } catch (e: unknown) {
      const msg = (e as Error).message ?? String(e);
      if (msg.includes("Already Verified")) {
        console.log("✅ Contract already verified on Etherscan.");
      } else {
        console.log("⚠️  Etherscan verification failed:", msg);
      }
    }
  } else {
    console.log("ℹ️  No ETHERSCAN_API_KEY — skipping auto-verification.");
    console.log(`   Verify manually: https://sepolia.etherscan.io/address/${address}`);
  }
}

main().catch((error) => {
  console.error("❌ Deploy failed:", error);
  process.exitCode = 1;
});
