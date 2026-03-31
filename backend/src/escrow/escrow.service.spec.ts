import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EscrowService } from './escrow.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mock factories ────────────────────────────────────────────────────────────
const mockTxReceipt = { hash: '0xabc123', wait: jest.fn().mockResolvedValue({}) };

const makeContractMock = () => ({
  approve: jest.fn().mockResolvedValue(mockTxReceipt),
  createEscrow: jest.fn().mockResolvedValue(mockTxReceipt),
  releaseFunds: jest.fn().mockResolvedValue(mockTxReceipt),
  raiseDispute: jest.fn().mockResolvedValue(mockTxReceipt),
  resolveDispute: jest.fn().mockResolvedValue(mockTxReceipt),
  refund: jest.fn().mockResolvedValue(mockTxReceipt),
  getEscrow: jest.fn().mockResolvedValue([
    '0xBuyer', '0xSeller', BigInt(1_000_000_000_000_000_000), 1, 'trade-1',
  ]),
});

/** POINT 1: Full PrismaService mock — all tables used by EscrowService */
const makePrismaMock = () => ({
  tradeEvent: {
    create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
  },
  trade: {
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({}),
  },
  escrow: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  },
  inspection: {
    findFirst: jest.fn().mockResolvedValue({ id: 'insp-1', status: 'COMPLETED' }),
  },
  $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) =>
    typeof fn === 'function' ? fn({}) : Promise.all(fn as Promise<unknown>[]),
  ),
});

const makeConfigMock = (configured = true) => ({
  get: jest.fn((key: string) => {
    const vals: Record<string, string> = configured
      ? {
          ESCROW_CONTRACT_ADDRESS: '0xContract',
          BLOCKCHAIN_RPC_URL: 'https://rpc.test',
          ADMIN_WALLET_PRIVATE_KEY: '0xPrivateKey',
          CUSD_TOKEN_ADDRESS: '0xCusd',
        }
      : {};
    return vals[key] ?? '';
  }),
});

// Mock ethers module
jest.mock('ethers', () => ({
  id: jest.fn((s: string) => `0xkey_${s}`),
  parseUnits: jest.fn(() => BigInt(1_000_000_000_000_000_000)),
  JsonRpcProvider: jest.fn(),
  Wallet: jest.fn(),
  Contract: jest.fn().mockImplementation(() => makeContractMock()),
}));

// ─── Build module helper ───────────────────────────────────────────────────────
async function buildModule(configured = true) {
  const prismaMock = makePrismaMock();
  const configMock = makeConfigMock(configured);
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      EscrowService,
      { provide: PrismaService, useValue: prismaMock },
      { provide: ConfigService, useValue: configMock },
    ],
  }).compile();

  return {
    service: module.get<EscrowService>(EscrowService),
    prisma: prismaMock,
    config: configMock,
  };
}

