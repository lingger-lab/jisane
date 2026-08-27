import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { SuccessToast, ErrorToast } from "@jisane/ui/toast";
import { EventPopup } from "@jisane/ui/event-popup";
import "@jisane/ui/styles/globals.css";
import { cookies } from "next/headers";
import { createClient } from "@jisane/shared/supabase/server";
import { rootMetadata, orgJsonLd, websiteJsonLd } from "@jisane/shared/seo";
import { JsonLd } from "@jisane/ui/json-ld";
import { signInWithGoogle, signInWithKakao, signOut } from "@jisane/shared/auth/actions";
import { AppHeader } from "@jisane/ui/app-header";
import { NavProgressProvider } from "@jisane/ui/nav-progress";
import { HeaderAutoHide } from "@jisane/ui/header-auto-hide";
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

export const metadata: Metadata = rootMetadata("admin", {
  titleDefault: "지사네 — 지역 기업의 든든한 성장 파트너",
  description:
    "부울경(부산·울산·경남) 중소기업을 위한 전문 서비스와 시니어 전문가 정보. AI(RAG) 상담 제공 — 지식나눔 사업협력 네트워크, 지사네 당신곁에.",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans" suppressHydrationWarning>
        {/* 다크모드 플래시 방지 — 페인트 전 저장된 테마를 <html>에 스탬프(첫 body 자식으로 동기 실행).
            기본=라이트(저장값 없으면 light 스탬프 — 모든 디스플레이 기본), 'dark'=다크,
            'system'=data-theme="system" 스탬프→[data-theme=system]에서만 OS 추종.
            <html>에 data-theme를 쓰므로 <html>에도 suppressHydrationWarning 필요. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':t==='system'?'system':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
        {/* 구조화 데이터 — 조직·웹사이트(검색 리치결과·AEO 사실 앵커) */}
        <JsonLd data={[orgJsonLd(), websiteJsonLd("admin")]} />
        <NavProgressProvider>
        <HeaderAutoHide />
        <AppHeader
          appName="지사네"
          hubUrl="/"
          joinUrl="/join"
          userEmail={user?.email}
          signOutAction={signOut}
          signInWithKakao={signInWithKakao}
          signInWithGoogle={signInWithGoogle}
          showThemeToggle
        />
        {children}
        {/* 시니어지식인 100인 초빙 이벤트 팝업 (마감 자동 종료·하루 1회).
            관리자/인증/관리 화면·이벤트 페이지 자체·전문가회원 공간에선 미노출. */}
        <EventPopup
          eventUrl="/event/senior100"
          hideOnPrefixes={['/login', '/dashboard', '/members', '/docs', '/partner', '/event', '/join']}
        />
        {/* 토스트는 루트에 한 번만 마운트한다 — 페이지별로 달면 마운트되지 않은 화면
            (특히 로그인 실패가 향하는 "/")에서 안내가 통째로 사라진다. */}
        <Suspense>
          <SuccessToast />
          <ErrorToast />
        </Suspense>
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
