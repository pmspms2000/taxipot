"use client";

import { use, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { gaEvent } from "@/lib/gtag";
import {
  DIRECTIONS,
  formatDepartAt,
  type Member,
  type Pot,
  type Settlement,
} from "@/lib/types";
import { estimateFare, formatWon, perPerson } from "@/lib/fare";

export default function PotPage(props: PageProps<"/pot/[id]">) {
  const { id } = use(props.params);
  const [pot, setPot] = useState<Pot | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [nick, setNick] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinedAs, setJoinedAs] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  // 정산 폼
  const [totalFare, setTotalFare] = useState("");
  const [tossId, setTossId] = useState("");
  const [settling, setSettling] = useState(false);
  const [settleError, setSettleError] = useState("");
  const [msgCopied, setMsgCopied] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const [{ data: potData }, { data: memberData }, { data: settleData }] =
      await Promise.all([
        supabase.from("pots").select("*").eq("id", id).single(),
        supabase.from("pot_members").select("*").eq("pot_id", id).order("joined_at"),
        supabase
          .from("settlements")
          .select("*")
          .eq("pot_id", id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
    setPot(potData as Pot | null);
    setMembers((memberData as Member[]) ?? []);
    setSettlement((settleData as Settlement[])?.[0] ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    // 10초마다 갱신 — 새 참여자/정산 실시간 반영 (MVP 폴링)
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

  async function handleSettle(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !pot) return;
    const total = parseInt(totalFare.replace(/[^0-9]/g, ""), 10);
    if (!total || total < 1000 || total > 200000) {
      setSettleError("택시비를 원 단위 숫자로 입력해주세요 (예: 38000)");
      return;
    }
    setSettling(true);
    setSettleError("");
    const { error: err } = await supabase.from("settlements").insert({
      pot_id: id,
      total_fare: total,
      member_count: members.length,
      per_person: perPerson(total, members.length),
      toss_id: tossId.trim() || null,
      creator_nick: joinedAs || "결제자",
    });
    if (err) {
      setSettleError("정산 생성에 실패했어요. 다시 시도해주세요.");
      setSettling(false);
      return;
    }
    gaEvent("settlement_create", { total, count: members.length });
    setSettling(false);
    load();
  }

  function settlementMessage(s: Settlement): string {
    const lines = [
      "🚕 택시팟 정산",
      `총 ${formatWon(s.total_fare)} ÷ ${s.member_count}명 = 인당 ${formatWon(s.per_person)}`,
    ];
    if (s.toss_id) lines.push(`토스로 보내기 → https://toss.me/${s.toss_id}/${s.per_person}`);
    lines.push(`${window.location.href}`);
    return lines.join("\n");
  }

  async function copySettlement(s: Settlement) {
    await navigator.clipboard.writeText(settlementMessage(s));
    gaEvent("settlement_copy");
    setMsgCopied(true);
    setTimeout(() => setMsgCopied(false), 1500);
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
  const fare = estimateFare(pot.direction, pot.dropoff);
  const inputCls =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm focus:border-yellow-400 focus:outline-none";

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
        <p className="mt-1.5 text-sm text-emerald-400/90">
          💰 예상 요금 약 {formatWon(fare)} → {pot.capacity}명이면 인당 약{" "}
          {formatWon(perPerson(fare, pot.capacity))}
        </p>
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
          {pot.contact ? (
            <a
              href={pot.contact}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block rounded-xl bg-emerald-500 px-4 py-2 font-bold text-zinc-900 hover:bg-emerald-400"
            >
              💬 오픈채팅 입장하기
            </a>
          ) : (
            <p className="mt-2 rounded-lg bg-zinc-800/60 px-3 py-2 text-xs text-zinc-400">
              이 팟은 오픈채팅이 없어요. 출발 5분 전까지 도착해서 참여자 닉네임으로 서로
              확인하세요. 이 페이지를 열어두면 참여 현황이 실시간 갱신됩니다.
            </p>
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
            className={inputCls}
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

      {/* 정산: 결과가 있으면 모두에게, 없으면 참여자에게 생성 폼 */}
      {settlement ? (
        <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
          <h2 className="text-sm font-bold text-sky-300">💸 정산 완료</h2>
          <p className="mt-2 text-lg font-bold">
            총 {formatWon(settlement.total_fare)} ÷ {settlement.member_count}명 ={" "}
            <span className="text-sky-300">인당 {formatWon(settlement.per_person)}</span>
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            결제: {settlement.creator_nick} · 결제자에게 보내주세요
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {settlement.toss_id && (
              <a
                href={`https://toss.me/${settlement.toss_id}/${settlement.per_person}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-sky-400"
              >
                토스로 {formatWon(settlement.per_person)} 보내기
              </a>
            )}
            <button
              onClick={() => copySettlement(settlement)}
              className="rounded-xl border border-sky-500/40 px-4 py-2 text-sm font-bold text-sky-300 hover:bg-sky-500/10"
            >
              {msgCopied ? "복사됨!" : "정산 메시지 복사"}
            </button>
          </div>
        </section>
      ) : joined ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-sm font-bold text-zinc-300">💸 택시비 정산 (1/N)</h2>
          <p className="mt-1 text-xs text-zinc-500">
            도착 후 결제한 사람이 입력하세요. 인당 금액과 송금 링크가 자동으로 만들어져요.
          </p>
          <form onSubmit={handleSettle} className="mt-3 space-y-2">
            <input
              value={totalFare}
              onChange={(e) => setTotalFare(e.target.value)}
              placeholder={`총 택시비 (예: ${fare})`}
              inputMode="numeric"
              className={inputCls}
            />
            <input
              value={tossId}
              onChange={(e) => setTossId(e.target.value)}
              placeholder="내 토스아이디 (선택 — toss.me 링크 생성)"
              className={inputCls}
            />
            {totalFare && parseInt(totalFare.replace(/[^0-9]/g, ""), 10) >= 1000 && (
              <p className="text-sm text-emerald-400">
                → {members.length}명이 인당{" "}
                {formatWon(
                  perPerson(parseInt(totalFare.replace(/[^0-9]/g, ""), 10), members.length)
                )}
              </p>
            )}
            {settleError && <p className="text-sm text-red-400">{settleError}</p>}
            <button
              type="submit"
              disabled={settling}
              className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-zinc-900 hover:bg-sky-400 disabled:opacity-50"
            >
              {settling ? "만드는 중…" : "정산 만들기"}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
