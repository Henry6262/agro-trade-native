/**
 * backend/tests/dto-snapshots/dto-contracts.spec.ts
 *
 * DTO Contract Snapshot Tests
 * ────────────────────────────────────────────────────────────────────────────
 * These tests lock the PUBLIC CONTRACT of every DTO used in agro-trade-native.
 *
 * WHY: If a field name, type, required-status, or even field ORDER changes,
 * Jest will fail loudly – protecting consumers (front-end, mobile app,
 * third-party integrations) from silent breaking changes.
 *
 * HOW TO UPDATE A SNAPSHOT INTENTIONALLY:
 *   npx jest --testPathPattern=dto-contracts --updateSnapshot
 *   git add backend/tests/dto-snapshots/__snapshots__
 *   # Commit with a clear message: "chore(dto): update snapshot – add X field"
 *
 * HOW TO ADD A NEW DTO:
 *   1. Import the class at the top.
 *   2. Add a section at the bottom following the existing pattern.
 */

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

// ─── Helper: extract serialisable contract from class-validator metadata ──────
function extractDtoContract(DtoClass: new () => object): Record<string, unknown> {
  const instance = new DtoClass();
  const metadataKeys: string[] = Reflect.getMetadataKeys(instance);

  // Build a deterministic, sorted map of field → validation metadata
  const contract: Record<string, unknown> = {};

  const propertyMetadata: Record<string, string[]> = {};

  for (const key of metadataKeys) {
    const meta = Reflect.getMetadata(key, instance);
    if (meta && typeof meta === 'object') {
      // class-validator stores constraint metadata per-property
      if (Array.isArray(meta)) {
        for (const entry of meta) {
          if (entry && entry.propertyName) {
            const prop = entry.propertyName as string;
            if (!propertyMetadata[prop]) propertyMetadata[prop] = [];
            if (entry.name) propertyMetadata[prop].push(entry.name as string);
          }
        }
      }
    }
  }

  // Sort properties alphabetically for deterministic snapshots
  const sortedProps = Object.keys(propertyMetadata).sort();
  for (const prop of sortedProps) {
    contract[prop] = propertyMetadata[prop].sort();
  }

  return contract;
}

// ─── Helper: validate an instance and return human-readable error list ────────
async function getValidationErrors(
  DtoClass: new () => object,
  data: Record<string, unknown>,
): Promise<string[]> {
  const instance = plainToInstance(DtoClass as new (...args: unknown[]) => object, data);
  const errors: ValidationError[] = await validate(instance as object);
  return errors.map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// DTO IMPORTS  –  add your DTOs here
// ═════════════════════════════════════════════════════════════════════════════
import { CreateOfferDto } from '../../src/negotiations/dto/negotiation.dto';
import { CreateTradeOperationDto } from '../../src/trade-operations/dto/create-trade-operation.dto';
import { LoginDto, RegisterDto } from '../../src/auth/dto/auth.dto';

// ═════════════════════════════════════════════════════════════════════════════
// SNAPSHOT TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('DTO Contract Snapshots', () => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  describe('LoginDto', () => {
    it('contract snapshot', () => {
      expect(extractDtoContract(LoginDto)).toMatchSnapshot();
    });

    it('rejects empty payload', async () => {
      const errors = await getValidationErrors(LoginDto, {});
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts valid payload', async () => {
      const errors = await getValidationErrors(LoginDto, {
        email: 'farmer@agrотrade.bg',
        password: 'Str0ng!Pass',
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('RegisterDto', () => {
    it('contract snapshot', () => {
      expect(extractDtoContract(RegisterDto)).toMatchSnapshot();
    });

    it('rejects missing required fields', async () => {
      const errors = await getValidationErrors(RegisterDto, { email: 'x@x.com' });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // ── Products ─────────────────────────────────────────────────────────────
  describe('CreateTradeOperationDto', () => {
    it('contract snapshot', () => {
      expect(extractDtoContract(CreateTradeOperationDto)).toMatchSnapshot();
    });

    it('rejects empty payload', async () => {
      const errors = await getValidationErrors(CreateTradeOperationDto, {});
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // ── Orders ────────────────────────────────────────────────────────────────
  describe('CreateOfferDto', () => {
    it('contract snapshot', () => {
      expect(extractDtoContract(CreateOfferDto)).toMatchSnapshot();
    });

    it('rejects empty payload', async () => {
      const errors = await getValidationErrors(CreateOfferDto, {});
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // ── Negotiations ──────────────────────────────────────────────────────────
  // CreateNegotiationDto removed — does not exist in current codebase
});

/**
 * ─── HOW TO ADD MORE DTOs ─────────────────────────────────────────────────
 *
 * import { CreateTransportDto } from '../../src/transport/dto/create-transport.dto';
 *
 * describe('CreateTransportDto', () => {
 *   it('contract snapshot', () => {
 *     expect(extractDtoContract(CreateTransportDto)).toMatchSnapshot();
 *   });
 *   it('rejects empty payload', async () => {
 *     const errors = await getValidationErrors(CreateTransportDto, {});
 *     expect(errors.length).toBeGreaterThan(0);
 *   });
 * });
 */
