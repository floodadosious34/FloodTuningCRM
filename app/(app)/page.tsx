import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { DataControls } from "@/components/DataControls";
import type { Client, Piano, ServiceRecord } from "@/lib/supabase/types";

type PianoWithRecords = Piano & { service_records: ServiceRecord[] };
type ClientWithPianos = Client & { pianos: PianoWithRecords[] };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const elevenMonthsAgo = new Date();
  elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
  const cutoff = elevenMonthsAgo.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const { data: rawClients } = await supabase
    .from("clients")
    .select(`
      *,
      pianos (
        *,
        service_records (*)
      )
    `)
    .order("name");

  const clients = (rawClients ?? []) as ClientWithPianos[];

  // Reminder queue: clients reminded in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: recentReminders } = await supabase
    .from("reminders")
    .select("client_id")
    .gte("reminded_at", thirtyDaysAgo.toISOString());

  const recentlyRemindedIds = new Set(recentReminders?.map((r) => r.client_id) ?? []);

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
