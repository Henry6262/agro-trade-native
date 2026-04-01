import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { NegotiationService } from './negotiation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfitCalculationService } from '../../trade-operations/services/profit-calculation.service';
import { InspectionService } from '../../inspections/inspection.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { NegotiationStatus, TradeStatus, SellerStatus, InspectionPriority } from '@prisma/client';

// ─── Factories ───────────────────────────────────────────────────────────────

const makeSeller = (override: Partial<any> = {}) => ({
  id: 'seller-1',
  name: 'Test Seller',
  email: 'seller@test.com',
  ...override,
});

const makeSaleListing = (override: Partial<any> = {}) => ({
  id: 'listing-1',
  quantity: 100,
  askingPrice: 200,
  sellerId: 'seller-1',
  productId: 'product-1',
  status: 'ACTIVE',
  qualityScore: null,
  qualityGrade: null,
  unit: 'TON',
  seller: makeSeller(),
  ...override,
});

const makeTradeSeller = (override: Partial<any> = {}) => ({
  id: 'trade-seller-1',
  sellerId: 'seller-1',
  saleListingId: 'listing-1',
  requestedQuantity: 50,
  offeredQuantity: 100,
  status: 'INVITED',
  agreedPrice: null,
  agreedQuantity: null,
  isVerified: false,
  seller: makeSeller(),
  saleListing: makeSaleListing(),
  ...override,
});

const makeBuyListing = (override: Partial<any> = {}) => ({
  id: 'buy-listing-1',
  productId: 'product-1',
  quantity: 100,
  neededBy: null,
  ...override,
});

const makeTrade = (override: Partial<any> = {}) => ({
  id: 'trade-1',
  status: TradeStatus.ACTIVE,
  sellingPrice: 300,
  estimatedTransportCost: 500,
  avgPurchasePrice: 200,
  buyListing: makeBuyListing(),
  sellers: [makeTradeSeller()],
  ...override,
});

