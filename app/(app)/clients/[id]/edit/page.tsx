import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateClientAction } from "@/app/actions/clients";
import { FormField } from "@/components/FormField";
import type { Client } from "@/lib/supabase/types";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawClient } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  const client = rawClient as Client | null;
  if (!client) notFound();

  const action = updateClientAction.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/clients/${id}`} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.1em]">Client</span>
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Edit Client</h1>
      </div>

      <form action={action} className="space-y-px">
        <FormField label="Name" name="name" required defaultValue={client.name} />
        <FormField label="Phone" name="phone" type="tel" defaultValue={client.phone} />
        <FormField label="Email" name="email" type="email" defaultValue={client.email} />
        <FormField label="Address" name="address" defaultValue={client.address} />
        <FormField label="Notes" name="notes" rows={3} defaultValue={client.notes} />

        <div className="flex gap-2 pt-4">
          <Link
            href={`/clients/${id}`}
            className="flex-1 text-center py-3 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-[0.1em] hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-[0.1em] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
