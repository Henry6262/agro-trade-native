const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Deploy AgroEscrow to Polygon Amoy testnet
// Usage: PRIVATE_KEY=<key> node contracts/deploy.js

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Set PRIVATE_KEY environment variable");
  }

  // Polygon Amoy testnet RPC
  const rpcUrl = process.env.RPC_URL || "https://rpc-amoy.polygon.technology";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Deploying from: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} MATIC`);

  // Read compiled ABI and bytecode (requires compilation first)
  // For now, provide instructions
  console.log("\n📋 To deploy AgroEscrow.sol:");
  console.log("1. Install Hardhat: npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox");
  console.log("2. Run: npx hardhat compile");
  console.log("3. Set PRIVATE_KEY and RPC_URL env vars");
  console.log("4. Run: npx hardhat run contracts/deploy.js --network amoy");
  console.log("\nOr use Remix IDE (remix.ethereum.org) to deploy directly.");
}

main().catch(console.error);
