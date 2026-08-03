import { BadRequestException } from '@nestjs/common';
import { NegotiationStatus } from '@prisma/client';
import { parseBoundedIntegerQuery, parseNegotiationStatusQuery } from './query-params.util';

describe('trade-operation query parsing', () => {
  it('normalizes one or multiple negotiation statuses', () => {
    expect(parseNegotiationStatusQuery('pending')).toBe(NegotiationStatus.PENDING);
    expect(parseNegotiationStatusQuery('pending, accepted')).toEqual([
      NegotiationStatus.PENDING,
      NegotiationStatus.ACCEPTED,
    ]);
  });

  it.each([[['PENDING']], [{ status: 'PENDING' }], ['PENDING,'], ['not-a-status']])(
    'rejects ambiguous or unsupported status input %#',
    (value) => {
      expect(() => parseNegotiationStatusQuery(value)).toThrow(BadRequestException);
    },
  );

  it('parses bounded integer query values and applies defaults', () => {
    const options = { field: 'limit', defaultValue: 100, min: 1, max: 100 };
    expect(parseBoundedIntegerQuery(undefined, options)).toBe(100);
    expect(parseBoundedIntegerQuery('25', options)).toBe(25);
  });

  it.each([['0'], ['101'], ['1.5'], [['10']], [{ value: '10' }]])(
    'rejects an invalid bounded integer input %#',
    (value) => {
      expect(() =>
        parseBoundedIntegerQuery(value, {
          field: 'limit',
          defaultValue: 100,
          min: 1,
          max: 100,
        }),
      ).toThrow(BadRequestException);
    },
  );
});
