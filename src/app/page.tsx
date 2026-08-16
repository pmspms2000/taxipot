"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  DIRECTIONS,
  formatDepartAt,
  memberCount,
  type Direction,
  type PotWithCount,
} from "@/lib/types";
import { estimateFare, formatWon, perPerson } from "@/lib/fare";

export default function HomePage() {
  const [pots, setPots] = useState<PotWithCount[]>([]);
  const [filter, setFilter] = useState<Direction | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    supabase
      .from("pots")
      .select("*, pot_members(count)")
      .gte("depart_at", cutoff)
      .order("depart_at", { ascending: true })
      .then(({ data }) => {
        setPots((data as PotWithCount[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (!supabase) {
    return (
      <div className="rounded-xl border border-yellow-600/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
        Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가
        설정되지 않았어요. <code>.env.local</code>을 확인해주세요.
      </div>
    );
  }

  const filtered = filter === "all" ? pots : pots.filter((p) => p.direction === filter);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-br from-yellow-400/15 to-transparent border border-yellow-400/20 p-4">
        <h1 className="text-xl font-bold">
          지금 출발하는 팟에 <span className="text-yellow-400">바로 합류</span>하세요
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          같은 시간·같은 방향 동승자를 찾고 택시비는 1/N로.
        </p>
        <Link
          href="/create"
          className="mt-3 inline-block rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-zinc-900 hover:bg-yellow-300"
        >
          + 10초 만에 팟 만들기
        </Link>
      </section>

      <div className="flex gap-2 text-sm">
        {(["all", "myeong_to_yul", "yul_to_myeong"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 border ${
              filter === f
                ? "border-yellow-400 bg-yellow-400/15 text-yellow-300"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {f === "all" ? "전체" : DIRECTIONS[f].label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-zinc-500">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 py-10 text-center text-sm text-zinc-500">
          지금 열린 팟이 없어요.
          <br />
          <Link
            href={filter === "all" ? "/create" : `/create?direction=${filter}`}
            className="text-yellow-400 underline"
          >
            {filter === "all" ? "첫 팟을 만들어보세요!" : "이 방향으로 팟 만들기"}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((pot) => {
            const count = memberCount(pot);
            const full = count >= pot.capacity;
            return (
              <li key={pot.id}>
                <Link
                  href={`/pot/${pot.id}`}
                  className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-yellow-400/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-yellow-400">
                      {DIRECTIONS[pot.direction].label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        full
                          ? "bg-zinc-700 text-zinc-400"
                          : "bg-emerald-500/15 text-emerald-400"
                      }`}
                    >
                      {full ? "마감" : `${count}/${pot.capacity}명`}
                    </span>
                  </div>
                  <p className="mt-1.5 font-semibold">
                    {formatDepartAt(pot.depart_at)} · {pot.pickup_spot} 출발
                  </p>
                  <p className="text-sm text-zinc-400">↓ {pot.dropoff} 하차</p>
                  <p className="mt-1 text-xs text-emerald-400/90">
                    💰 인당 약{" "}
                    {formatWon(perPerson(estimateFare(pot.direction, pot.dropoff), pot.capacity))}{" "}
                    (정원 {pot.capacity}명 기준)
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {filter !== "all" && filtered.length > 0 && (
        <Link
          href={`/create?direction=${filter}`}
          className="block rounded-xl border border-dashed border-zinc-700 py-3 text-center text-sm text-zinc-400 hover:border-yellow-400/50 hover:text-yellow-300"
        >
          맞는 팟이 없나요? 이 방향으로 팟 만들기 →
        </Link>
      )}
    </div>
  );
}
