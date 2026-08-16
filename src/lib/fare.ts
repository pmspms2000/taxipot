import type { Direction } from "./types";

// 심야 기준 대략적 추정치 (원). 실측 데이터가 쌓이면 보정한다.
const BASE_FARE: Record<Direction, number> = {
  myeong_to_yul: 38000,
  yul_to_myeong: 38000,
};

const DROPOFF_FARE: Record<string, number> = {
  수원역: 42000,
  "자과캠 기숙사": 40000,
  "율전캠 정문": 39000,
  성균관대역: 38000,
  혜화역: 38000,
  "명륜캠 정문": 39000,
  "종로/시청 방면": 34000,
};

export function estimateFare(direction: Direction, dropoff: string): number {
  return DROPOFF_FARE[dropoff] ?? BASE_FARE[direction];
}

export function perPerson(total: number, count: number): number {
  return Math.ceil(total / Math.max(count, 1));
}

export function formatWon(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}
