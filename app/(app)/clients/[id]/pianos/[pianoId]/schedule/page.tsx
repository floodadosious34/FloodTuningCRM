import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScheduleForm } from "@/components/ScheduleForm";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string; pianoId: string }>;
}) {
  const { id, pianoId } = await params;
  const supabase = await createClient();

  const { data: rawClient } = await supabase
    .from("clients")
    .select("name, address, phone")
    .eq("id", id)
    .single();

  if (!rawClient) notFound();

  const { data: rawPiano } = await supabase
    .from("pianos")
    .select("brand, model")
    .eq("id", pianoId)
    .eq("client_id", id)
    .single();

  if (!rawPiano) notFound();

  const client = rawClient as { name: string; address: string | null; phone: string | null };
  const piano = rawPiano as { brand: string | null; model: string | null };
  const pianoDescription = [piano.brand, piano.model].filter(Boolean).join(" ") || "Piano";

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-1">
        <Link href={`/clients/${id}`} className="text-stone-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-stone-900">Schedule Service</h1>
      </div>
      <p className="text-stone-500 text-sm ml-9 mb-6">
        Generate a calendar invite for {client.name}'s {pianoDescription}.
      </p>

      <ScheduleForm
        clientId={id}
        clientName={client.name}
        clientAddress={client.address}
        clientPhone={client.phone}
        pianoId={pianoId}
        pianoDescription={pianoDescription}
      />
    </div>
  );
}
