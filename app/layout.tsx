import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "FORMULATE — Architectural Diagram Studio", template: "%s — FORMULATE" },
  description: "건축 논문과 설계 개념을 AI로 분석해 편집 가능한 공간 다이어그램으로 변환합니다.",
  keywords: ["건축 다이어그램", "논문 다이어그램", "AI 건축", "React Flow"],
  openGraph: { title: "FORMULATE", description: "텍스트에서 공간의 논리를 찾다.", type: "website", locale: "ko_KR", url: siteUrl },
  twitter: { card: "summary", title: "FORMULATE", description: "AI Architectural Diagram Studio" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
