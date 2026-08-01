import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { pilotContactEmail } from "../../lib/pilotContact";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (
    !pilotContactEmail ||
    !resendApiKey ||
    !resendFromEmail ||
    !emailPattern.test(resendFromEmail)
  ) {
    return NextResponse.json(
      {
        error:
          "Pilot enquiries are not open until a verified contact channel is configured.",
      },
      { status: 503 },
    );
  }

  try {
    const { email, role } = await req.json();

    if (typeof email !== "string" || !emailPattern.test(email.trim())) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const requesterEmail = email.trim();
    const requesterRole =
      typeof role === "string" && role.trim()
        ? role.trim().slice(0, 80)
        : "unspecified";
    const resend = new Resend(resendApiKey);

    const result = await resend.emails.send({
      from: resendFromEmail,
      to: pilotContactEmail,
      subject: `AgriTek pilot review request — ${requesterRole}`,
      text: [
        "New AgriTek private-pilot review request",
        `Requester: ${requesterEmail}`,
        `Role: ${requesterRole}`,
        `Time: ${new Date().toISOString()}`,
      ].join("\n"),
    });

    if (result.error) {
      throw new Error("Resend rejected the pilot enquiry notification");
    }

    return NextResponse.json({ ok: true });
  } catch {
    console.error("[pilot-enquiry] Delivery failed");
    return NextResponse.json(
      { error: "Pilot enquiry delivery failed" },
      { status: 502 },
    );
  }
}
