"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { markRemindedAction } from "@/app/actions/reminders";

interface ReminderCardProps {
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    pianos: {
      id: string;
      brand: string | null;
      style: string | null;
      model: string | null;
      service_records: { date_serviced: string; next_service_due: string | null }[];
    }[];
  };
  reminded: boolean;
  remindedAt?: string;
}

export function ReminderCard({ client, reminded, remindedAt }: ReminderCardProps) {
  const [copied, setCopied] = useState(false);
  const [markedDone, setMarkedDone] = useState(reminded);
  const [isPending, startTransition] = useTransition();

  const pianoDescriptions = client.pianos
    .map((p) => [p.brand, p.model].filter(Boolean).join(" ") || "piano")
    .join(", ");

  const smsText = `Hi ${client.name.split(" ")[0]}! This is James Flood Jr reaching out — your ${pianoDescriptions} is due for its regular tuning and service. Would you like to schedule an appointment? Just reply to this message, give me a call at 502-509-7756, or visit www.floodpianotuning.com! Thanks so much!`;

  function handleCopy() {
    navigator.clipboard.writeText(smsText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleMarkReminded() {
    startTransition(async () => {
      await markRemindedAction(client.id);
      setMarkedDone(true);
    });
  }

  return (
    <div className={markedDone ? "opacity-50" : ""}>
      {/* Client row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex-1 min-w-0">
          <Link href={`/clients/${client.id}`} className="font-semibold text-zinc-100 hover:text-red-400 transition-colors">
            {client.name}
          </Link>
          <div className="flex gap-3 mt-0.5">
            {client.phone && (
              <a href={`tel:${client.phone}`} className="text-xs text-red-500 hover:text-red-400">
                {client.phone}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="text-xs text-red-500 hover:text-red-400 truncate">
                {client.email}
              </a>
            )}
          </div>
        </div>
        {markedDone && remindedAt && (
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-700 flex-shrink-0">
            {formatRelative(remindedAt)}
          </span>
        )}
      </div>

      {/* SMS template */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-2">Text message template</p>
        <p className="text-sm text-zinc-400 bg-zinc-900 p-3 leading-relaxed">
          {smsText}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-0 px-4 py-3">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] border transition-colors mr-2 ${
            copied
              ? "border-green-800 text-green-500 bg-green-950"
              : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
          }`}
        >
          {copied ? "Copied!" : "Copy Text"}
        </button>

        {!markedDone && (
          <button
            onClick={handleMarkReminded}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition-colors"
          >
            {isPending ? "Saving…" : "Mark Reminded"}
          </button>
        )}
      </div>
    </div>
  );
}

function formatRelative(isoString: string) {
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}