const makeNegotiation = (override: Partial<any> = {}) => ({
  id: 'nego-1',
  tradeOperationId: 'trade-1',
  tradeSellerId: 'trade-seller-1',
  status: NegotiationStatus.PENDING,
  currentOffer: { price: 200, quantity: 50, terms: 'Standard terms', createdAt: new Date().toISOString() },
  counterOffer: null,
  offerHistory: [{ price: 200, quantity: 50, terms: 'Standard terms', createdAt: new Date().toISOString() }],
  finalPrice: null,
  finalQuantity: null,
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  extensionCount: 0,
  createdAt: new Date(),
  tradeSeller: makeTradeSeller(),
  tradeOperation: makeTrade(),
  ...override,
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  tradeOperation: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  tradeSeller: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  offerNegotiation: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  saleListing: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  inspectionRequest: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn((fn: any) => fn(mockPrisma)),
};

const mockRealtimeService = {
  emitToUser: jest.fn(),
};

const mockInspectionService = {
  createInspectionRequest: jest.fn().mockResolvedValue({ id: 'inspection-1' }),
};

const mockProfitCalculationService = {};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('NegotiationService', () => {
  let service: NegotiationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NegotiationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProfitCalculationService, useValue: mockProfitCalculationService },
        { provide: InspectionService, useValue: mockInspectionService },
        { provide: RealtimeService, useValue: mockRealtimeService },
      ],
    }).compile();

    service = module.get<NegotiationService>(NegotiationService);
  });

  // ── sendOffer ──────────────────────────────────────────────────────────────

  describe('sendOffer', () => {
    const dto = { tradeSellerId: 'trade-seller-1', price: 200, quantity: 50 };

    it('creates a negotiation and emits offer:new event', async () => {
      const trade = makeTrade();
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(trade);
      mockPrisma.offerNegotiation.findFirst.mockResolvedValue(null);
      const nego = makeNegotiation();
      mockPrisma.offerNegotiation.create.mockResolvedValue(nego);
      mockPrisma.tradeSeller.update.mockResolvedValue({});

      const result = await service.sendOffer('trade-1', dto);

      expect(result.status).toBe(NegotiationStatus.PENDING);
      expect(mockPrisma.offerNegotiation.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.tradeSeller.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: SellerStatus.NEGOTIATING } }),
      );
      expect(mockRealtimeService.emitToUser).toHaveBeenCalledWith(
        nego.tradeSeller.seller.id,
        'offer:new',
        expect.any(Object),
      );
    });

    it('throws NotFoundException when trade does not exist', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(null);
      await expect(service.sendOffer('bad-id', dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when trade is not ACTIVE', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(
        makeTrade({ status: TradeStatus.COMPLETED }),
      );
      await expect(service.sendOffer('trade-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when tradeSeller not part of trade', async () => {
      const trade = makeTrade({ sellers: [] });
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(trade);
      await expect(service.sendOffer('trade-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when negotiation already exists for seller', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(makeTrade());
      mockPrisma.offerNegotiation.findFirst.mockResolvedValue(makeNegotiation());
      await expect(service.sendOffer('trade-1', dto)).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when price <= 0', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(makeTrade());
      mockPrisma.offerNegotiation.findFirst.mockResolvedValue(null);
      await expect(service.sendOffer('trade-1', { ...dto, price: 0 })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when quantity <= 0', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(makeTrade());
      mockPrisma.offerNegotiation.findFirst.mockResolvedValue(null);
      await expect(service.sendOffer('trade-1', { ...dto, quantity: -5 })).rejects.toThrow(BadRequestException);
    });

    it('sets default terms when none provided', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(makeTrade());
      mockPrisma.offerNegotiation.findFirst.mockResolvedValue(null);
      mockPrisma.offerNegotiation.create.mockResolvedValue(makeNegotiation());
      mockPrisma.tradeSeller.update.mockResolvedValue({});

      await service.sendOffer('trade-1', { ...dto, terms: undefined });

      const createCall = mockPrisma.offerNegotiation.create.mock.calls[0][0];
      expect((createCall.data.currentOffer as any).terms).toBe('Standard terms');
    });
  });

  // ── sendBatchOffers ────────────────────────────────────────────────────────

  describe('sendBatchOffers', () => {
    it('returns correct created/failed counts on mixed results', async () => {
      const dto1 = { tradeSellerId: 'trade-seller-1', price: 200, quantity: 50 };
      const dto2 = { tradeSellerId: 'bad-seller', price: 200, quantity: 50 };

      // First offer succeeds
      const trade = makeTrade();
      mockPrisma.tradeOperation.findUnique
        .mockResolvedValueOnce(trade)
        .mockResolvedValueOnce(trade);
      mockPrisma.offerNegotiation.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.offerNegotiation.create.mockResolvedValueOnce(makeNegotiation());
      mockPrisma.tradeSeller.update.mockResolvedValue({});

      // Second offer fails (seller not in trade)
      mockPrisma.tradeOperation.findUnique.mockResolvedValueOnce(
        makeTrade({ sellers: [] }),
      );

      const result = await service.sendBatchOffers('trade-1', [dto1, dto2]);

      expect(result.created).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].tradeSellerId).toBe('bad-seller');
    });
  });

  // ── getNegotiations ────────────────────────────────────────────────────────

  describe('getNegotiations', () => {
    it('returns summary with status counts', async () => {
      const trade = makeTrade({ buyListing: makeBuyListing() });
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(trade);

      const negotiations = [
        makeNegotiation({ status: NegotiationStatus.PENDING }),
        makeNegotiation({ id: 'nego-2', status: NegotiationStatus.ACCEPTED, finalPrice: 200, finalQuantity: 50 }),
      ];
      mockPrisma.offerNegotiation.findMany.mockResolvedValue(negotiations);
      mockPrisma.offerNegotiation.count.mockResolvedValue(2);
      mockPrisma.tradeSeller.count
        .mockResolvedValueOnce(1)  // allSellers
        .mockResolvedValueOnce(0); // acceptedSellers

      const result = await service.getNegotiations('trade-1');

      expect(result.tradeOperationId).toBe('trade-1');
      expect(result.totalNegotiations).toBe(2);
      expect(result.summary.pending).toBe(1);
      expect(result.summary.accepted).toBe(1);
    });

    it('throws NotFoundException for unknown trade', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(null);
      await expect(service.getNegotiations('bad-trade')).rejects.toThrow(NotFoundException);
    });

    it('filters by status array', async () => {
      const trade = makeTrade({ buyListing: makeBuyListing() });
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(trade);
      mockPrisma.offerNegotiation.findMany.mockResolvedValue([]);
      mockPrisma.offerNegotiation.count.mockResolvedValue(0);
      mockPrisma.tradeSeller.count.mockResolvedValue(0);

      await service.getNegotiations('trade-1', [NegotiationStatus.PENDING, NegotiationStatus.COUNTERED]);

      const whereArg = mockPrisma.offerNegotiation.findMany.mock.calls[0][0].where;
      expect(whereArg.status).toEqual({ in: [NegotiationStatus.PENDING, NegotiationStatus.COUNTERED] });
    });

    it('includes phaseTransition when all sellers accepted', async () => {
      const trade = makeTrade({ buyListing: makeBuyListing() });
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(trade);
      mockPrisma.offerNegotiation.findMany.mockResolvedValue([]);
      mockPrisma.offerNegotiation.count.mockResolvedValue(0);
      mockPrisma.tradeSeller.count
        .mockResolvedValueOnce(2)  // all
        .mockResolvedValueOnce(2); // accepted

      const result = await service.getNegotiations('trade-1');

      expect(result.phaseTransition?.allSellersAccepted).toBe(true);
      expect(result.phaseTransition?.nextPhase).toBe('INSPECTION_REQUIRED');
    });
  });

  // ── getNegotiationById ─────────────────────────────────────────────────────

  describe('getNegotiationById', () => {
    it('returns formatted negotiation with profit impact', async () => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(makeNegotiation());
      const result = await service.getNegotiationById('nego-1');
      expect(result.id).toBe('nego-1');
      expect(result.profitImpact).toBeDefined();
    });

    it('throws NotFoundException for unknown negotiation', async () => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(null);
      await expect(service.getNegotiationById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── counterOffer ───────────────────────────────────────────────────────────

  describe('counterOffer', () => {
    const counterDto = { price: 190, quantity: 50 };

    it('successfully counters a PENDING negotiation', async () => {
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING });
      const updated = makeNegotiation({ status: NegotiationStatus.COUNTERED, counterOffer: counterDto });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      const result = await service.counterOffer('nego-1', counterDto);

      expect(result.status).toBe(NegotiationStatus.COUNTERED);
    });

    it('successfully counters a COUNTERED negotiation', async () => {
      const nego = makeNegotiation({
        status: NegotiationStatus.COUNTERED,
        counterOffer: { price: 195, quantity: 50, offeredBy: 'SELLER' },
      });
      const updated = makeNegotiation({ status: NegotiationStatus.COUNTERED });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      await expect(service.counterOffer('nego-1', counterDto)).resolves.not.toThrow();
    });

    it('appends to offerHistory on counter', async () => {
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockImplementation(({ data }) => {
        return Promise.resolve({ ...nego, ...data, tradeSeller: nego.tradeSeller, tradeOperation: nego.tradeOperation });
      });

      await service.counterOffer('nego-1', counterDto);

      const updateData = mockPrisma.offerNegotiation.update.mock.calls[0][0].data;
      expect((updateData.offerHistory as any[]).length).toBeGreaterThan(nego.offerHistory.length);
    });

    it('adds profit warning when margin < MIN_PROFIT_MARGIN (5%)', async () => {
      // sellingPrice=210, price=200, quantity=50 → revenue=10500, cost=10000, transport=500 → profit=0 → 0%
      const trade = makeTrade({ sellingPrice: 210, estimatedTransportCost: 500 });
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING, tradeOperation: trade });
      const updated = makeNegotiation({ status: NegotiationStatus.COUNTERED, tradeOperation: trade });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      const result = await service.counterOffer('nego-1', { price: 200, quantity: 50 });

      // profitMargin = (10500-10000-500)/10500 * 100 = 0% < 5%
      expect(result.profitImpact?.warning).toBeDefined();
    });

    it.each([
      [NegotiationStatus.ACCEPTED, 'Cannot counter an accepted negotiation'],
      [NegotiationStatus.REJECTED, 'Cannot counter a rejected negotiation'],
      [NegotiationStatus.EXPIRED, 'Negotiation has expired'],
    ])('throws BadRequestException for status=%s', async (status, _msg) => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(makeNegotiation({ status }));
      await expect(service.counterOffer('nego-1', counterDto)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for unknown negotiation', async () => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(null);
      await expect(service.counterOffer('bad-id', counterDto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when counter price <= 0', async () => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(makeNegotiation());
      await expect(service.counterOffer('nego-1', { price: 0, quantity: 50 })).rejects.toThrow(BadRequestException);
    });
  });

  // ── acceptOffer ────────────────────────────────────────────────────────────

  describe('acceptOffer', () => {
    beforeEach(() => {
      mockPrisma.tradeSeller.update.mockResolvedValue({});
      mockPrisma.tradeOperation.update.mockResolvedValue({});
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(
        makeTrade({ sellers: [{ ...makeTradeSeller(), status: SellerStatus.ACCEPTED, agreedPrice: 200, agreedQuantity: 50 }] }),
      );
      mockPrisma.tradeSeller.findMany.mockResolvedValue([]);
      mockPrisma.saleListing.findUnique.mockResolvedValue(makeSaleListing());
      mockPrisma.inspectionRequest.findFirst.mockResolvedValue(null);
      mockPrisma.inspectionRequest = { findFirst: jest.fn().mockResolvedValue(null) } as any;
    });

    it('accepts PENDING offer, sets finalPrice/finalQuantity from currentOffer', async () => {
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING });
      const updated = makeNegotiation({
        status: NegotiationStatus.ACCEPTED,
        finalPrice: 200,
        finalQuantity: 50,
        tradeOperation: makeTrade({ sellers: [{ ...makeTradeSeller(), status: SellerStatus.ACCEPTED }] }),
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      const result = await service.acceptOffer('nego-1');

      expect(result.status).toBe(NegotiationStatus.ACCEPTED);
      expect(result.finalPrice).toBe(200);
    });

    it('accepts COUNTERED offer, uses counterOffer price/quantity', async () => {
      const nego = makeNegotiation({
        status: NegotiationStatus.COUNTERED,
        counterOffer: { price: 185, quantity: 50 },
      });
      const updated = makeNegotiation({
        status: NegotiationStatus.ACCEPTED,
        finalPrice: 185,
        finalQuantity: 50,
        tradeOperation: makeTrade({ sellers: [{ ...makeTradeSeller(), status: SellerStatus.ACCEPTED }] }),
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      const result = await service.acceptOffer('nego-1');

      expect(result.finalPrice).toBe(185);
    });

    it('emits offer:updated event after acceptance', async () => {
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING });
      const updated = makeNegotiation({
        status: NegotiationStatus.ACCEPTED,
        finalPrice: 200,
        finalQuantity: 50,
        tradeOperation: makeTrade({ sellers: [{ ...makeTradeSeller(), status: SellerStatus.ACCEPTED }] }),
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      await service.acceptOffer('nego-1');

      expect(mockRealtimeService.emitToUser).toHaveBeenCalledWith(
        expect.any(String),
        'offer:updated',
        expect.any(Object),
      );
    });

    it('includes phaseTransition when all sellers have accepted', async () => {
      const allAcceptedSellers = [
        { ...makeTradeSeller(), status: SellerStatus.ACCEPTED },
      ];
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING });
      const updated = makeNegotiation({
        status: NegotiationStatus.ACCEPTED,
        finalPrice: 200,
        finalQuantity: 50,
        tradeOperation: makeTrade({ sellers: allAcceptedSellers }),
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      const result = await service.acceptOffer('nego-1');

      expect((result as any).phaseTransition?.allSellersAccepted).toBe(true);
      expect((result as any).phaseTransition?.nextPhase).toBe('INSPECTION_REQUIRED');
    });

    it('includes quantityGap when finalQuantity < requestedQuantity', async () => {
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING, tradeSeller: makeTradeSeller({ requestedQuantity: 100 }) });
      const updated = makeNegotiation({
        status: NegotiationStatus.ACCEPTED,
        finalPrice: 200,
        finalQuantity: 40,
        tradeSeller: makeTradeSeller({ requestedQuantity: 100 }),
        tradeOperation: makeTrade({ sellers: [{ ...makeTradeSeller(), status: SellerStatus.ACCEPTED }] }),
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      const result = await service.acceptOffer('nego-1');

      expect((result as any).quantityGap?.shortfall).toBe(60);
    });

    it('throws BadRequestException when negotiation has expired (time-based)', async () => {
      const nego = makeNegotiation({
        status: NegotiationStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000), // already expired
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);

      await expect(service.acceptOffer('nego-1')).rejects.toThrow(BadRequestException);
    });

    it.each([
      [NegotiationStatus.ACCEPTED, 'Negotiation already accepted'],
      [NegotiationStatus.REJECTED, 'Cannot accept a rejected negotiation'],
      [NegotiationStatus.EXPIRED, 'Negotiation has expired'],
    ])('throws BadRequestException for status=%s', async (status) => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(makeNegotiation({ status }));
      await expect(service.acceptOffer('nego-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for unknown negotiation', async () => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(null);
      await expect(service.acceptOffer('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── rejectOffer ────────────────────────────────────────────────────────────

  describe('rejectOffer', () => {
    beforeEach(() => {
      mockPrisma.tradeSeller.update.mockResolvedValue({});
      mockPrisma.saleListing.update.mockResolvedValue({});
      mockPrisma.tradeSeller.findMany.mockResolvedValue([]);
      mockPrisma.saleListing.findMany.mockResolvedValue([]);
    });

    it('rejects negotiation, updates tradeSeller to REJECTED, re-activates listing', async () => {
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING });
      const updated = makeNegotiation({ status: NegotiationStatus.REJECTED });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      await service.rejectOffer('nego-1');

      expect(mockPrisma.tradeSeller.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: SellerStatus.REJECTED } }),
      );
      expect(mockPrisma.saleListing.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACTIVE' } }),
      );
    });

    it('emits offer:expired event after rejection', async () => {
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(makeNegotiation({ status: NegotiationStatus.REJECTED }));

      await service.rejectOffer('nego-1');

      expect(mockRealtimeService.emitToUser).toHaveBeenCalledWith(
        nego.tradeSeller.sellerId,
        'offer:expired',
        expect.objectContaining({ id: 'nego-1' }),
      );
    });

    it('includes replacementSuggestions when alternatives exist', async () => {
      const nego = makeNegotiation({ status: NegotiationStatus.PENDING });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(makeNegotiation({ status: NegotiationStatus.REJECTED }));
      mockPrisma.tradeSeller.findMany.mockResolvedValue([{ sellerId: 'seller-1' }]);
      mockPrisma.saleListing.findMany.mockResolvedValue([
        makeSaleListing({ id: 'alt-listing', sellerId: 'alt-seller', seller: makeSeller({ id: 'alt-seller', name: 'Alt Seller' }) }),
      ]);

      const result = await service.rejectOffer('nego-1');

      expect((result as any).replacementSuggestions?.available).toBe(true);
    });

    it.each([
      [NegotiationStatus.ACCEPTED],
      [NegotiationStatus.REJECTED],
    ])('throws BadRequestException for status=%s', async (status) => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(makeNegotiation({ status }));
      await expect(service.rejectOffer('nego-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for unknown negotiation', async () => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(null);
      await expect(service.rejectOffer('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── withdrawOffer ──────────────────────────────────────────────────────────

  describe('withdrawOffer', () => {
    beforeEach(() => {
      mockPrisma.tradeSeller.update.mockResolvedValue({});
      mockPrisma.saleListing.update.mockResolvedValue({});
    });

    it('withdraws negotiation and includes negotiationMetrics', async () => {
      const nego = makeNegotiation({
        status: NegotiationStatus.PENDING,
        offerHistory: [
          { price: 200, quantity: 50, createdAt: new Date().toISOString() },
          { price: 190, quantity: 50, createdAt: new Date().toISOString(), isCounterOffer: true },
        ],
      });
      const updated = makeNegotiation({ status: NegotiationStatus.WITHDRAWN });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);

      const result = await service.withdrawOffer('nego-1');

      expect(mockPrisma.tradeSeller.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: SellerStatus.WITHDRAWN } }),
      );
      expect((result as any).negotiationMetrics).toBeDefined();
      expect((result as any).negotiationMetrics.rounds).toBe(2);
    });

    it('negotiationMetrics priceRange reflects all offer prices', async () => {
      const nego = makeNegotiation({
        status: NegotiationStatus.COUNTERED,
        offerHistory: [
          { price: 220, quantity: 50 },
          { price: 180, quantity: 50 },
          { price: 195, quantity: 50 },
        ],
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(makeNegotiation({ status: NegotiationStatus.WITHDRAWN }));

      const result = await service.withdrawOffer('nego-1');

      expect((result as any).negotiationMetrics.priceRange.min).toBe(180);
      expect((result as any).negotiationMetrics.priceRange.max).toBe(220);
    });

    it.each([
      [NegotiationStatus.ACCEPTED],
      [NegotiationStatus.WITHDRAWN],
    ])('throws BadRequestException for status=%s', async (status) => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(makeNegotiation({ status }));
      await expect(service.withdrawOffer('nego-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for unknown negotiation', async () => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(null);
      await expect(service.withdrawOffer('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── extendExpiry ───────────────────────────────────────────────────────────

  describe('extendExpiry', () => {
    it('extends expiry by the given hours and returns extension metadata', async () => {
      const originalExpiry = new Date(Date.now() + 10 * 60 * 60 * 1000);
      const nego = makeNegotiation({ expiresAt: originalExpiry, extensionCount: 0 });
      const updatedExpiry = new Date(originalExpiry.getTime() + 24 * 60 * 60 * 1000);
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(
        makeNegotiation({ expiresAt: updatedExpiry }),
      );

      const result = await service.extendExpiry('nego-1', 24);

      expect((result as any).extension.extensionHours).toBe(24);
      expect((result as any).extension.totalExtensions).toBe(1);
    });

    it('throws BadRequestException when MAX_EXTENSIONS (2) reached', async () => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(
        makeNegotiation({ extensionCount: 2 }),
      );
      await expect(service.extendExpiry('nego-1', 24)).rejects.toThrow(BadRequestException);
    });

    it('allows up to MAX_EXTENSIONS (2) extensions', async () => {
      const nego = makeNegotiation({ extensionCount: 1 });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(makeNegotiation());

      await expect(service.extendExpiry('nego-1', 24)).resolves.not.toThrow();
    });

    it('throws NotFoundException for unknown negotiation', async () => {
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(null);
      await expect(service.extendExpiry('bad-id', 24)).rejects.toThrow(NotFoundException);
    });
  });

  // ── autoCreateInspection (indirectly via acceptOffer) ─────────────────────

  describe('autoCreateInspection (via acceptOffer)', () => {
    const setupAcceptedNego = (saleListingOverride: Partial<any> = {}) => {
      const nego = makeNegotiation({
        status: NegotiationStatus.PENDING,
        tradeSeller: makeTradeSeller({ saleListingId: 'listing-1' }),
      });
      const updated = makeNegotiation({
        status: NegotiationStatus.ACCEPTED,
        finalPrice: 200,
        finalQuantity: 50,
        tradeOperation: makeTrade({ sellers: [{ ...makeTradeSeller(), status: SellerStatus.ACCEPTED }] }),
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      mockPrisma.offerNegotiation.update.mockResolvedValue(updated);
      mockPrisma.tradeSeller.update.mockResolvedValue({});
      mockPrisma.tradeOperation.update.mockResolvedValue({});
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(
        makeTrade({ sellers: [{ ...makeTradeSeller(), agreedPrice: 200, agreedQuantity: 50 }] }),
      );
      mockPrisma.saleListing.findUnique.mockResolvedValue(makeSaleListing(saleListingOverride));
      mockPrisma.inspectionRequest = { findFirst: jest.fn().mockResolvedValue(null) } as any;
      return nego;
    };

    it('creates inspection request when listing is not yet verified', async () => {
      setupAcceptedNego({ qualityScore: null, qualityGrade: null });
      await service.acceptOffer('nego-1');
      expect(mockInspectionService.createInspectionRequest).toHaveBeenCalledTimes(1);
    });

    it('skips inspection creation when listing is already verified', async () => {
      setupAcceptedNego({ qualityScore: 90, qualityGrade: 'A' });
      mockPrisma.tradeSeller.updateMany = jest.fn().mockResolvedValue({});
      await service.acceptOffer('nego-1');
      expect(mockInspectionService.createInspectionRequest).not.toHaveBeenCalled();
    });

    it('does NOT throw if inspection creation fails (non-blocking)', async () => {
      setupAcceptedNego();
      mockInspectionService.createInspectionRequest.mockRejectedValueOnce(new Error('Inspection service down'));
      await expect(service.acceptOffer('nego-1')).resolves.not.toThrow();
    });

    it('assigns HIGH priority when neededBy is within 3 days', async () => {
      setupAcceptedNego();
      const urgentTrade = makeTrade({
        sellers: [{ ...makeTradeSeller(), agreedPrice: 200, agreedQuantity: 50 }],
        buyListing: makeBuyListing({ neededBy: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) }),
      });
      mockPrisma.tradeOperation.findUnique
        .mockResolvedValueOnce(makeTrade({ sellers: [{ ...makeTradeSeller(), agreedPrice: 200, agreedQuantity: 50 }] }))
        .mockResolvedValueOnce(urgentTrade); // for autoCreateInspection

      await service.acceptOffer('nego-1');

      expect(mockInspectionService.createInspectionRequest).toHaveBeenCalledWith(
        expect.objectContaining({ priority: InspectionPriority.HIGH }),
      );
    });
  });

  // ── formatNegotiationWithDetails (expiry flags) ────────────────────────────

  describe('formatNegotiationWithDetails (expiry flags via getNegotiationById)', () => {
    it('sets isExpiringSoon=true when < 12h remain', async () => {
      const nego = makeNegotiation({
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6h from now
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      const result = await service.getNegotiationById('nego-1');
      expect(result.isExpiringSoon).toBe(true);
    });

    it('sets isExpiringSoon=false when > 12h remain', async () => {
      const nego = makeNegotiation({
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      const result = await service.getNegotiationById('nego-1');
      expect(result.isExpiringSoon).toBe(false);
    });

    it('clamps hoursUntilExpiry to 0 for already-expired negotiations', async () => {
      const nego = makeNegotiation({
        status: NegotiationStatus.EXPIRED,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000),
      });
      mockPrisma.offerNegotiation.findUnique.mockResolvedValue(nego);
      const result = await service.getNegotiationById('nego-1');
      expect(result.hoursUntilExpiry).toBe(0);
    });
  });

  // ── $transaction guard (regression) ───────────────────────────────────────

  describe('Prisma $transaction regression', () => {
    it('mockPrisma.$transaction delegates correctly to callback', async () => {
      const callbackFn = jest.fn().mockResolvedValue('ok');
      const result = await mockPrisma.$transaction(callbackFn);
      expect(callbackFn).toHaveBeenCalledWith(mockPrisma);
      expect(result).toBe('ok');
    });
  });
});
