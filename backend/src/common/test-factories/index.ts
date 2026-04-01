/**
 * Centralized test-factory functions for agro-trade-native.
 *
 * Every factory accepts a Partial<> override so callers can inject
 * only the fields they care about — all other fields get safe defaults.
 *
 * Example:
 *   const op = tradeOperationFactory({ status: 'COMPLETED' });
 */
import { TradeStatus } from '@prisma/client';

// ─── Primitive helpers ───────────────────────────────────────────────────────

let __seq = 0;
const seq = () => String(++__seq);
const uid = (prefix = 'id') => `${prefix}-${seq()}`;
const now = () => new Date('2025-01-01T00:00:00.000Z');

// ─── User / Buyer / Seller ────────────────────────────────────────────────────

export function userFactory(overrides: Record<string, unknown> = {}) {
  return {
    id: uid('user'),
    email: `user${seq()}@test.com`,
    name: 'Test User',
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

export function buyerFactory(overrides: Record<string, unknown> = {}) {
  const userId = uid('user');
  return {
    id: uid('buyer'),
    userId,
    companyName: 'Buyer Co',
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

export function sellerFactory(overrides: Record<string, unknown> = {}) {
  const userId = uid('user');
  return {
    id: uid('seller'),
    userId,
    companyName: 'Seller Co',
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

// ─── Product ──────────────────────────────────────────────────────────────────

export function productFactory(overrides: Record<string, unknown> = {}) {
  return {
    id: uid('prod'),
    name: 'Wheat',
    category: 'GRAIN',
    unit: 'TON',
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

// ─── BuyListing ───────────────────────────────────────────────────────────────

export function buyListingFactory(overrides: Record<string, unknown> = {}) {
  return {
    id: uid('buy'),
    buyerId: uid('buyer'),
    productId: uid('prod'),
    quantity: 100,
    pricePerUnit: 250,
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
    product: productFactory(),
    buyer: buyerFactory(),
    ...overrides,
  };
}

// ─── SaleListing ──────────────────────────────────────────────────────────────

export function saleListingFactory(overrides: Record<string, unknown> = {}) {
  return {
    id: uid('sale'),
    sellerId: uid('seller'),
    productId: uid('prod'),
    quantity: 200,
    pricePerUnit: 240,
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

// ─── TradeOperation ───────────────────────────────────────────────────────────

export function tradeOperationFactory(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: uid('trade'),
    buyListingId: uid('buy'),
    status: 'ACTIVE' as TradeStatus,
    totalAmount: 25000,
    createdAt: now(),
    updatedAt: now(),
    buyListing: buyListingFactory(),
    sellers: [],
    ...overrides,
  };
}

// ─── Pagination helper ────────────────────────────────────────────────────────

export function paginatedFactory<T>(
  items: T[],
  page = 1,
  limit = 20,
) {
  return {
    orders: items,
    pagination: {
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit),
    },
  };
}
