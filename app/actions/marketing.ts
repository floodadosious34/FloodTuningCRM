"use server";

import { resend, FROM_EMAIL } from "@/lib/resend";

export async function sendMarketingEmailAction(
  recipientEmail: string,
  recipientName: string,
  organization: string,
  customNote: string
): Promise<{ success: boolean; error?: string }> {
  const greeting = recipientName ? `Dear ${recipientName},` : `Dear Music Director,`;
  const orgLine = organization ? ` at ${organization}` : "";

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject: `Professional Piano Tuning Services for ${organization || "Your Organization"}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#111111;padding:32px 40px;border-bottom:3px solid #dc2626;">
            <p style="margin:0 0 4px 0;font-size:10px;font-weight:bold;letter-spacing:0.3em;text-transform:uppercase;color:#666666;">Flood Piano Tuning</p>
            <h1 style="margin:0;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;color:#ffffff;">Professional Piano Care</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;color:#333333;font-size:15px;line-height:1.7;">
            <p style="margin:0 0 20px 0;">${greeting}</p>
            <p style="margin:0 0 20px 0;">
              My name is James Flood Jr, and I'm a professional piano technician serving the Kentucky/Cincinnati area. I'm reaching out to introduce my tuning and service offerings to your organization${orgLine}.
            </p>
            ${customNote ? `<p style="margin:0 0 20px 0;">${customNote}</p>` : ""}
            <p style="margin:0 0 12px 0;">I offer a full range of piano services including:</p>
            <ul style="margin:0 0 24px 0;padding-left:20px;color:#444444;">
              <li style="margin-bottom:8px;">Standard & pitch-raise tuning</li>
              <li style="margin-bottom:8px;">Regulation & voicing</li>
              <li style="margin-bottom:8px;">Repairs & restoration</li>
              <li style="margin-bottom:8px;">Recurring maintenance plans for institutions</li>
            </ul>
            <p style="margin:0 0 32px 0;">
              Whether you have a single upright in a practice room or a concert grand on stage, I'd love the opportunity to keep your instruments sounding their best. I'm happy to schedule a visit, provide a free quote, or answer any questions.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#dc2626;padding:14px 28px;">
                  <a href="https://www.floodpianotuning.com" style="color:#ffffff;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;text-decoration:none;">Visit My Website</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 4px 0;">Feel free to reach me directly:</p>
            <p style="margin:0 0 4px 0;">📞 <a href="tel:5025097756" style="color:#dc2626;text-decoration:none;">502-509-7756</a></p>
            <p style="margin:0 0 32px 0;">🌐 <a href="https://www.floodpianotuning.com" style="color:#dc2626;text-decoration:none;">www.floodpianotuning.com</a></p>

            <p style="margin:0;">Thank you for your time — I look forward to hearing from you!</p>
            <p style="margin:8px 0 0 0;font-weight:bold;">James Flood Jr</p>
            <p style="margin:0;font-size:13px;color:#999999;">Flood Piano Tuning · Louisville, KY</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:11px;color:#999999;text-align:center;">
              Flood Piano Tuning · Louisville, KY · 502-509-7756 · floodpianotuning.com
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
