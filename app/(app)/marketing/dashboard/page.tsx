import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import Link from "next/link";
import type { Lead } from "@/lib/supabase/types";

type EmailEvent =
  | "sent"
  | "delivered"
  | "delivery_delayed"
  | "complained"
  | "bounced"
  | "opened"
  | "clicked";

type SentEmail = {
  id: string;
  to: string[] | string;
  subject: string | null;
  created_at: string;
  last_event: EmailEvent;
};

export default async function OutreachDashboardPage() {
  const supabase = await createClient();
  const { data: leadsData } = await supabase
    .from("leads")
    .select("*")
    .order("created_at");
  const leads = (leadsData ?? []) as Lead[];

  let sentEmails: SentEmail[] = [];
  try {
    const { data, error } = await resend.emails.list();
    if (!error && data) {
      const raw = data as unknown as { data?: SentEmail[] } | SentEmail[];
      sentEmails = Array.isArray(raw) ? raw : (raw?.data ?? []);
    }
  } catch {}

  const totalLeads = leads.length;
  const emailedLeads = leads.filter((l) => l.emailed_at && l.email);
  const contacted = leads.filter((l) => l.emailed_at).length;
  const converted = leads.filter((l) => l.converted_at).length;

  const engagedAddresses = new Set(
    sentEmails
      .filter((e) => e.last_event === "opened" || e.last_event === "clicked")
      .flatMap((e) => (Array.isArray(e.to) ? e.to : [e.to]))
      .map((e) => e.toLowerCase())
  );
  const opened = emailedLeads.filter((l) =>
    engagedAddresses.has(l.email!.toLowerCase())
  ).length;

  const openPct = contacted > 0 ? Math.round((opened / contacted) * 100) : 0;
  const convPct = contacted > 0 ? Math.round((converted / contacted) * 100) : 0;

  const weeklyData = computeWeeklyData(leads);

  const funnel = [
    { label: "Sent", count: contacted, pct: contacted > 0 ? 100 : 0 },
    { label: "Opened", count: opened, pct: openPct },
    { label: "Booked", count: converted, pct: convPct },
  ];

  const categoryMap = new Map<string, { total: number; sent: number }>();
  for (const lead of leads) {
    const cat = lead.category ?? "Other";
    if (!categoryMap.has(cat)) categoryMap.set(cat, { total: 0, sent: 0 });
    const entry = categoryMap.get(cat)!;
    entry.total++;
    if (lead.emailed_at) entry.sent++;
  }
  const categoryData = Array.from(categoryMap.entries())
    .map(([category, { total, sent }]) => ({ category, total, sent }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/marketing"
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.1em]">
            Marketing
          </span>
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">
          Flood Piano Tuning
        </p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">
          Outreach Dashboard
        </h1>
        <p className="text-zinc-600 text-sm mt-1">
          Campaign performance at a glance
        </p>
      </div>

      <div className="grid grid-cols-4 border border-zinc-800 mb-8">
        <DashStatCard label="Leads" value={totalLeads} />
        <DashStatCard label="Sent" value={contacted} highlight={contacted > 0} />
        <DashStatCard label="Opened" value={`${openPct}%`} />
        <DashStatCard label="Booked" value={converted} highlight={converted > 0} />
      </div>

      <section className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">
          Weekly Outreach — Last 12 Weeks
        </p>
        <div className="border border-zinc-800 p-4">
          <WeeklyBarChart data={weeklyData} />
        </div>
      </section>

      <section className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">
          Outreach Funnel
        </p>
        <div className="border border-zinc-800 p-4">
          <FunnelChart stages={funnel} />
        </div>
      </section>

      {categoryData.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">
            By Category — {categoryData.length} groups
          </p>
          <div className="border border-zinc-800 p-4">
            <CategoryChart data={categoryData} />
          </div>
        </section>
      )}

      {totalLeads === 0 && (
        <div className="border border-zinc-800 p-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">
            No data yet — import leads to see outreach stats
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Chart Components ────────────────────────────────────────────────────────

function WeeklyBarChart({ data }: { data: { label: string; count: number }[] }) {
  const W = 520,
    H = 190;
  const ml = 32,
    mr = 12,
    mt = 12,
    mb = 30;
  const cw = W - ml - mr;
  const ch = H - mt - mb;
  const n = data.length;
  const slot = cw / n;
  const bw = Math.max(6, slot * 0.62);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const ticks = [0, 0.5, 1].map((f) => Math.round(f * maxCount));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Weekly outreach bar chart">
      {ticks.map((v) => {
        const y = mt + ch - (v / maxCount) * ch;
        return (
          <g key={v}>
            <line
              x1={ml}
              y1={y}
              x2={W - mr}
              y2={y}
              stroke="#27272a"
              strokeWidth={1}
            />
            {v > 0 && (
              <text
                x={ml - 5}
                y={y + 4}
                fill="#52525b"
                fontSize={9}
                textAnchor="end"
              >
                {v}
              </text>
            )}
          </g>
        );
      })}

      {data.map((d, i) => {
        const bh = d.count === 0 ? 0 : Math.max(2, (d.count / maxCount) * ch);
        const x = ml + i * slot + (slot - bw) / 2;
        const y = mt + ch - bh;
        const showLabel = i === 0 || i === Math.floor(n / 2) || i === n - 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={bh === 0 ? mt + ch - 1 : y}
              width={bw}
              height={bh === 0 ? 1 : bh}
              fill={bh === 0 ? "#27272a" : "#dc2626"}
            />
            {showLabel && (
              <text
                x={x + bw / 2}
                y={H - 6}
                fill="#52525b"
                fontSize={8}
                textAnchor="middle"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function FunnelChart({
  stages,
}: {
  stages: { label: string; count: number; pct: number }[];
}) {
  const W = 480,
    bh = 28,
    gap = 10;
  const H = stages.length * (bh + gap) + 8;
  const ml = 56,
    mr = 80;
  const cw = W - ml - mr;
  const maxCount = Math.max(stages[0]?.count ?? 0, 1);
  const fills = ["#dc2626", "#991b1b", "#7f1d1d"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Outreach funnel chart">
      {stages.map((s, i) => {
        const bw = s.count === 0 ? 0 : Math.max(2, (s.count / maxCount) * cw);
        const y = i * (bh + gap) + 4;
        return (
          <g key={i}>
            <rect x={ml} y={y} width={cw} height={bh} fill="#18181b" />
            {s.count > 0 && (
              <rect
                x={ml}
                y={y}
                width={bw}
                height={bh}
                fill={fills[i] ?? "#7f1d1d"}
              />
            )}
            <text
              x={ml - 6}
              y={y + bh / 2 + 4}
              fill="#71717a"
              fontSize={8}
              fontWeight="bold"
              textAnchor="end"
            >
              {s.label.toUpperCase()}
            </text>
            <text
              x={ml + cw + 8}
              y={y + bh / 2 + 4}
              fill="#a1a1aa"
              fontSize={9}
              fontWeight="bold"
            >
              {s.count} · {s.pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CategoryChart({
  data,
}: {
  data: { category: string; total: number; sent: number }[];
}) {
  const W = 480,
    bh = 22,
    gap = 8;
  const H = data.length * (bh + gap) + 16;
  const ml = 76,
    mr = 52;
  const cw = W - ml - mr;
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Category breakdown chart">
      {data.map((d, i) => {
        const totalW = (d.total / maxTotal) * cw;
        const sentW = d.total > 0 ? (d.sent / d.total) * totalW : 0;
        const y = i * (bh + gap) + 8;
        const catLabel = d.category.length > 11
          ? d.category.slice(0, 10).toUpperCase() + "…"
          : d.category.toUpperCase();
        return (
          <g key={i}>
            <rect x={ml} y={y} width={totalW} height={bh} fill="#27272a" />
            {d.sent > 0 && (
              <rect x={ml} y={y} width={sentW} height={bh} fill="#dc2626" />
            )}
            <text
              x={ml - 6}
              y={y + bh / 2 + 4}
              fill="#71717a"
              fontSize={8}
              fontWeight="bold"
              textAnchor="end"
            >
              {catLabel}
            </text>
            <text
              x={ml + totalW + 6}
              y={y + bh / 2 + 4}
              fill="#52525b"
              fontSize={9}
            >
              {d.sent}/{d.total}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function DashStatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-3 text-center border-r border-zinc-800 last:border-r-0 ${
        highlight ? "bg-red-950" : ""
      }`}
    >
      <p
        className={`text-2xl font-black tabular-nums ${
          highlight ? "text-red-400" : "text-zinc-100"
        }`}
      >
        {value}
      </p>
      <p
        className={`text-[9px] font-bold uppercase tracking-[0.15em] mt-1 ${
          highlight ? "text-red-700" : "text-zinc-600"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function computeWeeklyData(
  leads: Lead[]
): { label: string; count: number }[] {
  function weekStart(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d.toISOString().split("T")[0];
  }

  const today = new Date();
  const thisMonday = new Date(today);
  thisMonday.setHours(0, 0, 0, 0);
  const day = today.getDay();
  thisMonday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  const starts: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const ws = new Date(thisMonday);
    ws.setDate(thisMonday.getDate() - i * 7);
    starts.push(ws.toISOString().split("T")[0]);
  }

  const counts = new Map<string, number>();
  for (const ws of starts) counts.set(ws, 0);

  for (const lead of leads) {
    if (!lead.emailed_at) continue;
    const ws = weekStart(new Date(lead.emailed_at));
    if (counts.has(ws)) counts.set(ws, (counts.get(ws) ?? 0) + 1);
  }

  return starts.map((ws) => {
    const d = new Date(ws + "T00:00:00");
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: counts.get(ws) ?? 0,
    };
  });
}
