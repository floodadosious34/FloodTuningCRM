import type { PianoStyle } from "@/lib/supabase/types";

const styles: { value: PianoStyle; label: string }[] = [
  { value: "upright", label: "Upright" },
  { value: "grand", label: "Grand" },
  { value: "baby_grand", label: "Baby Grand" },
  { value: "spinet", label: "Spinet" },
  { value: "console", label: "Console" },
  { value: "studio", label: "Studio" },
  { value: "other", label: "Other" },
];

export function PianoStyleSelect({ defaultValue }: { defaultValue?: string | null }) {
  return (
    <div>
      <label htmlFor="style" className="block text-sm font-medium text-stone-700 mb-1">
        Style
      </label>
      <select
        id="style"
        name="style"
        defaultValue={defaultValue ?? ""}
        className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
      >
        <option value="">Select style…</option>
        {styles.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
