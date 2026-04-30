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
        <div className="flex items-center gap-3">
          <Link href={`/clients/${id}`} className="text-stone-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-stone-900">Edit Piano</h1>
        </div>
        <DeleteButton action={deleteAction} label="Delete" />
      </div>

      <form action={saveAction} className="space-y-4 bg-white rounded-2xl border border-stone-200 p-5">
        <PianoStyleSelect defaultValue={piano.style} />
        <FormField label="Brand" name="brand" defaultValue={piano.brand} />
        <FormField label="Model" name="model" defaultValue={piano.model} />
        <FormField label="Serial Number" name="serial_number" defaultValue={piano.serial_number} />
        <FormField label="Year Manufactured" name="year_manufactured" type="number" defaultValue={piano.year_manufactured} />
        <FormField label="Notes" name="notes" rows={3} defaultValue={piano.notes} />

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
