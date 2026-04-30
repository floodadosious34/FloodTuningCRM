import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createPianoAction } from "@/app/actions/pianos";
import { FormField } from "@/components/FormField";
import { PianoStyleSelect } from "@/components/PianoStyleSelect";

export default async function NewPianoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const clientName = (client as { name: string }).name;
  const action = createPianoAction.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-1">
        <Link href={`/clients/${id}`} className="text-stone-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-stone-900">Add Piano</h1>
      </div>
      <p className="text-stone-500 text-sm ml-9 mb-6">for {clientName}</p>

      <form action={action} className="space-y-4 bg-white rounded-2xl border border-stone-200 p-5">
        <PianoStyleSelect />
        <FormField label="Brand" name="brand" placeholder="Steinway, Yamaha, Kawai…" />
        <FormField label="Model" name="model" placeholder="Model B, U1, RX-3…" />
        <FormField label="Serial Number" name="serial_number" placeholder="123456" />
        <FormField label="Year Manufactured" name="year_manufactured" type="number" placeholder="1985" />
        <FormField label="Notes" name="notes" rows={3} placeholder="Any notes about this piano…" />

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
            Save Piano
          </button>
        </div>
      </form>
    </div>
  );
}
