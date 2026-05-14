import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Lead } from "@/lib/supabase/types";
import LeadsImporter from "@/components/LeadsImporter";
import LeadContactEditor from "@/components/LeadContactEditor";


export default async function MarketingPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("institution");
  const leads = (data ?? []) as Lead[];

  const grouped = leads.reduce<Record<string, Lead[]>>((acc, lead) => {
    const key = lead.category ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(lead);
    return acc;
  }, {});

  const totalEmailed = leads.filter((l) => l.emailed_at).length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Marketing Outreach</h1>
        {leads.length > 0 && (
          <p className="text-zinc-600 text-sm mt-1">
            {totalEmailed} of {leads.length} emailed
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <LeadsImporter hasLeads={leads.length > 0} />
        <Link
          href="/marketing/compose"
          className="text-xs font-bold uppercase tracking-[0.1em] border border-red-800 text-red-500 hover:bg-red-950 px-4 py-2.5 transition-colors"
        >
          + Quick Send
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="border border-zinc-800 p-8 text-center mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">
            No leads yet — import a CSV to get started
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([category, categoryLeads]) => (
            <section key={category}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">
                {category} — {categoryLeads.length}
              </p>
              <div className="border border-zinc-800 divide-y divide-zinc-800">
                {categoryLeads.map((lead) => (
                  <div key={lead.id} className={`px-4 py-3 ${lead.emailed_at ? "opacity-50" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-100 text-sm">{lead.institution}</p>
                        {lead.contact_name && (
                          <p className="text-xs text-zinc-500 mt-0.5">{lead.contact_name}</p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {lead.email && (
                            <span className="text-xs text-red-500 truncate">{lead.email}</span>
                          )}
                          {lead.phone && (
                            <span className="text-xs text-zinc-600">{lead.phone}</span>
                          )}
                        </div>
                        {lead.emailed_at && (
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-700 mt-1">
                            Emailed {formatRelative(lead.emailed_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        {lead.email ? (
                          <Link
                            href={`/marketing/compose/${lead.id}`}
                            className="text-[10px] font-bold uppercase tracking-[0.1em] border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 px-3 py-2 transition-colors whitespace-nowrap"
                          >
                            {lead.emailed_at ? "Send Again" : "Compose"}
                          </Link>
                        ) : null}
                        {(!lead.email || !lead.phone) && (
                          <LeadContactEditor
                            leadId={lead.id}
                            initialEmail={lead.email}
                            initialPhone={lead.phone}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelative(isoString: string) {
  const diffDays = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}
