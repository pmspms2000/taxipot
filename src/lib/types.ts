export type Direction = "myeong_to_yul" | "yul_to_myeong";

export type Pot = {
  id: string;
  direction: Direction;
  pickup_spot: string;
  dropoff: string;
  depart_at: string;
  capacity: number;
  creator_nick: string;
  contact: string | null;
  created_at: string;
};

export type PotWithCount = Pot & { pot_members: { count: number }[] };

export type Member = {
  id: string;
  nickname: string;
  joined_at: string;
  user_id: string | null;
};

export type Settlement = {
  id: string;
  pot_id: string;
  total_fare: number;
  member_count: number;
  per_person: number;
  toss_id: string | null;
  creator_nick: string;
  created_at: string;
};

export const DIRECTIONS: Record<
  Direction,
  { label: string; pickups: string[]; dropoffs: string[] }
> = {
  myeong_to_yul: {
    label: "명륜 → 율전",
    pickups: ["혜화역 4번 출구", "성대 정문 (600주년기념관 앞)", "혜화로터리 택시승강장"],
    dropoffs: ["성균관대역", "율전캠 정문", "자과캠 기숙사", "수원역"],
  },
  yul_to_myeong: {
    label: "율전 → 명륜",
    pickups: ["율전캠 정문", "성균관대역 1번 출구", "자과캠 기숙사 앞"],
    dropoffs: ["혜화역", "명륜캠 정문", "종로/시청 방면"],
  },
};

export function memberCount(pot: PotWithCount): number {
  return pot.pot_members[0]?.count ?? 0;
}

export function formatDepartAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `오늘 ${time}`;
  if (isTomorrow) return `내일 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}
