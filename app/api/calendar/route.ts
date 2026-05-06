import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  const [{ data: serviceRecords, error: srError }, { data: apptRecords, error: apptError }] =
    await Promise.all([
      // next_service_due dates from service history
      supabase
        .from("service_records")
        .select(`
          id,
          next_service_due,
          service_type,
          technician_notes,
          amount_charged,
          pianos (
            brand, style, model, year_manufactured, notes,
            clients ( id, name, phone, address, notes )
          )
        `)
        .not("next_service_due", "is", null)
        .gte("next_service_due", today)
        .order("next_service_due"),

      // explicitly scheduled appointments
      supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          scheduled_end_time,
          service_type,
          notes,
          pianos (
            brand, style, model, year_manufactured, notes,
            clients ( id, name, phone, address, notes )
          )
        `)
        .gte("scheduled_date", today)
        .order("scheduled_date"),
    ]);

  if (srError || apptError) return new NextResponse("Failed to fetch appointments", { status: 500 });

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Flood Tuning CRM//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Piano Tuning Appointments",
  ];

  // Explicitly scheduled appointments
  for (const appt of apptRecords ?? []) {
    const piano = appt.pianos as any;
    const client = piano?.clients;
    if (!client) continue;

    lines.push(...buildEvent({
      uid: `appt-${appt.id}@floodtuningcrm`,
      date: appt.scheduled_date,
      time: (appt as any).scheduled_time ?? null,
      endTime: (appt as any).scheduled_end_time ?? null,
      summary: `Piano Tuning – ${client.name}`,
      serviceType: appt.service_type,
      piano,
      client,
      notes: appt.notes ?? null,
      amountCharged: null,
    }));
  }

  // next_service_due dates (from service records)
  for (const record of serviceRecords ?? []) {
    const piano = record.pianos as any;
    const client = piano?.clients;
    if (!record.next_service_due || !client) continue;

    lines.push(...buildEvent({
      uid: `sr-${record.id}@floodtuningcrm`,
      date: record.next_service_due,
      time: null,
      endTime: null,
      summary: `Piano Tuning – ${client.name}`,
      serviceType: record.service_type,
      piano,
      client,
      notes: record.technician_notes ?? null,
      amountCharged: record.amount_charged ?? null,
    }));
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tuning-appointments.ics"',
    },
  });
}

function buildEvent({
  uid, date, time, endTime, summary, serviceType, piano, client, notes, amountCharged,
}: {
  uid: string;
  date: string;
  time: string | null;
  endTime: string | null;
  summary: string;
  serviceType: string;
  piano: any;
  client: any;
  notes: string | null;
  amountCharged: number | null;
}): string[] {
  const dateStr = date.replace(/-/g, "");
  const [startH, startM] = (time ?? "09:00").split(":").map(Number);
  const startTimeStr = `${String(startH).padStart(2, "0")}${String(startM).padStart(2, "0")}00`;
  // Use stored end time, or fall back to start + 2 hours
  const [endH, endM] = endTime
    ? endTime.split(":").map(Number)
    : [startH + 2, startM];
  const endTimeStr = `${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;

  const pianoLabel = [
    piano?.year_manufactured,
    piano?.brand,
    piano?.model,
    piano?.style ? `(${piano.style.replace("_", " ")})` : "",
  ].filter(Boolean).join(" ");

  const descParts: string[] = [];
  if (client.phone) descParts.push(`Phone: ${client.phone}`);
  descParts.push(`Service: ${serviceType}`);
  if (pianoLabel) descParts.push(`Piano: ${pianoLabel}`);
  if (amountCharged != null) descParts.push(`Cost: $${Number(amountCharged).toFixed(2)}`);
  if (notes) descParts.push(`Notes: ${notes}`);
  if (piano?.notes) descParts.push(`Piano notes: ${piano.notes}`);
  if (client.notes) descParts.push(`Client notes: ${client.notes}`);

  const description = descParts.map(icsEscape).join("\\n");
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const event = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${dateStr}T${startTimeStr}`,
    `DTEND:${dateStr}T${endTimeStr}`,
    `SUMMARY:${icsEscape(summary)}`,
  ];
  if (client.address) event.push(`LOCATION:${icsEscape(client.address)}`);
  if (description) event.push(`DESCRIPTION:${description}`);
  event.push(`DTSTAMP:${dtstamp}`);
  event.push("END:VEVENT");

  return event;
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
