"use client";

import { useState, useTransition } from "react";
import { markLeadConvertedAction } from "@/app/actions/leads";

interface LeadBookedToggleProps {
  leadId: string;
  isBooked: boolean;
}

export function LeadBookedToggle({ leadId, isBooked }: LeadBookedToggleProps) {
  const [booked, setBooked] = useState(isBooked);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await markLeadConvertedAction(leadId, !booked);
      setBooked(!booked);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`text-[10px] font-bold uppercase tracking-[0.1em] border px-3 py-2 transition-colors disabled:opacity-40 ${
        booked
          ? "border-green-800 text-green-500 bg-green-950 hover:bg-green-900"
          : "border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500"
      }`}
    >
      {isPending ? "…" : booked ? "Booked" : "Book"}
    </button>
  );
}
