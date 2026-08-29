import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { SuccessToast, ErrorToast } from "@jisane/ui/toast";
import { EventPopup } from "@jisane/ui/event-popup";
import "@jisane/ui/styles/globals.css";
import { cookies } from "next/headers";
import { createClient } from "@jisane/shared/supabase/server";
import { rootMetadata } from "@jisane/shared/seo";
import { signInWithGoogle, signInWithKakao, signOut } from "@jisane/shared/auth/actions";
import { AppHeader } from "@jisane/ui/app-header";
import { NavProgressProvider } from "@jisane/ui/nav-progress";
import { HeaderAutoHide } from "@jisane/ui/header-auto-hide";
import { ClientNav, ClientHeaderNav } from "@/components/client-nav";
import { ADMIN_URL, EXPERT_URL } from "@/lib/urls";
import Script from "next/script";
import localFont from "next/font/local";
import { Gowun_Batang } from "next/font/google";

// 폰트 셀프호스팅 (next/font, 설계 docs/16 §12.1) — CDN link 제거, CSS 변수로 노출.
// Pretendard는 Google Fonts에 없어 vendor woff2를 local로, Gowun Batang은 google로.
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
  ...rootMetadata("owner", {
    titleDefault: "지사네 기업회원",
    description: "기업 운영에 필요한 전문 서비스와 시니어 전문가 정보 — 조건을 먼저 볼 수 있는 에스크로 직거래. 지사네 당신곁에.",
  }),
  // PWA 설치는 관리자 허브(jisane.cloud)만 — owner/expert는 manifest·appleWebApp 미제공.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f5c46", // 모바일 브라우저 크롬/PWA 상태바 — 브랜드 딥그린(히어로와 연결)
  // maximumScale는 지정하지 않는다 — 핀치줌을 막으면 WCAG 2.1 AA 1.4.4(Resize Text)
  // 위반. initialScale:1만으로 iOS 입력 포커스 확대 점프는 방지됨(입력 폰트 ≥16px).
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
    <html lang="ko" className={`h-full antialiased ${pretendard.variable} ${gowunBatang.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0" suppressHydrationWarning>
        {/* 다크모드 플래시 방지 — 페인트 전 저장된 테마를 <html>에 스탬프(첫 body 자식으로 동기 실행).
            기본=라이트(저장값 없으면 light 스탬프 — 모든 디스플레이 기본), 'dark'=다크,
            'system'=data-theme="system" 스탬프→[data-theme=system]에서만 OS 추종.
            <html>에 data-theme를 쓰므로 <html>에도 suppressHydrationWarning 필요. ThemeToggle과 동일 계약. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':t==='system'?'system':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
        <NavProgressProvider>
        <HeaderAutoHide />
        <AppHeader
          appName="지사네"
          hubUrl="/"
          joinUrl={`${ADMIN_URL}/join`}
          userEmail={user?.email}
          signOutAction={signOut}
          signInWithKakao={signInWithKakao}
          signInWithGoogle={signInWithGoogle}
          centerNav={<ClientHeaderNav />}
          roleSwitch={[
            { label: "시니어지식인으로 전환", url: `${EXPERT_URL}/register` },
            { label: "전문가회원으로 전환 (승인제)", url: `${ADMIN_URL}/partner/apply` },
          ]}
          showThemeToggle
        />
        {children}
        {/* 시니어지식인 100인 초빙 이벤트 팝업 (허브 상세로 이동) */}
        <EventPopup eventUrl={`${ADMIN_URL}/event/senior100`} />
        {/* 토스트는 루트에 한 번만 마운트한다 — 페이지별로 달면 마운트되지 않은 화면
            (특히 로그인 실패가 향하는 "/")에서 안내가 통째로 사라진다. */}
        <Suspense>
          <SuccessToast />
          <ErrorToast />
        </Suspense>
        {/* 하단 탭 — 로그인 전후 공통 (크롬 연속) */}
        <ClientNav />
        {/* Docent RAG 챗봇 위젯 */}
        <Script
          src="https://ragbot-web-n6qj3b5f3q-du.a.run.app/embed.js"
          data-bot="bc714dfa-4cc5-474a-aa14-e0c0493b4a0c"
          strategy="lazyOnload"
        />
        </NavProgressProvider>
      </body>
    </html>
  );
}
