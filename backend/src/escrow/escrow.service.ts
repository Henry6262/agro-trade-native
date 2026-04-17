import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

const ESCROW_ABI = [
  // cUSD ERC-20 token (used to approve before createEscrow)
  "function approve(address spender, uint256 amount) external returns (bool)",
  // Escrow contract
  "function createEscrow(bytes32 key, address seller, string calldata tradeId, uint256 amount) external",
  "function releaseFunds(bytes32 key) external",
  "function raiseDispute(bytes32 key) external",
  "function resolveDispute(bytes32 key, bool releaseToBuyer) external",
  "function refund(bytes32 key) external",
  "function getEscrow(bytes32 key) external view returns (address buyer, address seller, uint256 amount, uint8 state, string tradeId)",
  "function cusdToken() external view returns (address)",
  "event EscrowCreated(bytes32 indexed key, string tradeId, uint256 amount)",
  "event PaymentReleased(bytes32 indexed key)",
  "event DisputeRaised(bytes32 indexed key)",
  "event DisputeResolved(bytes32 indexed key, address recipient, uint256 amount)",
  "event Refunded(bytes32 indexed key)",
];

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);
  private ethers: any = null;
  private contractAddress: string;
  private rpcUrl: string;
  private privateKey: string;
  private cusdAddress: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.contractAddress = this.configService.get<string>("ESCROW_CONTRACT_ADDRESS") ?? "";
    this.rpcUrl = this.configService.get<string>("BLOCKCHAIN_RPC_URL") ?? "";
    this.privateKey = this.configService.get<string>("ADMIN_WALLET_PRIVATE_KEY") ?? "";
    this.cusdAddress = this.configService.get<string>("CUSD_TOKEN_ADDRESS") ?? "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Celo Sepolia default
  }

  private async getCusdContract() {
    if (!this.ethers) {
      this.ethers = await import("ethers");
    }
    const provider = new this.ethers.JsonRpcProvider(this.rpcUrl);
    const wallet = new this.ethers.Wallet(this.privateKey, provider);
    const cusdAbi = ["function approve(address spender, uint256 amount) external returns (bool)"];
    return new this.ethers.Contract(this.cusdAddress, cusdAbi, wallet);
  }

  private async getContract() {
    if (!this.ethers) {
      this.ethers = await import("ethers");
    }
    if (!this.contractAddress || !this.rpcUrl || !this.privateKey) {
      throw new Error(
        "Blockchain config not set. Set ESCROW_CONTRACT_ADDRESS, BLOCKCHAIN_RPC_URL, ADMIN_WALLET_PRIVATE_KEY.",
      );
    }
    const provider = new this.ethers.JsonRpcProvider(this.rpcUrl);
    const wallet = new this.ethers.Wallet(this.privateKey, provider);
    return new this.ethers.Contract(this.contractAddress, ESCROW_ABI, wallet);
  }

  async createEscrow(tradeOperationId: string, sellerAddress: string, amountCusd: string) {
    const ethers = await import("ethers");
    const escrowContract = await this.getContract();
    const cusdContract = await this.getCusdContract();
    const key = ethers.id(tradeOperationId);
    // cUSD has 18 decimals like ETH
    const amountWei = ethers.parseUnits(amountCusd, 18);

    // Step 1: approve escrow contract to spend cUSD
    const approveTx = await cusdContract.approve(this.contractAddress, amountWei);
    await approveTx.wait();
    this.logger.log(`cUSD approved for trade ${tradeOperationId}: ${amountCusd} cUSD`);

    // Step 2: create escrow (pulls cUSD via transferFrom)
    const tx = await escrowContract.createEscrow(key, sellerAddress, tradeOperationId, amountWei);
    await tx.wait();
    this.logger.log(`Escrow created for trade ${tradeOperationId}: ${amountCusd} cUSD locked`);

    await this.prisma.tradeEvent.create({
      data: {
        tradeOperationId,
        eventType: "PAYMENT_ESCROWED",
        actorRole: "ADMIN",
        blockchainTxHash: tx.hash,
        metadata: { amountCusd },
      },
    });

    return { txHash: tx.hash };
  }

  async releaseFunds(tradeOperationId: string) {
    const ethers = await import("ethers");
    const contract = await this.getContract();
    const key = ethers.id(tradeOperationId);
    const tx = await contract.releaseFunds(key);
    await tx.wait();
    this.logger.log(`Funds released for trade ${tradeOperationId}: ${tx.hash}`);

    await this.prisma.tradeEvent.create({
      data: {
        tradeOperationId,
        eventType: "PAYMENT_RELEASED",
        actorRole: "ADMIN",
        blockchainTxHash: tx.hash,
      },
    });

    return { txHash: tx.hash };
  }

  async raiseDispute(tradeOperationId: string) {
    const ethers = await import("ethers");
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
      },
    });

    return { txHash: tx.hash };
  }

  async resolveDispute(tradeOperationId: string, releaseToBuyer: boolean) {
    const ethers = await import("ethers");
    const contract = await this.getContract();
    const key = ethers.id(tradeOperationId);
    const tx = await contract.resolveDispute(key, releaseToBuyer);
    await tx.wait();
    this.logger.log(
      `Dispute resolved for trade ${tradeOperationId}: ${tx.hash} (buyerRefund: ${releaseToBuyer})`,
    );

    await this.prisma.tradeEvent.create({
      data: {
        tradeOperationId,
        eventType: "PAYMENT_RELEASED",
        actorRole: "ADMIN",
        blockchainTxHash: tx.hash,
        metadata: { resolvedToBuyer: releaseToBuyer },
      },
    });

    return { txHash: tx.hash };
  }

  async refund(tradeOperationId: string) {
    const ethers = await import("ethers");
    const contract = await this.getContract();
    const key = ethers.id(tradeOperationId);
    const tx = await contract.refund(key);
    await tx.wait();
    this.logger.log(`Refund executed for trade ${tradeOperationId}: ${tx.hash}`);

    await this.prisma.tradeEvent.create({
      data: {
        tradeOperationId,
        eventType: "PAYMENT_REFUNDED",
        actorRole: "ADMIN",
        blockchainTxHash: tx.hash,
        metadata: {},
      },
    });

    return { txHash: tx.hash };
  }

  async getStatus(tradeOperationId: string) {
    const ethers = await import("ethers");
    const contract = await this.getContract();
    const key = ethers.id(tradeOperationId);
    const result = await contract.getEscrow(key);

    const states = ["AWAITING_PAYMENT", "AWAITING_DELIVERY", "COMPLETE", "DISPUTED", "REFUNDED"];

    return {
      tradeOperationId,
      buyer: result[0],
      seller: result[1],
      amountWei: result[2].toString(),
      state: states[Number(result[3])] ?? "UNKNOWN",
      tradeId: result[4],
    };
  }

  isConfigured(): boolean {
    return !!(this.contractAddress && this.rpcUrl && this.privateKey);
  }
}
