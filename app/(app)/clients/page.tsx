import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ClientSearch from "@/components/ClientSearch";

type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  pianos: { id: string }[];
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q } = await searchParams;

  let query = supabase
    .from("clients")
    .select("id, name, phone, email, pianos(id)")
    .order("name");

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: rawClients } = await query;
  const clients = (rawClients ?? []) as ClientRow[];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-stone-900">Clients</h1>
        <Link
          href="/clients/new"
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Client
        </Link>
      </div>

      <ClientSearch defaultValue={q} />

      <div className="mt-4 space-y-2">
        {clients.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-stone-400 text-sm">
              {q ? `No clients matching "${q}"` : "No clients yet. Add your first one!"}
            </p>
          </div>
        )}

        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="flex items-center justify-between bg-white rounded-2xl border border-stone-200 px-4 py-4 active:bg-stone-50"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-900 truncate">{client.name}</p>
              <p className="text-stone-500 text-sm mt-0.5 truncate">
                {client.phone || client.email || "No contact info"}
              </p>
            </div>
            <div className="flex items-center gap-3 ml-3 flex-shrink-0">
              <span className="text-xs text-stone-400">
                {client.pianos.length} {client.pianos.length === 1 ? "piano" : "pianos"}
              </span>
              <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
