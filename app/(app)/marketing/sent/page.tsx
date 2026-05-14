import Link from "next/link";
import { resend } from "@/lib/resend";

type EmailEvent = "sent" | "delivered" | "delivery_delayed" | "complained" | "bounced" | "opened" | "clicked";

type SentEmail = {
  id: string;
  to: string[];
  subject: string | null;
  created_at: string;
  last_event: EmailEvent;
};

const statusStyles: Record<EmailEvent, { label: string; classes: string }> = {
  delivered: { label: "Delivered", classes: "text-green-500 border-green-900 bg-green-950" },
  sent:      { label: "Sent",      classes: "text-zinc-400 border-zinc-700" },
  opened:    { label: "Opened",    classes: "text-blue-400 border-blue-900 bg-blue-950" },
  clicked:   { label: "Clicked",   classes: "text-blue-400 border-blue-900 bg-blue-950" },
  bounced:          { label: "Bounced",  classes: "text-red-400 border-red-900 bg-red-950" },
  complained:       { label: "Spam",     classes: "text-red-400 border-red-900 bg-red-950" },
  delivery_delayed: { label: "Delayed",  classes: "text-yellow-500 border-yellow-900 bg-yellow-950" },
};

export default async function SentEmailsPage() {
  let emails: SentEmail[] = [];
  let fetchError: string | null = null;

  try {
    const { data, error } = await resend.emails.list();
    if (error) {
      fetchError = error.message;
    } else {
      emails = ((data as { data?: SentEmail[] })?.data ?? (data as SentEmail[]) ?? [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load sent emails";
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/marketing"
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.1em]">Marketing</span>
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Sent Emails</h1>
        <p className="text-zinc-600 text-sm mt-1">All emails sent through the app via Resend</p>
      </div>

      {fetchError && (
        <div className="border border-red-900 bg-red-950 px-4 py-3 mb-6">
          <p className="text-xs text-red-400">{fetchError}</p>
        </div>
      )}

      {emails.length === 0 && !fetchError && (
        <div className="border border-zinc-800 p-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">No emails sent yet</p>
        </div>
      )}

      {emails.length > 0 && (
        <div className="border border-zinc-800 divide-y divide-zinc-800">
          {emails.map((email) => {
            const status = statusStyles[email.last_event] ?? statusStyles.sent;
            const to = Array.isArray(email.to) ? email.to.join(", ") : email.to;
            return (
              <div key={email.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-100 truncate">
                      {email.subject ?? "(no subject)"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{to}</p>
                    <p className="text-[10px] text-zinc-700 mt-0.5">{formatDate(email.created_at)}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.1em] border px-2 py-1 flex-shrink-0 ${status.classes}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}
