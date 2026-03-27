import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EscrowService } from './escrow.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mock factories ────────────────────────────────────────────────
const mockTxReceipt = { hash: '0xabc123', wait: jest.fn().mockResolvedValue({}) };

const makeContractMock = () => ({
  approve: jest.fn().mockResolvedValue(mockTxReceipt),
  createEscrow: jest.fn().mockResolvedValue(mockTxReceipt),
  releaseFunds: jest.fn().mockResolvedValue(mockTxReceipt),
  raiseDispute: jest.fn().mockResolvedValue(mockTxReceipt),
  resolveDispute: jest.fn().mockResolvedValue(mockTxReceipt),
  refund: jest.fn().mockResolvedValue(mockTxReceipt),
  getEscrow: jest.fn().mockResolvedValue([
    '0xBuyer', '0xSeller', BigInt(1000000000000000000), 1, 'trade-1',
  ]),
});

const makePrismaMock = () => ({
  tradeEvent: { create: jest.fn().mockResolvedValue({ id: 'evt-1' }) },
});

const makeConfigMock = (configured = true) => ({
  get: jest.fn((key: string) => {
    const vals: Record<string, string> = configured ? {
      ESCROW_CONTRACT_ADDRESS: '0xContract',
      BLOCKCHAIN_RPC_URL: 'https://rpc.test',
      ADMIN_WALLET_PRIVATE_KEY: '0xPrivateKey',
      CUSD_TOKEN_ADDRESS: '0xCusd',
    } : {};
    return vals[key] ?? '';
  }),
});

// Mock ethers module
jest.mock('ethers', () => ({
  id: jest.fn((s: string) => `0xkey_${s}`),
  parseUnits: jest.fn(() => BigInt(1000000000000000000)),
  JsonRpcProvider: jest.fn(),
  Wallet: jest.fn(),
  Contract: jest.fn().mockImplementation(() => makeContractMock()),
}));

// ─── Build module helper ─────────────────────────────────────────
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

// ─── TEST SUITE ─────────────────────────────────────────────────
describe('EscrowService', () => {
  let service: EscrowService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    const ctx = await buildModule();
    service = ctx.service;
    prisma = ctx.prisma;
  });

  // ---- DI bootstrap ----
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---- isConfigured ----
  describe('isConfigured()', () => {
    it('should return true when all blockchain env vars are set', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when blockchain env vars are missing', async () => {
      const ctx = await buildModule(false);
      expect(ctx.service.isConfigured()).toBe(false);
    });
  });

  // ---- createEscrow ----
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

    it('should throw when blockchain config is missing', async () => {
      const ctx = await buildModule(false);
      await expect(ctx.service.createEscrow('trade-1', '0xSeller', '100'))
        .rejects.toThrow(/config not set/i);
    });
  });

  // ---- releaseFunds ----
  describe('releaseFunds()', () => {
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
  });

  // ---- raiseDispute ----
  describe('raiseDispute()', () => {
    it('should raise dispute and return txHash', async () => {
      const result = await service.raiseDispute('trade-1');
      expect(result).toHaveProperty('txHash', '0xabc123');
    });

    it('should log DISPUTE_RAISED audit event', async () => {
      await service.raiseDispute('trade-1');
      expect(prisma.tradeEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'DISPUTE_RAISED',
          }),
        }),
      );
    });
  });

  // ---- resolveDispute ----
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
  });

  // ---- getStatus ----
  describe('getStatus()', () => {
    it('should return parsed escrow status from blockchain', async () => {
      const result = await service.getStatus('trade-1');
      expect(result.tradeOperationId).toBe('trade-1');
      expect(result.buyer).toBe('0xBuyer');
      expect(result.seller).toBe('0xSeller');
      expect(result.state).toBe('AWAITING_DELIVERY');
    });

    it('should map state index 0 to AWAITING_PAYMENT', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        getEscrow: jest.fn().mockResolvedValue([
          '0xB', '0xS', BigInt(0), 0, 'trade-2',
        ]),
      }));
      const ctx = await buildModule();
      const result = await ctx.service.getStatus('trade-2');
      expect(result.state).toBe('AWAITING_PAYMENT');
    });

    it('should map state index 2 to COMPLETE', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        getEscrow: jest.fn().mockResolvedValue([
          '0xB', '0xS', BigInt(0), 2, 'trade-3',
        ]),
      }));
      const ctx = await buildModule();
      const result = await ctx.service.getStatus('trade-3');
      expect(result.state).toBe('COMPLETE');
    });

    it('should map state index 3 to DISPUTED', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        getEscrow: jest.fn().mockResolvedValue([
          '0xB', '0xS', BigInt(0), 3, 'trade-4',
        ]),
      }));
      const ctx = await buildModule();
      const result = await ctx.service.getStatus('trade-4');
      expect(result.state).toBe('DISPUTED');
    });

    it('should map state index 4 to REFUNDED', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        getEscrow: jest.fn().mockResolvedValue([
          '0xB', '0xS', BigInt(0), 4, 'trade-5',
        ]),
      }));
      const ctx = await buildModule();
      const result = await ctx.service.getStatus('trade-5');
      expect(result.state).toBe('REFUNDED');
    });

    it('should return UNKNOWN for invalid state index', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        getEscrow: jest.fn().mockResolvedValue([
          '0xB', '0xS', BigInt(0), 99, 'trade-6',
        ]),
      }));
      const ctx = await buildModule();
      const result = await ctx.service.getStatus('trade-6');
      expect(result.state).toBe('UNKNOWN');
    });
  });

  // ---- Blockchain TX failure regression ----
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
  });
}); // end describe EscrowService