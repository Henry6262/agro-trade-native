import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { pilotContactEmail } from '../../lib/pilotContact';

function isValidEmail(value: string): boolean {
  const candidate = value.trim();

  if (!candidate || candidate.length > 254) return false;
  if ([...candidate].some((character) => character.trim() === '')) return false;

  const separator = candidate.indexOf('@');
  if (separator <= 0 || separator !== candidate.lastIndexOf('@') || separator > 64) {
    return false;
  }

  const domain = candidate.slice(separator + 1);
  const finalDot = domain.lastIndexOf('.');

  return finalDot > 0 && finalDot < domain.length - 1;
}

export async function POST(req: NextRequest) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!pilotContactEmail || !resendApiKey || !resendFromEmail || !isValidEmail(resendFromEmail)) {
    return NextResponse.json(
      {
        error: 'Pilot enquiries are not open until a verified contact channel is configured.',
      },
      { status: 503 },
    );
  }

  try {
    const { email, role } = await req.json();

    if (typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const requesterEmail = email.trim();
    const requesterRole =
      typeof role === 'string' && role.trim() ? role.trim().slice(0, 80) : 'unspecified';
    const resend = new Resend(resendApiKey);

    const result = await resend.emails.send({
      from: resendFromEmail,
      to: pilotContactEmail,
      subject: `AgriTek pilot review request — ${requesterRole}`,
      text: [
        'New AgriTek private-pilot review request',
        `Requester: ${requesterEmail}`,
        `Role: ${requesterRole}`,
        `Time: ${new Date().toISOString()}`,
      ].join('\n'),
    });

    if (result.error) {
      throw new Error('Resend rejected the pilot enquiry notification');
    }

    return NextResponse.json({ ok: true });
  } catch {
    console.error('[pilot-enquiry] Delivery failed');
    return NextResponse.json({ error: 'Pilot enquiry delivery failed' }, { status: 502 });
  }
}
