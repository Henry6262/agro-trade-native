import {
  BadRequestException,
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

    // Create DB record first (on-chain roundId assigned via event listener, Task 8)
    // Temporary onChainRoundId uses negative timestamp to satisfy @unique constraint
    const placeholderRoundId = -(Date.now());
    const round = await this.prisma.plantationRound.create({
      data: {
        onChainRoundId: placeholderRoundId,
        sellerId: userId,
        cropType: dto.cropType,
        farmLocation: dto.farmLocation,
        targetCUSD: dto.targetCUSD,
        pricePerShareCUSD: dto.pricePerShareCUSD,
        totalShares: Math.floor(dto.targetCUSD / dto.pricePerShareCUSD),
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
    const round = await this.prisma.plantationRound.findUnique({ where: { id: roundDbId } });
    if (!round) throw new NotFoundException('Round not found');
    if (round.status !== PlantationRoundStatus.OPEN) throw new BadRequestException('Round is not open');
    if (round.sharesSold + dto.shareCount > round.totalShares) {
      throw new BadRequestException('Exceeds available shares');
    }

    // Mint NFT DB records; real tokenIds assigned by event listener (Task 8)
    // Use negative timestamp-based IDs to satisfy the @unique constraint on tokenId
    const baseTokenId = -(Date.now());
    const nfts = await this.prisma.$transaction(
      Array.from({ length: dto.shareCount }, (_, i) =>
        this.prisma.plantationNft.create({
          data: {
            tokenId: baseTokenId - i,
            roundId: roundDbId,
            ownerId: userId,
            shareIndex: round.sharesSold + i,
          },
        }),
      ),
    );

    await this.prisma.plantationRound.update({
      where: { id: roundDbId },
      data: { sharesSold: { increment: dto.shareCount } },
    });

    return nfts;
  }

  async distributeHarvest(roundDbId: string, userId: string, dto: DistributeHarvestDto) {
    const round = await this.prisma.plantationRound.findUnique({ where: { id: roundDbId } });
    if (!round) throw new NotFoundException('Round not found');
    if (round.sellerId !== userId) throw new ForbiddenException('Only the farmer can distribute');
    if (round.status !== PlantationRoundStatus.ACTIVE) {
      throw new BadRequestException('Round must be ACTIVE to distribute');
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
