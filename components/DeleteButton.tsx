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
          className="text-sm text-stone-500 border border-stone-200 rounded-xl px-3 py-2 bg-white"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl px-3 py-2"
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-red-600 border border-red-200 rounded-xl px-3 py-2 bg-white"
    >
      {label}
    </button>
  );
}
