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
        <Link href={`/clients/${id}`} className="text-stone-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-stone-900">Edit Client</h1>
      </div>

      <form action={action} className="space-y-4 bg-white rounded-2xl border border-stone-200 p-5">
        <FormField label="Name" name="name" required defaultValue={client.name} />
        <FormField label="Phone" name="phone" type="tel" defaultValue={client.phone} />
        <FormField label="Email" name="email" type="email" defaultValue={client.email} />
        <FormField label="Address" name="address" defaultValue={client.address} />
        <FormField label="Notes" name="notes" rows={3} defaultValue={client.notes} />

        <div className="flex gap-3 pt-2">
          <Link
            href={`/clients/${id}`}
            className="flex-1 text-center py-3 border border-stone-200 rounded-xl text-stone-600 font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
