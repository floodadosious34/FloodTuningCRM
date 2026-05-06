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

  if (q) query = query.ilike("name", `%${q}%`);

  const { data: rawClients } = await query;
  const clients = (rawClients ?? []) as ClientRow[];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Clients</h1>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-[0.1em] px-4 py-2.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Client
        </Link>
      </div>

      <ClientSearch defaultValue={q} />

      <div className="mt-4 border border-zinc-800 divide-y divide-zinc-800">
        {clients.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">
              {q ? `No clients matching "${q}"` : "No clients yet"}
            </p>
          </div>
        )}

        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="flex items-center justify-between px-4 py-4 hover:bg-zinc-900 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-100 truncate">{client.name}</p>
              <p className="text-zinc-600 text-sm mt-0.5 truncate">
                {client.phone || client.email || "No contact info"}
              </p>
            </div>
            <div className="flex items-center gap-3 ml-3 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-700">
                {client.pianos.length} {client.pianos.length === 1 ? "piano" : "pianos"}
              </span>
              <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
