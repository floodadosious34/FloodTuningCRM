import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAppointmentAction } from "@/app/actions/appointments";
import { FormField } from "@/components/FormField";

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

export default async function NewAppointmentPage({
  params,
}: {
  params: Promise<{ id: string; pianoId: string }>;
}) {
  const { id, pianoId } = await params;
  const supabase = await createClient();

  const { data: rawPiano } = await supabase
    .from("pianos")
    .select("brand, model, client_id")
    .eq("id", pianoId)
    .eq("client_id", id)
    .single();

  if (!rawPiano) notFound();

  const piano = rawPiano as { brand: string | null; model: string | null; client_id: string };
  const action = createAppointmentAction.bind(null, pianoId, id);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-1">
        <Link href={`/clients/${id}`} className="text-stone-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-stone-900">Schedule Appointment</h1>
      </div>
      <p className="text-stone-500 text-sm ml-9 mb-6">
        {[piano.brand, piano.model].filter(Boolean).join(" ") || "Piano"}
      </p>

      <form action={action} className="space-y-4 bg-white rounded-2xl border border-stone-200 p-5">
        <FormField
          label="Date"
          name="scheduled_date"
          type="date"
          defaultValue={defaultDate}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Start Time"
            name="scheduled_time"
            type="time"
            defaultValue="09:00"
            required
          />
          <FormField
            label="End Time"
            name="scheduled_end_time"
            type="time"
            defaultValue="11:00"
          />
        </div>

        <div>
          <label htmlFor="service_type" className="block text-sm font-medium text-stone-700 mb-1">
            Service Type<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            id="service_type"
            name="service_type"
            required
            className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <FormField
          label="Notes"
          name="notes"
          rows={3}
          placeholder="Any details for this appointment…"
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
            Schedule
          </button>
        </div>
      </form>
    </div>
  );
}
