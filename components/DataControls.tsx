"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function DataControls() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleExport = () => {
    window.location.href = "/api/export";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      if (res.ok) {
        alert("Import successful!");
        router.refresh();
      } else {
        alert(`Import failed: ${await res.text()}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during import.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleExport}
        className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-3 py-2 transition-colors"
      >
        Export
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="text-xs font-bold uppercase tracking-[0.1em] text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 px-3 py-2 transition-colors"
      >
        {isUploading ? "Importing…" : "Import"}
      </button>
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
    </div>
  );
}
