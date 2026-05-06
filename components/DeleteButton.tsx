"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  action: () => Promise<void>;
  label?: string;
}

export function DeleteButton({ action, label = "Delete" }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setPending(true);
    try {
      await action();
      router.refresh();
    } catch {
      setPending(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-400 border border-zinc-700 px-3 py-2"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-xs font-bold uppercase tracking-[0.1em] text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 px-3 py-2 transition-colors"
        >
          {pending ? "…" : "Confirm"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-bold uppercase tracking-[0.1em] text-red-500 border border-zinc-800 px-3 py-2 hover:border-red-900 transition-colors"
    >
      {label}
    </button>
  );
}
