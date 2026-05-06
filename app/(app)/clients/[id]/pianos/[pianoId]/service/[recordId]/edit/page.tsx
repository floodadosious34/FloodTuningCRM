import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  updateServiceRecordAction,
  deleteServiceRecordAction,
} from "@/app/actions/service-records";
import { FormField } from "@/components/FormField";
import { DeleteButton } from "@/components/DeleteButton";
import type { ServiceRecord } from "@/lib/supabase/types";

const SERVICE_TYPES = [
  "Tuning",
  "Pitch Raise",
  "Regulation",
  "Voicing",
  "Repair",
  "Cleaning",
  "Inspection",
  "Other",
];

export default async function EditServiceRecordPage({
  params,
}: {
  params: Promise<{ id: string; pianoId: string; recordId: string }>;
}) {
  const { id, pianoId, recordId } = await params;
  const supabase = await createClient();

  const { data: rawRecord } = await supabase
    .from("service_records")
    .select("*")
    .eq("id", recordId)
    .eq("piano_id", pianoId)
    .single();

  const record = rawRecord as ServiceRecord | null;
  if (!record) notFound();

  const saveAction = updateServiceRecordAction.bind(null, recordId, pianoId, id);
  const deleteAction = deleteServiceRecordAction.bind(null, recordId, id);

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
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Edit Service Record</h1>
      </div>

      <form action={saveAction} className="space-y-px">
        <FormField label="Date Serviced" name="date_serviced" type="date" defaultValue={record.date_serviced} required />

        <div className="border border-zinc-800">
          <label htmlFor="service_type" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-4 pt-3">
            Service Type <span className="text-red-600">*</span>
          </label>
          <select
            id="service_type"
            name="service_type"
            defaultValue={record.service_type}
            required
            className="w-full bg-zinc-950 border-0 px-4 pt-1 pb-3 text-zinc-100 outline-none text-sm appearance-none"
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <FormField
          label="Amount Charged"
          name="amount_charged"
          type="number"
          step="0.01"
          defaultValue={record.amount_charged?.toString()}
          placeholder="150.00"
        />
        <FormField label="Technician Notes" name="technician_notes" rows={4} defaultValue={record.technician_notes} />
        <FormField label="Next Service Due" name="next_service_due" type="date" defaultValue={record.next_service_due} />

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
