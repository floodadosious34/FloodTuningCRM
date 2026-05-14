import Link from "next/link";
import QuickComposeForm from "@/components/QuickComposeForm";

export default function QuickComposePage() {
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
          <span className="text-xs font-bold uppercase tracking-[0.1em]">Marketing</span>
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Quick Send</h1>
        <p className="text-zinc-600 text-sm mt-1">Send a one-off outreach email to any institution</p>
      </div>

      <QuickComposeForm />
    </div>
  );
}
