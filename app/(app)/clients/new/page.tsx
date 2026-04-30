import Link from "next/link";
import { createClientAction } from "@/app/actions/clients";
import { FormField } from "@/components/FormField";

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="text-stone-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-stone-900">New Client</h1>
      </div>

      <form action={createClientAction} className="space-y-4 bg-white rounded-2xl border border-stone-200 p-5">
        <FormField label="Name" name="name" required placeholder="Jane Smith" />
        <FormField label="Phone" name="phone" type="tel" placeholder="(555) 000-0000" />
        <FormField label="Email" name="email" type="email" placeholder="jane@example.com" />
        <FormField label="Address" name="address" placeholder="123 Main St, City, State" />
        <FormField label="Notes" name="notes" rows={3} placeholder="Any notes about this client…" />

        <div className="flex gap-3 pt-2">
          <Link
            href="/clients"
            className="flex-1 text-center py-3 border border-stone-200 rounded-xl text-stone-600 font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Save Client
          </button>
        </div>
      </form>
    </div>
  );
}
