import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  // Lazy init — RESEND_API_KEY is a runtime secret, not available at build time
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email, role } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const roleLabel = role ?? "unspecified";

    // Notify the AgroTrade team
    await resend.emails.send({
      from: "AgroTrade Waitlist <waitlist@agrotrade.africa>",
      to: "hello@agrotrade.africa",
      subject: `New waitlist signup — ${roleLabel}`,
      html: `
        <h2>New waitlist signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${roleLabel}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
    });

    // Send confirmation to the user
    await resend.emails.send({
      from: "AgroTrade <waitlist@agrotrade.africa>",
      to: email,
      subject: "You're on the AgroTrade waitlist 🌾",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#f0ede6;border-radius:12px;">
          <h1 style="font-size:24px;margin:0 0 8px;">You're in. 🌾</h1>
          <p style="color:#a09880;margin:0 0 24px;">Welcome to the AgroTrade early access list.</p>

          <p style="margin:0 0 16px;">
            We're launching in the <strong>Balkans first</strong> — Serbia, Bosnia, Romania —
            then expanding to the Middle East and Asia.
          </p>
          <p style="margin:0 0 16px;">
            You'll be the first to know when your region goes live.
            Every payment will be locked in smart-contract escrow. No more blind trust.
          </p>

          <div style="background:#12120a;border:1px solid #2a2a1a;border-radius:8px;padding:16px;margin:24px 0;">
            <p style="margin:0;font-size:13px;color:#a09880;">
              🔒 Non-custodial escrow &nbsp;·&nbsp; ⛓️ Celo blockchain &nbsp;·&nbsp; 🌍 12 countries
            </p>
          </div>

          <p style="margin:0;font-size:12px;color:#665e50;">
            You signed up as: <strong>${roleLabel}</strong><br/>
            AgroTrade · hello@agrotrade.africa
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] Resend error:", err);
    // Still return success — don't fail the UX if email sending fails
    return NextResponse.json({ ok: true });
  }
}
