"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadContactAction } from "@/app/actions/leads";

export default function LeadContactEditor({
  leadId,
  initialEmail,
  initialPhone,
}: {
  leadId: string;
  initialEmail: string | null;
  initialPhone: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateLeadContactAction(leadId, email || null, phone || null);
      setSaved(true);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setSaved(false); }}
        className="text-[10px] font-bold uppercase tracking-[0.1em] border border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600 px-3 py-2 transition-colors whitespace-nowrap"
      >
        {saved ? "Saved ✓" : "Add Info"}
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="w-full mt-3 space-y-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-700 px-3 py-2 text-xs focus:outline-none focus:border-zinc-600"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number"
        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-700 px-3 py-2 text-xs focus:outline-none focus:border-zinc-600"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-[0.1em] transition-colors"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 border border-zinc-800 text-zinc-600 hover:text-zinc-300 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
