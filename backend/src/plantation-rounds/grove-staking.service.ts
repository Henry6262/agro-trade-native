import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { PlantationNftsService } from './plantation-nfts.service';
import { GROVE_STAKING_ABI } from './constants/contracts.constant';

@Injectable()
export class GroveStakingService {
  private readonly logger = new Logger(GroveStakingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly nftsService: PlantationNftsService,
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
    const address = this.config.get<string>('GROVE_STAKING_CONTRACT_ADDRESS');
    if (!address) throw new BadRequestException('GROVE_STAKING_CONTRACT_ADDRESS not configured');
    return new ethers.Contract(address, GROVE_STAKING_ABI, signer ?? this.getProvider());
  }

  async stakeNft(tokenId: number, userId: string) {
    const nft = await this.nftsService.assertOwner(tokenId, userId);

    const existing = await this.prisma.stakingPosition.findUnique({ where: { nftId: nft.id } });
    if (existing && !existing.unstakedAt) throw new BadRequestException('Already staked');

    const position = await this.prisma.stakingPosition.upsert({
      where: { nftId: nft.id },
      update: { stakedAt: new Date(), unstakedAt: null, claimedCUSD: 0 },
      create: { nftId: nft.id },
    });

    // On-chain stake (fire-and-forget; user must have approved staking contract to take their NFT)
    this.getContract(this.getAdminWallet())
      .stake(tokenId)
      .then((tx: ethers.TransactionResponse) => tx.wait())
      .catch((err: Error) => this.logger.error(`On-chain stake failed for token ${tokenId}: ${err.message}`));

    return position;
  }

  async unstakeNft(tokenId: number, userId: string) {
    const nft = await this.nftsService.assertOwner(tokenId, userId);
    const position = await this.prisma.stakingPosition.findUnique({ where: { nftId: nft.id } });
    if (!position || position.unstakedAt) throw new BadRequestException('NFT is not staked');

    const updated = await this.prisma.stakingPosition.update({
      where: { nftId: nft.id },
      data: { unstakedAt: new Date() },
    });

    this.getContract(this.getAdminWallet())
      .unstake(tokenId)
      .then((tx: ethers.TransactionResponse) => tx.wait())
      .catch((err: Error) => this.logger.error(`On-chain unstake failed for token ${tokenId}: ${err.message}`));

    return updated;
  }

  async getPendingYield(tokenId: number, userId: string): Promise<string> {
    await this.nftsService.assertOwner(tokenId, userId);
    const contract = this.getContract();
    const pending: bigint = await contract.pendingYield(tokenId);
    return ethers.formatEther(pending); // cUSD string, human-readable
  }

  async claimYield(tokenId: number, userId: string) {
    const nft = await this.nftsService.assertOwner(tokenId, userId);
    const position = await this.prisma.stakingPosition.findUnique({ where: { nftId: nft.id } });
    if (!position || position.unstakedAt) throw new BadRequestException('NFT is not staked');

    const tx = await this.getContract(this.getAdminWallet()).claimYield(tokenId);
    await tx.wait();

    // DB: update claimedCUSD (approximate — exact value comes from event)
    return position;
  }
}
