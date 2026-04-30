import { createClient } from "@/lib/supabase/server";
import { ReminderCard } from "@/components/ReminderCard";

type ServiceRecordRow = {
  id: string;
  date_serviced: string;
  next_service_due: string | null;
};

type PianoRow = {
  id: string;
  brand: string | null;
  style: string | null;
  model: string | null;
  service_records: ServiceRecordRow[];
};

type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  pianos: PianoRow[];
};

export default async function RemindersPage() {
  const supabase = await createClient();

  const elevenMonthsAgo = new Date();
  elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
  const cutoff = elevenMonthsAgo.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const { data: rawClients } = await supabase
    .from("clients")
    .select(`
      id, name, phone, email,
      pianos (
        id, brand, style, model,
        service_records (id, date_serviced, next_service_due)
      )
    `)
    .order("name");

  const clients = (rawClients ?? []) as ClientRow[];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: recentReminders } = await supabase
    .from("reminders")
    .select("client_id, reminded_at")
    .gte("reminded_at", thirtyDaysAgo.toISOString())
    .order("reminded_at", { ascending: false });

  const remindedMap = new Map<string, string>();
  for (const r of recentReminders ?? []) {
    if (!remindedMap.has(r.client_id)) {
      remindedMap.set(r.client_id, r.reminded_at);
    }
  }

  function isDue(piano: PianoRow): boolean {
    if (!piano.service_records || piano.service_records.length === 0) return true;
    const latest = piano.service_records.reduce((a, b) =>
      a.date_serviced > b.date_serviced ? a : b
    );
    if (latest.next_service_due) return latest.next_service_due <= today;
    return latest.date_serviced <= cutoff;
  }

  const dueClients = clients.filter((c) => c.pianos.some(isDue));
  const pending = dueClients.filter((c) => !remindedMap.has(c.id));
  const reminded = dueClients.filter((c) => remindedMap.has(c.id));

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Reminder Queue</h1>
      <p className="text-stone-500 text-sm mb-6">Clients whose piano is due for service</p>

      {pending.length === 0 && reminded.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-stone-500 text-sm">No clients due for service right now.</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Needs Contact ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((client) => (
              <ReminderCard key={client.id} client={client} reminded={false} />
            ))}
          </div>
        </section>
      )}

      {reminded.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Recently Reminded ({reminded.length})
          </h2>
          <div className="space-y-3">
            {reminded.map((client) => (
              <ReminderCard
                key={client.id}
                client={client}
                reminded={true}
                remindedAt={remindedMap.get(client.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
