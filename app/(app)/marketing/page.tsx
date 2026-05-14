"use client";

import { useState, useTransition } from "react";
import { sendMarketingEmailAction } from "@/app/actions/marketing";

export default function MarketingPage() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [organization, setOrganization] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientEmail) return;
    setStatus("sending");
    setErrorMsg(null);
    startTransition(async () => {
      const result = await sendMarketingEmailAction(
        recipientEmail,
        recipientName,
        organization,
        customNote
      );
      if (result.success) {
        setStatus("sent");
        setRecipientEmail("");
        setRecipientName("");
        setOrganization("");
        setCustomNote("");
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Failed to send email");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Marketing Outreach</h1>
        <p className="text-zinc-600 text-sm mt-1">Send a professional intro email to schools, universities, and venues</p>
      </div>

      <form onSubmit={handleSubmit} className="border border-zinc-800">

        <div className="px-4 py-4 border-b border-zinc-800">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">
            Recipient Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="music@university.edu"
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-700 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="px-4 py-4 border-b border-zinc-800">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">
            Contact Name <span className="text-zinc-700">(optional)</span>
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Dr. Sarah Johnson"
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-700 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="px-4 py-4 border-b border-zinc-800">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">
            Organization <span className="text-zinc-700">(optional)</span>
          </label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="University of Louisville School of Music"
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-700 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="px-4 py-4 border-b border-zinc-800">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">
            Personal Note <span className="text-zinc-700">(optional)</span>
          </label>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. I noticed your upcoming recital season and wanted to reach out…"
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-700 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600 resize-none"
          />
          <p className="text-[10px] text-zinc-700 mt-1.5">This will be inserted as a paragraph in the email body.</p>
        </div>

        <div className="px-4 py-4">
          {status === "sent" && (
            <div className="mb-4 px-3 py-2.5 bg-green-950 border border-green-800">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-green-500">Email sent successfully!</p>
            </div>
          )}
          {status === "error" && errorMsg && (
            <div className="mb-4 px-3 py-2.5 bg-red-950 border border-red-900">
              <p className="text-xs text-red-400">{errorMsg}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isPending || status === "sending"}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-[0.15em] transition-colors"
          >
            {status === "sending" ? "Sending…" : "Send Outreach Email"}
          </button>
        </div>

      </form>

      <div className="mt-6 border border-zinc-800 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">Email Preview</p>
        <div className="space-y-1.5 text-sm text-zinc-500">
          <p><span className="text-zinc-700">From:</span> James Flood Jr &lt;james@floodpianotuning.com&gt;</p>
          <p><span className="text-zinc-700">To:</span> {recipientEmail || <span className="text-zinc-700 italic">recipient email</span>}</p>
          <p><span className="text-zinc-700">Subject:</span> Professional Piano Tuning Services for {organization || <span className="text-zinc-700 italic">Your Organization</span>}</p>
        </div>
      </div>
    </div>
  );
}
