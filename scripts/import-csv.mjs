/**
 * CSV import script — upserts clients and pianos from a CRM export, then inserts
 * any service records that don't already exist (matched by piano + date).
 *
 * Usage:
 *   node scripts/import-csv.mjs <path-to-csv> <email> <password>
 *
 * Example:
 *   node scripts/import-csv.mjs ~/Downloads/flood-tuning-export-2026-05-06.csv james@leadvaultdigital.com mypassword
 */

import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Args ──────────────────────────────────────────────────────────────────────

const [, , CSV_PATH, EMAIL, PASSWORD] = process.argv;

if (!CSV_PATH || !EMAIL || !PASSWORD) {
  console.error("Usage: node scripts/import-csv.mjs <path-to-csv> <email> <password>");
  process.exit(1);
}

// ── Env ───────────────────────────────────────────────────────────────────────

try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of env.split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (k) process.env[k] = v;
  }
} catch {
  console.error("Could not read .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Parse CSV ─────────────────────────────────────────────────────────────────

const csvText = readFileSync(resolve(CSV_PATH), "utf-8");
const { data: rows, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

if (errors.length) {
  console.error("CSV parse errors:", errors);
  process.exit(1);
}

console.log(`Parsed ${rows.length} rows from CSV.`);

// ── Sign in ───────────────────────────────────────────────────────────────────

console.log(`Signing in as ${EMAIL}…`);
const { error: authError } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (authError) {
  console.error("Login failed:", authError.message);
  process.exit(1);
}
console.log("Signed in.\n");

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_STYLES = ["upright", "grand", "baby_grand", "spinet", "console", "studio", "other"];

function clean(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

// ── Group rows by client then piano ───────────────────────────────────────────

// Map: clientId → { clientData, pianos: Map<pianoId, { pianoData, serviceRows[] }> }
const clientMap = new Map();

for (const row of rows) {
  const clientId = clean(row["Client ID"]);
  const clientName = clean(row["Client Name"]);
  if (!clientId || !clientName) continue;

  if (!clientMap.has(clientId)) {
    clientMap.set(clientId, {
      clientData: {
        id: clientId,
        name: clientName,
        phone: clean(row["Phone"]),
        email: clean(row["Email"]),
        address: clean(row["Address"]),
        notes: clean(row["Client Notes"]),
      },
      pianos: new Map(),
    });
  }

  const pianoId = clean(row["Piano ID"]);
  if (!pianoId) continue;

  const { pianos } = clientMap.get(clientId);
  if (!pianos.has(pianoId)) {
    // NOTE: The export has a column-labeling bug — the "Year Manufactured" column
    // actually contains the serial number, and year_manufactured data is not exported.
    const rawStyle = clean(row["Piano Style"]);
    pianos.set(pianoId, {
      pianoData: {
        id: pianoId,
        brand: clean(row["Piano Brand"]),
        style: rawStyle && VALID_STYLES.includes(rawStyle) ? rawStyle : (rawStyle ? "other" : null),
        model: clean(row["Piano Model"]),
        serial_number: clean(row["Year Manufactured"]), // see NOTE above
        year_manufactured: null, // not preserved in export
      },
      serviceRows: [],
    });
  }

  const dateServiced = clean(row["Date Serviced"]);
  const serviceType = clean(row["Service Type"]);
  if (dateServiced && serviceType) {
    pianos.get(pianoId).serviceRows.push({
      date_serviced: dateServiced,
      service_type: serviceType,
      technician_notes: clean(row["Technician Notes"]),
      amount_charged: (() => {
        const v = parseFloat(clean(row["Amount Charged"]) ?? "");
        return isNaN(v) ? null : v;
      })(),
      next_service_due: clean(row["Next Service Due"]),
    });
  }
}

console.log(`Clients in CSV: ${clientMap.size}`);

// ── Upsert clients ────────────────────────────────────────────────────────────

const { data: { user } } = await supabase.auth.getUser();
let clientsUpserted = 0, pianosUpserted = 0, recordsInserted = 0, recordsSkipped = 0;

for (const [clientId, { clientData, pianos }] of clientMap) {
  const { error } = await supabase
    .from("clients")
    .upsert({ ...clientData, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: "id" });

  if (error) {
    console.warn(`  ✗ Client "${clientData.name}": ${error.message}`);
    continue;
  }
  clientsUpserted++;

  // ── Upsert pianos ───────────────────────────────────────────────────────────

  for (const [pianoId, { pianoData, serviceRows }] of pianos) {
    const { error: pianoErr } = await supabase
      .from("pianos")
      .upsert({ ...pianoData, client_id: clientId, updated_at: new Date().toISOString() }, { onConflict: "id" });

    if (pianoErr) {
      console.warn(`  ✗ Piano ${pianoId} for "${clientData.name}": ${pianoErr.message}`);
      continue;
    }
    pianosUpserted++;

    // ── Service records: fetch existing dates to avoid duplicates ───────────────

    const { data: existing } = await supabase
      .from("service_records")
      .select("date_serviced")
      .eq("piano_id", pianoId);

    const existingDates = new Set((existing ?? []).map((r) => r.date_serviced));

    for (const sr of serviceRows) {
      if (existingDates.has(sr.date_serviced)) {
        recordsSkipped++;
        continue;
      }
      const { error: srErr } = await supabase
        .from("service_records")
        .insert({ ...sr, piano_id: pianoId });

      if (srErr) {
        console.warn(`  ✗ Service record for piano ${pianoId} on ${sr.date_serviced}: ${srErr.message}`);
      } else {
        recordsInserted++;
        existingDates.add(sr.date_serviced); // guard against duplicate dates in same CSV
      }
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n✓ Import complete!");
console.log(`  Clients upserted:          ${clientsUpserted}`);
console.log(`  Pianos upserted:           ${pianosUpserted}`);
console.log(`  Service records inserted:  ${recordsInserted}`);
console.log(`  Service records skipped (already exist): ${recordsSkipped}`);
