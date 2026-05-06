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
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/clients/${id}`} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.1em]">{clientName}</span>
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Add Piano</h1>
      </div>

      <form action={action} className="space-y-px">
        <PianoStyleSelect />
        <FormField label="Brand" name="brand" placeholder="Steinway, Yamaha, Kawai…" />
        <FormField label="Model" name="model" placeholder="Model B, U1, RX-3…" />
        <FormField label="Serial Number" name="serial_number" placeholder="123456" />
        <FormField label="Year Manufactured" name="year_manufactured" type="number" placeholder="1985" />
        <FormField label="Notes" name="notes" rows={3} placeholder="Any notes about this piano…" />

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
            Save Piano
          </button>
        </div>
      </form>
    </div>
  );
}
