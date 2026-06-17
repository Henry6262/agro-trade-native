// backend/src/plantation-rounds/grove-staking.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { GroveStakingService } from './grove-staking.service';
import { PlantationNftsService } from './plantation-nfts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockNft = { id: 'nft-1', tokenId: 42, roundId: 'round-1', ownerId: 'user-1', shareIndex: 0, createdAt: new Date() };
const mockPosition = { id: 'pos-1', nftId: 'nft-1', stakedAt: new Date(), unstakedAt: null, claimedCUSD: 0 };

const makeNftsMock = () => ({
  assertOwner: jest.fn().mockResolvedValue(mockNft),
});

const makePrismaMock = () => ({
  stakingPosition: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue(mockPosition),
    update: jest.fn().mockResolvedValue({ ...mockPosition, unstakedAt: new Date() }),
  },
});

const makeConfigMock = () => ({
  get: jest.fn((key: string) => {
    const vals: Record<string, string> = {
      CELO_RPC_URL: 'https://forno.celo-sepolia.celo-testnet.org',
      CELO_ADMIN_PRIVATE_KEY: '0x' + 'a'.repeat(64),
      GROVE_STAKING_CONTRACT_ADDRESS: '0xStaking',
    };
    return vals[key];
  }),
});

describe('GroveStakingService', () => {
  let service: GroveStakingService;
  let prismaMock: ReturnType<typeof makePrismaMock>;
  let nftsMock: ReturnType<typeof makeNftsMock>;

  beforeEach(async () => {
    prismaMock = makePrismaMock();
    nftsMock = makeNftsMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroveStakingService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: makeConfigMock() },
        { provide: PlantationNftsService, useValue: nftsMock },
      ],
    }).compile();

    service = module.get(GroveStakingService);
    // Prevent actual ethers calls
    jest.spyOn(service as any, 'getAdminWallet').mockImplementation(() => ({}));
    jest.spyOn(service as any, 'getContract').mockImplementation(() => ({
      stake: jest.fn().mockResolvedValue({ wait: jest.fn() }),
      unstake: jest.fn().mockResolvedValue({ wait: jest.fn() }),
      claimYield: jest.fn().mockResolvedValue({ wait: jest.fn() }),
      pendingYield: jest.fn().mockResolvedValue(BigInt('1000000000000000')),
    }));
  });

  it('stakeNft creates a DB staking position', async () => {
    await service.stakeNft(42, 'user-1');
    expect(prismaMock.stakingPosition.upsert).toHaveBeenCalled();
  });

  it('stakeNft throws if already staked', async () => {
    prismaMock.stakingPosition.findUnique.mockResolvedValue(mockPosition);
    await expect(service.stakeNft(42, 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('unstakeNft throws if not staked', async () => {
    await expect(service.unstakeNft(42, 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('unstakeNft sets unstakedAt', async () => {
    prismaMock.stakingPosition.findUnique.mockResolvedValue(mockPosition);
    await service.unstakeNft(42, 'user-1');
    expect(prismaMock.stakingPosition.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ unstakedAt: expect.any(Date) }) }),
    );
  });
});
