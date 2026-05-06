"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ScheduleFormProps {
  clientId: string;
  clientName: string;
  clientAddress: string | null;
  clientPhone: string | null;
  pianoId: string;
  pianoDescription: string;
}

export function ScheduleForm({
  clientId,
  clientName,
  clientAddress,
  clientPhone,
  pianoId,
  pianoDescription,
}: ScheduleFormProps) {
  const router = useRouter();
  
  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0];
  const [dateStr, setDateStr] = useState(defaultDate);
  const [timeStr, setTimeStr] = useState("09:00");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Generate .ics contents
    const startObj = new Date(`${dateStr}T${timeStr}`);
    // Assume 2 hours duration
    const endObj = new Date(startObj.getTime() + 2 * 60 * 60 * 1000);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const startTimeFormatted = formatICSDate(startObj);
    const endTimeFormatted = formatICSDate(endObj);
    const nowFormatted = formatICSDate(new Date());

    const summary = `Piano Tuning: ${clientName}`;
    const description = `Piano: ${pianoDescription}\\nClient: ${clientName}\\nPhone: ${clientPhone || "N/A"}`;
    const location = clientAddress || "Client Address";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Flood Tuning CRM//EN",
      "BEGIN:VEVENT",
      `UID:${startObj.getTime()}@floodtuning.crm`,
      `DTSTAMP:${nowFormatted}`,
      `DTSTART:${startTimeFormatted}`,
      `DTEND:${endTimeFormatted}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    // trigger download
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Tuning_${clientName.replace(/\\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    
    // clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Redirect back to client page
    router.push(`/clients/${clientId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-stone-200 p-5">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-stone-700 mb-1">
          Date<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          id="date"
          type="date"
          required
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
        />
      </div>

      <div>
        <label htmlFor="time" className="block text-sm font-medium text-stone-700 mb-1">
          Start Time<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          id="time"
          type="time"
          required
          value={timeStr}
          onChange={(e) => setTimeStr(e.target.value)}
          className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
        />
        <p className="text-xs text-stone-500 mt-1.5">
          Duration defaults to 2 hours.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Link
          href={`/clients/${clientId}`}
          className="flex-1 text-center py-3 border border-stone-200 rounded-xl text-stone-600 font-medium"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Download .ICS
        </button>
      </div>
    </form>
  );
}
