"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { gaEvent } from "@/lib/gtag";

const SKKU_EMAIL = /@(g\.)?skku\.edu$/i;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const addr = email.trim().toLowerCase();
    if (!SKKU_EMAIL.test(addr)) {
      setError("성균관대 이메일(@skku.edu, @g.skku.edu)만 사용할 수 있어요.");
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: window.location.origin },
    });
    if (err) {
      setError("메일 발송에 실패했어요. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
      return;
    }
    gaEvent("login_request");
    setSent(true);
    setSubmitting(false);
  }

  if (!supabase) return <p className="text-sm text-zinc-500">환경변수 설정이 필요해요.</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">학교 인증 로그인</h1>
        <p className="mt-1 text-sm text-zinc-400">
          성균관대 이메일로 본인 확인을 하면 <b className="text-emerald-400">✓ 인증 배지</b>가
          붙고, 기기가 바뀌어도 내 팟·정산이 유지돼요. 비밀번호는 필요 없어요.
        </p>
      </div>

      {sent ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <p className="font-bold text-emerald-400">📮 로그인 링크를 보냈어요!</p>
          <p className="mt-1 text-zinc-300">
            <b>{email}</b> 메일함에서 &ldquo;Log In&rdquo; 링크를 누르면 바로 로그인됩니다.
            (스팸함도 확인해보세요)
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="학번@skku.edu"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm focus:border-yellow-400 focus:outline-none"
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-zinc-900 hover:bg-yellow-300 disabled:opacity-50"
          >
            {submitting ? "보내는 중…" : "로그인 링크 받기"}
          </button>
          <p className="text-xs text-zinc-500">
            로그인 없이도 팟 참여는 가능하지만, 인증 배지와 기기 간 연속성은 로그인해야
            제공돼요.
          </p>
        </form>
      )}
    </div>
  );
}
