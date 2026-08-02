import {
  PILOT_LEAD_ROLE_LABELS,
  pilotLeadSchema,
  type PilotLead,
} from '../../lib/pilotLeadContract.ts';
import {
  getPilotLeadDeliveryConfig,
  type PilotLeadDeliveryConfig,
} from '../../lib/pilotLeadConfig.ts';

export const MAX_PILOT_LEAD_BODY_BYTES = 16 * 1024;

export type PilotLeadEmail = {
  fromEmail: string;
  reference: string;
  replyTo: string;
  subject: string;
  text: string;
  toEmail: string;
};

export type PilotLeadDelivery = (
  config: PilotLeadDeliveryConfig,
  email: PilotLeadEmail,
) => Promise<{ id?: string; ok: boolean }>;

type PilotLeadPostDependencies = {
  createReference?: () => string;
  deliver: PilotLeadDelivery;
  env?: NodeJS.ProcessEnv;
  logDeliveryFailure?: (reference: string) => void;
  now?: () => Date;
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function declaredBodyIsTooLarge(request: Request): boolean {
  const header = request.headers.get('content-length');
  if (!header) return false;

  const bytes = Number(header);
  return Number.isFinite(bytes) && bytes > MAX_PILOT_LEAD_BODY_BYTES;
}

function buildPilotLeadEmail(
  lead: PilotLead,
  config: PilotLeadDeliveryConfig,
  reference: string,
  receivedAt: Date,
): PilotLeadEmail {
  const roleLabel = PILOT_LEAD_ROLE_LABELS[lead.role];

  return {
    fromEmail: config.fromEmail,
    toEmail: config.toEmail,
    replyTo: lead.email,
    reference,
    subject: `AgriTek pilot review request — ${roleLabel} — ${reference}`,
    text: [
      'New AgriTek private-pilot review request',
      `Reference: ${reference}`,
      `Received: ${receivedAt.toISOString()}`,
      `Name: ${lead.name}`,
      `Work email: ${lead.email}`,
      `Company: ${lead.company}`,
      `Role: ${roleLabel}`,
      '',
      'Trade exception:',
      lead.tradeBrief,
      '',
      'Contact consent: yes',
    ].join('\n'),
  };
}

export function createPilotLeadPost({
  createReference = () => crypto.randomUUID(),
  deliver,
  env = process.env,
  logDeliveryFailure = (reference) => {
    console.error('[pilot-enquiry] Delivery failed', { reference });
  },
  now = () => new Date(),
}: PilotLeadPostDependencies) {
  return async function POST(request: Request): Promise<Response> {
    const config = getPilotLeadDeliveryConfig(env);

    if (!config) {
      return jsonResponse(
        { error: 'Pilot enquiries are not open until a verified contact channel is configured.' },
        503,
      );
    }

    const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('application/json')) {
      return jsonResponse({ error: 'Pilot enquiries must be submitted as JSON.' }, 415);
    }

    if (declaredBodyIsTooLarge(request)) {
      return jsonResponse({ error: 'Pilot enquiry is too large.' }, 413);
    }

    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return jsonResponse({ error: 'Pilot enquiry could not be read.' }, 400);
    }

    if (new TextEncoder().encode(rawBody).byteLength > MAX_PILOT_LEAD_BODY_BYTES) {
      return jsonResponse({ error: 'Pilot enquiry is too large.' }, 413);
    }

    let candidate: unknown;
    try {
      candidate = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: 'Pilot enquiry is not valid JSON.' }, 400);
    }

    const parsed = pilotLeadSchema.safeParse(candidate);
    if (!parsed.success) {
      return jsonResponse({ error: 'Please complete every required pilot enquiry field.' }, 400);
    }

    // A populated hidden website field indicates an automated submission. Return a generic
    // success without delivering mail so the endpoint does not teach bots how to bypass it.
    if (parsed.data.website) {
      return jsonResponse({ ok: true }, 200);
    }

    const reference = createReference();
    const email = buildPilotLeadEmail(parsed.data, config, reference, now());

    try {
      const result = await deliver(config, email);
      if (!result.ok) {
        logDeliveryFailure(reference);
        return jsonResponse({ error: 'Pilot enquiry delivery failed.' }, 502);
      }

      return jsonResponse({ ok: true, reference }, 200);
    } catch {
      logDeliveryFailure(reference);
      return jsonResponse({ error: 'Pilot enquiry delivery failed.' }, 502);
    }
  };
}
