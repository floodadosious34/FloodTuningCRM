import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Papa from "papaparse";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return new NextResponse("No file provided", { status: 400 });

  const text = await file.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    return new NextResponse("Error parsing CSV", { status: 400 });
  }

  const rows = parsed.data as Record<string, string>[];

  const leads = rows
    .filter((r) => r["Institution"]?.trim())
    .map((r) => ({
      user_id: user.id,
      category: r["Category"]?.trim() || null,
      institution: r["Institution"].trim(),
      contact_name: r["Contact Name/Title"]?.trim() || null,
      email: r["Email"]?.trim() || null,
      phone: r["Phone"]?.trim() || null,
      address: r["Address"]?.trim() || null,
      notes: r["Notes"]?.trim() || null,
      emailed_at: null,
    }));

  if (leads.length === 0) {
    return new NextResponse("No valid rows found", { status: 400 });
  }

  const { error } = await supabase
    .from("leads")
    .upsert(leads, { onConflict: "institution,user_id" });

  if (error) {
    console.error("Leads import error:", error);
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ success: true, count: leads.length });
}
