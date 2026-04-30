"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export default function ClientSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    startTransition(() => {
      if (value) {
        router.replace(`${pathname}?q=${encodeURIComponent(value)}`);
      } else {
        router.replace(pathname);
      }
    });
  }

  return (
    <div className="relative">
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleSearch}
        placeholder="Search clients…"
        className={`w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-opacity ${isPending ? "opacity-60" : ""}`}
      />
    </div>
  );
}
