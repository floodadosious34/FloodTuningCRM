import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Lead } from "@/lib/supabase/types";
import LeadComposeForm from "@/components/LeadComposeForm";

export default async function ComposePage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").eq("id", leadId).single();
  const lead = data as Lead | null;
  if (!lead) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/marketing"
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.1em]">Leads</span>
        </Link>
      </div>

      {/* Lead info */}
      <div className="border border-zinc-800 mb-6">
        <div className="px-4 py-4 border-b border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">{lead.category ?? "Lead"}</p>
          <h1 className="text-xl font-black uppercase tracking-tight text-zinc-100">{lead.institution}</h1>
        </div>
        {lead.contact_name && (
          <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 w-16 flex-shrink-0">Contact</span>
            <span className="text-sm text-zinc-400">{lead.contact_name}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 w-16 flex-shrink-0">Email</span>
            <span className="text-sm text-red-500">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 w-16 flex-shrink-0">Phone</span>
            <span className="text-sm text-zinc-400">{lead.phone}</span>
          </div>
        )}
        {lead.address && (
          <div className="flex items-start gap-4 px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 w-16 flex-shrink-0 mt-0.5">Address</span>
            <span className="text-sm text-zinc-400">{lead.address}</span>
          </div>
        )}
      </div>

      <LeadComposeForm lead={lead} />
    </div>
  );
}
