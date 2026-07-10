import type { Metadata, Viewport } from "next";
import "@jisane/ui/styles/globals.css";
import { cookies } from "next/headers";
import { createClient } from "@jisane/shared/supabase/server";
import { signInWithGoogle, signInWithKakao, signOut } from "@jisane/shared/auth/actions";
import { AppHeader } from "@jisane/ui/app-header";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://jisane.cloud"),
  title: "지사네 - 부울경 로컬 인력매칭",
  description: "검증된 시니어 전문가와 지역 기업을 지사네가 직접 연결합니다.",
  openGraph: {
    title: "지사네 — 검증된 전문가, 부울경 인력매칭",
    description: "검증된 전문가를 사람이 직접 연결. 부울경 로컬 인력매칭 플랫폼.",
    url: "https://jisane.cloud",
    siteName: "지사네",
    images: [
      {
        url: "/jisane-og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "지사네 — 부울경 로컬 인력매칭",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "지사네 — 검증된 전문가, 부울경 인력매칭",
    description: "검증된 전문가를 사람이 직접 연결. 부울경 로컬 인력매칭 플랫폼.",
    images: ["/jisane-og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AppHeader
          appName="지사네"
          userEmail={user?.email}
          signOutAction={signOut}
          signInWithKakao={signInWithKakao}
          signInWithGoogle={signInWithGoogle}
        />
        {children}
        {/* Docent RAG 챗봇 위젯 (기존 자체 ChatWidget 교체). 공개봇 임베드 — botId만으로 동작. */}
        <Script
          src="https://ragbot-web-n6qj3b5f3q-du.a.run.app/embed.js"
          data-bot="bc714dfa-4cc5-474a-aa14-e0c0493b4a0c"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
