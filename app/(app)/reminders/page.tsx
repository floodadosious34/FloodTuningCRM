import { createClient } from "@/lib/supabase/server";
import { ReminderCard } from "@/components/ReminderCard";
import ClientSearch from "@/components/ClientSearch";

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

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q } = await searchParams;

  const elevenMonthsAgo = new Date();
  elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
  const cutoff = elevenMonthsAgo.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("clients")
    .select(`
      id, name, phone, email,
      pianos (
        id, brand, style, model,
        service_records (id, date_serviced, next_service_due)
      )
    `)
    .order("name");

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: rawClients } = await query;

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
    if (!remindedMap.has(r.client_id)) remindedMap.set(r.client_id, r.reminded_at);
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
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Reminder Queue</h1>
        <p className="text-zinc-600 text-sm mt-1">Clients whose piano is due for service</p>
      </div>

      <div className="mb-6">
        <ClientSearch defaultValue={q} />
      </div>

      {pending.length === 0 && reminded.length === 0 && (
        <div className="border border-zinc-800 p-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">
            {q ? `No clients due for service matching "${q}"` : "No clients due for service"}
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">
            Needs Contact — {pending.length}
          </p>
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {pending.map((client) => (
              <ReminderCard key={client.id} client={client} reminded={false} />
            ))}
          </div>
        </section>
      )}

      {reminded.length > 0 && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">
            Recently Reminded — {reminded.length}
          </p>
          <div className="border border-zinc-800 divide-y divide-zinc-800">
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
