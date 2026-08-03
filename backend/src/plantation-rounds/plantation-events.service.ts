import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlantationRoundStatus } from '@prisma/client';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { PLANTATION_ROUND_ABI } from './constants/contracts.constant';

@Injectable()
export class PlantationEventsService implements OnModuleInit {
  private readonly logger = new Logger(PlantationEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    const rpcUrl = this.config.get<string>('CELO_RPC_URL');
    const contractAddress = this.config.get<string>(
      'PLANTATION_ROUND_CONTRACT_ADDRESS',
    );

    if (!rpcUrl || !contractAddress) {
      this.logger.warn(
        'CELO_RPC_URL or PLANTATION_ROUND_CONTRACT_ADDRESS not set — event listener disabled',
      );
      return;
    }

    try {
      const provider = new ethers.WebSocketProvider(rpcUrl);
      const contract = new ethers.Contract(
        contractAddress,
        PLANTATION_ROUND_ABI,
        provider,
      );

      contract.on(
        'RoundCreated',
        async (
          roundId: bigint,
          _farmer: string,
          cropType: string,
          _targetCUSD: bigint,
        ) => {
          this.logger.log(`RoundCreated event: roundId=${roundId}`);
          try {
            // Find the most recent matching round that is still awaiting chain
            // reconciliation. The uint256 ID is stored as an exact decimal string.
            const round = await this.prisma.plantationRound.findFirst({
              where: {
                onChainRoundId: null,
                cropType,
                status: {
                  in: [
                    PlantationRoundStatus.OPEN,
                    PlantationRoundStatus.FUNDED,
                  ],
                },
              },
              orderBy: { createdAt: 'desc' },
            });
            if (round) {
              await this.prisma.plantationRound.update({
                where: { id: round.id },
                data: { onChainRoundId: roundId.toString() },
              });
              this.logger.log(
                `Updated PlantationRound ${round.id} → onChainRoundId=${roundId}`,
              );
            } else {
              this.logger.warn(
                `RoundCreated: no matching pending round awaiting reconciliation for cropType=${cropType}`,
              );
            }
          } catch (err) {
            this.logger.error(
              `RoundCreated handler error: ${(err as Error).message}`,
            );
          }
        },
      );

      contract.on(
        'SharesPurchased',
        async (roundId: bigint, _investor: string, tokenIds: bigint[]) => {
          this.logger.log(
            `SharesPurchased event: roundId=${roundId}, tokenIds=${tokenIds}`,
          );
          try {
            const round = await this.prisma.plantationRound.findFirst({
              where: { onChainRoundId: roundId.toString() },
            });
            if (!round) {
              this.logger.warn(
                `SharesPurchased: no round found for onChainRoundId=${roundId}`,
              );
              return;
            }

            // Resolve each token's authoritative share index from the contract.
            // This avoids assigning concurrent events to whichever nullable rows
            // happen to be returned first.
            const assignments = await Promise.all(
              tokenIds.map(async (tokenId) => {
                const tokenInfo = await contract.getTokenInfo(tokenId);
                const shareIndexBigInt = BigInt(
                  tokenInfo.shareIndex ?? tokenInfo[1],
                );
                if (
                  shareIndexBigInt < 0n ||
                  shareIndexBigInt >= BigInt(round.totalShares)
                ) {
                  throw new Error(
                    `Invalid share index ${shareIndexBigInt} for round ${round.id}`,
                  );
                }
                return {
                  shareIndex: Number(shareIndexBigInt),
                  tokenId: tokenId.toString(),
                };
              }),
            );

            await this.prisma.$transaction(async (tx) => {
              for (const assignment of assignments) {
                const updated = await tx.plantationNft.updateMany({
                  where: {
                    roundId: round.id,
                    shareIndex: assignment.shareIndex,
                    OR: [
                      { tokenId: null },
                      { tokenId: assignment.tokenId },
                    ],
                  },
                  data: { tokenId: assignment.tokenId },
                });
                if (updated.count !== 1) {
                  throw new Error(
                    `No matching reserved share ${assignment.shareIndex} for round ${round.id}`,
                  );
                }
              }
            });
            this.logger.log(
              `Reconciled ${assignments.length} PlantationNft records for round ${round.id}`,
            );
          } catch (err) {
            this.logger.error(
              `SharesPurchased handler error: ${(err as Error).message}`,
            );
          }
        },
      );

      contract.on(
        'CapitalUnlocked',
        async (roundId: bigint, _farmer: string, _amount: bigint) => {
          this.logger.log(`CapitalUnlocked event: roundId=${roundId}`);
          try {
            await this.prisma.plantationRound.updateMany({
              where: { onChainRoundId: roundId.toString() },
              data: { status: PlantationRoundStatus.ACTIVE },
            });
          } catch (err) {
            this.logger.error(
              `CapitalUnlocked handler error: ${(err as Error).message}`,
            );
          }
        },
      );

      contract.on(
        'HarvestDistributed',
        async (roundId: bigint, _totalCUSD: bigint) => {
          this.logger.log(`HarvestDistributed event: roundId=${roundId}`);
          try {
            await this.prisma.plantationRound.updateMany({
              where: { onChainRoundId: roundId.toString() },
              data: { status: PlantationRoundStatus.DISTRIBUTING },
            });
          } catch (err) {
            this.logger.error(
              `HarvestDistributed handler error: ${(err as Error).message}`,
            );
          }
        },
      );

      this.logger.log('Plantation contract event listener active');
    } catch (err) {
      this.logger.warn(
        `Failed to set up WebSocket event listener (RPC may not support wss://): ${(err as Error).message} — listener disabled`,
      );
    }
  }
}
