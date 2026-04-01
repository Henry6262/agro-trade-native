/**
 * Central mock for PrismaService — use in ALL unit tests.
 *
 * Usage:
 *   providers: [
 *     OrdersService,
 *     { provide: PrismaService, useValue: mockPrismaService },
 *   ],
 *
 * Reset between tests:
 *   beforeEach(() => jest.clearAllMocks());
 */
import { PrismaService } from '../prisma.service';

type MockFn = jest.MockedFunction<(...args: any[]) => any>;

function mockModel() {
  return {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  };
}

export const mockPrismaService: jest.Mocked<
  Pick<
    PrismaService,
    | 'tradeOperation'
    | 'buyListing'
    | 'saleListing'
    | 'product'
    | 'buyer'
    | 'seller'
    | 'user'
    | 'order'
    | 'negotiation'
    | 'inspection'
    | 'escrow'
    | 'notification'
    | '$transaction'
    | '$connect'
    | '$disconnect'
  >
> = {
  tradeOperation: mockModel() as any,
  buyListing: mockModel() as any,
  saleListing: mockModel() as any,
  product: mockModel() as any,
  buyer: mockModel() as any,
  seller: mockModel() as any,
  user: mockModel() as any,
  order: mockModel() as any,
  negotiation: mockModel() as any,
  inspection: mockModel() as any,
  escrow: mockModel() as any,
  notification: mockModel() as any,

  /**
   * $transaction mock — executes the callback synchronously in tests.
   * Supports both interactive-transactions and batch-array styles:
   *
   *   await prisma.$transaction(async (tx) => { ... })         // callback form
   *   await prisma.$transaction([op1, op2])                    // array form
   */
  $transaction: jest.fn().mockImplementation((arg: unknown) => {
    if (typeof arg === 'function') {
      // Pass the same mock back as the tx client
      return arg(mockPrismaService);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return Promise.resolve(arg);
  }) as MockFn,

  $connect: jest.fn().mockResolvedValue(undefined) as MockFn,
  $disconnect: jest.fn().mockResolvedValue(undefined) as MockFn,
};
