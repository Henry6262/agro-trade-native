import { BadRequestException } from '@nestjs/common';
import { NegotiationStatus } from '@prisma/client';

const NEGOTIATION_STATUSES = new Set<string>(Object.values(NegotiationStatus));

export function parseNegotiationStatusQuery(
  value: unknown,
): NegotiationStatus | NegotiationStatus[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestException('status must be provided as a single string');
  }

  const statuses = value.split(',').map((status) => status.trim().toUpperCase());
  if (
    statuses.length === 0 ||
    statuses.some((status) => !status || !NEGOTIATION_STATUSES.has(status))
  ) {
    throw new BadRequestException('status contains an unsupported negotiation status');
  }

  return statuses.length === 1
    ? (statuses[0] as NegotiationStatus)
    : (statuses as NegotiationStatus[]);
}

export function parseBoundedIntegerQuery(
  value: unknown,
  options: {
    field: string;
    defaultValue: number;
    min: number;
    max: number;
  },
): number {
  if (value === undefined || value === null || value === '') {
    return options.defaultValue;
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new BadRequestException(`${options.field} must be a single integer`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < options.min || parsed > options.max) {
    throw new BadRequestException(
      `${options.field} must be between ${options.min} and ${options.max}`,
    );
  }
  return parsed;
}
