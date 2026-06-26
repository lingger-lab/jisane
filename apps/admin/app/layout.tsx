import type { Metadata, Viewport } from "next";
import "@jisane/ui/styles/globals.css";
import { cookies } from "next/headers";
import { createClient } from "@jisane/shared/supabase/server";
import { signInWithGoogle, signInWithKakao, signOut } from "@jisane/shared/auth/actions";
import { AppHeader } from "@jisane/ui/app-header";
import { ChatWidgetLazy } from "@jisane/ui/chat-widget-lazy";

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
        <ChatWidgetLazy role="admin" kakaoChannelUrl={process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL} />
      </body>
    </html>
  );
}
