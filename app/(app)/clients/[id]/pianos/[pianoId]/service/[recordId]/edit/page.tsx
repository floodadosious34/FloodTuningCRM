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
        <div className="flex items-center gap-3">
          <Link href={`/clients/${id}`} className="text-stone-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-stone-900">Edit Service Record</h1>
        </div>
        <DeleteButton action={deleteAction} label="Delete" />
      </div>

      <form action={saveAction} className="space-y-4 bg-white rounded-2xl border border-stone-200 p-5">
        <FormField
          label="Date Serviced"
          name="date_serviced"
          type="date"
          defaultValue={record.date_serviced}
          required
        />

        <div>
          <label htmlFor="service_type" className="block text-sm font-medium text-stone-700 mb-1">
            Service Type<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            id="service_type"
            name="service_type"
            defaultValue={record.service_type}
            required
            className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
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

        <FormField
          label="Technician Notes"
          name="technician_notes"
          rows={4}
          defaultValue={record.technician_notes}
        />
        <FormField
          label="Next Service Due"
          name="next_service_due"
          type="date"
          defaultValue={record.next_service_due}
        />

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
