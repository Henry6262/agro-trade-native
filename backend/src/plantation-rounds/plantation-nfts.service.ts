import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const UINT256_MAX =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

const normalizeTokenId = (tokenId: string): string => {
  if (!/^\d+$/.test(tokenId)) {
    throw new BadRequestException('Token ID must be an unsigned integer');
  }
  if (tokenId.length > 78) {
    throw new BadRequestException('Token ID exceeds uint256 range');
  }

  const parsed = BigInt(tokenId);
  if (parsed > UINT256_MAX) {
    throw new BadRequestException('Token ID exceeds uint256 range');
  }
  return parsed.toString();
};

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

  async assertOwner(tokenId: string, userId: string) {
    const canonicalTokenId = normalizeTokenId(tokenId);
    const nft = await this.prisma.plantationNft.findUnique({
      where: { tokenId: canonicalTokenId },
    });
    if (!nft) throw new NotFoundException(`NFT token ${tokenId} not found`);
    if (nft.ownerId !== userId) throw new ForbiddenException('Not your NFT');
    return nft;
  }
}
