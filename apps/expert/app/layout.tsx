import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { SuccessToast, ErrorToast } from "@jisane/ui/toast";
import "@jisane/ui/styles/globals.css";
import { cookies } from "next/headers";
import { createClient } from "@jisane/shared/supabase/server";
import { signInWithGoogle, signInWithKakao, signOut } from "@jisane/shared/auth/actions";
import { AppHeader } from "@jisane/ui/app-header";
import { ExpertNav } from "@/components/expert-nav";
import { ADMIN_URL } from "@/lib/urls";
import Script from "next/script";
import localFont from "next/font/local";
import { Gowun_Batang } from "next/font/google";

// 폰트 셀프호스팅 (next/font, 설계 docs/16 §12.1) — CDN link 제거, CSS 변수로 노출.
const pretendard = localFont({
  src: "../../../packages/ui/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});
const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gowun",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://expert.jisane.cloud"),
  title: "지사네 시니어지식인회원",
  description: "경험으로 일하고, 정당한 대가를 받으세요. 지사네 시니어지식인 플랫폼.",
  openGraph: {
    title: "지사네 시니어지식인회원",
    description: "경험으로 일하고, 정당한 대가를 받으세요. 지사네 시니어지식인 플랫폼.",
    url: "https://expert.jisane.cloud",
    siteName: "지사네",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "지사네 시니어지식인회원",
    description: "경험으로 일하고, 정당한 대가를 받으세요. 지사네 시니어지식인 플랫폼.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale는 지정하지 않는다 — 핀치줌을 막으면 WCAG 2.1 AA 1.4.4(Resize Text)
  // 위반. 시니어 대상 서비스라 확대 필요성이 특히 큼. initialScale:1만으로 iOS 입력
  // 포커스 확대 점프는 방지됨(입력 폰트 ≥16px).
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ko" className={`h-full antialiased ${pretendard.variable} ${gowunBatang.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans pb-16" suppressHydrationWarning>
        {/* 다크모드 플래시 방지 — 페인트 전 저장된 테마를 <html>에 스탬프(첫 body 자식으로 동기 실행).
            'system'은 속성 미설정 → prefers-color-scheme 추종. ThemeToggle과 동일 계약. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <AppHeader
          appName="지사네"
          hubUrl="/"
          joinUrl={`${ADMIN_URL}/join`}
          userEmail={user?.email}
          signOutAction={signOut}
          signInWithKakao={signInWithKakao}
          signInWithGoogle={signInWithGoogle}
          showThemeToggle
        />
        {children}
        {/* 토스트는 루트에 한 번만 마운트한다 — 페이지별로 달면 마운트되지 않은 화면
            (특히 로그인 실패가 향하는 "/")에서 안내가 통째로 사라진다. */}
        <Suspense>
          <SuccessToast />
          <ErrorToast />
        </Suspense>
        {/* 하단 탭 — 로그인 전후 공통 */}
        <ExpertNav />
        {/* Docent RAG 챗봇 위젯 */}
        <Script
          src="https://ragbot-web-n6qj3b5f3q-du.a.run.app/embed.js"
          data-bot="bc714dfa-4cc5-474a-aa14-e0c0493b4a0c"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
