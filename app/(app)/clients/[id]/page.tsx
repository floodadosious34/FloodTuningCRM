import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteClientAction } from "@/app/actions/clients";
import { deleteAppointmentAction } from "@/app/actions/appointments";
import { DeleteButton } from "@/components/DeleteButton";
import type { Client, Piano, ServiceRecord, Appointment } from "@/lib/supabase/types";

type PianoWithRecords = Piano & { service_records: ServiceRecord[]; appointments: Appointment[] };

export default async function ClientDetailPage({
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

  const { data: rawPianos } = await supabase
    .from("pianos")
    .select(`*, service_records (*), appointments (*)`)
    .eq("client_id", id)
    .order("created_at");

  const pianos = (rawPianos ?? []) as PianoWithRecords[];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/clients"
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.1em]">Clients</span>
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/clients/${id}/edit`}
            className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-400 border border-zinc-800 px-3 py-2 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            Edit
          </Link>
          <DeleteButton action={deleteClientAction.bind(null, id)} label="Delete" />
        </div>
      </div>

      {/* Client info */}
      <div className="border border-zinc-800 mb-6">
        <div className="px-4 py-4 border-b border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">{client.name}</h1>
        </div>
        {client.phone && (
          <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 w-14 flex-shrink-0">Phone</span>
            <a href={`tel:${client.phone}`} className="text-sm text-red-500 hover:text-red-400 transition-colors">{client.phone}</a>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 w-14 flex-shrink-0">Email</span>
            <a href={`mailto:${client.email}`} className="text-sm text-red-500 hover:text-red-400 transition-colors truncate">{client.email}</a>
          </div>
        )}
        {client.address && (
          <div className="flex items-start gap-4 px-4 py-3 border-b border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 w-14 flex-shrink-0 mt-0.5">Address</span>
            <span className="text-sm text-zinc-400">{client.address}</span>
          </div>
        )}
        {client.notes && (
          <div className="flex items-start gap-4 px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 w-14 flex-shrink-0 mt-0.5">Notes</span>
            <span className="text-sm text-zinc-400 whitespace-pre-wrap">{client.notes}</span>
          </div>
        )}
      </div>

      {/* Pianos header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Pianos</p>
        <Link
          href={`/clients/${id}/pianos/new`}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-red-500 hover:text-red-400 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Piano
        </Link>
      </div>

      {pianos.length === 0 && (
        <div className="border border-zinc-800 p-8 text-center mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">No pianos yet</p>
        </div>
      )}

      <div className="space-y-4">
        {pianos.map((piano) => {
          const sortedRecords = [...piano.service_records].sort(
            (a, b) => b.date_serviced.localeCompare(a.date_serviced)
          );
          const latest = sortedRecords[0];
          const today = new Date().toISOString().split("T")[0];
          const upcoming = [...piano.appointments]
            .filter((a) => a.scheduled_date >= today)
            .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

          return (
            <div key={piano.id} className="border border-zinc-800">
              {/* Piano header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div>
                  <p className="font-semibold text-zinc-100">
                    {[piano.brand, piano.model].filter(Boolean).join(" ") || "Piano"}
                  </p>
                  <p className="text-zinc-600 text-xs mt-0.5">
                    {[
                      piano.style ? formatStyle(piano.style) : null,
                      piano.year_manufactured,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    {piano.serial_number && ` · S/N: ${piano.serial_number}`}
                  </p>
                </div>
                <Link
                  href={`/clients/${id}/pianos/${piano.id}/edit`}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 border border-zinc-800 px-2.5 py-1.5 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
                >
                  Edit
                </Link>
              </div>

              {/* Last serviced bar */}
              {latest && (
                <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                    Last serviced{" "}
                    <span className="text-zinc-400">{formatDate(latest.date_serviced)}</span>
                    {latest.next_service_due && (
                      <>
                        {" · "}Due{" "}
                        <span className={isPastDue(latest.next_service_due) ? "text-red-500" : "text-zinc-400"}>
                          {formatDate(latest.next_service_due)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Appointments */}
              <div className="px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Appointments</p>
                  <Link
                    href={`/clients/${id}/pianos/${piano.id}/appointments/new`}
                    className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-500 hover:text-red-400 transition-colors"
                  >
                    + Schedule
                  </Link>
                </div>
                {upcoming.length === 0 ? (
                  <p className="text-xs text-zinc-700">No upcoming appointments</p>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((appt) => (
                      <div key={appt.id} className="border border-zinc-800 bg-zinc-900 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-100">{appt.service_type}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {formatDate(appt.scheduled_date)}
                              {appt.scheduled_time && (
                                <>
                                  {" · "}
                                  {formatTime(appt.scheduled_time)}
                                  {appt.scheduled_end_time && ` – ${formatTime(appt.scheduled_end_time)}`}
                                </>
                              )}
                            </p>
                            {appt.notes && (
                              <p className="text-xs text-zinc-500 mt-1.5 whitespace-pre-wrap">{appt.notes}</p>
                            )}
                          </div>
                          <DeleteButton
                            action={deleteAppointmentAction.bind(null, appt.id, id)}
                            label="Delete"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service history */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Service History</p>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/clients/${id}/pianos/${piano.id}/schedule`}
                      className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Add to Calendar
                    </Link>
                    <Link
                      href={`/clients/${id}/pianos/${piano.id}/service/new`}
                      className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-500 hover:text-red-400 transition-colors"
                    >
                      + Add Record
                    </Link>
                  </div>
                </div>
                {sortedRecords.length === 0 ? (
                  <p className="text-xs text-zinc-700">No service records yet</p>
                ) : (
                  <div className="space-y-2">
                    {sortedRecords.map((record) => (
                      <div key={record.id} className="border border-zinc-800 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-zinc-100">{record.service_type}</p>
                              {record.amount_charged && (
                                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-500 border border-red-900 px-2 py-0.5">
                                  ${Number(record.amount_charged).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-600 mt-0.5">{formatDate(record.date_serviced)}</p>
                            {record.technician_notes && (
                              <p className="text-xs text-zinc-500 mt-1.5 whitespace-pre-wrap">{record.technician_notes}</p>
                            )}
                          </div>
                          <Link
                            href={`/clients/${id}/pianos/${piano.id}/service/${record.id}/edit`}
                            className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 border border-zinc-800 px-2 py-1 flex-shrink-0 hover:border-zinc-600 transition-colors"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isPastDue(dateStr: string) {
  return dateStr < new Date().toISOString().split("T")[0];
}

function formatStyle(style: string) {
  return style.charAt(0).toUpperCase() + style.slice(1).replace("_", " ");
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
