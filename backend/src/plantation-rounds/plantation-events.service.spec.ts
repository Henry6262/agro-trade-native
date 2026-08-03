import { ConfigService } from '@nestjs/config';
import { PlantationRoundStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlantationEventsService } from './plantation-events.service';

const mockContractOn = jest.fn();

jest.mock('ethers', () => ({
  ethers: {
    WebSocketProvider: jest.fn().mockImplementation(() => ({})),
    Contract: jest.fn().mockImplementation(() => ({ on: mockContractOn })),
  },
}));

describe('PlantationEventsService', () => {
  beforeEach(() => {
    mockContractOn.mockReset();
  });

  it('reconciles RoundCreated after API reservations already funded the round', async () => {
    const fundedRound = {
      id: 'round-1',
      status: PlantationRoundStatus.FUNDED,
      onChainRoundId: null,
    };
    const prisma = {
      plantationRound: {
        findFirst: jest.fn().mockResolvedValue(fundedRound),
        update: jest.fn().mockResolvedValue({
          ...fundedRound,
          onChainRoundId: '42',
        }),
        updateMany: jest.fn(),
      },
      plantationNft: { updateMany: jest.fn() },
      $transaction: jest.fn(),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'CELO_RPC_URL') return 'wss://rpc.example.invalid';
        if (key === 'PLANTATION_ROUND_CONTRACT_ADDRESS') return '0xContract';
        return undefined;
      }),
    };
    const service = new PlantationEventsService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );

    service.onModuleInit();
    const roundCreatedHandler = mockContractOn.mock.calls.find(
      ([eventName]) => eventName === 'RoundCreated',
    )?.[1] as
      | ((
          roundId: bigint,
          farmer: string,
          cropType: string,
          targetCUSD: bigint,
        ) => Promise<void>)
      | undefined;

    expect(roundCreatedHandler).toBeDefined();
    await roundCreatedHandler?.(42n, '0xFarmer', 'avocado', 200n);

    expect(prisma.plantationRound.findFirst).toHaveBeenCalledWith({
      where: {
        onChainRoundId: null,
        cropType: 'avocado',
        status: {
          in: [PlantationRoundStatus.OPEN, PlantationRoundStatus.FUNDED],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(prisma.plantationRound.update).toHaveBeenCalledWith({
      where: { id: 'round-1' },
      data: { onChainRoundId: '42' },
    });
  });
});
