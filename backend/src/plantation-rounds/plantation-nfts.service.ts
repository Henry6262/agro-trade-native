import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlantationNftsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortfolio(userId: string) {
    return this.prisma.plantationNft.findMany({
      where: { ownerId: userId },
      include: { round: true, staking: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assertOwner(tokenId: number, userId: string) {
    const nft = await this.prisma.plantationNft.findUnique({ where: { tokenId } });
    if (!nft) throw new NotFoundException(`NFT token ${tokenId} not found`);
    if (nft.ownerId !== userId) throw new ForbiddenException('Not your NFT');
    return nft;
  }
}
