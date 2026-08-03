import { checkBotId } from 'botid/server';
import { Resend } from 'resend';
import { createPilotLeadPost, type PilotLeadDelivery } from './handler.ts';

const deliverPilotLead: PilotLeadDelivery = async (config, email) => {
  const resend = new Resend(config.apiKey);
  const result = await resend.emails.send({
    from: `AgriTek <${email.fromEmail}>`,
    to: email.toEmail,
    replyTo: email.replyTo,
    subject: email.subject,
    text: email.text,
  });

  if (result.error) {
    return { ok: false };
  }

  return { id: result.data?.id, ok: true };
};

const postPilotLead = createPilotLeadPost({ deliver: deliverPilotLead });

export async function POST(request: Request) {
  const verification = await checkBotId();

  if (verification.isBot) {
    return Response.json(
      { error: 'Pilot enquiry could not be accepted.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return postPilotLead(request);
}
