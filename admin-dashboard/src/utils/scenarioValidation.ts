import type { UserRole } from '../services/api/types';
import type { ScenarioPayload } from '../types/scenario';

export type ScenarioInspectionResult = 'PASSED' | 'FAILED';

const USER_ROLES: readonly UserRole[] = [
  'BUYER',
  'FARMER',
  'TRANSPORTER',
  'INSPECTOR',
  'ADMIN',
  'COMPANY_ADMIN',
];
const USER_ROLE_VALUES: ReadonlySet<string> = new Set(USER_ROLES);

const INSPECTION_RESULTS: readonly ScenarioInspectionResult[] = ['PASSED', 'FAILED'];
const INSPECTION_RESULT_VALUES: ReadonlySet<string> = new Set(INSPECTION_RESULTS);

const describeValue = (value: unknown): string => {
  if (value === undefined) return 'missing';

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

const isScenarioPayload = (value: unknown): value is ScenarioPayload =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isScenarioUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && USER_ROLE_VALUES.has(value);

const isScenarioInspectionResult = (
  value: unknown,
): value is ScenarioInspectionResult =>
  typeof value === 'string' && INSPECTION_RESULT_VALUES.has(value);

export const requireScenarioPayload = (
  value: unknown,
  action: string,
): ScenarioPayload => {
  if (!isScenarioPayload(value)) {
    throw new Error(
      `Invalid scenario payload for "${action}": expected a JSON object, received ${describeValue(value)}`,
    );
  }

  return value;
};

export const requireScenarioUserRole = (value: unknown): UserRole => {
  if (!isScenarioUserRole(value)) {
    throw new Error(
      `Invalid scenario role: expected one of ${USER_ROLES.join(', ')}, received ${describeValue(value)}`,
    );
  }

  return value;
};

export const requireScenarioInspectionResult = (
  value: unknown,
): ScenarioInspectionResult => {
  if (!isScenarioInspectionResult(value)) {
    throw new Error(
      `Invalid scenario inspection result: expected PASSED or FAILED, received ${describeValue(value)}`,
    );
  }

  return value;
};
