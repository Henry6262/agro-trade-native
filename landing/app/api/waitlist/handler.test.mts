import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPilotLeadPost,
  MAX_PILOT_LEAD_BODY_BYTES,
  type PilotLeadDelivery,
  type PilotLeadEmail,
} from './handler.ts';

const readyEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_PILOT_CONTACT_EMAIL: 'privacy@example.com',
  PILOT_INTAKE_APPROVED: 'true',
  PILOT_ENQUIRY_TO_EMAIL: 'pilot-ops@example.com',
  RESEND_API_KEY: 're_test_key',
  RESEND_FROM_EMAIL: 'pilot@example.com',
};

const validLead = {
  name: 'Ana Buyer',
  email: 'ana@example.org',
  company: 'Iberia Produce SL',
  role: 'buyer_importer',
  tradeBrief:
    'Fresh raspberries from Morocco to Spain, 4 tonnes required before Friday after a supplier shortfall.',
  consent: true,
  website: '',
};

function requestWithJson(body: unknown, headers: HeadersInit = {}): Request {
  return new Request('https://agritek.test/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function responseBody(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

test('fails closed when delivery configuration is incomplete', async () => {
  let deliveries = 0;
  const post = createPilotLeadPost({
    env: { NODE_ENV: 'test' },
    deliver: async () => {
      deliveries += 1;
      return { ok: true };
    },
  });

  const response = await post(requestWithJson(validLead));

  assert.equal(response.status, 503);
  assert.equal(deliveries, 0);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('requires explicit intake approval and a published privacy contact', async () => {
  let deliveries = 0;
  const deliver: PilotLeadDelivery = async () => {
    deliveries += 1;
    return { ok: true };
  };

  const withoutApproval = createPilotLeadPost({
    env: { ...readyEnv, PILOT_INTAKE_APPROVED: 'false' },
    deliver,
  });
  const withoutPrivacyContact = createPilotLeadPost({
    env: { ...readyEnv, NEXT_PUBLIC_PILOT_CONTACT_EMAIL: '' },
    deliver,
  });

  assert.equal((await withoutApproval(requestWithJson(validLead))).status, 503);
  assert.equal((await withoutPrivacyContact(requestWithJson(validLead))).status, 503);
  assert.equal(deliveries, 0);
});

test('rejects non-JSON and oversized requests before delivery', async (context) => {
  let deliveries = 0;
  const post = createPilotLeadPost({
    env: readyEnv,
    deliver: async () => {
      deliveries += 1;
      return { ok: true };
    },
  });

  await context.test('unsupported content type', async () => {
    const response = await post(
      new Request('https://agritek.test/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'lead',
      }),
    );
    assert.equal(response.status, 415);
  });

  await context.test('declared body over 16KB', async () => {
    const response = await post(
      requestWithJson(validLead, { 'Content-Length': String(MAX_PILOT_LEAD_BODY_BYTES + 1) }),
    );
    assert.equal(response.status, 413);
  });

  await context.test('actual body over 16KB', async () => {
    const response = await post(
      requestWithJson({ ...validLead, tradeBrief: 'x'.repeat(MAX_PILOT_LEAD_BODY_BYTES) }),
    );
    assert.equal(response.status, 413);
  });

  assert.equal(deliveries, 0);
});

test('requires the bounded contract, role enum, and contact consent', async () => {
  let deliveries = 0;
  const post = createPilotLeadPost({
    env: readyEnv,
    deliver: async () => {
      deliveries += 1;
      return { ok: true };
    },
  });

  const invalidCandidates = [
    { ...validLead, consent: false },
    { ...validLead, role: 'founder' },
    { ...validLead, tradeBrief: 'too short' },
    { ...validLead, unexpected: 'field' },
  ];

  for (const candidate of invalidCandidates) {
    const response = await post(requestWithJson(candidate));
    assert.equal(response.status, 400);
  }

  assert.equal(deliveries, 0);
});

test('returns generic success for a populated honeypot without sending', async () => {
  let deliveries = 0;
  const post = createPilotLeadPost({
    env: readyEnv,
    deliver: async () => {
      deliveries += 1;
      return { ok: true };
    },
  });

  const response = await post(requestWithJson({ ...validLead, website: 'https://bot.test' }));

  assert.equal(response.status, 200);
  assert.deepEqual(await responseBody(response), { ok: true });
  assert.equal(deliveries, 0);
});

test('returns 502 and logs only the generated reference when delivery is rejected', async () => {
  const loggedReferences: string[] = [];
  const post = createPilotLeadPost({
    env: readyEnv,
    createReference: () => 'lead-rejected',
    logDeliveryFailure: (reference) => loggedReferences.push(reference),
    deliver: async () => ({ ok: false }),
  });

  const response = await post(requestWithJson(validLead));

  assert.equal(response.status, 502);
  assert.deepEqual(loggedReferences, ['lead-rejected']);
  assert.deepEqual(await responseBody(response), { error: 'Pilot enquiry delivery failed.' });
});

test('returns 502 when the delivery provider throws', async () => {
  const post = createPilotLeadPost({
    env: readyEnv,
    createReference: () => 'lead-provider-error',
    logDeliveryFailure: () => undefined,
    deliver: async () => {
      throw new Error('provider unavailable');
    },
  });

  const response = await post(requestWithJson(validLead));
  assert.equal(response.status, 502);
});

test('delivers one bounded plaintext internal email and returns its reference', async () => {
  const delivered: PilotLeadEmail[] = [];
  const deliver: PilotLeadDelivery = async (config, email) => {
    assert.deepEqual(config, {
      apiKey: 're_test_key',
      fromEmail: 'pilot@example.com',
      toEmail: 'pilot-ops@example.com',
    });
    delivered.push(email);
    return { id: 'resend-message-id', ok: true };
  };
  const post = createPilotLeadPost({
    env: readyEnv,
    createReference: () => 'lead-accepted',
    now: () => new Date('2026-08-02T10:00:00.000Z'),
    deliver,
  });

  const response = await post(requestWithJson(validLead));

  assert.equal(response.status, 200);
  assert.deepEqual(await responseBody(response), { ok: true, reference: 'lead-accepted' });
  assert.equal(delivered.length, 1);
  assert.deepEqual(delivered[0], {
    fromEmail: 'pilot@example.com',
    toEmail: 'pilot-ops@example.com',
    replyTo: 'ana@example.org',
    reference: 'lead-accepted',
    subject: 'AgriTek pilot review request — Buyer / importer — lead-accepted',
    text: [
      'New AgriTek private-pilot review request',
      'Reference: lead-accepted',
      'Received: 2026-08-02T10:00:00.000Z',
      'Name: Ana Buyer',
      'Work email: ana@example.org',
      'Company: Iberia Produce SL',
      'Role: Buyer / importer',
      '',
      'Trade exception:',
      validLead.tradeBrief,
      '',
      'Contact consent: yes',
    ].join('\n'),
  });
});
