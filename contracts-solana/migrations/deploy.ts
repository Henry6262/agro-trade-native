/**
 * AgroEscrow Solana — Devnet deploy migration.
 *
 * Usage:
 *   anchor migrate --provider.cluster devnet
 *
 * Prerequisites:
 *   1. solana-keygen new (if no ~/.config/solana/id.json)
 *   2. solana airdrop 2 --url devnet
 *   3. anchor build  (generates program keypair in target/deploy/)
 *   4. Update Anchor.toml [programs.devnet] with the generated program ID
 */
import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);

  const program = anchor.workspace.AgroEscrow;

  // Derive config PDA
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Program ID:", program.programId.toBase58());
  console.log("Config PDA:", configPda.toBase58());
  console.log("Admin:", provider.wallet.publicKey.toBase58());

  // Initialize config with deployer as admin
  try {
    await program.methods
      .initialize()
      .accounts({
        config: configPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Config initialized successfully.");
  } catch (e: any) {
    if (e.toString().includes("already in use")) {
      console.log("Config already initialized — skipping.");
    } else {
      throw e;
    }
  }

  console.log("\nDeployment complete.");
  console.log("─────────────────────────────────────────────");
  console.log("USDC Devnet Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
  console.log("USDC Mainnet Mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  console.log("─────────────────────────────────────────────");
};
