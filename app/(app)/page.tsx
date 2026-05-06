import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { DataControls } from "@/components/DataControls";
import type { Client, Piano, ServiceRecord } from "@/lib/supabase/types";

type AppointmentEntry = {
  id: string;
  date: string;
  service_type: string;
  client_id: string;
  client_name: string;
  piano_brand: string | null;
  piano_style: string | null;
};

type PianoWithRecords = Piano & { service_records: ServiceRecord[] };
type ClientWithPianos = Client & { pianos: PianoWithRecords[] };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const elevenMonthsAgo = new Date();
  elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
  const cutoff = elevenMonthsAgo.toISOString().split("T")[0];
  const todayDate = new Date();
  const today = todayDate.toISOString().split("T")[0];

  const ninetyDaysOut = new Date();
  ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);
  const ninetyDaysOutStr = ninetyDaysOut.toISOString().split("T")[0];

  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);

  const [
    { data: rawClients },
    { data: recentReminders },
    { data: rawServiceAppts },
    { data: rawAppts },
  ] = await Promise.all([
    supabase.from("clients").select(`*, pianos (*, service_records (*))`).order("name"),
    supabase.from("reminders").select("client_id").gte("reminded_at", thirtyDaysAgoDate.toISOString()),
    supabase
      .from("service_records")
      .select(`id, next_service_due, service_type, pianos (id, brand, style, clients (id, name))`)
      .not("next_service_due", "is", null)
      .gte("next_service_due", today)
      .lte("next_service_due", ninetyDaysOutStr)
      .order("next_service_due"),
    supabase
      .from("appointments")
      .select(`id, scheduled_date, service_type, pianos (id, brand, style, clients (id, name))`)
      .gte("scheduled_date", today)
      .lte("scheduled_date", ninetyDaysOutStr)
      .order("scheduled_date"),
  ]);

  const clients = (rawClients ?? []) as ClientWithPianos[];
  const recentlyRemindedIds = new Set(recentReminders?.map((r) => r.client_id) ?? []);

  // Merge both sources into a unified list, deduplicated by client+date
  const seen = new Set<string>();
  const calendarEntries: AppointmentEntry[] = [];

  for (const a of rawAppts ?? []) {
    const piano = a.pianos as any;
    const client = piano?.clients;
    if (!client) continue;
    const key = `${client.id}:${a.scheduled_date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    calendarEntries.push({
      id: `appt-${a.id}`,
      date: a.scheduled_date,
      service_type: a.service_type,
      client_id: client.id,
      client_name: client.name,
      piano_brand: piano?.brand ?? null,
      piano_style: piano?.style ?? null,
    });
  }

  for (const r of rawServiceAppts ?? []) {
    const piano = r.pianos as any;
    const client = piano?.clients;
    if (!client || !r.next_service_due) continue;
    const key = `${client.id}:${r.next_service_due}`;
    if (seen.has(key)) continue;
    seen.add(key);
    calendarEntries.push({
      id: `sr-${r.id}`,
      date: r.next_service_due,
      service_type: r.service_type,
      client_id: client.id,
      client_name: client.name,
      piano_brand: piano?.brand ?? null,
      piano_style: piano?.style ?? null,
    });
  }

  calendarEntries.sort((a, b) => a.date.localeCompare(b.date));

  function isDue(piano: PianoWithRecords): boolean {
    if (!piano.service_records || piano.service_records.length === 0) return true;
    const latest = piano.service_records.reduce((a, b) =>
      a.date_serviced > b.date_serviced ? a : b
    );
    if (latest.next_service_due) return latest.next_service_due <= today;
    return latest.date_serviced <= cutoff;
  }

  const dueClients = clients.filter((c) => c.pianos.some(isDue));
  const pendingReminders = dueClients.filter((c) => !recentlyRemindedIds.has(c.id));
  const totalClients = clients.length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <DataControls />
          <SignOutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border border-zinc-800 mb-8">
        <StatCard label="Clients" value={totalClients} />
        <StatCard label="Due" value={dueClients.length} highlight={dueClients.length > 0} />
        <StatCard label="Remind" value={pendingReminders.length} highlight={pendingReminders.length > 0} />
      </div>

      {/* Appointment Calendar */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Scheduled Appointments</p>
          <a
            href="/api/calendar"
            download="tuning-appointments.ics"
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Export .ics
          </a>
        </div>
        <AppointmentCalendar entries={calendarEntries} todayDate={todayDate} />
      </section>

      {/* Due clients */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Due for Service</p>
          {pendingReminders.length > 0 && (
            <Link href="/reminders" className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-500 hover:text-red-400 transition-colors">
              Reminder Queue →
            </Link>
          )}
        </div>

        {dueClients.length === 0 ? (
          <EmptyState message="All clients are up to date" />
        ) : (
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {dueClients.map((client) => {
              const duePianos = client.pianos.filter(isDue);
              const reminded = recentlyRemindedIds.has(client.id);
              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-start justify-between p-4 hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-100 truncate">{client.name}</p>
                    {client.phone && (
                      <p className="text-zinc-600 text-sm mt-0.5">{client.phone}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {duePianos.map((p) => (
                        <span
                          key={p.id}
                          className="text-[10px] font-bold uppercase tracking-[0.1em] bg-zinc-900 text-zinc-400 border border-zinc-700 px-2 py-0.5"
                        >
                          {p.brand || "Piano"} {p.style ? `· ${formatStyle(p.style)}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {reminded ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 border border-zinc-800 px-2 py-1">Reminded</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-500 border border-red-900 px-2 py-1">Due</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function AppointmentCalendar({
  entries,
  todayDate,
}: {
  entries: AppointmentEntry[];
  todayDate: Date;
}) {
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth();
  const todayDay = todayDate.getDate();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = todayDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const byDate = new Map<string, AppointmentEntry[]>();
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const thirtyDaysOut = new Date(todayDate);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  const thirtyDaysOutStr = thirtyDaysOut.toISOString().split("T")[0];
  const upcoming = entries.filter((e) => e.date <= thirtyDaysOutStr);

  return (
    <div className="border border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600 mb-4 text-center">{monthName}</p>
        <div className="grid grid-cols-7 gap-px text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="pb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-700">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasEntry = byDate.has(dateStr);
            const isToday = day === todayDay;
            return (
              <div
                key={i}
                className={`flex flex-col items-center py-1 ${isToday ? "bg-zinc-100" : ""}`}
              >
                <span className={`text-xs leading-none font-medium ${isToday ? "text-zinc-950 font-black" : "text-zinc-500"}`}>{day}</span>
                {hasEntry && (
                  <span className="mt-0.5 w-1 h-1 rounded-full bg-red-600" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">No appointments in the next 30 days</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {upcoming.map((entry) => {
            const dateLabel = new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            });
            return (
              <Link
                key={entry.id}
                href={`/clients/${entry.client_id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-900 transition-colors"
              >
                <div className="w-10 flex-shrink-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-red-600">{dateLabel.split(",")[0]}</span>
                  <span className="block text-lg font-black text-zinc-100 leading-tight">
                    {dateLabel.split(" ").slice(-1)[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{entry.client_name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 truncate mt-0.5">
                    {entry.piano_brand ?? "Piano"} · {entry.service_type}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-700 flex-shrink-0">
                  {dateLabel.replace(/^[^,]+,\s*/, "")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-4 text-center border-r border-zinc-800 last:border-r-0 ${highlight ? "bg-red-950" : ""}`}>
      <p className={`text-3xl font-black ${highlight ? "text-red-400" : "text-zinc-100"}`}>{value}</p>
      <p className={`text-[10px] font-bold uppercase tracking-[0.15em] mt-1 ${highlight ? "text-red-600" : "text-zinc-600"}`}>{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-zinc-800 p-8 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">{message}</p>
    </div>
  );
}

function formatStyle(style: string) {
  return style.replace("_", " ");
}
