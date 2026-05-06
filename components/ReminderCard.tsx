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
    <div className={`bg-white rounded-2xl border ${markedDone ? "border-stone-200 opacity-70" : "border-stone-200"} overflow-hidden`}>
      {/* Client info row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex-1 min-w-0">
          <Link href={`/clients/${client.id}`} className="font-semibold text-stone-900 hover:text-amber-700">
            {client.name}
          </Link>
          <div className="flex gap-3 mt-0.5">
            {client.phone && (
              <a href={`tel:${client.phone}`} className="text-xs text-amber-600">
                {client.phone}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="text-xs text-amber-600 truncate">
                {client.email}
              </a>
            )}
          </div>
        </div>
        {markedDone && remindedAt && (
          <span className="text-xs text-stone-400 flex-shrink-0">
            {formatRelative(remindedAt)}
          </span>
        )}
      </div>

      {/* SMS template */}
      <div className="px-4 py-3">
        <p className="text-xs text-stone-500 mb-2">Text message template:</p>
        <p className="text-sm text-stone-700 bg-stone-50 rounded-xl p-3 leading-relaxed">
          {smsText}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            copied
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
              Copy Text
            </>
          )}
        </button>

        {!markedDone && (
          <button
            onClick={handleMarkReminded}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-colors"
          >
            {isPending ? (
              "Saving…"
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Mark Reminded
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function formatRelative(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}
