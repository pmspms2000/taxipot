"use client";

import { use, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { gaEvent } from "@/lib/gtag";
import { DIRECTIONS, formatDepartAt, type Member, type Pot } from "@/lib/types";

export default function PotPage(props: PageProps<"/pot/[id]">) {
  const { id } = use(props.params);
  const [pot, setPot] = useState<Pot | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [nick, setNick] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinedAs, setJoinedAs] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const [{ data: potData }, { data: memberData }] = await Promise.all([
      supabase.from("pots").select("*").eq("id", id).single(),
      supabase.from("pot_members").select("*").eq("pot_id", id).order("joined_at"),
    ]);
    setPot(potData as Pot | null);
    setMembers((memberData as Member[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    // 10초마다 갱신 — 새 참여자 실시간 반영 (MVP 폴링)
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    setJoinedAs(localStorage.getItem(`taxipot-joined-${id}`) ?? "");
  }, [id]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !pot || !nick.trim()) return;
    setJoining(true);
    setError("");
    const { error: joinError } = await supabase
      .from("pot_members")
      .insert({ pot_id: id, nickname: nick.trim() });
    if (joinError) {
      setError(
        joinError.code === "23505"
          ? "이미 같은 닉네임이 있어요. 다른 닉네임을 써주세요."
          : "참여에 실패했어요. 다시 시도해주세요."
      );
      setJoining(false);
      return;
    }
    localStorage.setItem(`taxipot-joined-${id}`, nick.trim());
    setJoinedAs(nick.trim());
    gaEvent("pot_join", { direction: pot.direction });
    if (members.length + 1 >= pot.capacity) gaEvent("pot_full", { capacity: pot.capacity });
    setJoining(false);
    load();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!supabase) return <p className="text-sm text-zinc-500">환경변수 설정이 필요해요.</p>;
  if (loading) return <p className="py-10 text-center text-sm text-zinc-500">불러오는 중…</p>;
  if (!pot)
    return <p className="py-10 text-center text-sm text-zinc-500">존재하지 않는 팟이에요.</p>;

  const full = members.length >= pot.capacity;
  const joined = Boolean(joinedAs);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <span className="text-xs font-semibold text-yellow-400">
          {DIRECTIONS[pot.direction].label}
        </span>
        <h1 className="mt-1 text-xl font-bold">
          {formatDepartAt(pot.depart_at)} · {pot.pickup_spot} 출발
        </h1>
        <p className="mt-1 text-zinc-400">↓ {pot.dropoff} 하차</p>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              full ? "bg-zinc-700 text-zinc-300" : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            {full ? "정원 마감!" : `${members.length}/${pot.capacity}명 · ${pot.capacity - members.length}자리 남음`}
          </span>
          <button
            onClick={copyLink}
            className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-500"
          >
            {copied ? "복사됨!" : "🔗 링크 복사 (에타에 공유)"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-zinc-400">참여자 ({members.length}명)</h2>
        <ul className="space-y-1.5">
          {members.map((m, i) => (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm"
            >
              <span>{m.nickname}</span>
              {i === 0 && (
                <span className="rounded bg-yellow-400/15 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                  팟장
                </span>
              )}
              {m.nickname === joinedAs && <span className="text-xs text-zinc-500">(나)</span>}
            </li>
          ))}
        </ul>
      </section>

      {joined ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <p className="font-bold text-emerald-400">✅ 참여 완료!</p>
          <p className="mt-1 text-zinc-300">
            출발 시간에 맞춰 <b>{pot.pickup_spot}</b>에서 만나세요.
          </p>
          {pot.contact && (
            <a
              href={pot.contact}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block rounded-xl bg-emerald-500 px-4 py-2 font-bold text-zinc-900 hover:bg-emerald-400"
            >
              💬 오픈채팅 입장하기
            </a>
          )}
        </section>
      ) : full ? (
        <p className="rounded-xl border border-zinc-800 py-4 text-center text-sm text-zinc-500">
          아쉽지만 정원이 다 찼어요. 홈에서 다른 팟을 찾아보세요.
        </p>
      ) : (
        <form onSubmit={handleJoin} className="space-y-2">
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="닉네임 입력"
            maxLength={12}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm focus:border-yellow-400 focus:outline-none"
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={joining}
            className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-zinc-900 hover:bg-yellow-300 disabled:opacity-50"
          >
            {joining ? "참여하는 중…" : "이 팟에 참여하기"}
          </button>
        </form>
      )}
    </div>
  );
}
