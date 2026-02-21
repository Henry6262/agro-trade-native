import { z } from 'zod';

/**
 * Delivery address validation schema
 */
export const deliverySchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  zipCode: z.string().min(3, 'ZIP code is required'),
  notes: z.string().optional(),
});

export type DeliveryFormData = z.infer<typeof deliverySchema>;
