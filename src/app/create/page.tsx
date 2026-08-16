"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { gaEvent } from "@/lib/gtag";
import { DIRECTIONS, type Direction } from "@/lib/types";

function defaultDepartAt(): string {
  // 기본값: 지금부터 30분 뒤 (datetime-local 형식, 로컬 시간)
  const d = new Date(Date.now() + 30 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 10) * 10, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CUSTOM = "__custom__";

export default function CreatePage() {
  const router = useRouter();
  const [direction, setDirection] = useState<Direction>("myeong_to_yul");
  const [pickup, setPickup] = useState(DIRECTIONS.myeong_to_yul.pickups[0]);
  const [customPickup, setCustomPickup] = useState("");
  const [dropoff, setDropoff] = useState(DIRECTIONS.myeong_to_yul.dropoffs[0]);
  const [customDropoff, setCustomDropoff] = useState("");
  const [departAt, setDepartAt] = useState(defaultDepartAt());
  const [capacity, setCapacity] = useState(4);
  const [nick, setNick] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function switchDirection(d: Direction) {
    setDirection(d);
    setPickup(DIRECTIONS[d].pickups[0]);
    setDropoff(DIRECTIONS[d].dropoffs[0]);
  }

  // 홈의 방향 필터에서 넘어온 경우 프리필 (?direction=...)
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("direction");
    if (d === "myeong_to_yul" || d === "yul_to_myeong") switchDirection(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const pickupSpot = pickup === CUSTOM ? customPickup.trim() : pickup;
    const dropoffSpot = dropoff === CUSTOM ? customDropoff.trim() : dropoff;
    if (!pickupSpot || !dropoffSpot || !nick.trim()) {
      setError("탑승 장소, 하차 장소, 닉네임을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");

    const { data: pot, error: potError } = await supabase
      .from("pots")
      .insert({
        direction,
        pickup_spot: pickupSpot,
        dropoff: dropoffSpot,
        depart_at: new Date(departAt).toISOString(),
        capacity,
        creator_nick: nick.trim(),
        contact: contact.trim() || null,
      })
      .select()
      .single();

    if (potError || !pot) {
      setError("팟 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
      return;
    }

    // 개설자는 자동으로 첫 멤버
    await supabase.from("pot_members").insert({ pot_id: pot.id, nickname: nick.trim() });
    gaEvent("pot_create", { direction, capacity });
    router.push(`/pot/${pot.id}`);
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm focus:border-yellow-400 focus:outline-none";
  const labelCls = "block text-sm font-semibold mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-xl font-bold">팟 만들기</h1>

      <div>
        <span className={labelCls}>방향</span>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(DIRECTIONS) as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => switchDirection(d)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                direction === d
                  ? "border-yellow-400 bg-yellow-400/15 text-yellow-300"
                  : "border-zinc-700 text-zinc-400"
              }`}
            >
              {DIRECTIONS[d].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="pickup">탑승 장소</label>
        <select id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} className={inputCls}>
          {DIRECTIONS[direction].pickups.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          <option value={CUSTOM}>직접 입력…</option>
        </select>
        {pickup === CUSTOM && (
          <input
            value={customPickup}
            onChange={(e) => setCustomPickup(e.target.value)}
            placeholder="탑승 장소 입력"
            className={`${inputCls} mt-2`}
          />
        )}
      </div>

      <div>
        <label className={labelCls} htmlFor="departAt">출발 시간</label>
        <input
          id="departAt"
          type="datetime-local"
          value={departAt}
          onChange={(e) => setDepartAt(e.target.value)}
          className={inputCls}
          required
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="dropoff">하차 장소</label>
        <select id="dropoff" value={dropoff} onChange={(e) => setDropoff(e.target.value)} className={inputCls}>
          {DIRECTIONS[direction].dropoffs.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
          <option value={CUSTOM}>직접 입력…</option>
        </select>
        {dropoff === CUSTOM && (
          <input
            value={customDropoff}
            onChange={(e) => setCustomDropoff(e.target.value)}
            placeholder="하차 장소 입력"
            className={`${inputCls} mt-2`}
          />
        )}
      </div>

      <div>
        <span className={labelCls}>정원 (본인 포함)</span>
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCapacity(n)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                capacity === n
                  ? "border-yellow-400 bg-yellow-400/15 text-yellow-300"
                  : "border-zinc-700 text-zinc-400"
              }`}
            >
              {n}명
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="nick">닉네임</label>
        <input
          id="nick"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="예: 율전곰"
          maxLength={12}
          className={inputCls}
          required
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="contact">
          오픈채팅 링크{" "}
          <span className="font-normal text-zinc-500">
            (권장 — 링크가 있어야 탑승 장소에서 서로 찾기 쉬워요)
          </span>
        </label>
        <input
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="https://open.kakao.com/o/..."
          className={inputCls}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-zinc-900 hover:bg-yellow-300 disabled:opacity-50"
      >
        {submitting ? "만드는 중…" : "팟 만들기"}
      </button>
    </form>
  );
}
