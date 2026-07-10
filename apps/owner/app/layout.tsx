import type { Metadata, Viewport } from "next";
import "@jisane/ui/styles/globals.css";
import { cookies } from "next/headers";
import { createClient } from "@jisane/shared/supabase/server";
import { signInWithGoogle, signInWithKakao, signOut } from "@jisane/shared/auth/actions";
import { AppHeader } from "@jisane/ui/app-header";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://owner.jisane.cloud"),
  title: "지사네 기업공간",
  description: "검증된 시니어 전문가에게 일을 맡기세요. 지사네 기업 전문 서비스.",
  openGraph: {
    title: "지사네 기업공간",
    description: "검증된 시니어 전문가에게 일을 맡기세요.",
    url: "https://owner.jisane.cloud",
    siteName: "지사네",
    images: [
      {
        url: "/jisane-og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "지사네 기업공간",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "지사네 기업공간",
    description: "검증된 시니어 전문가에게 일을 맡기세요.",
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
          appName="지사네 기업공간"
          hubUrl={process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'}
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
