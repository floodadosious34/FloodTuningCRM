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
    <div className="max-w-2xl mx-auto px-4 pt-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/clients"
          className="flex items-center gap-1 text-stone-500 hover:text-stone-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Clients
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/clients/${id}/edit`}
            className="text-sm text-stone-600 border border-stone-200 rounded-xl px-3 py-2 bg-white"
          >
            Edit
          </Link>
          <DeleteButton action={deleteClientAction.bind(null, id)} label="Delete" />
        </div>
      </div>

      {/* Client info */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-5">
        <h1 className="text-xl font-bold text-stone-900 mb-3">{client.name}</h1>
        <dl className="space-y-2">
          {client.phone && (
            <Row label="Phone">
              <a href={`tel:${client.phone}`} className="text-amber-600 text-sm">{client.phone}</a>
            </Row>
          )}
          {client.email && (
            <Row label="Email">
              <a href={`mailto:${client.email}`} className="text-amber-600 text-sm">{client.email}</a>
            </Row>
          )}
          {client.address && (
            <Row label="Address">
              <span className="text-stone-700 text-sm">{client.address}</span>
            </Row>
          )}
          {client.notes && (
            <Row label="Notes">
              <span className="text-stone-700 text-sm whitespace-pre-wrap">{client.notes}</span>
            </Row>
          )}
        </dl>
      </div>

      {/* Pianos */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-stone-800">Pianos</h2>
        <Link
          href={`/clients/${id}/pianos/new`}
          className="flex items-center gap-1 text-sm text-amber-600 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Piano
        </Link>
      </div>

      {pianos.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center mb-4">
          <p className="text-stone-400 text-sm">No pianos yet</p>
        </div>
      )}

      <div className="space-y-4">
        {pianos.map((piano) => {
          const sortedRecords = [...piano.service_records].sort(
            (a, b) => b.date_serviced.localeCompare(a.date_serviced)
          );
          const latest = sortedRecords[0];

          return (
            <div key={piano.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                <div>
                  <p className="font-semibold text-stone-900">
                    {[piano.brand, piano.model].filter(Boolean).join(" ") || "Piano"}
                  </p>
                  <p className="text-stone-400 text-xs mt-0.5">
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
                  className="text-xs text-stone-500 border border-stone-200 rounded-lg px-2.5 py-1.5"
                >
                  Edit
                </Link>
              </div>

              {latest && (
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 text-xs text-stone-500">
                  Last serviced:{" "}
                  <span className="text-stone-700 font-medium">{formatDate(latest.date_serviced)}</span>
                  {latest.next_service_due && (
                    <>
                      {" · "}Due:{" "}
                      <span className={`font-medium ${isPastDue(latest.next_service_due) ? "text-red-600" : "text-stone-700"}`}>
                        {formatDate(latest.next_service_due)}
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="px-4 py-2">
                {/* Upcoming appointments */}
                <div className="flex items-center justify-between py-2">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Appointments</p>
                  <Link
                    href={`/clients/${id}/pianos/${piano.id}/appointments/new`}
                    className="text-xs text-amber-600 font-medium"
                  >
                    + Schedule
                  </Link>
                </div>
                {(() => {
                  const today = new Date().toISOString().split("T")[0];
                  const upcoming = [...piano.appointments]
                    .filter((a) => a.scheduled_date >= today)
                    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
                  if (upcoming.length === 0) {
                    return <p className="text-stone-400 text-sm pb-2">No upcoming appointments</p>;
                  }
                  return (
                    <div className="space-y-2 pb-2">
                      {upcoming.map((appt) => (
                        <div key={appt.id} className="border border-blue-100 bg-blue-50 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-stone-800">{appt.service_type}</p>
                              <p className="text-xs text-stone-500 mt-0.5">
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
                                <p className="text-xs text-stone-600 mt-1.5 whitespace-pre-wrap">{appt.notes}</p>
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
                  );
                })()}

                <div className="flex items-center justify-between py-2 border-t border-stone-100 mt-1">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Service History</p>
                  <Link
                    href={`/clients/${id}/pianos/${piano.id}/service/new`}
                    className="text-xs text-amber-600 font-medium"
                  >
                    + Add Record
                  </Link>
                </div>

                {sortedRecords.length === 0 ? (
                  <p className="text-stone-400 text-sm py-2 pb-3">No service records yet</p>
                ) : (
                  <div className="space-y-2 pb-2">
                    {sortedRecords.map((record) => (
                      <div key={record.id} className="border border-stone-100 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-stone-800">{record.service_type}</p>
                              {record.amount_charged && (
                                <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                                  ${Number(record.amount_charged).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5">{formatDate(record.date_serviced)}</p>
                            {record.technician_notes && (
                              <p className="text-xs text-stone-600 mt-1.5 whitespace-pre-wrap">{record.technician_notes}</p>
                            )}
                          </div>
                          <Link
                            href={`/clients/${id}/pianos/${piano.id}/service/${record.id}/edit`}
                            className="text-xs text-stone-400 border border-stone-100 rounded-lg px-2 py-1 flex-shrink-0"
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-stone-400 text-sm w-14 flex-shrink-0">{label}</dt>
      <dd>{children}</dd>
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
