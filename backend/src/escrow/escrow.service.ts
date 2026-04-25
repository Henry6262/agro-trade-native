import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import * as ethers from "ethers";
import { createHash } from "crypto";

export type EscrowChain = "CELO" | "SOLANA";

export interface EscrowStatus {
  tradeOperationId: string;
  buyer: string;
  seller: string;
  state: string;
  tradeId: string;
  chain: EscrowChain;
  amount?: string;
  [key: string]: any;
}

/**
 * Shared interface for blockchain-specific escrow implementations.
 * Using composition to separate chain logic from business coordination.
 */
export interface IEscrowEngine {
  createEscrow(tradeOperationId: string, sellerAddress: string, amount: string): Promise<{ txHash: string }>;
  releaseFunds(tradeOperationId: string): Promise<{ txHash: string }>;
  raiseDispute(tradeOperationId: string): Promise<{ txHash: string }>;
  resolveDispute(tradeOperationId: string, releaseToBuyer: boolean): Promise<{ txHash: string }>;
  refund(tradeOperationId: string): Promise<{ txHash: string }>;
  getStatus(tradeOperationId: string): Promise<EscrowStatus>;
  isConfigured(): boolean;
}

/**
 * Celo Implementation using Ethers
 */
class CeloEscrowEngine implements IEscrowEngine {
  private readonly logger = new Logger(CeloEscrowEngine.name);
  private readonly states = ["AWAITING_PAYMENT", "AWAITING_DELIVERY", "COMPLETE", "DISPUTED", "REFUNDED"];

  constructor(
    private readonly config: {
      contractAddress: string;
      rpcUrl: string;
      privateKey: string;
      cusdAddress: string;
    },
    private readonly prisma: PrismaService,
  ) {}

  isConfigured(): boolean {
    return !!(this.config.contractAddress && this.config.rpcUrl && this.config.privateKey);
  }

  private async getContract() {
    if (!this.isConfigured()) throw new Error("Celo config missing");
    const provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    const wallet = new ethers.Wallet(this.config.privateKey, provider);
    const abi = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function createEscrow(bytes32 key, address seller, string calldata tradeId, uint256 amount) external",
      "function releaseFunds(bytes32 key) external",
      "function raiseDispute(bytes32 key) external",
      "function resolveDispute(bytes32 key, bool releaseToBuyer) external",
      "function refund(bytes32 key) external",
      "function getEscrow(bytes32 key) external view returns (address buyer, address seller, uint256 amount, uint8 state, string tradeId)",
    ];
    return new ethers.Contract(this.config.contractAddress, abi, wallet);
  }

  private async getCusdContract() {
    const provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    const wallet = new ethers.Wallet(this.config.privateKey, provider);
    const abi = ["function approve(address spender, uint256 amount) external returns (bool)"];
    return new ethers.Contract(this.config.cusdAddress, abi, wallet);
  }

  async createEscrow(tradeOperationId: string, sellerAddress: string, amount: string) {
    const escrowContract = await this.getContract();
    const cusdContract = await this.getCusdContract();
    const key = ethers.id(tradeOperationId);
    const amountWei = ethers.parseUnits(amount, 18);

    const approveTx = await cusdContract.approve(this.config.contractAddress, amountWei);
    await approveTx.wait();

    const tx = await escrowContract.createEscrow(key, sellerAddress, tradeOperationId, amountWei);
    await tx.wait();

    await this.prisma.tradeEvent.create({
      data: {
        tradeOperationId,
        eventType: "PAYMENT_ESCROWED",
        actorRole: "ADMIN",
        blockchainTxHash: tx.hash,
        metadata: { amount, chain: "CELO" },
      },
    });

    return { txHash: tx.hash };
  }

  async releaseFunds(tradeOperationId: string) {
    const contract = await this.getContract();
    const key = ethers.id(tradeOperationId);
    const tx = await contract.releaseFunds(key);
    await tx.wait();

    await this.prisma.tradeEvent.create({
      data: {
        tradeOperationId,
        eventType: "PAYMENT_RELEASED",
        actorRole: "ADMIN",
        blockchainTxHash: tx.hash,
        metadata: { chain: "CELO" },
      },
    });

    return { txHash: tx.hash };
  }

  async raiseDispute(tradeOperationId: string) {
    const contract = await this.getContract();
    const key = ethers.id(tradeOperationId);
    const tx = await contract.raiseDispute(key);
    await tx.wait();

    await this.prisma.tradeEvent.create({
      data: {
        tradeOperationId,
        eventType: "DISPUTE_RAISED",
        actorRole: "ADMIN",
        blockchainTxHash: tx.hash,
        metadata: { chain: "CELO" },
      },
    });

    return { txHash: tx.hash };
  }

  async resolveDispute(tradeOperationId: string, releaseToBuyer: boolean) {
    const contract = await this.getContract();
    const key = ethers.id(tradeOperationId);
    const tx = await contract.resolveDispute(key, releaseToBuyer);
    await tx.wait();

    await this.prisma.tradeEvent.create({
      data: {
        tradeOperationId,
        eventType: "PAYMENT_RELEASED",
        actorRole: "ADMIN",
        blockchainTxHash: tx.hash,
        metadata: { chain: "CELO", resolvedToBuyer: releaseToBuyer },
      },
    });

    return { txHash: tx.hash };
  }

  async refund(tradeOperationId: string) {
    const contract = await this.getContract();
    const key = ethers.id(tradeOperationId);
    const tx = await contract.refund(key);
    await tx.wait();

    await this.prisma.tradeEvent.create({
      data: {
        tradeOperationId,
        eventType: "PAYMENT_REFUNDED",
        actorRole: "ADMIN",
        blockchainTxHash: tx.hash,
        metadata: { chain: "CELO" },
      },
    });

    return { txHash: tx.hash };
  }

  async getStatus(tradeOperationId: string): Promise<EscrowStatus> {
    const contract = await this.getContract();
    const key = ethers.id(tradeOperationId);
    const result = await contract.getEscrow(key);

    return {
      tradeOperationId,
      buyer: result[0],
      seller: result[1],
      amount: result[2].toString(),
      state: this.states[Number(result[3])] ?? "UNKNOWN",
      tradeId: result[4],
      chain: "CELO",
    };
  }
}

