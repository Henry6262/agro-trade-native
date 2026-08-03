import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlantationRoundStatus } from '@prisma/client';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { DistributeHarvestDto } from './dto/distribute-harvest.dto';
import { InvestDto } from './dto/invest.dto';
import { PLANTATION_ROUND_ABI } from './constants/contracts.constant';

const MAX_SHARE_RESERVATION_ATTEMPTS = 3;

class ShareReservationConflictError extends Error {}

@Injectable()
export class PlantationRoundsService {
  private readonly logger = new Logger(PlantationRoundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = this.config.get<string>('CELO_RPC_URL');
    if (!rpcUrl) throw new BadRequestException('CELO_RPC_URL not configured');
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private getAdminWallet(): ethers.Wallet {
    const privateKey = this.config.get<string>('CELO_ADMIN_PRIVATE_KEY');
    if (!privateKey) throw new BadRequestException('CELO_ADMIN_PRIVATE_KEY not configured');
    return new ethers.Wallet(privateKey, this.getProvider());
  }

  private getContract(signer?: ethers.Wallet): ethers.Contract {
    const address = this.config.get<string>('PLANTATION_ROUND_CONTRACT_ADDRESS');
    if (!address) throw new BadRequestException('PLANTATION_ROUND_CONTRACT_ADDRESS not configured');
    return new ethers.Contract(address, PLANTATION_ROUND_ABI, signer ?? this.getProvider());
  }

  async createRound(userId: string, dto: CreateRoundDto) {
    const contractAddress = this.config.get<string>('PLANTATION_ROUND_CONTRACT_ADDRESS') ?? '';
    const harvestDeadlineTs = Math.floor(new Date(dto.harvestDeadline).getTime() / 1000);
    const targetWei = ethers.parseEther(dto.targetCUSD.toString());
    const priceWei = ethers.parseEther(dto.pricePerShareCUSD.toString());
    if (targetWei % priceWei !== 0n) {
      throw new BadRequestException('Target must be divisible by share price');
    }

    const totalSharesBigInt = targetWei / priceWei;
    if (totalSharesBigInt <= 0n || totalSharesBigInt > BigInt(2_147_483_647)) {
      throw new BadRequestException('Total shares exceeds supported range');
    }
    const totalShares = Number(totalSharesBigInt);

    // Create DB record first (on-chain roundId assigned via event listener, Task 8)
    const round = await this.prisma.plantationRound.create({
      data: {
        onChainRoundId: null,
        sellerId: userId,
        cropType: dto.cropType,
        farmLocation: dto.farmLocation,
        targetCUSD: dto.targetCUSD,
        pricePerShareCUSD: dto.pricePerShareCUSD,
        totalShares,
        harvestDeadline: new Date(dto.harvestDeadline),
        projectedApyPct: dto.projectedApyPct ?? null,
        metadataUri: dto.metadataUri ?? null,
        contractAddress,
        status: PlantationRoundStatus.OPEN,
      },
    });

    // Submit on-chain (fire-and-forget; event listener in Task 8 syncs the real onChainRoundId)
    this.getContract(this.getAdminWallet())
      .createRound(dto.cropType, targetWei, priceWei, harvestDeadlineTs, dto.metadataUri ?? '')
      .then((tx: ethers.TransactionResponse) => tx.wait())
      .then(() => this.logger.log(`Round ${round.id} tx submitted on-chain`))
      .catch((err: Error) => this.logger.error(`On-chain createRound failed: ${err.message}`));

    return round;
  }

  async investInRound(roundDbId: string, userId: string, dto: InvestDto) {
    if (!Number.isInteger(dto.shareCount) || dto.shareCount < 1) {
      throw new BadRequestException('Share count must be a positive integer');
    }

    for (let attempt = 1; attempt <= MAX_SHARE_RESERVATION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const round = await tx.plantationRound.findUnique({
            where: { id: roundDbId },
          });
          if (!round) throw new NotFoundException('Round not found');
          if (round.status !== PlantationRoundStatus.OPEN) {
            throw new BadRequestException('Round is not open');
          }

          const nextSharesSold = round.sharesSold + dto.shareCount;
          if (nextSharesSold > round.totalShares) {
            throw new BadRequestException('Exceeds available shares');
          }

          // Compare-and-swap the observed sharesSold value. A concurrent buyer can
          // make this update affect zero rows, in which case the whole transaction
          // is rolled back and retried from a fresh snapshot.
          const reservation = await tx.plantationRound.updateMany({
            where: {
              id: roundDbId,
              status: PlantationRoundStatus.OPEN,
              sharesSold: round.sharesSold,
              totalShares: { gte: nextSharesSold },
            },
            data: {
              sharesSold: { increment: dto.shareCount },
              ...(nextSharesSold === round.totalShares
                ? { status: PlantationRoundStatus.FUNDED }
                : {}),
            },
          });
          if (reservation.count !== 1) {
            throw new ShareReservationConflictError();
          }

          // tokenId remains null until the exact uint256 value is reconciled from
          // the SharesPurchased event. The composite unique index protects each
          // round/share slot independently of the eventual on-chain token ID.
          const nfts = [];
          for (let i = 0; i < dto.shareCount; i += 1) {
            nfts.push(
              await tx.plantationNft.create({
                data: {
                  tokenId: null,
                  roundId: roundDbId,
                  ownerId: userId,
                  shareIndex: round.sharesSold + i,
                },
              }),
            );
          }

          return nfts;
        });
      } catch (error) {
        if (!(error instanceof ShareReservationConflictError)) throw error;
        if (attempt === MAX_SHARE_RESERVATION_ATTEMPTS) {
          throw new ConflictException(
            'Shares changed while reserving; please retry the investment',
          );
        }
      }
    }

    throw new ConflictException('Unable to reserve shares');
  }

  async distributeHarvest(roundDbId: string, userId: string, dto: DistributeHarvestDto) {
    const round = await this.prisma.plantationRound.findUnique({ where: { id: roundDbId } });
    if (!round) throw new NotFoundException('Round not found');
    if (round.sellerId !== userId) throw new ForbiddenException('Only the farmer can distribute');
    if (round.status !== PlantationRoundStatus.ACTIVE) {
      throw new BadRequestException('Round must be ACTIVE to distribute');
    }
    if (round.onChainRoundId === null) {
      throw new BadRequestException('Round is not yet confirmed on-chain');
    }

    // Fire on-chain distribution (fire-and-forget; event listener sets DISTRIBUTING in DB)
    const totalSaleWei = ethers.parseEther(dto.totalSaleCUSD.toString());
    this.getContract(this.getAdminWallet())
      .distributeHarvest(round.onChainRoundId, totalSaleWei)
      .then((tx: ethers.TransactionResponse) => tx.wait())
      .then(() => this.logger.log(`distributeHarvest on-chain for round ${round.id}`))
      .catch((err: Error) => this.logger.error(`On-chain distributeHarvest failed: ${err.message}`));

    return this.prisma.plantationRound.update({
      where: { id: roundDbId },
      data: { status: PlantationRoundStatus.DISTRIBUTING },
    });
  }

  async unlockCapital(roundDbId: string) {
    const round = await this.prisma.plantationRound.findUnique({ where: { id: roundDbId } });
    if (!round) throw new NotFoundException('Round not found');
    if (round.status !== PlantationRoundStatus.FUNDED) {
      throw new BadRequestException('Round is not funded');
    }
    if (round.onChainRoundId === null) {
      throw new BadRequestException('Round is not yet confirmed on-chain');
    }

    const tx: ethers.TransactionResponse = await this.getContract(this.getAdminWallet()).unlockCapital(
      round.onChainRoundId,
    );
    await tx.wait();

    return this.prisma.plantationRound.update({
      where: { id: roundDbId },
      data: { status: PlantationRoundStatus.ACTIVE },
    });
  }

  async listRounds(filters: { cropType?: string; status?: PlantationRoundStatus }) {
    return this.prisma.plantationRound.findMany({
      where: {
        ...(filters.cropType ? { cropType: filters.cropType } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRound(id: string) {
    const round = await this.prisma.plantationRound.findUnique({
      where: { id },
      include: { nfts: true },
    });
    if (!round) throw new NotFoundException('Round not found');
    return round;
  }
}
