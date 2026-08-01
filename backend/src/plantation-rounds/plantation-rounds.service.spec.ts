// backend/src/plantation-rounds/plantation-rounds.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PlantationRoundStatus } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PlantationRoundsService } from './plantation-rounds.service';
import { PrismaService } from '../prisma/prisma.service';

const mockRound = {
  id: 'round-1',
  onChainRoundId: null,
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

const makePrismaMock = () => {
  const mock = {
    plantationRound: {
      create: jest.fn().mockResolvedValue(mockRound),
      findUnique: jest.fn().mockResolvedValue(mockRound),
      findMany: jest.fn().mockResolvedValue([mockRound]),
      update: jest.fn().mockResolvedValue({
        ...mockRound,
        status: PlantationRoundStatus.ACTIVE,
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    plantationNft: {
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: `nft-${data.shareIndex}`,
          ...data,
          createdAt: new Date(),
        }),
      ),
    },
    $transaction: jest.fn(),
  };
  mock.$transaction.mockImplementation((callback) => callback(mock));
  return mock;
};

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

    it('atomically reserves shares and creates nullable NFT records', async () => {
      const result = await service.investInRound('round-1', 'user-1', {
        shareCount: 2,
      });

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.plantationRound.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'round-1',
          status: PlantationRoundStatus.OPEN,
          sharesSold: 0,
          totalShares: { gte: 2 },
        },
        data: { sharesSold: { increment: 2 } },
      });
      expect(prismaMock.plantationNft.create).toHaveBeenNthCalledWith(1, {
        data: {
          tokenId: null,
          roundId: 'round-1',
          ownerId: 'user-1',
          shareIndex: 0,
        },
      });
      expect(prismaMock.plantationNft.create).toHaveBeenNthCalledWith(2, {
        data: {
          tokenId: null,
          roundId: 'round-1',
          ownerId: 'user-1',
          shareIndex: 1,
        },
      });
      expect(result).toHaveLength(2);
    });

    it('marks the round funded when the last share is reserved', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue({
        ...mockRound,
        sharesSold: 3,
      });

      await service.investInRound('round-1', 'user-1', { shareCount: 1 });

      expect(prismaMock.plantationRound.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            sharesSold: { increment: 1 },
            status: PlantationRoundStatus.FUNDED,
          },
        }),
      );
    });

    it('retries from a fresh snapshot after a concurrent reservation', async () => {
      prismaMock.plantationRound.updateMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 1 });

      await service.investInRound('round-1', 'user-1', { shareCount: 1 });

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
      expect(prismaMock.plantationNft.create).toHaveBeenCalledTimes(1);
    });

    it('returns a conflict after bounded reservation contention', async () => {
      prismaMock.plantationRound.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.investInRound('round-1', 'user-1', { shareCount: 1 }),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(3);
      expect(prismaMock.plantationNft.create).not.toHaveBeenCalled();
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
        onChainRoundId: '0',
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
