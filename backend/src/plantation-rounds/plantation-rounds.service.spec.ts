// backend/src/plantation-rounds/plantation-rounds.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PlantationRoundStatus } from '@prisma/client';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlantationRoundsService } from './plantation-rounds.service';
import { PrismaService } from '../prisma/prisma.service';

const mockRound = {
  id: 'round-1',
  onChainRoundId: 0,
  sellerId: 'seller-1',
  cropType: 'avocado',
  farmLocation: 'Kenya',
  targetCUSD: 200,
  pricePerShareCUSD: 50,
  totalShares: 4,
  sharesSold: 0,
  harvestDeadline: new Date('2027-01-01'),
  projectedApyPct: null,
  status: PlantationRoundStatus.OPEN,
  metadataUri: null,
  contractAddress: '0xContract',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makePrismaMock = () => ({
  plantationRound: {
    create: jest.fn().mockResolvedValue(mockRound),
    findUnique: jest.fn().mockResolvedValue(mockRound),
    findMany: jest.fn().mockResolvedValue([mockRound]),
    update: jest.fn().mockResolvedValue({ ...mockRound, status: PlantationRoundStatus.ACTIVE }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  plantationNft: {
    create: jest.fn().mockResolvedValue({ id: 'nft-1', tokenId: -1 }),
    findMany: jest.fn().mockResolvedValue([]),
  },
  $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
});

const makeConfigMock = () => ({
  get: jest.fn((key: string) => {
    const vals: Record<string, string> = {
      CELO_RPC_URL: 'https://forno.celo-sepolia.celo-testnet.org',
      CELO_ADMIN_PRIVATE_KEY: '0x' + 'a'.repeat(64),
      PLANTATION_ROUND_CONTRACT_ADDRESS: '0xContract',
    };
    return vals[key];
  }),
});

describe('PlantationRoundsService', () => {
  let service: PlantationRoundsService;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prismaMock = makePrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantationRoundsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: makeConfigMock() },
      ],
    }).compile();
    service = module.get(PlantationRoundsService);
  });

  describe('listRounds', () => {
    it('returns all rounds when no filter', async () => {
      const result = await service.listRounds({});
      expect(result).toHaveLength(1);
      expect(prismaMock.plantationRound.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('filters by cropType', async () => {
      await service.listRounds({ cropType: 'avocado' });
      expect(prismaMock.plantationRound.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cropType: 'avocado' } }),
      );
    });
  });

  describe('getRound', () => {
    it('returns round by id', async () => {
      const result = await service.getRound('round-1');
      expect(result.id).toBe('round-1');
    });

    it('throws NotFoundException for unknown id', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue(null);
      await expect(service.getRound('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('investInRound', () => {
    it('throws if round not found', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue(null);
      await expect(service.investInRound('bad', 'user-1', { shareCount: 1 })).rejects.toThrow(NotFoundException);
    });

    it('throws if round not OPEN', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue({ ...mockRound, status: PlantationRoundStatus.FUNDED });
      await expect(service.investInRound('round-1', 'user-1', { shareCount: 1 })).rejects.toThrow(BadRequestException);
    });

    it('throws if exceeds available shares', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue({ ...mockRound, sharesSold: 3 });
      await expect(service.investInRound('round-1', 'user-1', { shareCount: 2 })).rejects.toThrow(BadRequestException);
    });

    it('creates NFT records for each share', async () => {
      await service.investInRound('round-1', 'user-1', { shareCount: 2 });
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('distributeHarvest', () => {
    it('throws ForbiddenException if caller is not the farmer', async () => {
      await expect(
        service.distributeHarvest('round-1', 'other-user', { totalSaleCUSD: 300 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws if round is not ACTIVE', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue({
        ...mockRound,
        sellerId: 'seller-1',
        status: PlantationRoundStatus.OPEN,
      });
      await expect(
        service.distributeHarvest('round-1', 'seller-1', { totalSaleCUSD: 300 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates status to DISTRIBUTING for valid call', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue({
        ...mockRound,
        sellerId: 'seller-1',
        status: PlantationRoundStatus.ACTIVE,
      });
      await service.distributeHarvest('round-1', 'seller-1', { totalSaleCUSD: 300 });
      expect(prismaMock.plantationRound.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: PlantationRoundStatus.DISTRIBUTING } }),
      );
    });
  });
});
