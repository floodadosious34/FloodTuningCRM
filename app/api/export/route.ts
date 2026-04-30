import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: clients, error } = await supabase
    .from("clients")
    .select(`
      id, name, phone, email, address, notes,
      pianos (
        id, brand, style, model, serial_number, year_manufactured,
        service_records (
          id, date_serviced, service_type, technician_notes, amount_charged, next_service_due
        )
      )
    `)
    .order("name");

  if (error) return new NextResponse("Export failed", { status: 500 });

  const rows: string[][] = [];

  rows.push([
    "Client ID",
    "Client Name",
    "Phone",
    "Email",
    "Address",
    "Client Notes",
    "Piano ID",
    "Piano Brand",
    "Piano Style",
    "Piano Model",
    "Year Manufactured",
    "Service Record ID",
    "Date Serviced",
    "Service Type",
    "Technician Notes",
    "Amount Charged",
    "Next Service Due",
  ]);

  for (const client of clients ?? []) {
    const pianos = (client.pianos as any[]) ?? [];

    if (pianos.length === 0) {
      rows.push([
        client.id,
        client.name,
        client.phone ?? "",
        client.email ?? "",
        client.address ?? "",
        client.notes ?? "",
        "", "", "", "", "", "", "", "", "", "", "", "",
      ]);
      continue;
    }

    for (const piano of pianos) {
      const records = (piano.service_records as any[]) ?? [];

      if (records.length === 0) {
        rows.push([
          client.id,
          client.name,
          client.phone ?? "",
          client.email ?? "",
          client.address ?? "",
          client.notes ?? "",
          piano.id,
          piano.brand ?? "",
          piano.model ?? "",
          piano.serial_number ?? "",
          piano.year_manufactured ?? "",
          "", "", "", "", "", "",
        ]);
        continue;
      }

      const sorted = [...records].sort((a, b) =>
        b.date_serviced.localeCompare(a.date_serviced)
      );

      for (const record of sorted) {
        rows.push([
          client.id,
          client.name,
          client.phone ?? "",
          client.email ?? "",
          client.address ?? "",
          client.notes ?? "",
          piano.id,
          piano.brand ?? "",
          piano.style ?? "",
          piano.model ?? "",
          piano.serial_number ?? "",
          piano.year_manufactured ?? "",
          record.date_serviced ?? "",
          record.service_type ?? "",
          record.technician_notes ?? "",
          record.amount_charged ?? "",
          record.next_service_due ?? "",
        ]);
      }
    }
  }

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="flood-tuning-export-${date}.csv"`,
    },
  });
}
