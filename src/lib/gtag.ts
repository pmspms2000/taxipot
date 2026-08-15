export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// KPI 이벤트: pot_create(팟 개설), pot_join(팟 참여), pot_full(정원 마감)
export function gaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("event", name, params);
}
