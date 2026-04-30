/**
 * Seed script — imports all service history from the Flood Tuning Excel file into Supabase.
 *
 * Usage:
 *   node scripts/seed.mjs <your-email> <your-password>
 *
 * Example:
 *   node scripts/seed.mjs joe@example.com mypassword
 */

import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Config ────────────────────────────────────────────────────────────────────

const EXCEL_PATH =
  "/Users/xcastudent/Library/Mobile Documents/com~apple~CloudDocs/Flood Tuning/Flood Tuning Invoices_2022(AutoRecovered).xlsx";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const [, , EMAIL, PASSWORD] = process.argv;

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node scripts/seed.mjs <email> <password>");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Try reading .env.local manually
  try {
    const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of env.split("\n")) {
      const [k, ...v] = line.split("=");
      process.env[k?.trim()] = v.join("=").trim();
    }
  } catch {
    console.error("Could not read .env.local — make sure it exists.");
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeStyle(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  if (s.includes("spinet")) return "spinet";
  if (s.includes("console")) return "console";
  if (s.includes("studio")) return "studio";
  if (s.includes("baby") || s === "bbg" || s === "bg") return "baby_grand";
  if (s.includes("grand")) return "grand";
  if (s.includes("upright") || s.includes("vertical") || s.includes("vert")) return "upright";
  return "other";
}

function parseDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw.toISOString().split("T")[0];
  // Excel serial number (e.g. 45297)
  if (typeof raw === "number") {
    // Excel epoch is Dec 30, 1899
    const date = new Date(Math.round((raw - 25569) * 86400 * 1000));
    if (!isNaN(date)) return date.toISOString().split("T")[0];
  }
  const str = String(raw).trim();
  const m = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const m2 = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m2) {
    const y = m2[3].length === 2 ? "20" + m2[3] : m2[3];
    return `${y}-${String(m2[1]).padStart(2, "0")}-${String(m2[2]).padStart(2, "0")}`;
  }
  return null;
}

function clean(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === "" || s === "NaN" || s === "nan" || s.toLowerCase() === "nan" ? null : s;
}

function buildAddress(addr, city, state, zip) {
  const parts = [addr, city, state, zip].map(clean).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function clientKey(firstName, lastName, address) {
  return `${String(firstName || "").toLowerCase().trim()}|${String(lastName || "").toLowerCase().trim()}|${String(address || "").toLowerCase().trim()}`;
}

// ── Parse Excel ───────────────────────────────────────────────────────────────

console.log("Reading Excel file…");
const wb = XLSX.readFile(EXCEL_PATH);

const SHEETS = [
  "2017 Services",
  "2018 Services",
  "2019 Services",
  "2021 Services",
  "2022 Services",
  "2023 Services",
  "2024 Services",
  "2025 Services",
  "2026 Services",
];

// Each entry: { client, piano, service }
const records = [];

for (const sheetName of SHEETS) {
  const ws = wb.Sheets[sheetName];
  if (!ws) continue;

  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

  for (const row of rows) {
    const firstName = clean(row["First Name"]);
    const lastName = clean(row["Last Name"]);
    if (!firstName && !lastName) continue;

    const name = [firstName, lastName].filter(Boolean).join(" ");
    const phone = clean(row["Phone"]);
    const email = clean(row["Email"]);
    const address = buildAddress(
      row["Address"],
      row["City"],
      row["State"],
      row["ZIP"]
    );
    const notes = clean(row["Notes"]);

    // Piano fields
    const brand = clean(row["Brand"]);
    const rawStyle = clean(row["Piano Type"]);
    const style = normalizeStyle(rawStyle);
    const model = clean(row["Make "]) ?? clean(row["Make"]);
    const serialRaw = clean(row["Serial #"]);
    const serial = serialRaw && serialRaw !== "NaN" ? serialRaw : null;

    // Service fields
    const serviceType = clean(row["Service"]) || "Tuning";
    const rawDate =
      row["Date of Service \r\nStart"] ??
      row["Date of Service \nStart"] ??
      row["Date of Service\r\nStart"] ??
      row["Date of Service\nStart"] ??
      row["Date of Service Start"] ??
      row["Date"];
    const dateServiced = parseDate(rawDate);

    if (!dateServiced) continue; // skip rows with no date

    records.push({
      client: { name, phone, email, address, notes },
      piano: { brand, style, model, serial_number: serial },
      service: {
        service_type: serviceType,
        date_serviced: dateServiced,
        technician_notes: notes,
      },
    });
  }
}

console.log(`Parsed ${records.length} service records from Excel.`);

// ── Sign in ───────────────────────────────────────────────────────────────────

console.log(`Signing in as ${EMAIL}…`);
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
});

if (authError) {
  console.error("Login failed:", authError.message);
  process.exit(1);
}

const userId = authData.user.id;
console.log(`Signed in. User ID: ${userId}`);

// ── Deduplicate and insert ────────────────────────────────────────────────────

// Map: clientKey → { clientId, pianoMap: { pianoKey → pianoId } }
const clientMap = new Map();

let clientsCreated = 0;
let pianosCreated = 0;
let servicesCreated = 0;
let skipped = 0;

for (const { client, piano, service } of records) {
  const key = clientKey(client.name.split(" ")[0], client.name.split(" ").slice(1).join(" "), client.address);

  // ── Client ──
  let clientId;
  if (clientMap.has(key)) {
    clientId = clientMap.get(key).clientId;
  } else {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: userId,
        name: client.name,
        phone: client.phone,
        email: client.email,
        address: client.address,
        notes: null, // notes go on service records
      })
      .select("id")
      .single();

    if (error) {
      console.warn(`  ✗ Client "${client.name}": ${error.message}`);
      skipped++;
      continue;
    }

    clientId = data.id;
    clientMap.set(key, { clientId, pianoMap: new Map() });
    clientsCreated++;
  }

  // ── Piano ──
  const pianoKey = `${clean(piano.brand) || ""}|${clean(piano.style) || ""}|${clean(piano.serial_number) || ""}`;
  let pianoId;
  const pianoMap = clientMap.get(key).pianoMap;

  if (pianoMap.has(pianoKey)) {
    pianoId = pianoMap.get(pianoKey);
  } else {
    const { data, error } = await supabase
      .from("pianos")
      .insert({
        client_id: clientId,
        brand: piano.brand,
        style: piano.style,
        model: piano.model,
        serial_number: piano.serial_number,
      })
      .select("id")
      .single();

    if (error) {
      console.warn(`  ✗ Piano for "${client.name}": ${error.message}`);
      skipped++;
      continue;
    }

    pianoId = data.id;
    pianoMap.set(pianoKey, pianoId);
    pianosCreated++;
  }

  // ── Service record ──
  const { error: svcError } = await supabase.from("service_records").insert({
    piano_id: pianoId,
    date_serviced: service.date_serviced,
    service_type: service.service_type,
    technician_notes: service.technician_notes,
    next_service_due: null,
  });

  if (svcError) {
    console.warn(`  ✗ Service record for "${client.name}" on ${service.date_serviced}: ${svcError.message}`);
    skipped++;
  } else {
    servicesCreated++;
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n✓ Import complete!");
console.log(`  Clients created:         ${clientsCreated}`);
console.log(`  Pianos created:          ${pianosCreated}`);
console.log(`  Service records created: ${servicesCreated}`);
if (skipped > 0) console.log(`  Skipped (errors):        ${skipped}`);
