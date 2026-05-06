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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-500 text-sm">{user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <DataControls />
          <SignOutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Clients" value={totalClients} />
        <StatCard label="Due for Service" value={dueClients.length} highlight={dueClients.length > 0} />
        <StatCard label="Need Reminder" value={pendingReminders.length} highlight={pendingReminders.length > 0} />
      </div>

      {/* Appointment Calendar */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-stone-800">Scheduled Appointments</h2>
          <a
            href="/api/calendar"
            download="tuning-appointments.ics"
            className="text-sm text-stone-500 hover:text-stone-700 font-medium"
          >
            Export .ics
          </a>
        </div>
        <AppointmentCalendar entries={calendarEntries} todayDate={todayDate} />
      </section>

      {/* Due clients */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-stone-800">Due for Service</h2>
          {pendingReminders.length > 0 && (
            <Link href="/reminders" className="text-sm text-amber-600 font-medium">
              Reminder Queue →
            </Link>
          )}
        </div>

        {dueClients.length === 0 ? (
          <EmptyState message="All clients are up to date!" icon="✓" />
        ) : (
          <div className="space-y-3">
            {dueClients.map((client) => {
              const duePianos = client.pianos.filter(isDue);
              const reminded = recentlyRemindedIds.has(client.id);
              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block bg-white rounded-2xl border border-stone-200 p-4 active:bg-stone-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 truncate">{client.name}</p>
                      {client.phone && (
                        <p className="text-stone-500 text-sm mt-0.5">{client.phone}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {duePianos.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5"
                          >
                            {p.brand || "Piano"} {p.style ? `(${formatStyle(p.style)})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      {reminded ? (
                        <span className="text-xs bg-stone-100 text-stone-500 rounded-full px-2 py-1">Reminded</span>
                      ) : (
                        <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-1">Due</span>
                      )}
                    </div>
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
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="p-4">
        <p className="text-sm font-semibold text-stone-700 mb-3 text-center">{monthName}</p>
        <div className="grid grid-cols-7 gap-px text-center text-xs">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="pb-1 font-medium text-stone-400">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasEntry = byDate.has(dateStr);
            const isToday = day === todayDay;
            return (
              <div
                key={i}
                className={`flex flex-col items-center py-1 rounded-lg ${
                  isToday ? "bg-stone-900 text-white" : "text-stone-700"
                }`}
              >
                <span className="text-xs leading-none">{day}</span>
                {hasEntry && (
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isToday ? "bg-amber-400" : "bg-amber-500"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="px-4 pb-4 text-center text-stone-400 text-xs">
          No appointments in the next 30 days
        </div>
      ) : (
        <div className="border-t border-stone-100">
          {upcoming.map((entry) => {
            const dateLabel = new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            });
            return (
              <Link
                key={entry.id}
                href={`/clients/${entry.client_id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 hover:bg-stone-50"
              >
                <div className="w-10 text-center flex-shrink-0">
                  <span className="block text-xs font-semibold text-amber-600">{dateLabel.split(",")[0]}</span>
                  <span className="block text-sm font-bold text-stone-800 leading-tight">
                    {dateLabel.split(" ").slice(-1)[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{entry.client_name}</p>
                  <p className="text-xs text-stone-500 truncate">
                    {entry.piano_brand ?? "Piano"} · {entry.service_type}
                  </p>
                </div>
                <span className="text-xs text-stone-400 flex-shrink-0">
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
    <div className={`rounded-2xl p-4 text-center border ${highlight ? "bg-amber-50 border-amber-200" : "bg-white border-stone-200"}`}>
      <p className={`text-2xl font-bold ${highlight ? "text-amber-700" : "text-stone-900"}`}>{value}</p>
      <p className={`text-xs mt-0.5 ${highlight ? "text-amber-600" : "text-stone-500"}`}>{label}</p>
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-stone-500 text-sm">{message}</p>
    </div>
  );
}

function formatStyle(style: string) {
  return style.replace("_", " ");
}
