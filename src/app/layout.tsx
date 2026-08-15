import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";
import { GA_ID } from "@/lib/gtag";

export const metadata: Metadata = {
  title: "택시팟 — 성균관대 택시 동승 매칭",
  description:
    "성균관대 축제·심야 귀가 택시 동승자를 빠르게 찾고 택시비를 1/N로 나누세요. 율전↔명륜 택시팟 매칭 서비스.",
  keywords: ["택시팟", "성균관대", "택시 동승", "율전", "명륜", "N빵"],
  verification: { google: "c2raSW07L-IVLHpc0_wERrk2F7XDMGOu4ZkCnS6AWqQ" },
  openGraph: {
    title: "택시팟 — 성균관대 택시 동승 매칭",
    description: "같은 시간, 같은 방향 동승자를 5분 안에. 택시비는 1/N로.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
        <header className="border-b border-zinc-800">
          <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight">
              🚕 <span className="text-yellow-400">택시팟</span>
            </Link>
            <span className="text-xs text-zinc-500">성균관대 택시 동승 매칭</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-600">
          택시팟 MVP · 신인류 AI 사피엔스 경험디자인
        </footer>
      </body>
    </html>
  );
}