/**
 * Solana Implementation using @solana/web3.js
 */
class SolanaEscrowEngine implements IEscrowEngine {
  private readonly logger = new Logger(SolanaEscrowEngine.name);
  private readonly states = ["AWAITING_PAYMENT", "AWAITING_DELIVERY", "COMPLETE", "DISPUTED", "REFUNDED"];

  constructor(
    private readonly config: {
      programId: string;
      rpcUrl: string;
      privateKey: string;
      usdcMint: string;
    },
    private readonly prisma: PrismaService,
  ) {}

  isConfigured(): boolean {
    return !!(this.config.rpcUrl && this.config.privateKey && this.config.programId && this.config.usdcMint);
  }

  private async getConnection() {
    const { Connection } = await import("@solana/web3.js");
    return new Connection(this.config.rpcUrl, "confirmed");
  }

  private isDryRun(): boolean {
    return this.config.privateKey === "DRY_RUN" || !this.config.privateKey;
  }

  private async getAdminKeypair() {
    if (this.isDryRun()) return null;
    const { Keypair } = await import("@solana/web3.js");
    const bs58 = (await import("bs58")).default;
    if (this.config.privateKey.startsWith("[")) {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(this.config.privateKey)));
    }
    return Keypair.fromSecretKey(bs58.decode(this.config.privateKey));
  }

  private anchorDiscriminator(methodName: string): Buffer {
    return createHash("sha256").update(`global:${methodName}`).digest().subarray(0, 8);
  }

  private deriveAddresses(PublicKey: any, tradeId: string) {
    const programId = new PublicKey(this.config.programId);
    const [escrowPda] = PublicKey.findProgramAddressSync([Buffer.from("escrow"), Buffer.from(tradeId)], programId);
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), escrowPda.toBuffer()], programId);
    return { escrowPda, vaultPda, programId };
  }

  private amountToBigInt(amount: string): bigint {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    const [integerPart, fractionalPart = ''] = amount.split('.');
    const paddedFractional = fractionalPart.padEnd(6, '0').slice(0, 6);
    const microUnitsString = integerPart + paddedFractional;
    return BigInt(microUnitsString);
  }

  private async wrapTransaction(
    action: string,
    tradeOperationId: string,
    fn: (connection: any, admin: any, PublicKey: any, Transaction: any) => Promise<any>,
  ) {
    const { PublicKey, Transaction } = await import("@solana/web3.js");
    const connection = await this.getConnection();
    const admin = await this.getAdminKeypair();

    if (this.isDryRun()) {
      this.logger.warn(`DRY RUN: Skipping live Solana transaction for ${action} (Trade: ${tradeOperationId})`);
      return { txHash: `DRY_RUN_${action.toUpperCase()}_${Date.now()}` };
    }

    try {
      this.logger.log(`Executing ${action} for trade ${tradeOperationId} on Solana...`);
      const signature = await fn(connection, admin, PublicKey, Transaction);
      this.logger.log(`${action} successful: ${signature}`);
      return { txHash: signature };
    } catch (err: any) {
      this.logger.error(`Solana ${action} failed for trade ${tradeOperationId}: ${err.message}`);
      
      if (err.message.includes("0x1")) {
        throw new Error("Solana Insufficient Funds: Admin wallet needs more SOL or USDC.");
      }
      if (err.message.includes("Account already exists")) {
        throw new Error("Solana Conflict: Escrow account already initialized for this trade.");
      }
      
      throw err;
    }
  }

  async createEscrow(tradeOperationId: string, sellerAddress: string, amount: string) {
    return this.wrapTransaction("createEscrow", tradeOperationId, async (connection, admin, PublicKey, Transaction) => {
      const { SystemProgram, SYSVAR_RENT_PUBKEY } = await import("@solana/web3.js");
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import("@solana/spl-token");

      const mint = new PublicKey(this.config.usdcMint);
      const { escrowPda, vaultPda, programId } = this.deriveAddresses(PublicKey, tradeOperationId);
      const adminTokenAccount = await getAssociatedTokenAddress(mint, admin.publicKey);

      const amountInUnits = this.amountToBigInt(amount);
      const amountBuf = Buffer.alloc(8);
      amountBuf.writeBigUInt64LE(amountInUnits);

      const tradeIdBuf = Buffer.from(tradeOperationId);
      const tradeIdLenBuf = Buffer.alloc(4);
      tradeIdLenBuf.writeUInt32LE(tradeIdBuf.length);

      const data = Buffer.concat([this.anchorDiscriminator("create_escrow"), tradeIdLenBuf, tradeIdBuf, amountBuf]);

      const transaction = new Transaction().add({
        keys: [
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: adminTokenAccount, isSigner: false, isWritable: true },
          { pubkey: admin.publicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey(sellerAddress), isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        programId,
        data,
      });

      const signature = await connection.sendTransaction(transaction, [admin]);
      await Promise.race([
        connection.confirmTransaction(signature, { commitment: 'confirmed' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timeout')), 15000))
      ]);

      await this.prisma.tradeEvent.create({
        data: {
          tradeOperationId,
          eventType: "PAYMENT_ESCROWED",
          actorRole: "ADMIN",
          blockchainTxHash: signature,
          metadata: { amount, chain: "SOLANA" },
        },
      }).catch(() => {}); // Don't fail if prisma logging fails

      return signature;
    });
  }

  async releaseFunds(tradeOperationId: string) {
    return this.wrapTransaction("releaseFunds", tradeOperationId, async (connection, admin, PublicKey, Transaction) => {
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import("@solana/spl-token");

      const mint = new PublicKey(this.config.usdcMint);
      const { escrowPda, vaultPda, programId } = this.deriveAddresses(PublicKey, tradeOperationId);
      
      const escrowInfo = await connection.getAccountInfo(escrowPda);
      if (!escrowInfo) throw new Error("Escrow not found");
      const sellerPubkey = new PublicKey(escrowInfo.data.slice(40, 72));
      const sellerTokenAccount = await getAssociatedTokenAddress(mint, sellerPubkey);

      const transaction = new Transaction().add({
        keys: [
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
          { pubkey: admin.publicKey, isSigner: true, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId,
        data: this.anchorDiscriminator("release_funds"),
      });

      const signature = await connection.sendTransaction(transaction, [admin]);
      await Promise.race([
        connection.confirmTransaction(signature, { commitment: 'confirmed' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timeout')), 15000))
      ]);

      await this.prisma.tradeEvent.create({
        data: {
          tradeOperationId,
          eventType: "PAYMENT_RELEASED",
          actorRole: "ADMIN",
          blockchainTxHash: signature,
          metadata: { chain: "SOLANA" },
        },
      }).catch(() => {});

      return signature;
    });
  }

  async raiseDispute(tradeOperationId: string) {
    return this.wrapTransaction("raiseDispute", tradeOperationId, async (connection, admin, PublicKey, Transaction) => {
      const { escrowPda, programId } = this.deriveAddresses(PublicKey, tradeOperationId);

      const transaction = new Transaction().add({
        keys: [
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: admin.publicKey, isSigner: true, isWritable: true },
        ],
        programId,
        data: this.anchorDiscriminator("raise_dispute"),
      });

      const signature = await connection.sendTransaction(transaction, [admin]);
      await Promise.race([
        connection.confirmTransaction(signature, { commitment: 'confirmed' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timeout')), 15000))
      ]);

      await this.prisma.tradeEvent.create({
        data: {
          tradeOperationId,
          eventType: "DISPUTE_RAISED",
          actorRole: "ADMIN",
          blockchainTxHash: signature,
          metadata: { chain: "SOLANA" },
        },
      }).catch(() => {});

      return signature;
    });
  }

  async resolveDispute(tradeOperationId: string, releaseToBuyer: boolean) {
    return this.wrapTransaction("resolveDispute", tradeOperationId, async (connection, admin, PublicKey, Transaction) => {
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import("@solana/spl-token");

      const mint = new PublicKey(this.config.usdcMint);
      const { escrowPda, vaultPda, programId } = this.deriveAddresses(PublicKey, tradeOperationId);

      const escrowInfo = await connection.getAccountInfo(escrowPda);
      if (!escrowInfo) throw new Error("Escrow not found");
      const recipient = releaseToBuyer ? new PublicKey(escrowInfo.data.slice(8, 40)) : new PublicKey(escrowInfo.data.slice(40, 72));
      const recipientTokenAccount = await getAssociatedTokenAddress(mint, recipient);

      const transaction = new Transaction().add({
        keys: [
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
          { pubkey: admin.publicKey, isSigner: true, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId,
        data: Buffer.concat([this.anchorDiscriminator("resolve_dispute"), Buffer.from([releaseToBuyer ? 1 : 0])]),
      });

      const signature = await connection.sendTransaction(transaction, [admin]);
      await Promise.race([
        connection.confirmTransaction(signature, { commitment: 'confirmed' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timeout')), 15000))
      ]);

      await this.prisma.tradeEvent.create({
        data: {
          tradeOperationId,
          eventType: releaseToBuyer ? "PAYMENT_REFUNDED" : "PAYMENT_RELEASED",
          actorRole: "ADMIN",
          blockchainTxHash: signature,
          metadata: { chain: "SOLANA", resolvedToBuyer: releaseToBuyer },
        },
      }).catch(() => {});

      return signature;
    });
  }

  async refund(tradeOperationId: string) {
    return this.wrapTransaction("refund", tradeOperationId, async (connection, admin, PublicKey, Transaction) => {
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import("@solana/spl-token");

      const mint = new PublicKey(this.config.usdcMint);
      const { escrowPda, vaultPda, programId } = this.deriveAddresses(PublicKey, tradeOperationId);

      const escrowInfo = await connection.getAccountInfo(escrowPda);
      if (!escrowInfo) throw new Error("Escrow not found");
      const buyer = new PublicKey(escrowInfo.data.slice(8, 40));
      const buyerTokenAccount = await getAssociatedTokenAddress(mint, buyer);

      const transaction = new Transaction().add({
        keys: [
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
          { pubkey: admin.publicKey, isSigner: true, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId,
        data: this.anchorDiscriminator("refund"),
      });

      const signature = await connection.sendTransaction(transaction, [admin]);
      await Promise.race([
        connection.confirmTransaction(signature, { commitment: 'confirmed' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timeout')), 15000))
      ]);

      await this.prisma.tradeEvent.create({
        data: {
          tradeOperationId,
          eventType: "PAYMENT_REFUNDED",
          actorRole: "ADMIN",
          blockchainTxHash: signature,
          metadata: { chain: "SOLANA" },
        },
      }).catch(() => {});

      return signature;
    });
  }

  async getStatus(tradeOperationId: string): Promise<EscrowStatus> {
    const { PublicKey } = await import("@solana/web3.js");
    const connection = await this.getConnection();
    const { escrowPda } = this.deriveAddresses(PublicKey, tradeOperationId);
    
    const info = await connection.getAccountInfo(escrowPda);
    if (!info) throw new Error("Escrow account not found");

    if (info.data.byteLength < 81) {
      throw new Error("Invalid escrow account data: insufficient length");
    }

    const data = info.data;
    const buyer = new PublicKey(data.slice(8, 40)).toBase58();
    const seller = new PublicKey(data.slice(40, 72)).toBase58();
    const amountLamports = data.readBigUInt64LE(72);
    const stateIndex = data[80] ?? 0;

    return {
      tradeOperationId,
      buyer,
      seller,
      amount: (Number(amountLamports) / 1_000_000).toString(),
      state: this.states[stateIndex] ?? "UNKNOWN",
      tradeId: tradeOperationId,
      chain: "SOLANA",
      escrowPda: escrowPda.toBase58(),
    };
  }
}

/**
 * Main EscrowService using composition and Strategy Pattern
 */
@Injectable()
export class EscrowService {
  private readonly engines: Record<EscrowChain, IEscrowEngine>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Compose with specific chain engines
    this.engines = {
      CELO: new CeloEscrowEngine({
        contractAddress: this.configService.get<string>("ESCROW_CONTRACT_ADDRESS") ?? "",
        rpcUrl: this.configService.get<string>("BLOCKCHAIN_RPC_URL") ?? "",
        privateKey: this.configService.get<string>("ADMIN_WALLET_PRIVATE_KEY") ?? "",
        cusdAddress: this.configService.get<string>("CUSD_TOKEN_ADDRESS") ?? "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
      }, this.prisma),
      
      SOLANA: new SolanaEscrowEngine({
        programId: this.configService.get<string>("SOLANA_ESCROW_PROGRAM_ID") ?? "AgroEscrw1111111111111111111111111111111111",
        rpcUrl: this.configService.get<string>("SOLANA_RPC_URL") ?? "https://api.devnet.solana.com",
        privateKey: this.configService.get<string>("SOLANA_ADMIN_WALLET_PRIVATE_KEY") ?? "",
        usdcMint: this.configService.get<string>("SOLANA_USDC_MINT") ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      }, this.prisma),
    };
  }

  private async getEngine(tradeOperationId: string, overrideChain?: EscrowChain): Promise<IEscrowEngine> {
    const chain = overrideChain || await this.resolveChainForTrade(tradeOperationId);
    return this.engines[chain];
  }

  private async resolveChainForTrade(tradeOperationId: string): Promise<EscrowChain> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      select: { metadata: true },
    });
    const metadata = trade?.metadata as any;
    return metadata?.escrowChain === "SOLANA" ? "SOLANA" : "CELO";
  }

  // --- Coordination Methods ---

  async createEscrow(tradeOpId: string, seller: string, amount: string, chain?: EscrowChain) {
    const engine = await this.getEngine(tradeOpId, chain);
    return engine.createEscrow(tradeOpId, seller, amount);
  }

  async releaseFunds(tradeOpId: string, chain?: EscrowChain) {
    const engine = await this.getEngine(tradeOpId, chain);
    return engine.releaseFunds(tradeOpId);
  }

  async raiseDispute(tradeOpId: string, chain?: EscrowChain) {
    const engine = await this.getEngine(tradeOpId, chain);
    return engine.raiseDispute(tradeOpId);
  }

  async resolveDispute(tradeOpId: string, releaseToBuyer: boolean, chain?: EscrowChain) {
    const engine = await this.getEngine(tradeOpId, chain);
    return engine.resolveDispute(tradeOpId, releaseToBuyer);
  }

  async refund(tradeOpId: string, chain?: EscrowChain) {
    const engine = await this.getEngine(tradeOpId, chain);
    return engine.refund(tradeOpId);
  }

  async getStatus(tradeOpId: string, chain?: EscrowChain) {
    const engine = await this.getEngine(tradeOpId, chain);
    return engine.getStatus(tradeOpId);
  }

  isConfigured(chain: EscrowChain = "CELO"): boolean {
    return this.engines[chain].isConfigured();
  }
}
