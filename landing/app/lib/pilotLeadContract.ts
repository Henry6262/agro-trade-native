import { z } from 'zod';

export const PILOT_LEAD_ROLES = [
  'buyer_importer',
  'exporter_packhouse',
  'logistics_inspection',
  'other',
] as const;

export type PilotLeadRole = (typeof PILOT_LEAD_ROLES)[number];

export const PILOT_LEAD_ROLE_LABELS: Record<PilotLeadRole, string> = {
  buyer_importer: 'Buyer / importer',
  exporter_packhouse: 'Exporter / packhouse',
  logistics_inspection: 'Logistics / inspection',
  other: 'Other trade operator',
};

export const pilotLeadSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().max(254).pipe(z.email()),
    company: z.string().trim().min(2).max(120),
    role: z.enum(PILOT_LEAD_ROLES),
    tradeBrief: z.string().trim().min(20).max(1_500),
    consent: z.literal(true),
    website: z.string().trim().max(200).optional().default(''),
  })
  .strict();

export type PilotLead = z.infer<typeof pilotLeadSchema>;
