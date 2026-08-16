"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setEmail(session?.user.email ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabase) return null;

  return email ? (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold text-emerald-400">✓ {email.split("@")[0]}</span>
      <button
        onClick={() => supabase!.auth.signOut()}
        className="text-zinc-500 hover:text-zinc-300"
      >
        로그아웃
      </button>
    </div>
  ) : (
    <Link
      href="/login"
      className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-yellow-400/50 hover:text-yellow-300"
    >
      학교 인증 로그인
    </Link>
  );
}
