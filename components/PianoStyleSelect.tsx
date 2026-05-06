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
    <div className="border border-zinc-800">
      <label htmlFor="style" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-4 pt-3">
        Style
      </label>
      <select
        id="style"
        name="style"
        defaultValue={defaultValue ?? ""}
        className="w-full bg-zinc-950 border-0 px-4 pt-1 pb-3 text-zinc-100 outline-none text-sm appearance-none"
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
