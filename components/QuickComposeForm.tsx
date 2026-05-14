"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMarketingEmailAction } from "@/app/actions/marketing";

export default function QuickComposeForm() {
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [organization, setOrganization] = useState("");
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
      const result = await sendMarketingEmailAction(email, contactName, organization, customNote);
      if (result.success) {
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
        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">
          Recipient Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="music@venue.com"
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
          placeholder="The Blue Room Jazz Club"
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-700 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600"
        />
      </div>

      <div className="px-4 py-4 border-b border-zinc-800">
        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">
          Contact Name <span className="text-zinc-700">(optional)</span>
        </label>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Sarah Johnson"
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
          placeholder="e.g. I stopped in last night and noticed your grand piano — I'd love to help keep it in top shape…"
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-700 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600 resize-none"
        />
      </div>

      {organization || email ? (
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1.5">Preview</p>
          <p className="text-xs text-zinc-500"><span className="text-zinc-700">To:</span> {email || "—"}</p>
          <p className="text-xs text-zinc-500 mt-0.5"><span className="text-zinc-700">Subject:</span> Professional Piano Tuning Services for {organization || "Your Organization"}</p>
        </div>
      ) : null}

      <div className="px-4 py-4">
        {status === "sent" && (
          <div className="mb-4 px-3 py-2.5 bg-green-950 border border-green-800">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-green-500">Sent — returning to marketing…</p>
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
