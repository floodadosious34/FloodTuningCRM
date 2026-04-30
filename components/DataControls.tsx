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

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Import successful!");
        router.refresh();
      } else {
        const text = await res.text();
        alert(`Import failed: ${text}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during import.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleExport}
        className="px-3 py-1.5 text-sm font-medium bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200 rounded-lg transition-colors"
      >
        Export CSV
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="px-3 py-1.5 text-sm font-medium bg-amber-600 border border-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Import CSV"}
      </button>

      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
