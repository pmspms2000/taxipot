# 🚕 택시팟

성균관대 축제·심야 귀가 택시 동승자 매칭 + 택시비 1/N 정산 웹 서비스.

율전↔명륜 이동 시 같은 시간·같은 방향 동승자를 에브리타임보다 빠르게 찾고,
도착 후 택시비를 깔끔하게 나눕니다.

**신인류 AI 사피엔스 경험디자인** 기말 프로젝트 — 계획·가설·KPI는 [docs/PLAN.md](docs/PLAN.md) 참고.

## 스택

- Next.js 16 (App Router) + Tailwind CSS
- Supabase (DB) · Vercel (배포) · GA4 (측정) · Google Search Console (검색)

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # Supabase URL/키, GA ID 입력
npm run dev
```

DB 스키마는 `supabase/schema.sql`을 Supabase SQL Editor에서 실행.

## 반복(iteration) 현황

| 반복 | 가설 | 상태 |
|---|---|---|
| 1 | 구조화된 팟 보드가 에브리타임 자유 글보다 매칭이 빠르다 | ✅ 배포 완료 · 검증 중 ([taxipot00.vercel.app](https://taxipot00.vercel.app)) |
| 2 | 1/N 정산 도우미·예상 요금 표시가 팟 완료율을 높인다 | ✅ 배포 완료 · 검증 중 |
| 3 | 학교 이메일 인증이 신뢰·기기 간 연속성을 만든다 | ✅ 완료 — H3-a 채택 |