// ─── TEST SUITE ────────────────────────────────────────────────────────────────
describe('EscrowService', () => {
  let service: EscrowService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    const ctx = await buildModule();
    service = ctx.service;
    prisma = ctx.prisma;
  });

  /** POINT 3: afterEach clearAllMocks — absolutely clean state between cases */
  afterEach(() => jest.clearAllMocks());

  // ── DI bootstrap ──────────────────────────────────────────────────────────
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── isConfigured() ────────────────────────────────────────────────────────
  describe('isConfigured()', () => {
    it('should return true when all blockchain env vars are set', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when blockchain env vars are missing', async () => {
      const ctx = await buildModule(false);
      expect(ctx.service.isConfigured()).toBe(false);
    });
  });

  // ── createEscrow() ────────────────────────────────────────────────────────
  describe('createEscrow()', () => {
    it('should approve cUSD and create escrow on blockchain', async () => {
      const result = await service.createEscrow('trade-1', '0xSeller', '100');
      expect(result).toHaveProperty('txHash', '0xabc123');
    });

    it('should log PAYMENT_ESCROWED audit event to Prisma', async () => {
      await service.createEscrow('trade-1', '0xSeller', '100');
      expect(prisma.tradeEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tradeOperationId: 'trade-1',
            eventType: 'PAYMENT_ESCROWED',
            actorRole: 'ADMIN',
          }),
        }),
      );
    });

    /** POINT 4: config-missing path for every public method */
    it('should throw when blockchain config is missing', async () => {
      const ctx = await buildModule(false);
      await expect(ctx.service.createEscrow('trade-1', '0xSeller', '100'))
        .rejects.toThrow(/config not set/i);
    });
  });

  // ── releaseFunds() ────────────────────────────────────────────────────────
  describe('releaseFunds()', () => {
    /** POINT 2: Always seed inspection mock when guard logic may check it */
    beforeEach(() => {
      prisma.inspection.findFirst.mockResolvedValue({ id: 'insp-1', status: 'COMPLETED' });
    });

    it('should release funds and return txHash', async () => {
      const result = await service.releaseFunds('trade-1');
      expect(result).toHaveProperty('txHash', '0xabc123');
    });

    it('should log PAYMENT_RELEASED audit event', async () => {
      await service.releaseFunds('trade-1');
      expect(prisma.tradeEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'PAYMENT_RELEASED',
            actorRole: 'ADMIN',
          }),
        }),
      );
    });

    /** POINT 4 */
    it('should throw when blockchain config is missing', async () => {
      const ctx = await buildModule(false);
      await expect(ctx.service.releaseFunds('trade-99'))
        .rejects.toThrow(/config not set/i);
    });
  });

  // ── raiseDispute() ────────────────────────────────────────────────────────
  describe('raiseDispute()', () => {
    it('should raise dispute and return txHash', async () => {
      const result = await service.raiseDispute('trade-1');
      expect(result).toHaveProperty('txHash', '0xabc123');
    });

    it('should log DISPUTE_RAISED audit event', async () => {
      await service.raiseDispute('trade-1');
      expect(prisma.tradeEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'DISPUTE_RAISED' }),
        }),
      );
    });

    /** POINT 4 */
    it('should throw when blockchain config is missing', async () => {
      const ctx = await buildModule(false);
      await expect(ctx.service.raiseDispute('trade-99'))
        .rejects.toThrow(/config not set/i);
    });
  });

  // ── resolveDispute() ──────────────────────────────────────────────────────
  describe('resolveDispute()', () => {
    it('should resolve dispute with releaseToBuyer=true', async () => {
      const result = await service.resolveDispute('trade-1', true);
      expect(result).toHaveProperty('txHash', '0xabc123');
    });

    it('should resolve dispute with releaseToBuyer=false (seller gets funds)', async () => {
      const result = await service.resolveDispute('trade-1', false);
      expect(result).toHaveProperty('txHash');
    });

    it('should log resolvedToBuyer metadata in audit event', async () => {
      await service.resolveDispute('trade-1', true);
      expect(prisma.tradeEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({ resolvedToBuyer: true }),
          }),
        }),
      );
    });

    /** POINT 4 */
    it('should throw when blockchain config is missing', async () => {
      const ctx = await buildModule(false);
      await expect(ctx.service.resolveDispute('trade-99', true))
        .rejects.toThrow(/config not set/i);
    });
  });

  // ── refund() ──────────────────────────────────────────────────────────────
  describe('refund()', () => {
    it('should execute refund and return txHash', async () => {
      const result = await service.refund('trade-1');
      expect(result).toHaveProperty('txHash', '0xabc123');
    });

    it('should log PAYMENT_REFUNDED audit event', async () => {
      await service.refund('trade-1');
      expect(prisma.tradeEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'PAYMENT_REFUNDED', actorRole: 'ADMIN' }),
        }),
      );
    });

    /** POINT 4 */
    it('should throw when blockchain config is missing', async () => {
      const ctx = await buildModule(false);
      await expect(ctx.service.refund('trade-99'))
        .rejects.toThrow(/config not set/i);
    });
  });

  // ── getStatus() ───────────────────────────────────────────────────────────
  describe('getStatus()', () => {
    it('should return parsed escrow status from blockchain', async () => {
      const result = await service.getStatus('trade-1');
      expect(result.tradeOperationId).toBe('trade-1');
      expect(result.buyer).toBe('0xBuyer');
      expect(result.seller).toBe('0xSeller');
      expect(result.state).toBe('AWAITING_DELIVERY');
    });

    /** POINT 5: .each tabular test — exhaustive state machine branch coverage */
    it.each([
      [0, 'AWAITING_PAYMENT'],
      [1, 'AWAITING_DELIVERY'],
      [2, 'COMPLETE'],
      [3, 'DISPUTED'],
      [4, 'REFUNDED'],
      [99, 'UNKNOWN'],
    ])('should map blockchain state index %i → "%s"', async (stateIndex, expectedState) => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        getEscrow: jest.fn().mockResolvedValue([
          '0xB', '0xS', BigInt(0), stateIndex, `trade-state-${stateIndex}`,
        ]),
      }));
      const ctx = await buildModule();
      const result = await ctx.service.getStatus(`trade-state-${stateIndex}`);
      expect(result.state).toBe(expectedState);
    });

    /** POINT 4 */
    it('should throw when blockchain config is missing', async () => {
      const ctx = await buildModule(false);
      await expect(ctx.service.getStatus('trade-99'))
        .rejects.toThrow(/config not set/i);
    });
  });

  // ── Blockchain TX failure regression ──────────────────────────────────────
  describe('blockchain failure handling', () => {
    it('should propagate tx revert error on createEscrow', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        approve: jest.fn().mockRejectedValue(new Error('tx reverted')),
      }));
      const ctx = await buildModule();
      await expect(ctx.service.createEscrow('t-1', '0xS', '10'))
        .rejects.toThrow('tx reverted');
    });

    it('should propagate error on releaseFunds failure', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        releaseFunds: jest.fn().mockRejectedValue(new Error('already released')),
      }));
      const ctx = await buildModule();
      await expect(ctx.service.releaseFunds('t-1'))
        .rejects.toThrow('already released');
    });

    it('should propagate error on raiseDispute failure', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        raiseDispute: jest.fn().mockRejectedValue(new Error('dispute already open')),
      }));
      const ctx = await buildModule();
      await expect(ctx.service.raiseDispute('t-1'))
        .rejects.toThrow('dispute already open');
    });

    it('should propagate error on refund failure', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        refund: jest.fn().mockRejectedValue(new Error('not refundable')),
      }));
      const ctx = await buildModule();
      await expect(ctx.service.refund('t-1'))
        .rejects.toThrow('not refundable');
    });
  });
}); // end describe EscrowService
