"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Bauhaus red left rail */}
      <div className="hidden sm:block w-1.5 bg-red-600 flex-shrink-0" />

      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-xs">

          {/* Wordmark */}
          <div className="mb-10">
            <div className="w-8 h-0.5 bg-red-600 mb-5" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-1">Flood</p>
            <h1 className="text-4xl font-black uppercase tracking-tight text-zinc-100 leading-none">
              Piano<br />Tuning
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mt-2">CRM</p>
          </div>

          {/* Error */}
          {error && (
            <div className="border-l-2 border-red-600 pl-3 mb-6 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-0">
            <div className="border border-zinc-800">
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-4 pt-3">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-transparent px-4 pt-1 pb-3 text-zinc-100 outline-none text-sm placeholder-zinc-700"
                placeholder="you@example.com"
              />
            </div>

            <div className="border border-t-0 border-zinc-800">
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-4 pt-3">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-transparent px-4 pt-1 pb-3 text-zinc-100 outline-none text-sm placeholder-zinc-700"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-[0.2em] py-4 mt-4 transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
