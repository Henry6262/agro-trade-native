import { z } from 'zod';

const emailSchema = z.string().trim().max(254).pipe(z.email());

export type PilotLeadDeliveryConfig = {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
};

export function getPilotLeadDeliveryConfig(
  env: NodeJS.ProcessEnv = process.env,
): PilotLeadDeliveryConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const fromEmail = emailSchema.safeParse(env.RESEND_FROM_EMAIL);
  const toEmail = emailSchema.safeParse(env.PILOT_ENQUIRY_TO_EMAIL);
  const privacyContactEmail = emailSchema.safeParse(env.NEXT_PUBLIC_PILOT_CONTACT_EMAIL);
  const intakeApproved = env.PILOT_INTAKE_APPROVED?.trim().toLowerCase() === 'true';

  if (
    !apiKey ||
    !fromEmail.success ||
    !toEmail.success ||
    !privacyContactEmail.success ||
    !intakeApproved
  ) {
    return null;
  }

  return {
    apiKey,
    fromEmail: fromEmail.data,
    toEmail: toEmail.data,
  };
}

export function isPilotLeadIntakeReady(env: NodeJS.ProcessEnv = process.env): boolean {
  return getPilotLeadDeliveryConfig(env) !== null;
}
