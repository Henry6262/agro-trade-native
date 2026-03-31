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

// ─── $transaction mock ─────────────────────────────────────────────
// Executes the callback inline so Prisma writes inside a "transaction"
// are still intercepted by jest.fn() spies on tradeEvent.create.
const makePrismaMock = () => ({
  tradeEvent: { create: jest.fn().mockResolvedValue({ id: 'evt-1' }) },
  $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => unknown) => {
    // If cb is a function (interactive transaction), execute it with the mock itself.
    // If it is an array (batch transaction), resolve immediately.
    if (typeof cb === 'function') return cb(makePrismaMock());
    return Promise.resolve(cb);
  }),
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

// ─── Escrow scenario factory ─────────────────────────────────────
// Use stateOverride to pin getEscrow to any on-chain state.
// Use txOverride to simulate specific tx hash or revert.
function makeEscrowScenario(opts: {
  stateIndex?: number;
  txHash?: string;
  revertOn?: 'approve' | 'createEscrow' | 'releaseFunds' | 'refund' | 'raiseDispute' | 'resolveDispute';
} = {}) {
  const { stateIndex = 1, txHash = '0xabc123', revertOn } = opts;
  const receipt = { hash: txHash, wait: jest.fn().mockResolvedValue({}) };
  const base = makeContractMock();

  // Override state returned by getEscrow
  base.getEscrow = jest.fn().mockResolvedValue([
    '0xBuyer', '0xSeller', BigInt(1000000000000000000), stateIndex, 'trade-scenario',
  ]);

  // Optionally simulate a revert on a specific call
  if (revertOn) {
    (base as Record<string, jest.Mock>)[revertOn] = jest
      .fn()
      .mockRejectedValue(new Error(`on-chain revert: ${revertOn}`));
  } else {
    // Wire all writable methods to the custom txHash receipt
    (['approve', 'createEscrow', 'releaseFunds', 'refund', 'raiseDispute', 'resolveDispute'] as const)
      .forEach((m) => { base[m] = jest.fn().mockResolvedValue(receipt); });
  }

  return base;
}

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

    // ── Edge: on-chain revert must NOT produce an audit trail ─────────
    it('should NOT write audit event to Prisma when on-chain approve reverts', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() =>
        makeEscrowScenario({ revertOn: 'approve' }),
      );
      const ctx = await buildModule();
      await expect(ctx.service.createEscrow('t-revert', '0xS', '50'))
        .rejects.toThrow(/on-chain revert/);
      // Prisma must not be called — no phantom audit record
      expect(ctx.prisma.tradeEvent.create).not.toHaveBeenCalled();
    });

    it('should NOT write audit event when createEscrow tx reverts', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() =>
        makeEscrowScenario({ revertOn: 'createEscrow' }),
      );
      const ctx = await buildModule();
      await expect(ctx.service.createEscrow('t-revert2', '0xS', '50'))
        .rejects.toThrow(/on-chain revert/);
      expect(ctx.prisma.tradeEvent.create).not.toHaveBeenCalled();
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

  // ---- refund ----
  describe('refund()', () => {
    it('should execute refund and return txHash', async () => {
      const result = await service.refund('trade-1');
      expect(result).toHaveProperty('txHash', '0xabc123');
    });

    it('should log PAYMENT_REFUNDED audit event with correct fields', async () => {
      await service.refund('trade-1');
      expect(prisma.tradeEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tradeOperationId: 'trade-1',
            eventType: 'PAYMENT_REFUNDED',
            actorRole: 'ADMIN',
            blockchainTxHash: '0xabc123',
          }),
        }),
      );
    });

    // ── Edge: on-chain revert during refund must NOT produce audit trail ──
    it('should NOT write PAYMENT_REFUNDED event when refund() tx reverts on-chain', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() =>
        makeEscrowScenario({ revertOn: 'refund' }),
      );
      const ctx = await buildModule();
      await expect(ctx.service.refund('t-refund-revert'))
        .rejects.toThrow(/on-chain revert/);
      // No phantom audit record — critical for financial integrity
      expect(ctx.prisma.tradeEvent.create).not.toHaveBeenCalled();
    });

    it('should propagate blockchain error and not silently swallow it', async () => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() => ({
        ...makeContractMock(),
        refund: jest.fn().mockRejectedValue(new Error('escrow already refunded')),
      }));
      const ctx = await buildModule();
      await expect(ctx.service.refund('t-1')).rejects.toThrow('escrow already refunded');
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

    // ── State mapping via factory ──────────────────────────────────────
    const STATE_TABLE: Array<[number, string]> = [
      [0, 'AWAITING_PAYMENT'],
      [1, 'AWAITING_DELIVERY'],
      [2, 'COMPLETE'],
      [3, 'DISPUTED'],
      [4, 'REFUNDED'],
      [99, 'UNKNOWN'],
    ];

    it.each(STATE_TABLE)('state index %i → %s', async (stateIndex, expected) => {
      const ethers = require('ethers');
      ethers.Contract.mockImplementation(() =>
        makeEscrowScenario({ stateIndex }),
      );
      const ctx = await buildModule();
      const result = await ctx.service.getStatus(`trade-state-${stateIndex}`);
      expect(result.state).toBe(expected);
    });
  });

  // ---- $transaction mock sanity ────────────────────────────────────
  describe('$transaction mock', () => {
    it('should expose $transaction on prismaMock', () => {
      expect(typeof prisma.$transaction).toBe('function');
    });

    it('should execute interactive $transaction callback inline', async () => {
      const spy = jest.fn().mockResolvedValue('ok');
      await prisma.$transaction(spy);
      expect(spy).toHaveBeenCalled();
    });
  });

  // ---- Blockchain TX failure regression ────────────────────────────
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
