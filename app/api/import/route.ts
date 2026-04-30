import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Papa from "papaparse";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return new NextResponse("No file provided", { status: 400 });

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    
    if (parsed.errors.length > 0) {
      console.error("Papa parse errors", parsed.errors);
      // We can continue if they are non-fatal, but generally better to return error
      return new NextResponse("Error parsing CSV", { status: 400 });
    }

    const rows = parsed.data as Record<string, string>[];

    for (const row of rows) {
      const clientId = row["Client ID"]?.trim() || undefined;
      const clientName = row["Client Name"]?.trim();

      if (!clientName) continue; // Skip rows with no client name

      const clientData = {
        ...(clientId ? { id: clientId } : {}),
        user_id: user.id,
        name: clientName,
        phone: row["Phone"]?.trim() || null,
        email: row["Email"]?.trim() || null,
        address: row["Address"]?.trim() || null,
        notes: row["Client Notes"]?.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { data: client, error: clientErr } = await supabase
        .from("clients")
        .upsert(clientData, { onConflict: "id" })
        .select("id")
        .single();
      
      if (clientErr || !client) {
        console.error("Client upsert error:", clientErr, clientData);
        continue;
      }

      const newClientId = client.id;
      const pianoId = row["Piano ID"]?.trim() || undefined;
      const brand = row["Piano Brand"]?.trim() || null;
      let style = row["Piano Style"]?.trim() || null;
      const allowedStyles = ["upright", "grand", "baby_grand", "spinet", "console", "studio", "other"];
      if (style && !allowedStyles.includes(style)) {
        style = "other"; // Default fallback
      }

      const model = row["Piano Model"]?.trim() || null;
      const serial = row["Serial Number"]?.trim() || null;
      const yearStr = row["Year Manufactured"]?.trim() || "";
      const yearParsed = parseInt(yearStr, 10);
      const year = isNaN(yearParsed) ? null : yearParsed;

      if (pianoId || brand || style || model || serial || year) {
        const pianoData = {
          ...(pianoId ? { id: pianoId } : {}),
          client_id: newClientId,
          brand,
          style,
          model,
          serial_number: serial,
          year_manufactured: year,
          updated_at: new Date().toISOString()
        };

        const { data: pianoObj, error: pianoErr } = await supabase
          .from("pianos")
          .upsert(pianoData, { onConflict: "id" })
          .select("id")
          .single();
          
        if (pianoErr || !pianoObj) {
           console.error("Piano upsert error:", pianoErr, pianoData);
           continue; 
        }

        const newPianoId = pianoObj.id;
        const recordId = row["Service Record ID"]?.trim() || undefined;
        let dateServiced = row["Date Serviced"]?.trim() || null;
        const serviceType = row["Service Type"]?.trim() || null;
        const techNotes = row["Technician Notes"]?.trim() || null;
        const amountChargedStr = row["Amount Charged"]?.trim() || "";
        const amountCharged = amountChargedStr ? parseFloat(amountChargedStr) : null;
        let nextDue = row["Next Service Due"]?.trim() || null;

        if (recordId || dateServiced || serviceType || techNotes || amountCharged !== null || nextDue) {
          // Add dummy date if we somehow only have a service type, notes, or amount
          if (!dateServiced && (serviceType || techNotes)) {
             dateServiced = new Date().toISOString().split("T")[0];
          }

          if (dateServiced && serviceType) {
              const recordData = {
                ...(recordId ? { id: recordId } : {}),
                piano_id: newPianoId,
                date_serviced: dateServiced,
                service_type: serviceType,
                technician_notes: techNotes,
                amount_charged: isNaN(amountCharged as number) ? null : amountCharged,
                next_service_due: nextDue,
                updated_at: new Date().toISOString()
              };

              const { error: recErr } = await supabase
                .from("service_records")
                .upsert(recordData, { onConflict: "id" });
              if (recErr) {
                 console.error("Service record upsert error:", recErr, recordData);
              }
          }
        }
      }
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (err: any) {
    console.error("Import error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
