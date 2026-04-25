import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { Prisma, UserRole } from "@prisma/client";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../prisma/prisma.service";
import { TradeEventsService } from "../trade-events/trade-events.service";
import { RealtimeService } from "../realtime/realtime.service";
import {
  CURATED_ASSETS,
  CuratedAsset,
  USDC_SOLANA_MINT,
} from "./constants/curated-assets.constant";
import { UpdateInvestmentPreferenceDto } from "./dto/update-preference.dto";

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);
  private readonly quoteUrl = "https://quote-api.jup.ag/v6/quote";
  private readonly swapUrl = "https://quote-api.jup.ag/v6/swap";

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly tradeEventsService: TradeEventsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  getAssets() {
    return CURATED_ASSETS;
  }

  async getQuote(inputMint: string, outputMint: string, amountLamports: string) {
    const response = await firstValueFrom(
      this.httpService.get(this.quoteUrl, {
        params: {
          inputMint,
          outputMint,
          amount: amountLamports,
          slippageBps: 50,
        },
      }),
    );

    return response.data;
  }

  async executeSwap(
    userId: string,
    tradeOperationId: string | undefined,
    assetSymbol: string,
    amountUsdc: number,
  ) {
    const asset = this.getAssetBySymbol(assetSymbol);
    const amountLamports = this.usdcToLamports(amountUsdc);

    // Basic deduplication for trade-linked swaps
    if (tradeOperationId) {
      const existing = await this.prisma.investmentPosition.findFirst({
        where: {
          tradeOperationId,
          status: "EXECUTED",
        },
      });
      if (existing) {
        this.logger.warn(`Investment already executed for trade ${tradeOperationId}. Skipping.`);
        return existing;
      }
    }

    const pendingPosition = await this.prisma.investmentPosition.create({
      data: {
        userId,
        tradeOperationId,
        assetSymbol: asset.symbol,
        amountUsdc: new Prisma.Decimal(amountUsdc),
        tokenAmount: new Prisma.Decimal(0),
        inputMint: USDC_SOLANA_MINT,
        outputMint: asset.outputMint,
        status: "PENDING",
      },
    });

    try {
      this.ensureAssetConfigured(asset);

      const quoteResponse = await this.getQuote(
        USDC_SOLANA_MINT,
        asset.outputMint,
        amountLamports,
      );

      const publicKey = this.configService.get<string>("SOLANA_ADMIN_WALLET_ADDRESS");
      if (!publicKey) {
        throw new BadRequestException("SOLANA_ADMIN_WALLET_ADDRESS is not configured");
      }

      const swapResponse = await firstValueFrom(
        this.httpService.post(this.swapUrl, {
          quoteResponse,
          userPublicKey: publicKey,
        }, { timeout: 10000 }), // 10s timeout
      );

      const txSignature = await this.broadcastSwap(swapResponse.data.swapTransaction);
      
      // Note: In production, we'd fetch the transaction receipt to get the REAL outAmount.
      // For now, we use the quote amount but acknowledge it's an expectation.
      const tokenAmount = this.quoteOutAmountToDecimal(quoteResponse.outAmount, asset.decimals);

      const executedPosition = await this.prisma.investmentPosition.update({
        where: { id: pendingPosition.id },
        data: {
          tokenAmount,
          txSignature,
          status: "EXECUTED",
          errorMessage: null,
        },
      });

      if (tradeOperationId) {
        await this.tradeEventsService.record({
          tradeOperationId,
          eventType: "INVESTMENT_EXECUTED",
          actorRole: UserRole.ADMIN,
          actorId: userId,
          blockchainTxHash: txSignature,
          metadata: {
            assetSymbol: asset.symbol,
            amountUsdc,
          },
        });
      }

      this.realtimeService.emitToUser(userId, "investment:executed", {
        positionId: executedPosition.id,
        txSignature,
        assetSymbol: asset.symbol,
        amountUsdc,
      });

      return executedPosition;
    } catch (error) {
      this.logger.error(`Swap execution failed for user ${userId}:`, error);
      
      // Sanitize error message for client and DB
      let message = "Swap execution failed due to an internal error";
      if (error instanceof BadRequestException) {
        message = error.message;
      } else if (error instanceof Error) {
        // Only allow specific non-sensitive messages
        if (error.message.includes("Slippage") || error.message.includes("Insufficient Funds")) {
          message = error.message;
        }
      }

      const failedPosition = await this.prisma.investmentPosition.update({
        where: { id: pendingPosition.id },
        data: {
          status: "FAILED",
          errorMessage: message,
        },
      });

      this.realtimeService.emitToUser(userId, "investment:failed", {
        positionId: failedPosition.id,
        assetSymbol,
        error: message,
      });

      throw new BadRequestException(message);
    }
  }

  async executeAutoSwap(
    userId: string,
    tradeOperationId: string,
    releasedAmountUsdc: number,
  ): Promise<void> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      select: { metadata: true },
    });

    const escrowChain = (trade?.metadata as Record<string, unknown> | null)?.escrowChain;
    if (escrowChain !== "SOLANA") {
      return;
    }

    const preference = await this.getOrCreatePreference(userId);
    if (!preference.autoInvest || preference.percentage <= 0) {
      return;
    }

    const swapAmount = releasedAmountUsdc * (preference.percentage / 100);
    if (swapAmount <= 0) {
      return;
    }

    await this.executeSwap(userId, tradeOperationId, preference.assetSymbol, swapAmount);
  }

  getPortfolio(userId: string) {
    return this.prisma.investmentPosition.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  getOrCreatePreference(userId: string) {
    return this.prisma.userInvestmentPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updatePreference(userId: string, dto: UpdateInvestmentPreferenceDto) {
    if (dto.assetSymbol) {
      this.getAssetBySymbol(dto.assetSymbol);
    }

    return this.prisma.userInvestmentPreference.upsert({
      where: { userId },
      update: {
        autoInvest: dto.autoInvest,
        assetSymbol: dto.assetSymbol,
        percentage: dto.percentage,
      },
      create: {
        userId,
        autoInvest: dto.autoInvest ?? false,
        assetSymbol: dto.assetSymbol ?? "PAXG",
        percentage: dto.percentage ?? 100,
      },
    });
  }

  async assertPortfolioAccess(requestUserId: string, targetUserId: string, role: UserRole) {
    if (requestUserId !== targetUserId && role !== UserRole.ADMIN) {
      throw new ForbiddenException("You can only access your own portfolio");
    }
  }

  private getAssetBySymbol(assetSymbol: string): CuratedAsset {
    const asset = CURATED_ASSETS.find((entry) => entry.symbol === assetSymbol);
    if (!asset) {
      throw new NotFoundException(`Unsupported investment asset: ${assetSymbol}`);
    }
    return asset;
  }

  private ensureAssetConfigured(asset: CuratedAsset) {
    if (asset.outputMint.startsWith("TODO_SET_")) {
      throw new BadRequestException(
        `Mint address for ${asset.symbol} is not configured yet`,
      );
    }
  }

  private usdcToLamports(amountUsdc: number): string {
    return Math.round(amountUsdc * 1_000_000).toString();
  }

  private quoteOutAmountToDecimal(outAmount: string, decimals: number) {
    return new Prisma.Decimal(outAmount).div(new Prisma.Decimal(Math.pow(10, decimals)));
  }

  private async broadcastSwap(serializedSwapTransaction: string): Promise<string> {
    const rpcUrl = this.configService.get<string>("SOLANA_RPC_URL");
    const secret = this.configService.get<string>("SOLANA_ADMIN_WALLET_PRIVATE_KEY");
    if (!rpcUrl || !secret) {
      throw new BadRequestException(
        "SOLANA_RPC_URL and SOLANA_ADMIN_WALLET_PRIVATE_KEY are required",
      );
    }

    const [{ Connection, Keypair, VersionedTransaction }, bs58] = await Promise.all([
      import("@solana/web3.js"),
      import("bs58"),
    ]);

    const connection = new Connection(rpcUrl, "confirmed");
    const secretBytes = this.parseSecretKey(secret, bs58.default ?? bs58);
    const signer = Keypair.fromSecretKey(secretBytes);
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(serializedSwapTransaction, "base64"),
    );

    try {
      transaction.sign([signer]);
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
      this.logger.log(`Broadcasting Jupiter swap transaction: ${signature}`);
      await connection.confirmTransaction(signature, "confirmed");
      return signature;
    } catch (error: any) {
      this.logger.error(`Jupiter swap broadcast failed: ${error.message}`);
      if (error.message.includes("Slippage tolerance exceeded")) {
        throw new BadRequestException("Swap failed: Price moved too much (slippage).");
      }
      throw error;
    }
  }

  private parseSecretKey(secret: string, bs58: { decode(value: string): Uint8Array }): Uint8Array {
    try {
      const trimmed = secret.trim();
      let bytes: Uint8Array;

      if (trimmed.startsWith("[")) {
        bytes = Uint8Array.from(JSON.parse(trimmed) as number[]);
      } else {
        bytes = bs58.decode(trimmed);
      }

      if (bytes.length !== 64) {
        throw new Error(`Invalid Solana key length: expected 64, got ${bytes.length}`);
      }

      return bytes;
    } catch (err: any) {
      this.logger.error(`Failed to parse Solana secret key: ${err.message}`);
      throw new Error("Internal configuration error: Invalid Solana private key.");
    }
  }
}
