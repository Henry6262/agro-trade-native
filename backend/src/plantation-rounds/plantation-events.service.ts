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
            // Find the most recent OPEN round with matching cropType that still has a
            // placeholder (negative) onChainRoundId, assigned by the create handler.
            const round = await this.prisma.plantationRound.findFirst({
              where: {
                onChainRoundId: { lt: 0 },
                cropType,
                status: PlantationRoundStatus.OPEN,
              },
              orderBy: { createdAt: 'desc' },
            });
            if (round) {
              await this.prisma.plantationRound.update({
                where: { id: round.id },
                data: { onChainRoundId: Number(roundId) },
              });
              this.logger.log(
                `Updated PlantationRound ${round.id} → onChainRoundId=${roundId}`,
              );
            } else {
              this.logger.warn(
                `RoundCreated: no matching OPEN round with placeholder id for cropType=${cropType}`,
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
              where: { onChainRoundId: Number(roundId) },
            });
            if (!round) {
              this.logger.warn(
                `SharesPurchased: no round found for onChainRoundId=${roundId}`,
              );
              return;
            }

            // Update placeholder NFT records (tokenId < 0) with real tokenIds from chain.
            // Placeholders are created with -(Date.now()) - i, so all are negative.
            const placeholders = await this.prisma.plantationNft.findMany({
              where: { roundId: round.id, tokenId: { lt: 0 } },
              orderBy: { shareIndex: 'asc' },
              take: tokenIds.length,
            });

            await Promise.all(
              placeholders.map((nft, i) =>
                this.prisma.plantationNft.update({
                  where: { id: nft.id },
                  data: { tokenId: Number(tokenIds[i]) },
                }),
              ),
            );
            this.logger.log(
              `Updated ${placeholders.length} PlantationNft records for round ${round.id}`,
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
              where: { onChainRoundId: Number(roundId) },
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
              where: { onChainRoundId: Number(roundId) },
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
