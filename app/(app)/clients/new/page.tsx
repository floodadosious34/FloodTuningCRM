import Link from "next/link";
import { createClientAction } from "@/app/actions/clients";
import { FormField } from "@/components/FormField";

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.1em]">Clients</span>
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Flood Piano Tuning</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">New Client</h1>
      </div>

      <form action={createClientAction} className="space-y-px">
        <FormField label="Name" name="name" required placeholder="Jane Smith" />
        <FormField label="Phone" name="phone" type="tel" placeholder="(555) 000-0000" />
        <FormField label="Email" name="email" type="email" placeholder="jane@example.com" />
        <FormField label="Address" name="address" placeholder="123 Main St, City, State" />
        <FormField label="Notes" name="notes" rows={3} placeholder="Any notes about this client…" />

        <div className="flex gap-2 pt-4">
          <Link
            href="/clients"
            className="flex-1 text-center py-3 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-[0.1em] hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-[0.1em] transition-colors"
          >
            Save Client
          </button>
        </div>
      </form>
    </div>
  );
}
