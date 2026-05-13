"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { resend, FROM_EMAIL } from "@/lib/resend";

export async function markRemindedAction(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("reminders").insert({
    client_id: clientId,
    reminded_at: new Date().toISOString(),
  });

  if (error) throw error;
  revalidatePath("/reminders");
  revalidatePath("/");
}

export async function sendReminderEmailAction(
  clientId: string,
  clientName: string,
  clientEmail: string,
  pianoDescription: string
): Promise<{ success: boolean; error?: string }> {
  const firstName = clientName.split(" ")[0];

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: clientEmail,
    subject: `Time to schedule your piano tuning, ${firstName}!`,
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
            <h1 style="margin:0;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;color:#ffffff;">Time for a Tuning</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;color:#333333;font-size:15px;line-height:1.7;">
            <p style="margin:0 0 20px 0;">Hi ${firstName},</p>
            <p style="margin:0 0 20px 0;">
              Your <strong>${pianoDescription}</strong> is due for its regular tuning and service. Keeping your piano regularly tuned ensures it stays in top condition and sounds its best.
            </p>
            <p style="margin:0 0 32px 0;">
              I'd love to get it scheduled at a time that's convenient for you!
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#dc2626;padding:14px 28px;">
                  <a href="https://www.floodpianotuning.com" style="color:#ffffff;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;text-decoration:none;">Schedule an Appointment</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px 0;">Or reach me directly:</p>
            <p style="margin:0 0 4px 0;">📞 <a href="tel:5025097756" style="color:#dc2626;text-decoration:none;">502-509-7756</a></p>
            <p style="margin:0 0 32px 0;">🌐 <a href="https://www.floodpianotuning.com" style="color:#dc2626;text-decoration:none;">www.floodpianotuning.com</a></p>

            <p style="margin:0;">Thanks so much — looking forward to hearing from you!</p>
            <p style="margin:8px 0 0 0;font-weight:bold;">James Flood Jr</p>
            <p style="margin:0;font-size:13px;color:#999999;">Flood Piano Tuning</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:11px;color:#999999;text-align:center;">
              You're receiving this because you're a valued client of Flood Piano Tuning.
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

  await markRemindedAction(clientId);
  return { success: true };
}
