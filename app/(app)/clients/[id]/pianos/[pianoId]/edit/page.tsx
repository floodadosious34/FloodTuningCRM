import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updatePianoAction, deletePianoAction } from "@/app/actions/pianos";
import { FormField } from "@/components/FormField";
import { PianoStyleSelect } from "@/components/PianoStyleSelect";
import { DeleteButton } from "@/components/DeleteButton";
import type { Piano } from "@/lib/supabase/types";

export default async function EditPianoPage({
  params,
}: {
  params: Promise<{ id: string; pianoId: string }>;
}) {
  const { id, pianoId } = await params;
  const supabase = await createClient();

  const { data: rawPiano } = await supabase
    .from("pianos")
    .select("*")
    .eq("id", pianoId)
    .eq("client_id", id)
    .single();

  const piano = rawPiano as Piano | null;
  if (!piano) notFound();

  const saveAction = updatePianoAction.bind(null, pianoId, id);
  const deleteAction = deletePianoAction.bind(null, pianoId, id);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/clients/${id}`} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.1em]">Client</span>
        </Link>
        <DeleteButton action={deleteAction} label="Delete" />
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Edit Piano</h1>
      </div>

      <form action={saveAction} className="space-y-px">
        <PianoStyleSelect defaultValue={piano.style} />
        <FormField label="Brand" name="brand" defaultValue={piano.brand} />
        <FormField label="Model" name="model" defaultValue={piano.model} />
        <FormField label="Serial Number" name="serial_number" defaultValue={piano.serial_number} />
        <FormField label="Year Manufactured" name="year_manufactured" type="number" defaultValue={piano.year_manufactured} />
        <FormField label="Notes" name="notes" rows={3} defaultValue={piano.notes} />

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
