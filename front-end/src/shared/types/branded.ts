// Utility for nominal typing of IDs
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

// Branded ID types
export type UserId         = Brand<string, 'UserId'>;
export type LocationId     = Brand<string, 'LocationId'>;
export type ProductId      = Brand<string, 'ProductId'>;
export type OfferId        = Brand<string, 'OfferId'>;
export type RequestId      = Brand<string, 'RequestId'>;
export type NegotiationId  = Brand<string, 'NegotiationId'>;
export type OrderId        = Brand<string, 'OrderId'>;
export type CategoryId     = Brand<string, 'CategoryId'>;
export type PaymentId      = Brand<string, 'PaymentId'>;
// Add more branded IDs here as needed.

// Correct day-of-week enum (closed world — only valid day abbreviations)
export type DayOfWeek =
  | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

// TimeSlot is readonly for slot safety
export interface TimeSlot {
  readonly start: string; // HH:MM
  readonly end: string;   // HH:MM
}

// WeeklyAvailability — only valid days, only readonly arrays (immutable)
export type WeeklyAvailability = Readonly<Partial<Record<DayOfWeek, readonly TimeSlot[]>>>;

/*
 * Migration guide:
 * - Go interface by interface and replace every `id: string` or `*Id: string`
 *   with the exact branded type (e.g. UserId, OfferId).
 * - At API deserialization boundaries use: `user.id as UserId`
 *   but business-logic functions must accept only the branded type.
 * - No raw string IDs remain in core flows after migration.
 */
