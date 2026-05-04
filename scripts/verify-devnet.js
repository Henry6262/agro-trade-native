#!/usr/bin/env node
/**
 * Verify local devnet deployment
 * Usage: node scripts/verify-devnet.js
 */

const { ethers } = require("ethers");

const RPC = "http://127.0.0.1:8545";
const ESCROW = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44";
const CUSD = "0x59b670e9fa9d0a427751af201d676719a970857b";
const ADMIN = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function symbol() view returns (string)",
];

const ESCROW_ABI = [
  "function admin() view returns (address)",
  "function cusdToken() view returns (address)",
  "function getEscrow(bytes32) view returns (address buyer, address seller, uint256 amount, uint8 status)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const block = await provider.getBlockNumber();
  console.log(`✅ RPC connected — Block ${block}`);

  const cusd = new ethers.Contract(CUSD, ERC20_ABI, provider);
  const symbol = await cusd.symbol();
  const supply = await cusd.totalSupply();
  const adminBal = await cusd.balanceOf(ADMIN);
  console.log(`✅ ${symbol} — Total supply: ${ethers.formatUnits(supply, 18)}`);
  console.log(`✅ Admin balance: ${ethers.formatUnits(adminBal, 18)} ${symbol}`);

  const escrow = new ethers.Contract(ESCROW, ESCROW_ABI, provider);
  const escrowAdmin = await escrow.admin();
  const token = await escrow.cusdToken();
  console.log(`✅ Escrow admin: ${escrowAdmin}`);
  console.log(`✅ Escrow token: ${token}`);

  const match = escrowAdmin.toLowerCase() === ADMIN.toLowerCase();
  console.log(match ? "\n🟢 All checks passed. Devnet ready." : "\n🔴 Admin mismatch!");
}

main().catch(console.error);
