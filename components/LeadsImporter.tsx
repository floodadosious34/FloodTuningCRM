"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLeadsAction } from "@/app/actions/leads";

export default function LeadsImporter({ hasLeads }: { hasLeads: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/leads/import", { method: "POST", body: formData });
    if (res.ok) {
      const { count } = await res.json();
      setStatus("done");
      setMessage(`${count} institutions imported`);
      router.refresh();
    } else {
      setStatus("error");
      setMessage(await res.text());
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClearAll() {
    startTransition(async () => {
      await deleteLeadsAction();
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={status === "uploading"}
        className="text-xs font-bold uppercase tracking-[0.1em] border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 px-4 py-2.5 transition-colors disabled:opacity-40"
      >
        {status === "uploading" ? "Importing…" : hasLeads ? "Re-import CSV" : "Import CSV"}
      </button>

      {hasLeads && (
        <button
          onClick={handleClearAll}
          disabled={isPending}
          className="text-xs font-bold uppercase tracking-[0.1em] border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-900 px-4 py-2.5 transition-colors disabled:opacity-40"
        >
          Clear All
        </button>
      )}

      {message && (
        <span className={`text-xs font-bold uppercase tracking-[0.1em] ${status === "done" ? "text-green-500" : "text-red-400"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
