"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-3 py-2 transition-colors"
    >
      Sign out
    </button>
  );
}
