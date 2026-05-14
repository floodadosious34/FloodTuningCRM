"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMarketingEmailAction } from "@/app/actions/marketing";
import { markLeadEmailedAction } from "@/app/actions/leads";
import type { Lead } from "@/lib/supabase/types";

export default function LeadComposeForm({ lead }: { lead: Lead }) {
  const [customNote, setCustomNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    startTransition(async () => {
      const result = await sendMarketingEmailAction(
        lead.email!,
        lead.contact_name ?? "",
        lead.institution,
        customNote
      );
      if (result.success) {
        await markLeadEmailedAction(lead.id);
        setStatus("sent");
        setTimeout(() => router.push("/marketing"), 1500);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Failed to send email");
      }
    });
  }

  return (
    <form onSubmit={handleSend} className="border border-zinc-800">
      <div className="px-4 py-4 border-b border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">Email Preview</p>
        <div className="space-y-1.5 text-sm text-zinc-500 bg-zinc-900 px-3 py-3">
          <p><span className="text-zinc-700">From:</span> James Flood Jr &lt;james@floodpianotuning.com&gt;</p>
          <p><span className="text-zinc-700">To:</span> {lead.email}</p>
          <p><span className="text-zinc-700">Subject:</span> Professional Piano Tuning Services for {lead.institution}</p>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-zinc-800">
        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">
          Personal Note <span className="text-zinc-700">(optional)</span>
        </label>
        <textarea
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="e.g. I saw your upcoming concert season and wanted to reach out…"
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-700 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600 resize-none"
        />
        <p className="text-[10px] text-zinc-700 mt-1.5">Inserted as a paragraph in the email body.</p>
      </div>

      <div className="px-4 py-4">
        {status === "sent" && (
          <div className="mb-4 px-3 py-2.5 bg-green-950 border border-green-800">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-green-500">Email sent — returning to leads…</p>
          </div>
        )}
        {status === "error" && errorMsg && (
          <div className="mb-4 px-3 py-2.5 bg-red-950 border border-red-900">
            <p className="text-xs text-red-400">{errorMsg}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={isPending || status === "sending" || status === "sent"}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-[0.15em] transition-colors"
        >
          {status === "sending" ? "Sending…" : "Send Outreach Email"}
        </button>
      </div>
    </form>
  );
}
